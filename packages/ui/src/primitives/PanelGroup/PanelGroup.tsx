import { useCallback, useEffect, useLayoutEffect, useRef, type Ref } from "react";
import {
  Group,
  Panel as PanelPrimitive,
  Separator,
  type GroupImperativeHandle,
  type GroupProps,
  type Layout,
  type LayoutStorage,
  type PanelProps as PanelPrimitiveProps,
  type SeparatorProps,
} from "react-resizable-panels";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";

// Guarded so server rendering and blocked storage (private modes) never throw.
const browserStorage: LayoutStorage = {
  getItem: (key) => {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      // Storage blocked: the layout just isn't remembered.
    }
  },
};

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function readLayout(storage: LayoutStorage, key: string): Layout | null {
  try {
    const parsed = JSON.parse(storage.getItem(key) ?? "null");
    if (!parsed || typeof parsed !== "object") return null;
    return Object.values(parsed).every((v) => typeof v === "number") ? (parsed as Layout) : null;
  } catch {
    return null;
  }
}

/**
 * While a PanelHandle is dragged, slides its grip to the pointer along the divider.
 * The library hit-tests separators at group level (a 1px divider is "active" from
 * several px away), so this listens on the group, not the separator.
 */
function slideGrips(group: HTMLElement, clientX: number, clientY: number) {
  for (const child of Array.from(group.children)) {
    const el = child as HTMLElement;
    if (el.dataset.separator !== "active") continue;
    const rect = el.getBoundingClientRect();
    const along = el.getAttribute("aria-orientation") === "horizontal" ? clientX - rect.left : clientY - rect.top;
    el.style.setProperty("--resize-thumb", `${Math.round(along)}px`);
  }
}

/** Re-centres every grip in the group (on pointer release, wherever it happens). */
function centreGrips(group: HTMLElement) {
  for (const child of Array.from(group.children)) (child as HTMLElement).style.removeProperty("--resize-thumb");
}

export interface PanelGroupProps extends GroupProps {
  /** Split direction: "horizontal" puts panels side by side, "vertical" stacks them. Default "horizontal". */
  orientation?: "horizontal" | "vertical";
  /** Remember the layout under this key (saved after the user resizes). Panels need stable `id`s. */
  persistKey?: string;
  /** Where `persistKey` saves the layout. Default localStorage. For SSR without a layout jump, read the layout from a cookie on the server and pass it as `defaultLayout`. */
  storage?: LayoutStorage;
}

/**
 * Panes that trade space with each other. Import from "@shavin/ui/panels".
 * For a single element that resizes itself, use the `resizable` prop on Box / Flex / Card.
 */
