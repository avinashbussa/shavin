/**
 * Where the finding popover goes, as a pure function of rectangles.
 *
 * Rules (vertical sides first, then horizontal; never on the element, the bar or the findings list):
 *  1. Obstacles: the element grown by 6, the bar by 8, the list by 8 (when it is showing), and any other panel the
 *     caller names in `obstacles` (the Theme and Settings panels) by 8. Those are never ignored.
 *  2. Candidates: below, above, right, left of the element. Below and above come first (the one with more room first),
 *     then right and left (same).
 *  3. The first candidate that fits the viewport and touches no obstacle wins.
 *  4. Otherwise slide each candidate along its cross axis by 80, 160 and 240 px either way.
 *  5. Otherwise, with the list showing, ignore the list: the list steps aside while the popover is open.
 *  6. Otherwise shrink the popover (at least 220 px tall) above or below and let it scroll inside.
 *  7. The caller may then scroll the page once (see `scrollToMakeRoom`) and ask again.
 *  8. Last resort: inside the element's visible bottom-right corner.
 * A finding about the whole page has no element: the popover docks beside the bar.
 */
import type { Rect } from "./geometry";

export interface PlaceInput {
  viewport: { W: number; H: number };
  /** The element's viewport rect (settled, after any scroll), or null for a page-level finding. */
  target: Rect | null;
  /** The bar's rect: its destination box, not a mid-transition rect. */
  bar: Rect;
  /** The findings list rect, or null when it is hidden. */
  list: Rect | null;
  /** Other open panels (Theme, Settings): always avoided, the way the bar is. */
  obstacles?: readonly Rect[];
  popover: { w: number; naturalH: number };
}

export type Side = "below" | "above" | "right" | "left" | "inside" | "bar";

export interface Placement {
  placed: Side;
  x: number;
  y: number;
  /** Set when the popover had to shrink and scroll inside. */
  maxHeight: number | null;
  /** The list should be hidden while the popover is open. */
  listAside: boolean;
}

export const PLACE = { gap: 10, margin: 12, pad: 6, obstaclePad: 8, minShrunk: 220, slides: [-80, 80, -160, 160, -240, 240] } as const;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
const grow = (r: Rect, p: number): Rect => ({ x: r.x - p, y: r.y - p, w: r.w + 2 * p, h: r.h + 2 * p });
const hit = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

