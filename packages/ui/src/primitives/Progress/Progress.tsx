"use client";
import * as RadixProgress from "@radix-ui/react-progress";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/cn";
import { Text } from "../Text";

export const progressVariants = cva("relative w-full overflow-hidden", {
  variants: {
    variant: {
      bar: "rounded-[var(--radius-lg)] bg-fg/10",
      "top-bar": "fixed top-0 left-0 right-0 z-[100] h-0.5 bg-transparent rounded-none",
    },
    size: {
      sm: "h-1.5",
      md: "h-2.5",
    },
  },
  defaultVariants: { variant: "bar", size: "md" },
});

export interface ProgressProps
  extends VariantProps<typeof progressVariants> {
  /** 0-100 percentage. When omitted or set to null, progress operates in indeterminate loading mode. */
  value?: number | null;
  /** Force indeterminate infinite sliding animation. */
  indeterminate?: boolean;
  /** Display numeric percentage indicator. @default false */
  showValue?: boolean;
  /** Custom formatter function for numeric indicator. @default (v) => `${Math.round(v)}%` */
  valueFormat?: (value: number) => string;
  /** Title or label text displayed above or alongside the progress bar. */
  label?: string;
  /** Position of numeric indicator & label ("top" header row or "right" side-by-side). @default "right" */
  labelPosition?: "top" | "right";
  /** Accessible name when the bar has no visible `label` (e.g. a heading above names it). */
  "aria-label"?: string;
  className?: string;
}

export function Progress({
  value,
  indeterminate,
  showValue = false,
  valueFormat,
  label,
  labelPosition = "right",
  "aria-label": ariaLabel,
  variant = "bar",
  size = "md",
  className,
}: ProgressProps) {
  const isIndeterminate = indeterminate || value == null;
  const isTopBar = variant === "top-bar";

  const formattedValue =
    typeof value === "number"
      ? valueFormat
        ? valueFormat(value)
        : `${Math.round(value)}%`
      : null;

  const hasTopHeader = labelPosition === "top" && (label || (showValue && formattedValue));
  const hasRightValue = labelPosition === "right" && showValue && formattedValue && !isTopBar;

  const track = isIndeterminate ? (
    <div
      role="progressbar"
      aria-label={ariaLabel ?? label ?? "Loading progress"}
      className={cn(progressVariants({ variant, size }), isTopBar ? "h-0.5" : "", !hasRightValue && className)}
    >
      <div className="h-full w-full rounded-[var(--radius-lg)] bg-accent/20 overflow-hidden relative">
        <div className="h-full w-full bg-accent animate-progress-indeterminate rounded-[var(--radius-lg)]" />
      </div>
    </div>
  ) : (
    <RadixProgress.Root
      value={value}
      aria-label={ariaLabel ?? label ?? "Progress"}
      className={cn(progressVariants({ variant, size }), isTopBar ? "h-0.5" : "", !hasRightValue && className)}
    >
      <RadixProgress.Indicator
        className="h-full rounded-[var(--radius-lg)] bg-accent transition-transform duration-300 ease-out"
        style={{ transform: `translateX(-${100 - (value ?? 0)}%)` }}
      />
    </RadixProgress.Root>
  );

  if (isTopBar) {
    return track;
  }

  return (
    <div className={cn("w-full", hasRightValue && className)}>
      {hasTopHeader && (
        <div className="flex items-center justify-between gap-2 mb-1.5">
          {label ? <Text size="xs" color="muted" weight="medium">{label}</Text> : <span />}
          {showValue && formattedValue && (
            <Text size="xs" color="muted" className="font-mono">{formattedValue}</Text>
          )}
        </div>
      )}
      {hasRightValue ? (
        <div className="flex items-center gap-3 w-full">
          <div className="flex-1 min-w-0">{track}</div>
          <Text size="xs" color="muted" className="shrink-0 font-mono min-w-[3.5ch] text-right">
            {formattedValue}
          </Text>
        </div>
      ) : (
        track
      )}
    </div>
  );
}
