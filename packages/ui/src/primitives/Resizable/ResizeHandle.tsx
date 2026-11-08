import type { ComponentType, CSSProperties, HTMLAttributes, ReactNode, Ref } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import {
  useMergedRef,
  useResizable,
  type ResizableEdges,
  type ResizeEdge,
  type ResizeRadii,
  type ResizeSize,
  type UseResizableResult,
} from "../../lib/useResizable";

// Hit area is centred on the border: 8px for a mouse, 24px for touch. The visible
// line or grip is drawn with ::after / ::before so the hit area can stay invisible.
// Edge lines stop where the element's rounded corners begin (--resize-inset-start /
// --resize-inset-end, set by ResizeHandles from the measured radii).
export const resizeHandleVariants = cva(
  "absolute z-20 touch-none select-none outline-none after:pointer-events-none after:absolute after:bg-transparent after:transition-colors after:duration-150 before:pointer-events-none before:absolute before:rounded-full before:transition-[background-color,top,left] before:duration-150 data-[resizing]:before:transition-[background-color]",
  {
    variants: {
      edge: {
        right: "inset-y-0 -right-1 w-2 cursor-ew-resize [@media(pointer:coarse)]:-right-3 [@media(pointer:coarse)]:w-6 after:top-[var(--resize-inset-start,0px)] after:bottom-[var(--resize-inset-end,0px)] after:left-1/2 after:w-px after:-translate-x-1/2 focus-visible:after:w-0.5 data-[resizing]:after:w-0.5",
        left: "inset-y-0 -left-1 w-2 cursor-ew-resize [@media(pointer:coarse)]:-left-3 [@media(pointer:coarse)]:w-6 after:top-[var(--resize-inset-start,0px)] after:bottom-[var(--resize-inset-end,0px)] after:left-1/2 after:w-px after:-translate-x-1/2 focus-visible:after:w-0.5 data-[resizing]:after:w-0.5",
        bottom: "inset-x-0 -bottom-1 h-2 cursor-ns-resize [@media(pointer:coarse)]:-bottom-3 [@media(pointer:coarse)]:h-6 after:left-[var(--resize-inset-start,0px)] after:right-[var(--resize-inset-end,0px)] after:top-1/2 after:h-px after:-translate-y-1/2 focus-visible:after:h-0.5 data-[resizing]:after:h-0.5",
        top: "inset-x-0 -top-1 h-2 cursor-ns-resize [@media(pointer:coarse)]:-top-3 [@media(pointer:coarse)]:h-6 after:left-[var(--resize-inset-start,0px)] after:right-[var(--resize-inset-end,0px)] after:top-1/2 after:h-px after:-translate-y-1/2 focus-visible:after:h-0.5 data-[resizing]:after:h-0.5",
        "top-left": "z-[21] -left-1.5 -top-1.5 h-3 w-3 cursor-nwse-resize [@media(pointer:coarse)]:h-6 [@media(pointer:coarse)]:w-6 [@media(pointer:coarse)]:-left-3 [@media(pointer:coarse)]:-top-3",
        "top-right": "z-[21] -right-1.5 -top-1.5 h-3 w-3 cursor-nesw-resize [@media(pointer:coarse)]:h-6 [@media(pointer:coarse)]:w-6 [@media(pointer:coarse)]:-right-3 [@media(pointer:coarse)]:-top-3",
        "bottom-left": "z-[21] -bottom-1.5 -left-1.5 h-3 w-3 cursor-nesw-resize [@media(pointer:coarse)]:h-6 [@media(pointer:coarse)]:w-6 [@media(pointer:coarse)]:-bottom-3 [@media(pointer:coarse)]:-left-3",
        "bottom-right": "z-[21] -bottom-1.5 -right-1.5 h-3 w-3 cursor-nwse-resize [@media(pointer:coarse)]:h-6 [@media(pointer:coarse)]:w-6 [@media(pointer:coarse)]:-bottom-3 [@media(pointer:coarse)]:-right-3",
      },
      variant: {
        line: "",
        grip: "before:-translate-x-1/2 before:-translate-y-1/2 before:bg-hairline-strong",
        invisible: "after:hidden before:hidden focus-visible:after:block",
      },
      // Hover, focus and drag colours of the line and the grip.
      color: {
        accent:
          "hover:after:bg-accent focus-visible:after:bg-accent data-[resizing]:after:bg-accent hover:before:bg-accent focus-visible:before:bg-accent data-[resizing]:before:bg-accent",
        "accent-subtle":
          "hover:after:bg-accent/40 focus-visible:after:bg-accent/60 data-[resizing]:after:bg-accent/60 hover:before:bg-accent/40 focus-visible:before:bg-accent/60 data-[resizing]:before:bg-accent/60",
        neutral:
          "hover:after:bg-fg-subtle focus-visible:after:bg-fg-muted data-[resizing]:after:bg-fg-muted hover:before:bg-fg-subtle focus-visible:before:bg-fg-muted data-[resizing]:before:bg-fg-muted",
      },
    },
    compoundVariants: [
      // Corners draw a dot instead of a line.
      {
        edge: ["top-left", "top-right", "bottom-left", "bottom-right"],
        className: "after:left-1/2 after:top-1/2 after:h-1.5 after:w-1.5 after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full",
      },
      // While dragging, the grip follows the pointer along the edge (--resize-thumb, set by
      // trackResizeThumb), clamped so its 24px pill never enters a rounded corner. Centred at rest.
      {
        edge: ["left", "right"],
        variant: "grip",
        className:
          "before:h-6 before:w-1 before:left-1/2 before:top-[clamp(calc(var(--resize-inset-start,0px)_+_12px),var(--resize-thumb,50%),calc(100%_-_var(--resize-inset-end,0px)_-_12px))]",
      },
      {
        edge: ["top", "bottom"],
        variant: "grip",
        className:
          "before:h-1 before:w-6 before:top-1/2 before:left-[clamp(calc(var(--resize-inset-start,0px)_+_12px),var(--resize-thumb,50%),calc(100%_-_var(--resize-inset-end,0px)_-_12px))]",
      },
      { edge: ["top-left", "top-right", "bottom-left", "bottom-right"], variant: "grip", className: "before:h-1.5 before:w-1.5 before:left-1/2 before:top-1/2" },
    ],
    defaultVariants: { variant: "line", color: "accent-subtle" },
  }
);

