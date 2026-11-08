import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type Ref,
  type RefCallback,
} from "react";

/** An edge or corner of a resizable element. Edges are physical, not logical. */
export type ResizeEdge =
  | "top"
  | "right"
  | "bottom"
  | "left"
  | "top-left"
  | "top-right"
  | "bottom-left"
  | "bottom-right";

/**
 * Which edges get a resize handle.
 * `true` / `"both"` = right + bottom + bottom-right corner, `"x"` = left + right,
 * `"y"` = top + bottom, or one edge, or a list of edges.
 */
export type ResizableEdges = ResizeEdge | ResizeEdge[] | "x" | "y" | "both" | boolean;

export interface ResizeSize {
  width: number;
  height: number;
}

/** Rendered corner radii in px, used to keep handle lines off rounded corners. */
export interface ResizeRadii {
  topLeft: number;
  topRight: number;
  bottomRight: number;
  bottomLeft: number;
}

export interface UseResizableOptions {
  /** Edges that get a handle. Falsy disables resizing. */
  edges?: ResizableEdges;
  /** Minimum width in px. */
  minWidth?: number;
  /** Maximum width in px. */
  maxWidth?: number;
  /** Minimum height in px. */
  minHeight?: number;
  /** Maximum height in px. */
  maxHeight?: number;
  /** Arrow-key step in px. Shift multiplies it by 4. Default 16. */
  step?: number;
  /** Round dragged sizes to this grid in px. */
  snap?: number;
  /** Keep the width/height ratio the element had when the resize started. */
  lockAspectRatio?: boolean;
  /** Save the size in localStorage under `shavin:resize:<persistKey>`. */
  persistKey?: string;
  /** Turn resizing off without changing `edges` (e.g. while collapsed). */
  disabled?: boolean;
  /** Fires once per frame while resizing. */
  onResize?: (size: ResizeSize) => void;
  /** Fires when a drag or key press finishes. */
  onResizeEnd?: (size: ResizeSize) => void;
}

export interface ResizeHandleProps {
  role: "separator";
  tabIndex: number;
  "aria-label": string;
  "aria-orientation"?: "horizontal" | "vertical";
  "aria-valuenow"?: number;
  "aria-valuemin"?: number;
  "aria-valuemax"?: number;
  "data-edge": ResizeEdge;
  "data-resizing"?: "";
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
  onDoubleClick: () => void;
}

export interface UseResizableResult {
  /** Attach to the element being resized. */
  ref: RefCallback<HTMLElement>;
  /** True when resizing is on (edges set and not disabled). */
  enabled: boolean;
  /** Edges that get a handle. */
  edges: ResizeEdge[];
  /** Size set by the user, or null while the element has its natural size. */
  size: Partial<ResizeSize> | null;
  /** Rendered size in layout px (unaffected by CSS transforms). */
  measured: ResizeSize | null;
  /** Rendered corner radii in px (0 for square corners). */
  radii: ResizeRadii | null;
  /** Inline style to merge onto the element: the user size plus min/max bounds. */
  style: CSSProperties;
  isResizing: boolean;
  activeEdge: ResizeEdge | null;
  getHandleProps: (edge: ResizeEdge) => ResizeHandleProps;
  /** Back to the natural size; clears the persisted value. */
  reset: () => void;
}

const ALL_EDGES: ResizeEdge[] = ["top", "right", "bottom", "left", "top-left", "top-right", "bottom-left", "bottom-right"];

export function resolveResizeEdges(edges: ResizableEdges | undefined): ResizeEdge[] {
  if (!edges) return [];
  if (edges === true || edges === "both") return ["right", "bottom", "bottom-right"];
  if (edges === "x") return ["left", "right"];
  if (edges === "y") return ["top", "bottom"];
  const list = Array.isArray(edges) ? edges : [edges];
  return ALL_EDGES.filter((e) => list.includes(e));
}

/** Direction each edge moves on the x and y axes: 1 grows with the pointer, -1 against it. */
function edgeAxes(edge: ResizeEdge): { x: -1 | 0 | 1; y: -1 | 0 | 1 } {
  return {
    x: edge.includes("right") ? 1 : edge.includes("left") ? -1 : 0,
    y: edge.includes("bottom") ? 1 : edge.includes("top") ? -1 : 0,
  };
}

/**
 * While dragging, slides a handle's grip to the pointer along its edge by setting
 * `--resize-thumb` (layout px from the handle's start) on the handle. The CSS clamps
 * it clear of the rounded corners. A direct style write, so following the pointer
 * never re-renders. The drag removes it on release, which re-centres the grip.
 */
