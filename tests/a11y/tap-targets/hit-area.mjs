/**
 * In-page measurement of interactive hit areas, shared by the tap-target spec and the
 * screenshot overlay. Runs inside the browser (Playwright `page.evaluate`), so it must be
 * self-contained: no imports, no closures over Node values.
 *
 * Why not getBoundingClientRect alone: the 44px coarse-pointer hit area is an invisible
 * ::after on the control. It never shows in the element's rect, but `elementFromPoint`
 * returns the control for points inside it. So the hit area is measured by probing outwards
 * from the centre of the visible box until the control is no longer in the hit-test stack
 * (`elementsFromPoint`). Where a later neighbour's hit area overlaps, a click goes to the neighbour
 * (it paints on top), but each control still counts the overlap as its own area.
 */

/**
 * @typedef {{ x: number, y: number, w: number, h: number }} Rect
 * @typedef {object} HitMeasure
 * @property {string} label Short description: tag, role, accessible name or text.
 * @property {{ w: number, h: number }} visual Visual box (getBoundingClientRect).
 * @property {{ w: number, h: number }} hit Extent of the area that hits the control, probed along the centre lines.
 * @property {Rect} rect Hit rectangle in viewport px, for overlays.
 * @property {Rect} box Visual box in viewport px, for overlays.
 * @property {boolean} [primary] Only when `opts.primary` is given: the control is a primary control (grows to 44px on touch).
 *
 * @typedef {object} MeasureOptions
 * @property {string} [root] CSS selector the search is limited to (default: whole document).
 * @property {string} [only] Only elements matching this selector (default: every interactive element).
 * @property {number} [cap] Probe at most this many px from the centre in each direction (default 24, so a reported
 * size tops out at 49: enough to judge the 24px and 44px bars quickly; pass a larger value to see the full extent).
 * @property {string} [primary] Selector of the primary controls (primary.mjs PRIMARY_SELECTOR). Sets `primary` on each result.
 * @property {string} [secondary] Selector of containers whose controls are never primary (primary.mjs SECONDARY_CONTEXT).
 * @property {boolean} [noScroll] Measure only what is already on screen; do not scroll (overlay screenshots).
 */

/**
 * Function body for `page.evaluate`. Returns one entry per interactive element worth judging.
 * @param {MeasureOptions} [opts]
 * @returns {HitMeasure[]}
 */