export type ResizeHandleVariant = "line" | "grip" | "invisible";
export type ResizeHandleColor = "accent" | "accent-subtle" | "neutral";

export interface ResizeHandleProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onPointerDown" | "onKeyDown" | "onDoubleClick" | "color">,
    VariantProps<typeof resizeHandleVariants> {
  /** Edge or corner this handle sits on. */
  edge: ResizeEdge;
  /** Spread from `useResizable().getHandleProps(edge)`. */
  onPointerDown?: HTMLAttributes<HTMLDivElement>["onPointerDown"];
  onKeyDown?: HTMLAttributes<HTMLDivElement>["onKeyDown"];
  onDoubleClick?: () => void;
}

/** One styled resize handle. Position it inside a `relative` element. */
export function ResizeHandle({ edge, variant, color, className, ...props }: ResizeHandleProps) {
  return <div className={cn(resizeHandleVariants({ edge, variant, color }), className)} {...props} />;
}

// How far a corner handle moves in from the bounding-box corner to sit on the
// curve: the 45° point of a radius r is r·(1 − 1/√2) in from each side.
const ON_CURVE = 1 - Math.SQRT1_2;

/** Keeps edge lines off rounded corners and puts corner handles on the curve. */
function handleGeometry(edge: ResizeEdge, radii: ResizeRadii | null): CSSProperties | undefined {
  if (!radii) return undefined;
  const px = (n: number) => `${n}px`;
  switch (edge) {
    case "right":
      return { "--resize-inset-start": px(radii.topRight), "--resize-inset-end": px(radii.bottomRight) } as CSSProperties;
    case "left":
      return { "--resize-inset-start": px(radii.topLeft), "--resize-inset-end": px(radii.bottomLeft) } as CSSProperties;
    case "top":
      return { "--resize-inset-start": px(radii.topLeft), "--resize-inset-end": px(radii.topRight) } as CSSProperties;
    case "bottom":
      return { "--resize-inset-start": px(radii.bottomLeft), "--resize-inset-end": px(radii.bottomRight) } as CSSProperties;
    default: {
      const r = { "top-left": radii.topLeft, "top-right": radii.topRight, "bottom-left": radii.bottomLeft, "bottom-right": radii.bottomRight }[edge];
      if (!r) return undefined;
      const k = Math.round(r * ON_CURVE * 10) / 10;
      const dx = edge.endsWith("right") ? -k : k;
      const dy = edge.startsWith("bottom") ? -k : k;
      return { translate: `${dx}px ${dy}px` };
    }
  }
}

