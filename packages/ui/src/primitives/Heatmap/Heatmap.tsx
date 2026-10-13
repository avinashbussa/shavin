"use client";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { formatChartValue, type ChartYFormat } from "../../lib/chart-kit";
import { toneColor } from "../../lib/chart-kit";

export interface HeatmapProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  rows: string[];
  columns: string[];
  /** `values[row][column]`. Use `null` for cells with no data (they stay empty, like the lower triangle of a cohort table). */
  values: (number | null)[][];
  /** Colour of the filled cells (a theme tone). */
  tone?: "accent" | "success" | "warning" | "danger";
  /** Value that maps to full intensity; defaults to the largest value. */
  max?: number;
  format?: ChartYFormat;
  /** Print the value inside each cell (default true). */
  showValues?: boolean;
  /** Narrowest a column may get before the heatmap scrolls sideways, in px. */
  minColumnWidth?: number;
  /** Width of the row label column. */
  labelWidth?: string;
  rowLabelTitle?: string;
}

/** A labelled grid of cells shaded by value: cohort retention, activity by hour, correlation. */
export function Heatmap({ rows, columns, values, tone = "accent", max, format = "number", showValues = true, minColumnWidth = 44, labelWidth = "8rem", rowLabelTitle, className, ...props }: HeatmapProps) {
  const top = max ?? Math.max(0.0001, ...values.flat().map((v) => v ?? 0));
  const color = toneColor(tone);
  return (
    <div className={cn("overflow-x-auto", className)} {...props}>
      <div className="grid items-center gap-1" style={{ gridTemplateColumns: `${labelWidth} repeat(${columns.length}, minmax(${minColumnWidth}px, 1fr))`, minWidth: `calc(${labelWidth} + ${columns.length * (minColumnWidth + 4)}px)` }} role="table">
        <div className="text-xs text-fg-subtle">{rowLabelTitle}</div>
        {columns.map((c) => <div key={c} className="text-center text-xs text-fg-subtle">{c}</div>)}
        {rows.map((r, ri) => (
          <div key={r} className="contents" role="row">
            <div className="truncate text-sm text-fg">{r}</div>
            {columns.map((c, ci) => {
              const v = values[ri]?.[ci];
              if (v === null || v === undefined) return <div key={c} className="h-9" />;
              const shown = formatChartValue(v, format, undefined, undefined, format === "number");
              return (
                <div key={c} title={`${r} · ${c}: ${shown}`} className="relative flex h-9 items-center justify-center overflow-hidden rounded-[var(--radius-sm)] border border-hairline">
                  <div className="absolute inset-0" style={{ background: color, opacity: 0.08 + Math.min(v / top, 1) * 0.72 }} />
                  {showValues && <span className="relative text-xs font-medium tabular-nums text-fg">{shown}</span>}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
