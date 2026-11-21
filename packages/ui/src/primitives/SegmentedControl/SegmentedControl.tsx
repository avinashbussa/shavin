"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import * as RadixToggleGroup from "@radix-ui/react-toggle-group";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { hitAreaClass, type HitArea } from "../../lib/hit-area";
import { useSlidingIndicator } from "../../lib/useSlidingIndicator";

export type Size = "sm" | "md";
export type Variant = "default" | "pill" | "subtle" | "expand" | "icon";

type SegmentedCtx = { size: Size; variant: Variant; hitArea?: HitArea };
const SizeContext = createContext<SegmentedCtx>({ size: "md", variant: "default" });

const rootPad = { sm: "p-0.5", md: "p-1" } as const;
const indInset = { sm: "top-0.5 bottom-0.5", md: "top-1 bottom-1" } as const;

/** Variants with the animated sliding indicator (a single pill that glides between items) instead
 *  of a per-item background swap. `expand` is excluded: its active item animates its own width to
 *  reveal a label, which a single sliding pill cannot track without looking broken. */
const SLIDING = new Set<Variant>(["default", "pill", "subtle", "icon"]);

export interface SegmentedControlProps
  extends Omit<RadixToggleGroup.ToggleGroupSingleProps, "type"> {
  size?: Size;
  /** default | pill | subtle | expand | icon. */
  variant?: Variant;
  /**
   * Hit-area override (docs: "Target size"). "default": 24px floor, 44px on touch. "none": no hit area
   * growth (dense toolbars; may go below 24px, yours to own). "touch": always 44px on a coarse pointer.
   */
  hitArea?: HitArea;
}

export function SegmentedControl({
  className,
  size = "md",
  variant = "default",
  hitArea,
  value,
  defaultValue,
  onValueChange,
  children,
  ...props
}: SegmentedControlProps) {
  // Single-select must always have a value (radio semantics): Radix ToggleGroup lets
  // a second click clear it, so keep our own value and ignore the empty one.
  const [innerValue, setInnerValue] = useState(defaultValue);
  const currentValue = value ?? innerValue;
  const resolved: Variant = variant;
  const isPill = resolved === "pill";
  // Variants whose active fill is a muted brand tint rather than a solid brand pill.
  const isTinted = resolved === "subtle" || resolved === "icon";
  const sliding = SLIDING.has(resolved);

  const { ref: rootRef, indicatorRef, pos, size: indWidth, on, transitionClass } = useSlidingIndicator<HTMLDivElement>({
    enabled: sliding,
    activeSelector: '[data-state="on"]',
  });

  // pill: the track sits on canvas and the thumb on elevated, so the thumb reads raised in both
  // themes (white on grey in light, a lighter grey on near-black in dark).
  const indRadius = isPill ? "rounded-full" : "rounded-control-inner";
  const indBg = isTinted
    ? "bg-brand/10"
    : isPill
      ? "bg-elevated shadow-card border border-hairline/40"
      : "bg-brand-solid";

  return (
    <SizeContext.Provider value={{ size, variant: resolved, hitArea }}>
      <RadixToggleGroup.Root
        ref={rootRef}
        type="single"
        value={currentValue}
        onValueChange={(next: string) => {
          if (!next) return;
          setInnerValue(next);
          onValueChange?.(next);
        }}
        className={cn(
          // Coarse pointer: let the items' 44px hit area extend past the track (nothing is drawn outside it).
          "relative inline-flex gap-1 overflow-hidden [@media(pointer:coarse)]:overflow-visible",
          isPill
            ? "rounded-full border border-hairline/60 bg-canvas/80"
            : "rounded-[var(--radius-lg)] border border-hairline",
          rootPad[size],
          className,
        )}
        {...props}
      >
        {sliding && (
          <span
            ref={indicatorRef}
            aria-hidden="true"
            className={cn("pointer-events-none absolute left-0 z-0", indInset[size], indRadius, indBg, transitionClass, !on && "opacity-0")}
            style={{ transform: `translateX(${pos}px)`, width: indWidth }}
          />
        )}
        {children}
      </RadixToggleGroup.Root>
    </SizeContext.Provider>
  );
}