export function trackResizeThumb(handle: HTMLElement, edge: ResizeEdge, clientX: number, clientY: number) {
  const axes = edgeAxes(edge);
  if (axes.x && axes.y) return; // Corners have no trail.
  const rect = handle.getBoundingClientRect();
  const along = axes.x
    ? (clientY - rect.top) / (handle.offsetHeight ? rect.height / handle.offsetHeight : 1)
    : (clientX - rect.left) / (handle.offsetWidth ? rect.width / handle.offsetWidth : 1);
  handle.style.setProperty("--resize-thumb", `${Math.round(along)}px`);
}

export function resizeCursor(edge: ResizeEdge): string {
  if (edge === "left" || edge === "right") return "ew-resize";
  if (edge === "top" || edge === "bottom") return "ns-resize";
  return edge === "top-left" || edge === "bottom-right" ? "nwse-resize" : "nesw-resize";
}

const clamp = (value: number, min?: number, max?: number) =>
  Math.min(max ?? Infinity, Math.max(min ?? 0, value));

const storageKey = (key: string) => `shavin:resize:${key}`;

function readStored(key: string): Partial<ResizeSize> | null {
  try {
    const raw = window.localStorage.getItem(storageKey(key));
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed !== "object") return null;
    const out: Partial<ResizeSize> = {};
    if (typeof parsed.width === "number") out.width = parsed.width;
    if (typeof parsed.height === "number") out.height = parsed.height;
    return out.width !== undefined || out.height !== undefined ? out : null;
  } catch {
    return null;
  }
}

function writeStored(key: string, size: Partial<ResizeSize> | null) {
  try {
    if (size) window.localStorage.setItem(storageKey(key), JSON.stringify(size));
    else window.localStorage.removeItem(storageKey(key));
  } catch {
    // Storage blocked (private mode, quota): the size just isn't remembered.
  }
}

/** One corner's radius in px. Percentages resolve against the element; elliptical radii use the first value. */
function cornerRadius(value: string, width: number, height: number): number {
  const first = value.trim().split(/\s+/)[0] ?? "0";
  const n = parseFloat(first);
  if (!Number.isFinite(n)) return 0;
  return first.endsWith("%") ? (n / 100) * Math.min(width, height) : n;
}

function readRadii(el: HTMLElement, width: number, height: number): ResizeRadii {
  const cs = getComputedStyle(el);
  // A radius can never exceed half the shorter side once rendered.
  const cap = Math.min(width, height) / 2;
  const r = (v: string) => Math.round(Math.min(cap, cornerRadius(v, width, height)) * 10) / 10;
  return {
    topLeft: r(cs.borderTopLeftRadius),
    topRight: r(cs.borderTopRightRadius),
    bottomRight: r(cs.borderBottomRightRadius),
    bottomLeft: r(cs.borderBottomLeftRadius),
  };
}

const sameRadii = (a: ResizeRadii | null, b: ResizeRadii) =>
  !!a && a.topLeft === b.topLeft && a.topRight === b.topRight && a.bottomRight === b.bottomRight && a.bottomLeft === b.bottomLeft;

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

/**
 * Headless resize engine behind the `resizable` prop on Box, Flex, Card and Sidebar.
 * Owns the element's own width/height; renders nothing. Spread `getHandleProps(edge)`
 * onto each handle element (or render `<ResizeHandles state={...} />`).
 */