export function measureHitAreas(opts = {}) {
  const root = (opts.root ? document.querySelector(opts.root) : document.body) ?? document.body;
  const cap = opts.cap ?? 24;
  const INTERACTIVE =
    'a[href], button, input:not([type="hidden"]), select, textarea, summary, ' +
    '[role="button"], [role="link"], [role="tab"], [role="radio"], [role="checkbox"], [role="switch"], ' +
    '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], [role="option"], [role="slider"], ' +
    '[role="combobox"], [role="spinbutton"], [role="treeitem"]';

  const skip = (el) => {
    for (let n = el; n; n = n.parentElement) {
      if (n.getAttribute("aria-hidden") === "true" || n.hasAttribute("inert") || n.hasAttribute("hidden")) return true;
      const cs = getComputedStyle(n);
      if (cs.display === "none" || cs.visibility === "hidden" || cs.opacity === "0") return true;
    }
    const cs = getComputedStyle(el);
    if (cs.pointerEvents === "none") return true;
    if (/** @type {HTMLButtonElement} */ (el).disabled || el.getAttribute("aria-disabled") === "true") return true;
    return false;
  };

  /**
   * WCAG 2.5.8 "inline" exception: a link inside a sentence or other running text. Detected as an
   * inline-level <a> whose parent block also holds other text. Stand-alone links (nav, breadcrumbs,
   * footers, list items that are only a link) are not exempt.
   */
  const isInlineTextLink = (el) => {
    if (el.tagName !== "A") return false;
    const display = getComputedStyle(el).display;
    if (display !== "inline" && display !== "") return false; // "" only in jsdom, which has no UA stylesheet
    const parent = el.parentElement;
    if (!parent) return false;
    const around = (parent.textContent ?? "").replace(el.textContent ?? "", "").trim();
    return around.length > 0;
  };

  /** True when the hit element activates `el`: it is the control, inside it, or its label. */
  const owns = (el, hit) => {
    if (!hit) return false;
    if (hit === el || el.contains(hit)) return true;
    const input = /** @type {HTMLInputElement} */ (el);
    if (input.labels) for (const l of Array.from(input.labels)) if (l === hit || l.contains(hit)) return true;
    return false;
  };

  const describe = (el) => {
    const name = (el.getAttribute("aria-label") || el.textContent || /** @type {HTMLInputElement} */ (el).placeholder || "").trim().replace(/\s+/g, " ").slice(0, 28);
    const role = el.getAttribute("role");
    return `${el.tagName.toLowerCase()}${role ? `[${role}]` : ""}${name ? ` "${name}"` : ""}`;
  };

  /** @type {HitMeasure[]} */
  const out = [];
  for (const el of Array.from(root.querySelectorAll(INTERACTIVE))) {
    if (opts.only && !el.matches(opts.only)) continue;
    if (skip(el) || isInlineTextLink(el)) continue;
    if (!opts.noScroll) /** @type {HTMLElement} */ (el).scrollIntoView({ block: "center", inline: "center" });
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (opts.noScroll && (r.bottom < 0 || r.top > window.innerHeight || r.right < 0 || r.left > window.innerWidth)) continue;
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const inView = (x, y) => x >= 0 && y >= 0 && x < vw && y < vh;
    // The area is where the control is anywhere in the hit-test stack, so two controls whose hit areas
    // overlap each keep their own area (a click goes to the one on top; see the header of this file).
    const hits = (x, y) => inView(x, y) && document.elementsFromPoint(x, y).some((n) => owns(el, n));
    // The centre must hit the control; otherwise something covers it (skip, not our concern).
    if (!(inView(cx, cy) && owns(el, document.elementFromPoint(cx, cy)))) continue;
    const probe = (dx, dy, max) => {
      let d = 0;
      while (d < max && hits(cx + dx * (d + 1), cy + dy * (d + 1))) d++;
      return d;
    };
    const left = probe(-1, 0, cap);
    const right = probe(1, 0, cap);
    const up = probe(0, -1, cap);
    const down = probe(0, 1, cap);
    out.push({
      label: describe(el),
      visual: { w: Math.round(r.width * 10) / 10, h: Math.round(r.height * 10) / 10 },
      hit: { w: left + right + 1, h: up + down + 1 },
      rect: { x: cx - left, y: cy - up, w: left + right + 1, h: up + down + 1 },
      box: { x: r.left, y: r.top, w: r.width, h: r.height },
      ...(opts.primary ? { primary: el.matches(opts.primary) && !(opts.secondary && el.closest(opts.secondary)) } : {}),
    });
  }
  return out;
}

/**
 * Pure judge for a list of measurements: which are smaller than `min` px in either dimension.
 * @param {HitMeasure[]} measures
 * @param {number} min 24 at a fine pointer (WCAG 2.5.8), 44 at a coarse one.
 */
export function undersized(measures, min) {
  return measures.filter((m) => m.hit.w < min || m.hit.h < min);
}

/**
 * Pure judge for a whole page: the 24px WCAG 2.5.8 floor for every control, and under a coarse pointer 44px for the
 * controls measured as `primary` (see primary.mjs). Used by the adherence scorer.
 * @param {HitMeasure[]} measures Measured with `primary` / `secondary` options.
 * @param {{ coarse: boolean, floor?: number, touch?: number }} opts
 * @returns {{ small: HitMeasure[], primaryMisses: number, secondaryMisses: number }}
 */
export function judgeTargets(measures, { coarse, floor = 24, touch = 44 }) {
  const need = (m) => (coarse && m.primary ? touch : floor);
  const small = measures.filter((m) => m.hit.w < need(m) || m.hit.h < need(m));
  return {
    small,
    primaryMisses: small.filter((m) => m.primary).length,
    secondaryMisses: small.filter((m) => !m.primary).length,
  };
}
