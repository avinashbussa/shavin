/**
 * Concentric radius lint + role-aware autofix, shared by validate_code, autofix_code, audit_source's
 * validator pass and (via evals/src/autofix.mjs) the eval harness.
 *
 * The law:  R_inner = max(floor, R_outer - P),  floor = min(--radius-lg, --radius-panel / 2)
 *   - containers (Card, Section, data-panel, popover/dialog content, ...) use --radius-panel
 *   - controls (Button, Input, Badge, Select, ...) use --radius-lg
 *   - a rounded element nested in a rounded, padded one uses rounded-panel-pN (N = padding / 4px)
 *     or, when N is not on the scale, the explicit max(floor, calc(panel - X)) arbitrary value.
 *
 * Conservative by design. It only judges what it can read from the source:
 *   - radius written as a token class (rounded-[var(--radius-panel)], rounded-panel, rounded-panel-pN,
 *     rounded-[var(--radius-lg)], rounded-[calc(var(--radius-panel) - Npx)]); rounded-full, rounded-none,
 *     rounded-panel-inner and any other form are left alone, never flagged.
 *   - padding written as p-N / px-N py-N (equal) / p-[Npx] on the outer element, or Card padding="md".
 *     Unknown padding (a component with its own default padding, no explicit value) means no verdict.
 *   - a transparent wrapper between outer and inner adds its padding; a wrapper with a background or
 *     border and no radius is a sharp reference and ends the check.
 * Literal radius (rounded-lg, rounded-xl, ...) is always reported, with the exact class to write when the
 * role or nesting makes it unambiguous, and flagged-only (both exact options listed) when it does not.
 */

const PANEL = "rounded-[var(--radius-panel)]";
const LG = "rounded-[var(--radius-lg)]";
const SCALE = new Set([4, 8, 12, 16, 20, 24, 32]); // px with a rounded-panel-pN utility (p1..p6, p8)
// (lg, panel) in px for the none / small / medium / large radius presets (RADIUS_PRESETS in @shavin/ui).
// "full" is left out: its pill-sized --radius-lg is a documented jump, not a concentric case.
const PRESETS = [[0, 0], [4, 8], [8, 16], [12, 24]];

const CONTROL_TAGS = new Set([
  "Button", "IconButton", "Input", "TextField", "TextArea", "NumberField", "SearchField", "PasswordField",
  "Select", "Dropdown", "Combobox", "Badge", "Chip", "Tag", "Kbd", "SegmentedControl", "Toggle", "ToggleButton",
  "Tab", "TabsTrigger", "Checkbox", "Pill", "button", "input", "select", "textarea",
]);
const CONTAINER_TAGS = new Set([
  "Card", "Section", "Panel", "Callout", "StatCard", "PopoverContent", "DialogContent", "DrawerContent",
  "HoverCardContent", "MenuContent", "SelectContent", "dialog",
]);
// Components that carry their own default padding: with no explicit value the padding is unknown.
const IMPLICIT_PADDING = new Set([...CONTAINER_TAGS, "Inset", "Alert", "AlertDialog", "Dialog", "Popover", "Menu", "Drawer"]);
const CARD_PADDING = { none: 0, xs: 8, sm: 16, md: 20, lg: 24, xl: 32, "2xl": 40, "3xl": 48 };
const VOID = new Set(["img", "input", "br", "hr", "meta", "link", "source", "wbr"]);
const EXEMPT = /data-overlay|data-gradient|data-scope-theme/;
const exempt = (el) => Object.keys(el.attrs).some((k) => /^data-(overlay|gradient|scope-theme)$/.test(k));

const lineOf = (src, i) => src.slice(0, i).split("\n").length;

// ── JSX scanner ──────────────────────────────────────────────────────────────────────────────

function skipString(src, i) {
  const q = src[i];
  i++;
  while (i < src.length && src[i] !== q) i += src[i] === "\\" ? 2 : 1;
  return i + 1;
}
function skipBraces(src, i) {
  let depth = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === '"' || c === "'" || c === "`") { i = skipString(src, i); continue; }
    if (c === "{") depth++;
    else if (c === "}" && --depth === 0) return i + 1;
    i++;
  }
  return i;
}