export function useResizable(options: UseResizableOptions = {}): UseResizableResult {
  const { edges: edgesOption, minWidth, maxWidth, minHeight, maxHeight, step = 16, disabled, persistKey } = options;
  const edgeKey = Array.isArray(edgesOption) ? edgesOption.join(",") : String(edgesOption ?? "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const edges = useMemo(() => resolveResizeEdges(edgesOption), [edgeKey]);
  const enabled = edges.length > 0 && !disabled;

  const elementRef = useRef<HTMLElement | null>(null);
  const [node, setNode] = useState<HTMLElement | null>(null);
  const ref = useCallback((el: HTMLElement | null) => {
    elementRef.current = el;
    setNode(el);
  }, []);

  const [size, setSize] = useState<Partial<ResizeSize> | null>(null);
  const [measured, setMeasured] = useState<ResizeSize | null>(null);
  const [radii, setRadii] = useState<ResizeRadii | null>(null);
  const [activeEdge, setActiveEdge] = useState<ResizeEdge | null>(null);

  // Latest options for event handlers that outlive a render.
  const optionsRef = useRef(options);
  optionsRef.current = options;
  const sizeRef = useRef(size);
  sizeRef.current = size;
  const endDragRef = useRef<(() => void) | null>(null);

  // Persisted size is read after mount so server markup never depends on storage.
  useEffect(() => {
    if (!persistKey) return;
    const stored = readStored(persistKey);
    if (stored) setSize(stored);
  }, [persistKey]);

  // Track the rendered size (aria-valuenow, drag hint) and corner radii (handle insets).
  useIsoLayoutEffect(() => {
    if (!enabled || !node) return;
    const update = () => {
      const next = { width: node.offsetWidth, height: node.offsetHeight };
      setMeasured((prev) => (prev && prev.width === next.width && prev.height === next.height ? prev : next));
      const nextRadii = readRadii(node, next.width, next.height);
      setRadii((prev) => (sameRadii(prev, nextRadii) ? prev : nextRadii));
    };
    update();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(update);
    observer.observe(node);
    return () => observer.disconnect();
  }, [enabled, node]);

  useEffect(() => () => endDragRef.current?.(), []);

  const computeSize = useCallback(
    (start: ResizeSize, dx: number, dy: number, edge: ResizeEdge, applySnap: boolean): Partial<ResizeSize> => {
      const o = optionsRef.current;
      const axes = edgeAxes(edge);
      const round = (v: number) => (applySnap && o.snap ? Math.round(v / o.snap) * o.snap : v);
      let width = axes.x ? round(start.width + axes.x * dx) : undefined;
      let height = axes.y ? round(start.height + axes.y * dy) : undefined;
      if (o.lockAspectRatio && start.height > 0) {
        const ratio = start.width / start.height;
        if (width !== undefined && (height === undefined || Math.abs(dx) >= Math.abs(dy))) height = width / ratio;
        else if (height !== undefined) width = height * ratio;
      }
      const next: Partial<ResizeSize> = {};
      if (width !== undefined) next.width = Math.round(clamp(width, o.minWidth, o.maxWidth));
      if (height !== undefined) next.height = Math.round(clamp(height, o.minHeight, o.maxHeight));
      return next;
    },
    []
  );

  const commit = useCallback((next: Partial<ResizeSize>, final: boolean) => {
    const merged = { ...sizeRef.current, ...next };
    sizeRef.current = merged;
    setSize(merged);
    const el = elementRef.current;
    const full: ResizeSize = {
      width: merged.width ?? el?.offsetWidth ?? 0,
      height: merged.height ?? el?.offsetHeight ?? 0,
    };
    const o = optionsRef.current;
    o.onResize?.(full);
    if (final) {
      if (o.persistKey) writeStored(o.persistKey, merged);
      o.onResizeEnd?.(full);
    }
  }, []);

  const reset = useCallback(() => {
    sizeRef.current = null;
    setSize(null);
    if (optionsRef.current.persistKey) writeStored(optionsRef.current.persistKey, null);
  }, []);

  const startDrag = useCallback(
    (edge: ResizeEdge, event: ReactPointerEvent<HTMLElement>) => {
      const el = elementRef.current;
      if (!el || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      // Pointer deltas are in screen px; divide by the rendered scale for layout px.
      const rect = el.getBoundingClientRect();
      const scaleX = el.offsetWidth ? rect.width / el.offsetWidth : 1;
      const scaleY = el.offsetHeight ? rect.height / el.offsetHeight : 1;
      const start: ResizeSize = { width: el.offsetWidth, height: el.offsetHeight };
      const startX = event.clientX;
      const startY = event.clientY;
      const handle = event.currentTarget;
      trackResizeThumb(handle, edge, startX, startY);

      // A full-viewport overlay keeps iframes from swallowing pointer events mid-drag.
      const overlay = document.createElement("div");
      overlay.setAttribute("data-shavin-resize-overlay", "");
      Object.assign(overlay.style, { position: "fixed", inset: "0", zIndex: "2147483647", cursor: resizeCursor(edge) });
      document.body.appendChild(overlay);
      const prevUserSelect = document.body.style.userSelect;
      document.body.style.userSelect = "none";

      let frame = 0;
      let pending: Partial<ResizeSize> | null = null;
      const flush = () => {
        frame = 0;
        if (pending) commit(pending, false);
      };
      const onMove = (e: PointerEvent) => {
        // The overlay covers the handle mid-drag, so its own pointermove stops firing.
        trackResizeThumb(handle, edge, e.clientX, e.clientY);
        pending = computeSize(start, (e.clientX - startX) / scaleX, (e.clientY - startY) / scaleY, edge, true);
        if (!frame) frame = requestAnimationFrame(flush);
      };
      const end = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", end);
        window.removeEventListener("pointercancel", end);
        if (frame) cancelAnimationFrame(frame);
        overlay.remove();
        document.body.style.userSelect = prevUserSelect;
        // The grip glides back to the centre of the edge on release.
        handle.style.removeProperty("--resize-thumb");
        endDragRef.current = null;
        setActiveEdge(null);
        if (pending) commit(pending, true);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", end);
      window.addEventListener("pointercancel", end);
      endDragRef.current = end;
      setActiveEdge(edge);
    },
    [commit, computeSize]
  );

  const onKey = useCallback(
    (edge: ResizeEdge, event: ReactKeyboardEvent<HTMLElement>) => {
      const el = elementRef.current;
      if (!el) return;
      const o = optionsRef.current;
      const axes = edgeAxes(edge);
      const start: ResizeSize = { width: el.offsetWidth, height: el.offsetHeight };
      const amount = (o.step ?? 16) * (event.shiftKey ? 4 : 1);
      let next: Partial<ResizeSize> | null = null;

      switch (event.key) {
        // Arrows move the focused edge in their direction: ArrowRight grows a right
        // edge and shrinks a left one.
        case "ArrowLeft":
        case "ArrowRight":
          if (axes.x) next = computeSize(start, event.key === "ArrowRight" ? amount : -amount, 0, edge, false);
          break;
        case "ArrowUp":
        case "ArrowDown":
          if (axes.y) next = computeSize(start, 0, event.key === "ArrowDown" ? amount : -amount, edge, false);
          break;
        case "Home":
          next = {};
          if (axes.x && o.minWidth !== undefined) next.width = o.minWidth;
          if (axes.y && o.minHeight !== undefined) next.height = o.minHeight;
          break;
        case "End":
          next = {};
          if (axes.x && o.maxWidth !== undefined) next.width = o.maxWidth;
          if (axes.y && o.maxHeight !== undefined) next.height = o.maxHeight;
          break;
        case "Enter":
          event.preventDefault();
          reset();
          return;
        default:
          return;
      }
      if (!next || (next.width === undefined && next.height === undefined)) return;
      event.preventDefault();
      commit(next, true);
    },
    [commit, computeSize, reset]
  );

  const getHandleProps = useCallback(
    (edge: ResizeEdge): ResizeHandleProps => {
      const axes = edgeAxes(edge);
      const horizontal = axes.x !== 0;
      const corner = axes.x !== 0 && axes.y !== 0;
      return {
        role: "separator",
        tabIndex: 0,
        "aria-label": corner ? "Resize" : horizontal ? "Resize width" : "Resize height",
        // A separator between left/right content is a vertical line.
        "aria-orientation": corner ? undefined : horizontal ? "vertical" : "horizontal",
        "aria-valuenow": horizontal ? measured?.width : measured?.height,
        "aria-valuemin": horizontal ? minWidth : minHeight,
        "aria-valuemax": horizontal ? maxWidth : maxHeight,
        "data-edge": edge,
        "data-resizing": activeEdge === edge ? "" : undefined,
        onPointerDown: (e) => startDrag(edge, e),
        onKeyDown: (e) => onKey(edge, e),
        onDoubleClick: reset,
      };
    },
    [activeEdge, maxHeight, maxWidth, measured, minHeight, minWidth, onKey, reset, startDrag]
  );

  const style = useMemo<CSSProperties>(() => {
    if (!enabled) return {};
    const s: CSSProperties = {};
    if (size?.width !== undefined) s.width = size.width;
    if (size?.height !== undefined) s.height = size.height;
    if (minWidth !== undefined) s.minWidth = minWidth;
    if (maxWidth !== undefined) s.maxWidth = maxWidth;
    if (minHeight !== undefined) s.minHeight = minHeight;
    if (maxHeight !== undefined) s.maxHeight = maxHeight;
    return s;
  }, [enabled, size, minWidth, maxWidth, minHeight, maxHeight]);

  return {
    ref,
    enabled,
    edges: enabled ? edges : [],
    size,
    measured,
    radii,
    style,
    isResizing: activeEdge !== null,
    activeEdge,
    getHandleProps,
    reset,
  };
}

/** Merge a caller's ref with an internal ref callback. */
export function useMergedRef<T>(...refs: Array<Ref<T> | undefined>): RefCallback<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useCallback((value: T | null) => {
    for (const r of refs) {
      if (typeof r === "function") r(value);
      else if (r) (r as { current: T | null }).current = value;
    }
  }, refs);
}
