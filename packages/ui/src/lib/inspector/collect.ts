/**
 * Gathers the facts the detectors need from a live document: text boxes with their styles, interactive elements,
 * and elements that run past the viewport or their own box. Reads layout only; never changes the page.
 *
 * Skips hidden, `aria-hidden`, `inert` and disabled content and anything inside the inspector itself.
 */
import { over, parseColor, type Rgba } from "./color";
import type { Backdrop, Box, OverflowItem, PageData, TapItem, TextItem } from "./rules";

export interface CollectOptions {
  doc?: Document;
  /** True for nodes that belong to the inspector (or other dev overlays) and must not be audited. */
  isInspectorNode?: (el: Element) => boolean;
  consoleErrors?: string[];
  /** Upper bounds that keep a very large page cheap. */
  maxText?: number;
  maxElements?: number;
  maxBackdropProbes?: number;
}

const INSPECTOR_SELECTOR = "[data-shavin-inspector], .shavin-dev-tools-root, #shavin-audit-focus-beacon, [data-radix-popper-content-wrapper]";

export function defaultIsInspectorNode(el: Element): boolean {
  try {
    return !!el.closest(INSPECTOR_SELECTOR);
  } catch {
    return false;
  }
}

/** Computed `overflow-x` values that clip or scroll (an empty string means the engine did not report one). */
const clips = (value: string) => value === "hidden" || value === "auto" || value === "scroll" || value === "clip";

const SKIP_TAGS = new Set(["SCRIPT", "STYLE", "NOSCRIPT", "TEMPLATE"]);
const INTERACTIVE = "a[href],button,input,select,textarea,[role=button],[role=tab]";

const canvasCache = new Map<string, Rgba | null>();

/** Reads any CSS colour (including oklch and color-mix) as sRGB through a 1px canvas; null where canvas is missing. */
function toRgba(doc: Document, css: string): Rgba | null {
  const direct = parseColor(css);
  if (direct) return direct;
  if (!css || css === "none") return null;
  if (canvasCache.has(css)) return canvasCache.get(css) ?? null;
  // jsdom has no canvas and reports every attempt as an error.
  if (typeof navigator !== "undefined" && /jsdom/i.test(navigator.userAgent)) return null;
  let out: Rgba | null = null;
  try {
    const canvas = doc.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (ctx) {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "black";
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const d = ctx.getImageData(0, 0, 1, 1).data;
      out = { rgb: [d[0] ?? 0, d[1] ?? 0, d[2] ?? 0], a: (d[3] ?? 255) / 255 };
    }
  } catch {
    out = null;
  }
  if (canvasCache.size > 200) canvasCache.clear();
  canvasCache.set(css, out);
  return out;
}

function isHidden(el: Element, win: Window): boolean {
  for (let e: Element | null = el; e && e.nodeType === 1; e = e.parentElement) {
    if (e.getAttribute("aria-hidden") === "true" || e.hasAttribute("inert")) return true;
    if ((e as HTMLButtonElement).disabled || e.getAttribute("aria-disabled") === "true") return true;
  }
  const cs = win.getComputedStyle(el);
  return cs.display === "none" || cs.visibility === "hidden";
}

/** Product of opacities up the tree; 0 when effectively invisible. */
function inheritedOpacity(el: Element, win: Window): number {
  let op = 1;
  for (let e: Element | null = el; e && e.nodeType === 1; e = e.parentElement) {
    const o = parseFloat(win.getComputedStyle(e).opacity);
    if (Number.isFinite(o)) op *= o;
  }
  return op > 0.05 ? op : 0;
}

function motionState(el: Element): { animating: boolean; looping: boolean } {
  let animating = false;
  let looping = false;
  for (let e: Element | null = el; e && e.nodeType === 1 && !(animating && looping); e = e.parentElement) {
    if (typeof e.getAnimations !== "function") continue;
    for (const a of e.getAnimations()) {
      if (a.playState !== "running" || !a.effect) continue;
      if (a.effect.getComputedTiming().iterations === Infinity) looping = true;
      else animating = true;
    }
  }
  return { animating, looping };
}

/**
 * What is behind an element: the first opaque ancestor background, with translucent layers composited on top of it.
 * An image, gradient, video or backdrop-filter on the way makes the answer "unknown" (we do not sample pixels).
 */
