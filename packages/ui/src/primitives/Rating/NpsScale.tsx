"use client";
import { useRef, useState, type HTMLAttributes, type KeyboardEvent } from "react";
import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

const cell = cva(
  "flex flex-1 items-center justify-center border font-medium tabular-nums transition-colors duration-150 first:rounded-l-[var(--radius-lg)] last:rounded-r-[var(--radius-lg)] -ml-px first:ml-0 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-accent",
  {
    variants: {
      size: { sm: "h-8 min-w-7 text-xs", md: "h-10 min-w-8 text-sm", lg: "h-12 min-w-9 text-base" },
      band: { detractor: "", passive: "", promoter: "" },
      selected: { true: "z-10", false: "border-hairline bg-surface text-fg hover:bg-surface-hover" },
    },
    compoundVariants: [
      { selected: true, band: "detractor", class: "border-danger bg-danger text-danger-fg" },
      { selected: true, band: "passive", class: "border-warning bg-warning text-warning-fg" },
      { selected: true, band: "promoter", class: "border-success bg-success text-success-fg" },
    ],
    defaultVariants: { size: "md", selected: false },
  },
);

const bandOf = (n: number) => (n <= 6 ? "detractor" : n <= 8 ? "passive" : "promoter");

export interface NpsScaleProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange" | "defaultValue"> {
  /** 0 to 10, or null for no answer. */
  value?: number | null;
  defaultValue?: number | null;
  onValueChange?: (value: number) => void;
  /** Label under the left end. @default "Not at all likely" */
  lowLabel?: string;
  /** Label under the right end. @default "Extremely likely" */
  highLabel?: string;
  size?: "sm" | "md" | "lg";
  readOnly?: boolean;
  disabled?: boolean;
  /** Accessible name. @default "How likely are you to recommend us, from 0 to 10?" */
  label?: string;
}

/**
 * The 0 to 10 Net Promoter Score question. The chosen number takes the colour of its band:
 * 0 to 6 detractor, 7 to 8 passive, 9 to 10 promoter. Arrow keys move the choice; Home and End jump to 0 and 10.
 */
export function NpsScale({ value, defaultValue = null, onValueChange, lowLabel = "Not at all likely", highLabel = "Extremely likely", size = "md", readOnly, disabled, label = "How likely are you to recommend us, from 0 to 10?", className, ...props }: NpsScaleProps) {
  const [inner, setInner] = useState<number | null>(defaultValue);
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const current = value !== undefined ? value : inner;
  const inert = readOnly || disabled;

  function pick(n: number) {
    if (inert) return;
    const v = Math.min(10, Math.max(0, n));
    if (value === undefined) setInner(v);
    onValueChange?.(v);
    refs.current[v]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (inert) return;
    const base = current ?? 0;
    const next: Record<string, number> = { ArrowRight: base + 1, ArrowUp: base + 1, ArrowLeft: base - 1, ArrowDown: base - 1, Home: 0, End: 10 };
    if (e.key in next) {
      e.preventDefault();
      pick(next[e.key]);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2", disabled && "opacity-50", className)} {...props}>
      <div role="radiogroup" aria-label={label} aria-disabled={disabled || undefined} onKeyDown={onKeyDown} className="flex w-full">
        {Array.from({ length: 11 }).map((_, n) => {
          const selected = current === n;
          return (
            <button
              key={n}
              ref={(el) => { refs.current[n] = el; }}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={String(n)}
              tabIndex={selected || (current === null && n === 0) ? 0 : -1}
              disabled={disabled}
              onClick={() => pick(n)}
              className={cn(cell({ size, band: bandOf(n), selected }), inert && "cursor-default")}
            >
              {n}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-between text-xs text-fg-subtle">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

export interface NpsResult {
  /** Promoters minus detractors, as a whole number from -100 to 100. */
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
}

/** Net Promoter Score from raw 0 to 10 answers. */
export function calculateNps(scores: number[]): NpsResult {
  const total = scores.length;
  const promoters = scores.filter((s) => s >= 9).length;
  const detractors = scores.filter((s) => s <= 6).length;
  const passives = total - promoters - detractors;
  return { score: total ? Math.round(((promoters - detractors) / total) * 100) : 0, promoters, passives, detractors, total };
}
