"use client";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { Icon } from "../Icon";
import { Rating } from "./Rating";

export interface RatingSummaryProps extends Omit<HTMLAttributes<HTMLDivElement>, "onSelect"> {
  /** How many ratings each star level got, from 1 star up: `[2, 1, 4, 20, 55]`. Average and total are derived from it. */
  counts: number[];
  /** Overrides the computed average (for example when it comes from your backend). */
  average?: number;
  /** Makes each row a button that reports its star level, for filtering reviews. */
  onSelect?: (stars: number) => void;
  /** The star level currently filtered, highlighted. */
  selected?: number | null;
  /** Noun for the total line. @default "reviews" */
  noun?: string;
}

/** Review summary: the average with stars and a count, beside a 5 to 1 distribution. */
export function RatingSummary({ counts, average, onSelect, selected, noun = "reviews", className, ...props }: RatingSummaryProps) {
  const total = counts.reduce((n, c) => n + c, 0);
  const avg = average ?? (total ? counts.reduce((n, c, i) => n + c * (i + 1), 0) / total : 0);
  const top = Math.max(1, ...counts);
  return (
    <div className={cn("flex flex-wrap items-center gap-x-10 gap-y-5", className)} {...props}>
      <div className="flex flex-col gap-2">
        <span className="text-5xl font-semibold tracking-tight tabular-nums text-fg">{avg.toFixed(1)}</span>
        <Rating readOnly value={avg} max={counts.length} size="md" />
        <span className="text-sm text-fg-muted tabular-nums">{total.toLocaleString("en")} {noun}</span>
      </div>
      <div className="flex min-w-56 flex-1 flex-col gap-1.5" role="list" aria-label="Rating breakdown">
        {counts.map((_, k) => {
          const stars = counts.length - k;
          const c = counts[stars - 1];
          const row = (
            <>
              <span className="inline-flex w-8 shrink-0 items-center gap-0.5 text-sm tabular-nums text-fg-muted">{stars}<Icon name="star" size="xs" color="inherit" className="fill-current" /></span>
              <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-fg/10">
                <span className="absolute inset-y-0 left-0 rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${(c / top) * 100}%` }} />
              </span>
              <span className="w-10 shrink-0 text-right text-sm tabular-nums text-fg-muted">{c.toLocaleString("en")}</span>
            </>
          );
          return onSelect ? (
            // A role on the button would erase its button semantics; the listitem wraps it.
            <div key={stars} role="listitem">
              <button
                type="button"
                aria-pressed={selected === stars}
                aria-label={`${stars} stars, ${c} ${noun}`}
                onClick={() => onSelect(stars)}
                className={cn("flex w-full items-center gap-3 rounded-[var(--radius-lg)] px-1.5 py-0.5 transition-colors hover:bg-surface-hover", selected === stars && "bg-surface-hover")}
              >
                {row}
              </button>
            </div>
          ) : (
            <div key={stars} role="listitem" className="flex items-center gap-3 px-1.5 py-0.5">{row}</div>
          );
        })}
      </div>
    </div>
  );
}