export function backdropOf(el: Element, doc: Document = el.ownerDocument): Backdrop {
  const win = doc.defaultView;
  if (!win) return { kind: "solid", rgb: [255, 255, 255] };
  const layers: Rgba[] = [];
  let opaque = false;
  let stop: Element | null = null;
  for (let n: Element | null = el; n && n.nodeType === 1; n = n.parentElement) {
    const cs = win.getComputedStyle(n);
    const image = cs.backgroundImage;
    if (image && image !== "none" && !(/gradient\(/.test(image) && isFaintTexture(image, parseFloat(cs.opacity)))) {
      return unknownBackdrop(/gradient\(/.test(image) ? "gradient" : "image", n);
    }
    const filter = (cs as CSSStyleDeclaration & { backdropFilter?: string }).backdropFilter;
    if (filter && filter !== "none") return unknownBackdrop("filter", n);
    const bg = toRgba(doc, cs.backgroundColor);
    if (bg && bg.a > 0) {
      layers.push(bg);
      if (bg.a >= 0.999) {
        opaque = true;
        stop = n;
        break;
      }
    }
  }
  let acc: Rgba = opaque ? (layers.pop() as Rgba) : { rgb: [255, 255, 255], a: 1 };
  for (let i = layers.length - 1; i >= 0; i--) acc = over(layers[i]!, acc);

  // A background can be painted by a positioned layer that is a sibling of the text's ancestors (a button's fill
  // span, a hero image). One opaque flat layer under the text is its backdrop; anything else cannot be judged.
  const layer = layerBehind(el, stop, doc, win);
  if (layer && "owner" in layer) return unknownBackdrop("layer", layer.owner);
  if (layer) return { kind: "solid", rgb: layer.rgb };
  return { kind: "solid", rgb: acc.rgb };
}

/**
 * Positioned siblings (absolute or fixed) along the text's ancestor chain that cover the text and paint a
 * background. Returns the colour of a single opaque flat one, "unknown" for media, images, translucent or several
 * layers, and null when there is none.
 */
function layerBehind(el: Element, stop: Element | null, doc: Document, win: Window): Rgba | { owner: Element } | null {
  const r = el.getBoundingClientRect();
  if (r.width <= 0 && r.height <= 0) return null;
  const cx = r.x + r.width / 2;
  const cy = r.y + r.height / 2;
  const found: Array<Rgba | { owner: Element }> = [];
  for (let n: Element | null = el; n && n !== stop && n.nodeType === 1 && found.length < 3; n = n.parentElement) {
    const parent: Element | null = n.parentElement;
    if (!parent) break;
    for (const c of Array.from(parent.children) as Element[]) {
      if (c === n || c.contains(el)) continue;
      const cs = win.getComputedStyle(c);
      if (cs.position !== "absolute" && cs.position !== "fixed") continue;
      if (cs.display === "none" || cs.visibility === "hidden") continue;
      const cr = c.getBoundingClientRect();
      if (cx < cr.left || cx > cr.right || cy < cr.top || cy > cr.bottom) continue;
      const image = cs.backgroundImage;
      if (/^(IMG|VIDEO|CANVAS|PICTURE|IFRAME)$/.test(c.tagName) || (image && image !== "none")) {
        // A faint pattern layer (dots, hairlines) does not decide what the text is read against.
        if (image && image !== "none" && /gradient\(/.test(image) && isFaintTexture(image, parseFloat(cs.opacity))) continue;
        found.push({ owner: c });
        continue;
      }
      const bg = toRgba(doc, cs.backgroundColor);
      if (bg && bg.a > 0) found.push(bg.a >= 0.999 && !(parseFloat(cs.opacity) < 0.999) ? bg : { owner: c });
    }
  }
  if (!found.length) return null;
  if (found.length > 1) {
    const first = found.find((f): f is { owner: Element } => "owner" in f);
    return { owner: first ? first.owner : (el as Element) };
  }
  return found[0]!;
}

/**
 * A decorative texture (a hairline grid, a dot pattern) that is too faint to change contrast: every colour stop in
 * the image has little alpha, or the element itself is nearly transparent. These do not make a backdrop "unknown".
 */
export function isFaintTexture(image: string, opacity: number): boolean {
  const op = Number.isFinite(opacity) ? opacity : 1;
  const stops = image.match(/rgba?\([^)]*\)/g) ?? [];
  if (stops.length === 0) return false;
  let max = 0;
  for (const stop of stops) {
    const c = parseColor(stop);
    if (!c) return false;
    max = Math.max(max, c.a);
  }
  return max * op <= FAINT_TEXTURE;
}

/** Combined alpha at or below which an image or gradient is treated as texture, not as a backdrop. */
export const FAINT_TEXTURE = 0.35;

/** An unknown backdrop that remembers which element paints it, so the finding is about that element once. */
function unknownBackdrop(reason: "image" | "gradient" | "video" | "filter" | "layer", owner: Element): Backdrop {
  const r = owner.getBoundingClientRect();
  return { kind: "unknown", reason, owner, ownerBox: { x: r.x, y: r.y, w: r.width, h: r.height } };
}

/** The media element painted behind the text but outside its ancestors (a hero image or video), or null. */
function mediaBehind(el: Element, box: Box, doc: Document): Element | null {
  if (typeof doc.elementsFromPoint !== "function") return null;
  try {
    const stack = doc.elementsFromPoint(box.x + box.w / 2, box.y + box.h / 2);
    const at = stack.indexOf(el);
    const win = doc.defaultView;
    if (at === -1 || !win) return null;
    for (let i = at + 1; i < stack.length; i++) {
      const other = stack[i]!;
      if (other.contains(el)) continue;
      if (/^(IMG|VIDEO|CANVAS|PICTURE|IFRAME)$/.test(other.tagName)) return other;
      const ocs = win.getComputedStyle(other);
      const bg = ocs.backgroundImage;
      if (bg && bg !== "none" && !(/gradient\(/.test(bg) && isFaintTexture(bg, parseFloat(ocs.opacity)))) return other;
    }
  } catch {
    /* a hit test can fail on odd documents: treat the backdrop as plain */
  }
  return null;
}

const boxOf = (r: { x: number; y: number; width: number; height: number }): Box => ({ x: r.x, y: r.y, w: r.width, h: r.height });

/** Reads the document and returns the data the rules run on. */
export function collectPage(options: CollectOptions = {}): PageData {
  const doc = options.doc ?? document;
  const win = doc.defaultView as Window & typeof globalThis;
  const skipNode = options.isInspectorNode ?? defaultIsInspectorNode;
  const maxText = options.maxText ?? 2500;
  const maxElements = options.maxElements ?? 5000;
  let probes = options.maxBackdropProbes ?? 400;

  const viewport = { w: win.innerWidth, h: win.innerHeight, scrollX: win.scrollX, scrollY: win.scrollY };

  // ---- text ----
  const seen = new Map<Element, { rects: Box[]; text: string }>();
  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node && seen.size < maxText; node = walker.nextNode()) {
    const value = node.nodeValue ?? "";
    if (!value.trim()) continue;
    const el = node.parentElement;
    if (!el || SKIP_TAGS.has(el.tagName) || skipNode(el) || isHidden(el, win)) continue;
    const range = doc.createRange();
    range.selectNodeContents(node);
    const rects = Array.from(range.getClientRects()).filter((q) => q.width > 1 && q.height > 1);
    if (!rects.length) continue;
    const eb = el.getBoundingClientRect();
    if (eb.width <= 2 && eb.height <= 2) continue; // screen-reader-only text
    const rec = seen.get(el) ?? { rects: [], text: "" };
    rec.rects.push(...rects.map(boxOf));
    rec.text += `${value.trim()} `;
    seen.set(el, rec);
  }

  const items: TextItem[] = [];
  for (const [el, rec] of seen) {
    const opacity = inheritedOpacity(el, win);
    if (!opacity) continue;
    const cs = win.getComputedStyle(el);
    const fontSize = parseFloat(cs.fontSize) || 16;
    const parsedLineHeight = parseFloat(cs.lineHeight);
    const lineHeight = cs.lineHeight === "normal" || !Number.isFinite(parsedLineHeight) ? fontSize * 1.2 : parsedLineHeight;
    const x0 = Math.min(...rec.rects.map((q) => q.x));
    const y0 = Math.min(...rec.rects.map((q) => q.y));
    const x1 = Math.max(...rec.rects.map((q) => q.x + q.w));
    const y1 = Math.max(...rec.rects.map((q) => q.y + q.h));
    const box: Box = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    const motion = motionState(el);
    let backdrop = backdropOf(el, doc);
    if (backdrop.kind === "solid" && probes > 0 && !motion.animating) {
      probes--;
      const media = mediaBehind(el, box, doc);
      if (media) backdrop = unknownBackdrop(/^VIDEO$/.test(media.tagName) ? "video" : "image", media);
    }
    items.push({
      ref: el,
      text: rec.text.trim(),
      box,
      rects: rec.rects,
      fontSize,
      lineHeight,
      lines: new Set(rec.rects.map((q) => Math.round(q.y))).size,
      weight: parseInt(cs.fontWeight, 10) || 400,
      color: toRgba(doc, cs.color),
      opacity,
      backdrop,
      animating: motion.animating,
      looping: motion.looping,
      offscreen: x0 >= win.innerWidth - 1 || x1 <= 1,
    });
  }

  // ---- interactive elements ----
  const interactive: TapItem[] = [];
  for (const el of Array.from(doc.querySelectorAll(INTERACTIVE))) {
    if (skipNode(el) || isHidden(el, win) || !inheritedOpacity(el, win)) continue;
    // WCAG 2.5.8 exempts a link inside a sentence.
    if (el.tagName === "A" && win.getComputedStyle(el).display === "inline") {
      const siblings = Array.from(el.parentNode?.childNodes ?? []);
      if (siblings.some((s) => s !== el && s.nodeType === 3 && (s.nodeValue ?? "").trim())) continue;
    }
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    // The hit area may be a pseudo-element (hit-area utility): measure it too and take the larger box.
    let inset = { w: 0, h: 0 };
    try {
      const pe = win.getComputedStyle(el, "::after");
      if (pe.content !== "none" && pe.position === "absolute") inset = { w: parseFloat(pe.width) || 0, h: parseFloat(pe.height) || 0 };
    } catch {
      /* pseudo-element styles are not available everywhere */
    }
    const w = Math.max(r.width, inset.w);
    const h = Math.max(r.height, inset.h);
    if (w <= 2 && h <= 2) continue; // screen-reader-only skip links
    interactive.push({ ref: el, text: (el.textContent ?? el.getAttribute("aria-label") ?? "").trim().slice(0, 60), box: boxOf(r), w, h });
  }

  // ---- overflow ----
  const overflow: OverflowItem[] = [];
  const docEl = doc.documentElement;
  const viewportOverflow = docEl.scrollWidth > win.innerWidth + 1;
  const flagged = new Set<Element>();
  const clipped = (el: Element): boolean => {
    for (let e = el.parentElement; e && e !== doc.body && e !== docEl; e = e.parentElement) {
      if (clips(win.getComputedStyle(e).overflowX)) return true;
    }
    return false;
  };
  let scanned = 0;
  for (const el of Array.from(doc.body.querySelectorAll("*"))) {
    if (++scanned > maxElements) break;
    if (skipNode(el) || SKIP_TAGS.has(el.tagName)) continue;
    const cs = win.getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden" || cs.position === "fixed") continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    if (viewportOverflow && r.right > win.innerWidth + 1 && !clipped(el)) {
      const parent = el.parentElement;
      const parentFits = !parent || parent === doc.body || parent === docEl || parent.getBoundingClientRect().right <= win.innerWidth + 1;
      if (parentFits && overflow.filter((o) => o.kind === "viewport").length < 5) {
        overflow.push({ ref: el, box: boxOf(r), kind: "viewport", measured: `ends at ${Math.round(r.right)}px, viewport ${win.innerWidth}px` });
        flagged.add(el);
        continue;
      }
    }
    if (!clips(cs.overflowX) && cs.position !== "absolute" && el.clientWidth > 0 && el.scrollWidth > el.clientWidth + 1 && el.children.length > 0 && !/^(inline|table-cell|table-row|contents)/.test(cs.display)) {
      // Only text that spills is a layout problem; decorative layers and animations often extend on purpose.
      const spills = Array.from(el.children).some((c) => (c.textContent ?? "").trim() !== "" && c.getBoundingClientRect().right > r.right + 1);
      if (spills && overflow.filter((o) => o.kind === "container").length < 12) {
        overflow.push({ ref: el, box: boxOf(r), kind: "container", measured: `content ${el.scrollWidth}px in a ${el.clientWidth}px box` });
        flagged.add(el);
      }
    }
  }
  if (viewportOverflow && !overflow.some((o) => o.kind === "viewport")) {
    overflow.push({ ref: docEl, box: { x: 0, y: 0, w: docEl.scrollWidth, h: win.innerHeight }, kind: "viewport", measured: `page ${docEl.scrollWidth}px wide, viewport ${win.innerWidth}px` });
  }

  return { items, interactive, overflow, viewport, consoleErrors: options.consoleErrors ?? [] };
}