/** Parse every JSX element into a flat list with parent links. Attribute values keep their source range. */
export function parseJsx(src) {
  const els = [];
  const stack = [];
  const re = /<(\/?)([A-Za-z][\w.]*)?/g;
  let m;
  while ((m = re.exec(src))) {
    const before = m.index > 0 ? src[m.index - 1] : "";
    if (!m[2]) continue; // fragment or "<" in an expression
    if (!m[1] && /[\w$)\]]/.test(before)) continue; // a < b, Array<string>
    if (m[1]) { // closing tag
      for (let k = stack.length - 1; k >= 0; k--) if (stack[k].name === m[2]) { stack.length = k; break; }
      re.lastIndex = src.indexOf(">", m.index) + 1 || src.length;
      continue;
    }
    let i = m.index + m[0].length;
    const attrs = {};
    let selfClose = false;
    while (i < src.length) {
      while (/\s/.test(src[i] ?? "")) i++;
      if (src[i] === "/" && src[i + 1] === ">") { selfClose = true; i += 2; break; }
      if (src[i] === ">") { i++; break; }
      if (src[i] === "{") { i = skipBraces(src, i); continue; }
      const nm = /^[\w:.-]+/.exec(src.slice(i, i + 80));
      if (!nm) { i++; continue; }
      i += nm[0].length;
      if (src[i] !== "=") { attrs[nm[0]] = { start: i, end: i, text: "" }; continue; }
      i++;
      const vs = i;
      if (src[i] === '"' || src[i] === "'") i = skipString(src, i);
      else if (src[i] === "{") i = skipBraces(src, i);
      attrs[nm[0]] = { start: vs, end: i, text: src.slice(vs, i) };
    }
    const el = { name: m[2], start: m.index, end: i, line: lineOf(src, m.index), attrs, parent: stack[stack.length - 1] ?? null };
    els.push(el);
    if (!selfClose && !VOID.has(el.name)) stack.push(el);
    re.lastIndex = i;
  }
  return els;
}

// ── element facts ────────────────────────────────────────────────────────────────────────────

const cls = (el) => (el.attrs.className ?? el.attrs.class)?.text ?? "";
const NOPFX = String.raw`(?<![\w:\[-])`; // a class with no variant prefix

/** The element's own radius from a token class, or null. kind: panel | lg | none | full | other. */
function radiusOf(el) {
  const c = cls(el);
  let m;
  const find = (re) => (m = new RegExp(NOPFX + re).exec(c));
  if (find(String.raw`rounded-\[var\(--radius-panel\)\]`) || find(String.raw`rounded-panel(?![\w-])`)) return { kind: "panel", sub: 0, floored: true, token: m[0], index: m.index };
  if (find(String.raw`rounded-panel-p(\d+)(?![\w-])`)) return { kind: "panel", sub: Number(m[1]) * 4, floored: true, token: m[0], index: m.index };
  if (find(String.raw`rounded-\[calc\(var\(--radius-panel\)[ _]*-[ _]*(\d+(?:\.\d+)?)(px|rem)\)\]`)) return { kind: "panel", sub: Number(m[1]) * (m[2] === "rem" ? 16 : 1), floored: false, token: m[0], index: m.index };
  if (find(String.raw`rounded-\[var\(--radius-lg\)\]`)) return { kind: "lg", sub: 0, token: m[0], index: m.index };
  if (find(String.raw`rounded-full(?![\w-])`)) return { kind: "full" };
  if (find(String.raw`rounded(?:-none)?(?![\w-])`) || find(String.raw`rounded-\[0(?:px)?\]`)) return { kind: "none" };
  if (find(String.raw`rounded-(?:panel-inner|control-inner|\[[^\]]+\]|(?:sm|md|lg|xl|2xl|3xl))(?![\w-])`)) return { kind: "other" };
  return null;
}

