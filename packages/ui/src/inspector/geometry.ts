/** Pure geometry for the Issues layer: which markers to draw, and how to merge the ones that crowd each other. */

export interface Point {
  x: number;
  y: number;
}

export interface MarkerInput extends Point {
  id: string;
  severity: "error" | "warning";
}

export interface Marker extends Point {
  /** Finding ids this marker stands for (more than one when merged). */
  ids: string[];
  severity: "error" | "warning";
}

/** Limits from the design: at most 12 markers on the page; merge within 24 px; a 96 px grid above 50 findings. */
export const MARKER_LIMITS = { max: 12, proximity: 24, grid: 96, gridAbove: 50, tintAtMost: 10 } as const;

const rank = { error: 0, warning: 1 } as const;

/** Greedy merge: each point joins the first marker within `distance`; the marker keeps the worst severity. */
function mergeByProximity(points: readonly MarkerInput[], distance: number): Marker[] {
  const out: Marker[] = [];
  for (const p of points) {
    const hit = out.find((m) => Math.hypot(m.x - p.x, m.y - p.y) < distance);
    if (hit) {
      hit.ids.push(p.id);
      if (rank[p.severity] < rank[hit.severity]) hit.severity = p.severity;
    } else {
      out.push({ x: p.x, y: p.y, ids: [p.id], severity: p.severity });
    }
  }
  return out;
}

function mergeByGrid(points: readonly MarkerInput[], cell: number): Marker[] {
  const cells = new Map<string, Marker>();
  for (const p of points) {
    const key = `${Math.floor(p.x / cell)}:${Math.floor(p.y / cell)}`;
    const hit = cells.get(key);
    if (hit) {
      hit.ids.push(p.id);
      if (rank[p.severity] < rank[hit.severity]) hit.severity = p.severity;
    } else {
      cells.set(key, { x: p.x, y: p.y, ids: [p.id], severity: p.severity });
    }
  }
  return [...cells.values()];
}

export interface MarkerPlan {
  markers: Marker[];
  /** Findings that have no marker on the page; they stay in the list ("+N more in the list"). */
  hidden: number;
  /** Tints are shown at rest only when there are few findings. */
  tint: boolean;
}

/**
 * Turns on-screen points into the markers to draw. Errors win a slot before warnings; markers are ordered by
 * position inside a severity so the choice is stable while scrolling.
 */
/** `total` is every finding that counts, on the page or not: the tint is only for a handful of findings overall. */
export function planMarkers(points: readonly MarkerInput[], limits = MARKER_LIMITS, total: number = points.length): MarkerPlan {
  const merged = points.length > limits.gridAbove ? mergeByGrid(points, limits.grid) : mergeByProximity(points, limits.proximity);
  merged.sort((a, b) => rank[a.severity] - rank[b.severity] || a.y - b.y || a.x - b.x);
  const markers = merged.slice(0, limits.max);
  const shown = markers.reduce((n, m) => n + m.ids.length, 0);
  return { markers, hidden: points.length - shown, tint: total <= limits.tintAtMost };
}

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const intersects = (a: Rect, b: Rect): boolean => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Is any part of the rect inside the viewport. */
export const inViewport = (r: Rect, w: number, h: number): boolean => r.x + r.w > 0 && r.y + r.h > 0 && r.x < w && r.y < h;