export function PanelGroup({
  persistKey,
  storage,
  defaultLayout,
  onLayoutChanged,
  groupRef,
  elementRef,
  className,
  onPointerMove,
  ...props
}: PanelGroupProps) {
  const handleRef = useRef<GroupImperativeHandle | null>(null);
  const groupEl = useRef<HTMLDivElement | null>(null);
  const setGroupEl = useCallback(
    (el: HTMLDivElement | null) => {
      groupEl.current = el;
      if (typeof elementRef === "function") elementRef(el);
      else if (elementRef) (elementRef as { current: HTMLDivElement | null }).current = el;
    },
    [elementRef]
  );

  // The release can land anywhere, so listen on the document.
  useEffect(() => {
    const onUp = () => groupEl.current && centreGrips(groupEl.current);
    document.addEventListener("pointerup", onUp);
    document.addEventListener("pointercancel", onUp);
    return () => {
      document.removeEventListener("pointerup", onUp);
      document.removeEventListener("pointercancel", onUp);
    };
  }, []);
  const setGroupRef = useCallback(
    (handle: GroupImperativeHandle | null) => {
      handleRef.current = handle;
      if (typeof groupRef === "function") groupRef(handle);
      else if (groupRef) (groupRef as { current: GroupImperativeHandle | null }).current = handle;
    },
    [groupRef]
  );
  const storageKey = persistKey ? `shavin:panels:${persistKey}` : null;
  const store = storage ?? browserStorage;

  // Saved layouts are applied after hydration, never during render, so server and
  // client markup match. A layout effect applies it before the first client paint.
  useIsoLayoutEffect(() => {
    if (!storageKey || defaultLayout) return;
    const saved = readLayout(store, storageKey);
    if (saved) handleRef.current?.setLayout(saved);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  return (
    <Group
      className={cn("h-full w-full", className)}
      defaultLayout={defaultLayout}
      groupRef={setGroupRef as Ref<GroupImperativeHandle | null>}
      elementRef={setGroupEl}
      onPointerMove={(e) => {
        slideGrips(e.currentTarget, e.clientX, e.clientY);
        onPointerMove?.(e);
      }}
      onLayoutChanged={(layout, meta) => {
        if (storageKey && meta.isUserInteraction) store.setItem(storageKey, JSON.stringify(meta.requestedLayout ?? layout));
        onLayoutChanged?.(layout, meta);
      }}
      {...props}
    />
  );
}

export interface PanelProps extends PanelPrimitiveProps {
  /** Stable id; required for `persistKey` and imperative APIs. */
  id?: string;
}

/**
 * One pane of a PanelGroup. Sizes: numbers are px, unitless strings are %, or use "px", "%", "rem", "vh", "vw".
 */
export function Panel({ className, ...props }: PanelProps) {
  return <PanelPrimitive className={cn("min-h-0 min-w-0", className)} {...props} />;
}

export const panelHandleVariants = cva(
  "relative flex-none focus-visible:outline-offset-0 transition-colors duration-150 [&[aria-orientation=vertical]]:w-px [&[aria-orientation=horizontal]]:h-px data-[separator=disabled]:opacity-50 before:pointer-events-none before:absolute before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:transition-[background-color,top,left] before:duration-150 data-[separator=active]:before:transition-[background-color] [&[aria-orientation=vertical]]:before:left-1/2 [&[aria-orientation=vertical]]:before:top-[clamp(12px,var(--resize-thumb,50%),calc(100%_-_12px))] [&[aria-orientation=horizontal]]:before:top-1/2 [&[aria-orientation=horizontal]]:before:left-[clamp(12px,var(--resize-thumb,50%),calc(100%_-_12px))]",
  {
    variants: {
      variant: {
        line: "bg-hairline",
        grip: "bg-hairline before:bg-hairline-strong [&[aria-orientation=vertical]]:before:h-6 [&[aria-orientation=vertical]]:before:w-1 [&[aria-orientation=horizontal]]:before:h-1 [&[aria-orientation=horizontal]]:before:w-6",
        invisible: "bg-transparent",
      },
      // Hover, focus and drag colours of the divider and the grip.
      color: {
        accent:
          "data-[separator=hover]:bg-accent data-[separator=active]:bg-accent data-[separator=focus]:bg-accent data-[separator=hover]:before:bg-accent data-[separator=active]:before:bg-accent data-[separator=focus]:before:bg-accent",
        "accent-subtle":
          "data-[separator=hover]:bg-accent/40 data-[separator=active]:bg-accent/60 data-[separator=focus]:bg-accent/60 data-[separator=hover]:before:bg-accent/40 data-[separator=active]:before:bg-accent/60 data-[separator=focus]:before:bg-accent/60",
        neutral:
          "data-[separator=hover]:bg-fg-subtle data-[separator=active]:bg-fg-muted data-[separator=focus]:bg-fg-muted data-[separator=hover]:before:bg-fg-subtle data-[separator=active]:before:bg-fg-muted data-[separator=focus]:before:bg-fg-muted",
      },
    },
    defaultVariants: { variant: "line", color: "accent-subtle" },
  }
);

export interface PanelHandleProps extends Omit<SeparatorProps, "color">, VariantProps<typeof panelHandleVariants> {}

/** Resize handle between two Panels. Must be a direct child of PanelGroup. */
export function PanelHandle({ variant, color, className, ...props }: PanelHandleProps) {
  return <Separator aria-label="Resize panels" className={cn(panelHandleVariants({ variant, color }), className)} {...props} />;
}