export function placePopover(input: PlaceInput): Placement {
  const { W, H } = input.viewport;
  const { w: pw, naturalH: ph } = input.popover;
  const { gap: g, margin: m } = PLACE;

  if (!input.target) return placeBesideBar(input);
  const r = input.target;

  const barBox = grow(input.bar, PLACE.obstaclePad);
  const listBox = input.list ? grow(input.list, PLACE.obstaclePad) : null;
  const targetBox = grow(r, PLACE.pad);
  const others = (input.obstacles ?? []).map((o) => grow(o, PLACE.obstaclePad));
  const obstacles = (withList: boolean) => [targetBox, barBox, ...others, ...(withList && listBox ? [listBox] : [])];

  const ok = (x: number, y: number, h: number, withList: boolean) => {
    if (x < m || y < m || x + pw > W - m || y + h > H - m) return false;
    const box = { x, y, w: pw, h };
    return !obstacles(withList).some((o) => hit(box, o));
  };

  const cx = clamp(r.x, m, W - pw - m);
  const cy = clamp(r.y, m, H - ph - m);
  const below = { side: "below" as const, x: cx, y: r.y + r.h + g, space: H - (r.y + r.h), cross: "x" as const };
  const above = { side: "above" as const, x: cx, y: r.y - ph - g, space: r.y, cross: "x" as const };
  const right = { side: "right" as const, x: r.x + r.w + g, y: cy, space: W - (r.x + r.w), cross: "y" as const };
  const left = { side: "left" as const, x: r.x - pw - g, y: cy, space: r.x, cross: "y" as const };
  // The side with more room goes first. Right and left within a pixel of each other are a tie, and right wins
  // (an element centred in the viewport measures the same on both sides, up to rounding).
  const vertical = [below, above].sort((a, b) => b.space - a.space);
  const horizontal = [right, left].sort((a, b) => (Math.abs(b.space - a.space) < 1 ? 0 : b.space - a.space));
  const candidates = [...vertical, ...horizontal];

  const pick = (withList: boolean): Placement | null => {
    for (const c of candidates) if (ok(c.x, c.y, ph, withList)) return { placed: c.side, x: c.x, y: c.y, maxHeight: null, listAside: !withList };
    return null;
  };

  const first = pick(true);
  if (first) return first;

  for (const c of candidates) {
    for (const off of PLACE.slides) {
      const x = c.cross === "x" ? clamp(c.x + off, m, W - pw - m) : c.x;
      const y = c.cross === "y" ? clamp(c.y + off, m, H - ph - m) : c.y;
      if (ok(x, y, ph, true)) return { placed: c.side, x, y, maxHeight: null, listAside: false };
    }
  }

  if (input.list) {
    const aside = pick(false);
    if (aside) return aside;
  }

  for (const c of vertical) {
    const avail = c.space - g - m - 3;
    if (avail < PLACE.minShrunk) continue;
    const y = c.side === "below" ? r.y + r.h + g : r.y - g - avail;
    const box = { x: cx, y, w: pw, h: avail };
    if (hit(box, barBox) || others.some((o) => hit(box, o)) || (listBox && hit(box, listBox))) continue;
    return { placed: c.side, x: cx, y, maxHeight: avail, listAside: false };
  }

  return {
    placed: "inside",
    x: clamp(Math.min(r.x + r.w, W) - pw - m, m, W - pw - m),
    y: clamp(Math.min(r.y + r.h, H) - ph - m, m, H - ph - m),
    maxHeight: null,
    listAside: false,
  };
}

/** A finding with no element: the popover goes beside the bar, above it when the bar is low or in the middle. */
export function placeBesideBar(input: PlaceInput): Placement {
  const { W, H } = input.viewport;
  const { w: pw, naturalH: ph } = input.popover;
  const bar = input.bar;
  const low = bar.y + bar.h / 2 > H / 3;
  const y = low ? bar.y - ph - PLACE.gap : bar.y + bar.h + PLACE.gap;
  const x = clamp(bar.x, PLACE.margin, W - pw - PLACE.margin);
  const yy = clamp(y, PLACE.margin, Math.max(PLACE.margin, H - ph - PLACE.margin));
  // The bar and the list share the right-hand column: if the popover would sit on the list, the list steps aside.
  const onList = !!input.list && hit({ x, y: yy, w: pw, h: ph }, grow(input.list, PLACE.obstaclePad));
  return { placed: "bar", x, y: yy, maxHeight: null, listAside: onList };
}

/**
 * How far to scroll the page so that an element and the popover can both be seen: put the element at `want` from the
 * top. Returns null when the element plus the popover cannot fit in the viewport at all.
 */
export function scrollToMakeRoom(input: { viewport: { W: number; H: number }; target: Rect; popoverH: number }): number | null {
  const { H } = input.viewport;
  const { gap, margin } = PLACE;
  const r = input.target;
  if (r.h + input.popoverH + gap + 2 * margin > H) return null;
  const want = clamp((H - (r.h + input.popoverH + gap)) / 2, margin + 36, H);
  return r.y - want;
}

/** Phone width: the popover becomes a bottom sheet instead. */
export const isSheetWidth = (W: number) => W < 640;

/** How far to scroll so the element stays visible above a bottom sheet of height `sheetH`; 0 when it already is. */
export function scrollAboveSheet(input: { viewport: { W: number; H: number }; target: Rect; sheetH: number }): number {
  const limit = input.viewport.H - input.sheetH - 12;
  const r = input.target;
  if (r.y + r.h <= limit && r.y >= 8) return 0;
  return r.h > limit - 16 ? r.y - 12 : r.y + r.h - limit + 8;
}