export const itemVariants = cva(
  "hit-area-touch transition disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
  {
    variants: {
      variant: {
        // Sliding-indicator variants: the item carries NO background (the moving pill does); only text toggles.
        default:
          "relative z-10 rounded-control-inner text-fg-muted hover:text-fg active:scale-[0.97] data-[state=on]:text-brand-fg",
        subtle:
          "relative z-10 rounded-control-inner text-fg-muted hover:text-fg active:scale-[0.97] data-[state=on]:text-brand-text data-[state=on]:font-medium",
        pill:
          "relative z-10 rounded-full font-medium text-fg-muted hover:text-fg active:scale-[0.97] data-[state=on]:text-fg data-[state=on]:font-semibold",
        // expand keeps its per-item background swap (the label-reveal rail is not slide-compatible).
        expand:
          "rounded-control-inner text-fg-muted hover:bg-surface-hover hover:text-fg active:scale-[0.97] data-[state=on]:bg-brand-solid data-[state=on]:text-brand-fg data-[state=on]:hover:bg-brand-solid",
        // icon rail defers its background to the sliding indicator (subtle brand tint, text/icon only).
        icon:
          "relative z-10 rounded-control-inner text-fg-muted hover:text-fg active:scale-[0.97] data-[state=on]:text-brand-text data-[state=on]:font-medium",
      },
      size: {
        sm: "px-2.5 py-1 text-xs",
        md: "px-4 py-1.5 text-sm",
      },
    },
    defaultVariants: { variant: "default", size: "md" },
  },
);

export interface SegmentedControlItemProps {
  value: string;
  children?: ReactNode;
  icon?: ReactNode;
  label?: ReactNode;
  disabled?: boolean;
  /** Accessible name for icon-only items when `label` is not a string. Falls back to `value`. */
  "aria-label"?: string;
  /** Hit-area override for this item; defaults to the control's. See SegmentedControl. */
  hitArea?: HitArea;
}

export function SegmentedControlItem({
  value,
  children,
  icon,
  label,
  disabled,
  hitArea: itemHitArea,
  "aria-label": ariaLabel,
}: SegmentedControlItemProps) {
  const { size, variant, hitArea: groupHitArea } = useContext(SizeContext);
  const hit = hitAreaClass(itemHitArea ?? groupHitArea, "touch", "SegmentedControl");

  if (variant === "icon" && icon !== undefined) {
    return (
      <RadixToggleGroup.Item
        value={value}
        disabled={disabled}
        aria-label={ariaLabel ?? (typeof label === "string" ? label : value)}
        className={cn(itemVariants({ variant, size }), hit, "flex items-center justify-center")}
      >
        <span className="shrink-0" aria-hidden="true">{icon}</span>
      </RadixToggleGroup.Item>
    );
  }

  const iconOnly = variant === "expand";
  if (iconOnly && icon !== undefined) {
    return (
      <RadixToggleGroup.Item
        value={value}
        disabled={disabled}
        className={cn(
          itemVariants({ variant, size }),
          hit,
          // No overflow-hidden here: it would clip the item's hit area (the label span clips its own overflow).
          "grid grid-cols-[auto_0fr] items-center gap-0",
          "data-[state=on]:grid-cols-[auto_1fr] data-[state=on]:gap-1.5",
        )}
        style={{
          transition:
            "grid-template-columns 160ms cubic-bezier(0.23,1,0.32,1), gap 160ms cubic-bezier(0.23,1,0.32,1), background-color 120ms ease, color 120ms ease, transform 100ms ease",
        }}
      >
        <span className="shrink-0">{icon}</span>
        <span
          className="min-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-opacity data-[state=on]:opacity-100 [[data-state=on]_&]:opacity-100"
          style={{ transition: "opacity 100ms cubic-bezier(0.23,1,0.32,1) 60ms" }}
        >
          {label}
        </span>
      </RadixToggleGroup.Item>
    );
  }

  return (
    <RadixToggleGroup.Item
      value={value}
      disabled={disabled}
      className={cn("flex-1 text-center whitespace-nowrap min-w-fit select-none", itemVariants({ variant, size }), hit)}
    >
      {children ?? label}
    </RadixToggleGroup.Item>
  );
}
