/**
 * Where the control bar sits: one of eight anchors (four corners, four edge middles), snapped to on release and
 * remembered in dev storage. Pure helpers, no React.
 */
export type Anchor = "top-left" | "top-center" | "top-right" | "middle-left" | "middle-right" | "bottom-left" | "bottom-center" | "bottom-right";

export const ANCHORS: readonly Anchor[] = ["top-left", "top-center", "top-right", "middle-left", "middle-right", "bottom-left", "bottom-center", "bottom-right"];
export const DEFAULT_ANCHOR: Anchor = "bottom-right";
export const BAR_MARGIN = 20;
export const STORAGE_KEY = "shavin-inspector-bar";

export interface BarPrefs {
  anchor: Anchor;
  collapsed: boolean;
}

export const isAnchor = (v: unknown): v is Anchor => typeof v === "string" && (ANCHORS as readonly string[]).includes(v);

/** The side edges lay the bar out vertically. */
export const isVertical = (a: Anchor): boolean => a === "middle-left" || a === "middle-right";

/** Centre of the anchor's slot for a bar of the given size, in viewport coordinates. */
export function anchorCenter(a: Anchor, vw: number, vh: number, w: number, h: number, margin = BAR_MARGIN): { x: number; y: number } {
  const [row, col] = a.split("-") as ["top" | "middle" | "bottom", "left" | "center" | "right"];
  const x = col === "left" ? margin + w / 2 : col === "right" ? vw - margin - w / 2 : vw / 2;
  const y = row === "top" ? margin + h / 2 : row === "bottom" ? vh - margin - h / 2 : vh / 2;
  return { x, y };
}

/** The anchor whose slot is closest to the point (the bar's centre when it was let go). */
export function snapAnchor(x: number, y: number, vw: number, vh: number, w: number, h: number): Anchor {
  let best: Anchor = DEFAULT_ANCHOR;
  let bestD = Infinity;
  for (const a of ANCHORS) {
    const c = anchorCenter(a, vw, vh, w, h);
    const d = (c.x - x) ** 2 + (c.y - y) ** 2;
    if (d < bestD) {
      bestD = d;
      best = a;
    }
  }
  return best;
}

/** CSS position for an anchor. Edge middles and the bottom/top centre are centred with a transform. */
export function anchorStyle(a: Anchor, margin = BAR_MARGIN): { top?: number | string; bottom?: number | string; left?: number | string; right?: number | string; transform?: string } {
  const [row, col] = a.split("-") as ["top" | "middle" | "bottom", "left" | "center" | "right"];
  const s: ReturnType<typeof anchorStyle> = {};
  if (row === "top") s.top = margin;
  else if (row === "bottom") s.bottom = margin;
  else s.top = "50%";
  if (col === "left") s.left = margin;
  else if (col === "right") s.right = margin;
  else s.left = "50%";
  const tx = col === "center" ? "-50%" : "0";
  const ty = row === "middle" ? "-50%" : "0";
  if (tx !== "0" || ty !== "0") s.transform = `translate(${tx}, ${ty})`;
  return s;
}

/**
 * Where a panel that belongs to the bar (the findings list) opens: right next to it, on the side that faces the
 * page, lined up with the bar's edge. A box that fills the free space and aligns its child.
 */
export function dockStyle(a: Anchor, bar = 40, gap = 8, margin = BAR_MARGIN): { top: number; bottom: number; left: number; right: number; display: "flex"; alignItems: string; justifyContent: string } {
  const [row, col] = a.split("-") as ["top" | "middle" | "bottom", "left" | "center" | "right"];
  const off = margin + bar + gap;
  const justify = col === "left" ? "flex-start" : col === "right" ? "flex-end" : "center";
  if (row === "middle") {
    return { top: margin, bottom: margin, left: col === "left" ? off : margin, right: col === "right" ? off : margin, display: "flex", alignItems: "center", justifyContent: col === "left" ? "flex-start" : "flex-end" };
  }
  return { top: row === "top" ? off : margin, bottom: row === "bottom" ? off : margin, left: margin, right: margin, display: "flex", alignItems: row === "top" ? "flex-start" : "flex-end", justifyContent: justify };
}

/** Move one step toward a direction on the 3 by 3 grid (the middle cell does not exist). Stays put at an edge. */
export function stepAnchor(a: Anchor, dir: "left" | "right" | "up" | "down"): Anchor {
  const rows = ["top", "middle", "bottom"] as const;
  const cols = ["left", "center", "right"] as const;
  const [row, col] = a.split("-") as [(typeof rows)[number], (typeof cols)[number]];
  let r = rows.indexOf(row);
  let c = cols.indexOf(col);
  if (dir === "left") c = Math.max(0, c - 1);
  if (dir === "right") c = Math.min(2, c + 1);
  if (dir === "up") r = Math.max(0, r - 1);
  if (dir === "down") r = Math.min(2, r + 1);
  const next = `${rows[r]}-${cols[c]}` as Anchor;
  return isAnchor(next) ? next : a;
}

export function loadBarPrefs(startAnchor: Anchor = DEFAULT_ANCHOR): BarPrefs {
  const fallback: BarPrefs = { anchor: startAnchor, collapsed: true };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") as Partial<BarPrefs> | null;
    return { anchor: isAnchor(raw?.anchor) ? raw!.anchor : fallback.anchor, collapsed: typeof raw?.collapsed === "boolean" ? raw.collapsed : fallback.collapsed };
  } catch {
    return fallback;
  }
}

export function saveBarPrefs(p: BarPrefs): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(p));
  } catch {
    /* storage blocked: the bar still works, it just forgets */
  }
}

/** Tried in this order when the bar would cover the selection: bottom right, bottom left, bottom centre, then the top. */
export const AVOID_ORDER: readonly Anchor[] = ["bottom-right", "bottom-left", "bottom-center", "top-right", "top-left", "top-center"];

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const touches = (a: Box, b: Box) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/**
 * Where the bar should actually sit: the anchor the person chose, unless that would cover the selected element, in
 * which case the first anchor in `AVOID_ORDER` that does not. The chosen anchor is never overwritten.
 */
export function avoidAnchor(preferred: Anchor, covered: Box | null, vw: number, vh: number, w: number, h: number, pad = 8): Anchor {
  if (!covered) return preferred;
  const grown = { x: covered.x - pad, y: covered.y - pad, w: covered.w + 2 * pad, h: covered.h + 2 * pad };
  const slot = (a: Anchor): Box => {
    const c = anchorCenter(a, vw, vh, w, h);
    return { x: c.x - w / 2, y: c.y - h / 2, w, h };
  };
  if (!touches(slot(preferred), grown)) return preferred;
  for (const a of AVOID_ORDER) if (!touches(slot(a), grown)) return a;
  return preferred;
}

/**
 * Where a side panel (Theme on the left, Settings on the right) sits so it steps around the bar when the bar is in its
 * column: shorter at the bottom or top, moved over on the middle of the edge.
 */
export function panelInsets(bar: Anchor, side: "left" | "right", barSize = 40, gap = 8, margin = BAR_MARGIN): { top: number; bottom: number; left: number; right: number } {
  const [row, col] = bar.split("-") as ["top" | "middle" | "bottom", "left" | "center" | "right"];
  const off = margin + barSize + gap;
  const base = { top: margin, bottom: margin, left: margin, right: margin };
  if (col !== side) return base;
  if (row === "top") base.top = off;
  else if (row === "bottom") base.bottom = off;
  else base[side] = off;
  return base;
}
