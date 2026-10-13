"use client";
import { useId, useState, type HTMLAttributes, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { Icon } from "../Icon";

const toneClass = cva("", {
  variants: {
    tone: { accent: "text-accent", warning: "text-warning", success: "text-success" },
  },
  defaultVariants: { tone: "accent" },
});

const sizeClass = cva("", {
  variants: {
    size: { sm: "gap-0.5 text-xs", md: "gap-1 text-sm", lg: "gap-1.5 text-base" },
  },
  defaultVariants: { size: "md" },
});

const STAR_SIZE = { sm: "sm", md: "md", lg: "lg" } as const;

export interface RatingProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue">,
    VariantProps<typeof toneClass>,
    VariantProps<typeof sizeClass> {
  /** Current value, 0 to `max`. Fractions render as partly filled stars (4.5, 4.2…). */
  value?: number;
  defaultValue?: number;
  onValueChange?: (value: number) => void;
  /** Number of stars. @default 5 */
  max?: number;
  /** Input step. `half` lets people pick 3.5. Display always shows any fraction. @default "full" */
  precision?: "full" | "half";
  /** Display only: no focus, no pointer, announced as an image. */
  readOnly?: boolean;
  disabled?: boolean;
  /** Show the number next to the stars, for example "4.8". */
  showValue?: boolean;
  /** Review count shown in brackets, for example "(34)". */
  count?: number;
  /** Accessible name for the interactive control. @default "Rating" */
  label?: string;
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

/**
 * Star rating, for showing an average (read only, fractions allowed) or collecting one (click, drag-free,
 * arrow keys, optional half stars). Interactive mode is a single `slider` so screen readers announce
 * "3 out of 5" and keyboard users use Arrow, Home and End.
 */
export function Rating({ value, defaultValue = 0, onValueChange, max = 5, precision = "full", readOnly, disabled, showValue, count, label = "Rating", tone, size = "md", className, ...props }: RatingProps) {
  const [inner, setInner] = useState(defaultValue);
  const [hover, setHover] = useState<number | null>(null);
  const id = useId();
  const current = value ?? inner;
  const shown = hover ?? current;
  const step = precision === "half" ? 0.5 : 1;
  const interactive = !readOnly && !disabled;
  const px = STAR_SIZE[size ?? "md"];

  function commit(next: number) {
    const v = clamp(next, 0, max);
    if (value === undefined) setInner(v);
    onValueChange?.(v);
  }

  function valueAt(e: PointerEvent<HTMLElement>, index: number) {
    if (precision !== "half") return index + 1;
    const r = e.currentTarget.getBoundingClientRect();
    return index + (e.clientX - r.left < r.width / 2 ? 0.5 : 1);
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (!interactive) return;
    const keys: Record<string, number> = { ArrowRight: current + step, ArrowUp: current + step, ArrowLeft: current - step, ArrowDown: current - step, Home: 0, End: max };
    if (e.key in keys) {
      e.preventDefault();
      commit(keys[e.key]);
    }
  }

  const stars = (
    <span className={cn("relative inline-flex items-center", sizeClass({ size }), toneClass({ tone }))} aria-hidden>
      {Array.from({ length: max }).map((_, i) => {
        const fill = clamp(shown - i, 0, 1);
        return (
          <span
            key={i}
            data-star={i + 1}
            className={cn("relative inline-flex", interactive && "cursor-pointer transition-transform duration-150 hover:scale-110")}
            onPointerMove={interactive ? (e) => setHover(valueAt(e, i)) : undefined}
            onPointerLeave={interactive ? () => setHover(null) : undefined}
            onClick={interactive ? (e) => commit(valueAt(e as unknown as PointerEvent<HTMLElement>, i)) : undefined}
          >
            <Icon name="star" size={px} color="inherit" className="text-fg-subtle/50" />
            <span data-fill className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Icon name="star" size={px} color="inherit" className="fill-current" />
            </span>
          </span>
        );
      })}
    </span>
  );

  const meta: ReactNode = (showValue || count !== undefined) && (
    <span className="inline-flex items-baseline gap-1 text-fg-muted tabular-nums">
      {showValue && <span className="font-medium text-fg">{Number.isInteger(current) ? current : current.toFixed(1)}</span>}
      {count !== undefined && <span>({count.toLocaleString("en")})</span>}
    </span>
  );

  if (!interactive) {
    return (
      <div
        role="img"
        aria-label={`${Number.isInteger(current) ? current : current.toFixed(1)} out of ${max}`}
        aria-disabled={disabled || undefined}
        className={cn("inline-flex items-center gap-2", disabled && "opacity-50", className)}
        {...props}
      >
        {stars}
        {meta}
      </div>
    );
  }

  return (
    <div className={cn("inline-flex items-center gap-2", className)} {...props}>
      <div
        id={id}
        role="slider"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={current}
        aria-valuetext={`${current} out of ${max}`}
        onKeyDown={onKeyDown}
        className="rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        {stars}
      </div>
      {meta}
    </div>
  );
}