/** Padding in px when readable from the source, 0 when the element plainly has none, null when unknown. */
function paddingPx(el) {
  const c = cls(el);
  const side = (re) => { const m = new RegExp(NOPFX + re).exec(c); return m ? m[1] : undefined; };
  const px = (v) => (/px$/.test(v) ? Number(v.slice(0, -2)) : /rem$/.test(v) ? Number(v.slice(0, -3)) * 16 : v === "px" ? 1 : Number(v) * 4);
  const all = side(String.raw`p-(\d+(?:\.5)?|px|\[[\d.]+(?:px|rem)\])(?![\w-])`);
  const x = side(String.raw`px-(\d+(?:\.5)?|px|\[[\d.]+(?:px|rem)\])(?![\w-])`);
  const y = side(String.raw`py-(\d+(?:\.5)?|px|\[[\d.]+(?:px|rem)\])(?![\w-])`);
  const clean = (v) => (v ? px(v.replace(/^\[|\]$/g, "")) : undefined);
  if (all !== undefined || x !== undefined || y !== undefined) {
    const h = clean(x ?? all) ?? 0;
    const v = clean(y ?? all) ?? 0;
    return Math.min(h, v);
  }
  if (el.name === "Card") {
    const p = el.attrs.padding?.text.replace(/^["'{]+|["'}]+$/g, "");
    if (p && p in CARD_PADDING) return CARD_PADDING[p];
    return null;
  }
  if (/^[a-z]/.test(el.name)) return CONTAINER_TAGS.has(el.name) ? null : 0;
  if (IMPLICIT_PADDING.has(el.name)) return null;
  return ["Box", "Flex", "Grid", "Stack", "Container"].includes(el.name) ? 0 : null;
}

const hasBoundary = (el) => /(?<![\w:-])(?:bg-(?!transparent)[\w[\]-]+|border(?:-[\w-]+)?)(?![\w-])/.test(cls(el).replace(/border-(?:0|none|transparent)\b/g, ""));
const borderPx = (el) => (/(?<![\w:-])border(?:-[1-9])?(?![\w-])/.test(cls(el)) ? 1 : 0);

/** control | container | unknown (conservative: a bare div, Box, Flex or Grid is unknown). */
export function roleOf(el) {
  if (CONTROL_TAGS.has(el.name)) return "control";
  if (CONTAINER_TAGS.has(el.name) || "data-panel" in el.attrs) return "container";
  return "unknown";
}

// ── maths ────────────────────────────────────────────────────────────────────────────────────

const floorOf = ([lg, panel]) => Math.min(lg, panel / 2);
const valueOf = (r, p) => (r.kind === "lg" ? p[0] : r.floored ? Math.max(floorOf(p), p[1] - r.sub) : Math.max(0, p[1] - r.sub));
const same = (r, total) => PRESETS.every((p) => Math.abs(valueOf(r, p) - Math.max(floorOf(p), p[1] - total)) < 0.01);

/** The exact class for "inside a panel-based outer, total px from its corner". */
export function innerClass(totalPx) {
  if (SCALE.has(totalPx)) return `rounded-panel-p${totalPx / 4}`;
  const rem = Number((totalPx / 16).toFixed(4));
  return `rounded-[max(min(var(--radius-lg),calc(var(--radius-panel)/2)),calc(var(--radius-panel)_-_${rem}rem))]`;
}

/** Nearest rounded ancestor and the px between its corner and the element. null when no verdict is possible. */
function nesting(el) {
  let gap = 0;
  for (let a = el.parent; a; a = a.parent) {
    if (exempt(a)) return null;
    const r = radiusOf(a);
    if (r) {
      if (r.kind === "full" || r.kind === "other") return null;
      const p = paddingPx(a);
      if (p === null) return null;
      return { outer: a, r, gap: gap + p, border: borderPx(a) };
    }
    if (hasBoundary(a)) return null; // sharp visible edge = the reference
    const p = paddingPx(a);
    if (p === null) return null;
    gap += p;
  }
  return null;
}

const describe = (el) => `<${el.name}>`;
const outerDesc = (n) => `${describe(n.outer)} (${n.r.token}, padding ${n.gap}px)`;

/** What the inner element should be, given its nesting. { cls, ok } or null when not judgeable. */
function expectNested(el, n) {
  if (n.r.kind === "none") return null;
  if (n.gap <= 0) return null; // no padding (a border alone does not count): same radius is right
  if (n.r.kind === "lg") return { outerLg: true };
  const totals = [n.r.sub + n.gap, ...(n.border ? [n.r.sub + n.gap + n.border] : [])];
  return { totals, cls: innerClass(totals[0]) };
}

// ── findings ─────────────────────────────────────────────────────────────────────────────────

/**
 * @returns {{rule:string,line:number,message:string,dense:string,from?:string,to?:string|null,index?:number,element?:string}[]}
 * `from`/`to`/`index` are the class to replace, its replacement (null: flag-only) and its offset in src.
 */
export function findConcentricIssues(src) {
  const out = [];
  const els = parseJsx(src);
  const claimed = new Set(); // literal tokens already handled through an element

  for (const el of els) {
    if (exempt(el)) continue;
    const role = roleOf(el);
    const cattr = el.attrs.className ?? el.attrs.class;
    const base = cattr ? cattr.start : 0;
    const add = (rule, from, index, to, why, dense) => {
      const exact = to ? `write ${to} in place of ${from}` : "";
      out.push({
        rule, line: el.line, from, to, index: base + index, element: el.name,
        message: `${rule} (L${el.line} <${el.name}>): ${why} ${exact}`.trim(),
        dense: dense ?? `${rule}@L${el.line} <${el.name}> -> ${to ? `${from} => ${to}` : why}`,
      });
    };

    const n = nesting(el);
    const exp = n && expectNested(el, n);

    // 1. literal radius utilities, with the exact class where role or nesting decides
    if (cattr) {
      for (const lm of cattr.text.matchAll(/\brounded-(sm|md|lg|xl|2xl|3xl)\b/g)) {
        claimed.add(cattr.start + lm.index);
        const from = lm[0];
        const small = lm[1] === "sm" || lm[1] === "md";
        let to = null;
        let why;
        if (exp && exp.cls) {
          to = role === "control" && same({ kind: "lg" }, exp.totals[0]) ? LG : exp.cls;
          why = `literal ${from} inside ${outerDesc(n)}; the inner radius is max(floor, R_outer - ${n.r.sub + n.gap}px).`;
        } else if (role === "control") {
          to = LG; why = `literal ${from} on a control; controls use --radius-lg.`;
        } else if (role === "container") {
          to = PANEL; why = `literal ${from} on a container; containers use --radius-panel.`;
        } else if (small) {
          to = LG; why = `literal ${from}; small radii are controls (--radius-lg).`;
        } else {
          why = `literal ${from} and the element's role is ambiguous. A container (card, panel, surface) uses ${PANEL}; a control (button, input, chip) uses ${LG}. Inside a padded rounded container use rounded-panel-pN (N = padding / 4px).`;
        }
        add("literal-radius", from, lm.index, to, why);
      }
    }

    const r = radiusOf(el);
    if (!r || !r.token || !cattr) continue;

    // 2. nested: inner radius wrong for the outer padding
    if (exp && exp.outerLg) {
      if (r.kind === "panel") add("concentric-nested", r.token, r.index, LG, `${r.token} is larger than its parent's radius (${n.r.token}). Nothing inside a control-radius element may use the panel radius.`);
      continue;
    }
    if (exp && exp.cls) {
      if (exp.totals.some((t) => same(r, t))) continue;
      const to = role === "control" && exp.totals.some((t) => same({ kind: "lg" }, t)) ? LG : exp.cls;
      add("concentric-nested", r.token, r.index, to, `inside ${outerDesc(n)} the inner radius must be max(floor, ${n.r.token === PANEL ? "panel" : "R_outer"} - ${n.r.sub + n.gap}px), not ${r.token}.`);
      continue;
    }

    // 3. role vs token, when nesting gives no verdict
    if (role === "control" && r.kind === "panel" && r.sub === 0) {
      add("concentric-control-panel", r.token, r.index, LG, `a control uses --radius-lg, not the panel radius.`);
    } else if (role === "container" && r.kind === "lg" && !n) {
      add("concentric-container-control", r.token, r.index, PANEL, `a container uses --radius-panel, not the control radius. If it is nested in a padded container use rounded-panel-pN (N = padding / 4px) instead.`);
    }
  }

  // literal radius outside any parsed className (const strings, cva): same mapping without a role
  for (const lm of src.matchAll(/\brounded-(sm|md|lg|xl|2xl|3xl)\b/g)) {
    if (claimed.has(lm.index)) continue;
    const lineStart = src.lastIndexOf("\n", lm.index) + 1;
    if (EXEMPT.test(src.slice(lineStart, src.indexOf("\n", lm.index) >>> 0 || src.length))) continue;
    const small = lm[1] === "sm" || lm[1] === "md";
    const to = small ? LG : null;
    const line = lineOf(src, lm.index);
    out.push({
      rule: "literal-radius", line, from: lm[0], to, index: lm.index, element: null,
      message: `literal-radius (L${line}): literal ${lm[0]}. ${small ? `Small radii are controls: write ${LG} in place of ${lm[0]}.` : `Role is ambiguous here: write ${PANEL} for a container or ${LG} for a control in place of ${lm[0]}.`}`,
      dense: `literal-radius@L${line} -> ${small ? `${lm[0]} => ${LG}` : `${lm[0]} => ${PANEL} (container) | ${LG} (control)`}`,
    });
  }
  return out.sort((a, b) => a.index - b.index);
}

/**
 * Apply every finding that has an exact replacement. Returns the new source, what changed and what needs a human.
 * Runs up to three passes: fixing a literal ancestor (rounded-2xl -> panel) can expose a nested mismatch below it.
 */
export function concentricAutofix(src) {
  const fixesApplied = [];
  let fixedCode = src;
  let unfixed = [];
  for (let pass = 0; pass < 3; pass++) {
    const issues = findConcentricIssues(fixedCode);
    const cur = fixedCode;
    let changed = false;
    for (const f of [...issues].reverse()) {
      if (!f.to || cur.slice(f.index, f.index + f.from.length) !== f.from) continue;
      fixedCode = fixedCode.slice(0, f.index) + f.to + fixedCode.slice(f.index + f.from.length);
      changed = true;
    }
    for (const f of issues) {
      if (f.to && cur.slice(f.index, f.index + f.from.length) === f.from) fixesApplied.push(`L${f.line}${f.element ? ` <${f.element}>` : ""}: ${f.from} -> ${f.to}`);
    }
    unfixed = issues.filter((f) => !f.to || cur.slice(f.index, f.index + f.from.length) !== f.from).map((f) => f.message);
    if (!changed) break;
  }
  if (fixedCode !== src) unfixed = findConcentricIssues(fixedCode).filter((f) => !f.to).map((f) => f.message);
  return { fixedCode, fixesApplied, unfixed };
}