/** Every handle for a `useResizable` result, plus the size hint shown while dragging. */
export function ResizeHandles({
  state,
  variant,
  color,
  sizeHint = true,
}: {
  state: UseResizableResult;
  variant?: ResizeHandleVariant;
  color?: ResizeHandleColor;
  /** Show "320 × 200" while dragging. Default true. */
  sizeHint?: boolean;
}) {
  if (!state.enabled) return null;
  return (
    <>
      {state.edges.map((edge) => (
        <ResizeHandle
          key={edge}
          edge={edge}
          variant={variant}
          color={color}
          style={handleGeometry(edge, state.radii)}
          {...state.getHandleProps(edge)}
        />
      ))}
      {sizeHint && state.isResizing && state.measured && (
        <span
          data-panel
          aria-hidden="true"
          className="pointer-events-none absolute bottom-2 right-2 z-30 rounded-[var(--radius-lg)] border border-hairline bg-elevated px-1.5 py-0.5 text-xs tabular-nums text-fg shadow-panel"
        >
          {state.measured.width} × {state.measured.height}
        </span>
      )}
    </>
  );
}

/** Props shared by every primitive that takes `resizable` (Box, Flex, Card). */
export interface ResizableProps {
  /** Make the element user-resizable from these edges: "right", "bottom", "x", "y", "both", true, or a list such as ["left", "bottom-left"]. Off by default. */
  resizable?: ResizableEdges;
  /** Minimum width in px while resizable (also applied as CSS min-width). */
  minWidth?: number;
  /** Maximum width in px while resizable (also applied as CSS max-width). */
  maxWidth?: number;
  /** Minimum height in px while resizable (also applied as CSS min-height). */
  minHeight?: number;
  /** Maximum height in px while resizable (also applied as CSS max-height). */
  maxHeight?: number;
  /** Arrow-key resize step in px; Shift multiplies by 4. Default 16. */
  resizeStep?: number;
  /** Round dragged sizes to this grid in px. */
  snap?: number;
  /** Keep the width/height ratio while resizing. */
  lockAspectRatio?: boolean;
  /** Remember the size in localStorage under this key. */
  persistKey?: string;
  /** Fires once per frame while resizing. */
  onResize?: (size: ResizeSize) => void;
  /** Fires when a resize finishes. */
  onResizeEnd?: (size: ResizeSize) => void;
  /** Handle look: "line" (accent line on hover), "grip" (always-visible pill) or "invisible". Default "line". */
  resizeHandle?: ResizeHandleVariant;
  /** Handle colour on hover, focus and drag: "accent", "accent-subtle" (softer accent) or "neutral" (monochrome). Default "accent-subtle". */
  resizeColor?: ResizeHandleColor;
}

/** Splits `ResizableProps` off a primitive's props without running the engine. */
export function splitResizableProps<P extends ResizableProps>(props: P) {
  const {
    resizable,
    minWidth,
    maxWidth,
    minHeight,
    maxHeight,
    resizeStep,
    snap,
    lockAspectRatio,
    persistKey,
    onResize,
    onResizeEnd,
    resizeHandle,
    resizeColor,
    ...rest
  } = props;
  return {
    options: {
      edges: resizable,
      minWidth,
      maxWidth,
      minHeight,
      maxHeight,
      step: resizeStep,
      snap,
      lockAspectRatio,
      persistKey,
      onResize,
      onResizeEnd,
    },
    handleVariant: resizeHandle,
    handleColor: resizeColor,
    rest: rest as Omit<P, keyof ResizableProps>,
  };
}

type ResizableHost = {
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
};

/**
 * Adds the `resizable` prop to a layout primitive. The engine only mounts while
 * `resizable` is set, so plain Boxes and Flexes pay nothing for it.
 */
export function withResizable<P extends ResizableHost>(Inner: ComponentType<P>, displayName: string) {
  function ResizableHostImpl(props: P & ResizableProps) {
    const { options, handleVariant, handleColor, rest } = splitResizableProps(props);
    const state = useResizable(options);
    const host = rest as unknown as P;
    // Hosts type `ref` for their own element (HTMLDivElement, HTMLElement); the engine only needs HTMLElement.
    const ref = useMergedRef((host as { ref?: Ref<HTMLElement> }).ref, state.ref);
    return (
      <Inner
        {...({ ...host, ref } as P)}
        style={{ ...host.style, ...state.style }}
        className={cn("relative", state.isResizing && "select-none", host.className)}
      >
        {host.children}
        <ResizeHandles state={state} variant={handleVariant} color={handleColor} />
      </Inner>
    );
  }

  function Component(props: P & ResizableProps) {
    if (props.resizable) return <ResizableHostImpl {...props} />;
    return <Inner {...(splitResizableProps(props).rest as unknown as P)} />;
  }
  Component.displayName = displayName;
  return Component;
}
