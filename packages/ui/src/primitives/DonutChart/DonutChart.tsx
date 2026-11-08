"use client";
import { useId, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "../../lib/cn";
import { ChartDataTable, ChartSwatch, SeriesPatterns, chartKeyProps, patternBase, seriesFill, toneColor, type ChartA11yProps } from "../../lib/chart-kit";

export interface DonutDatum {
  label: string;
  value: number;
  tone?: string;
  color?: string;
}

export interface DonutChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title">, ChartA11yProps {
  data: DonutDatum[];
  /** Diameter in px (default 160). */
  size?: number;
  /** Ring thickness in px (default 18). */
  thickness?: number;
  /** Small text in the centre, above the value. */
  centerLabel?: string;
  /** Large text in the centre. Defaults to the total. */
  centerValue?: ReactNode;
  showLegend?: boolean;
}

const num = (n: number) => n.toLocaleString("en");

/** A share-of-total ring with a centre readout and a legend that shows each slice's percentage. */
export function DonutChart({ data, size = 160, thickness = 18, centerLabel = "Total", centerValue, showLegend = true, title, description, patterns = true, className, ...props }: DonutChartProps) {
  const [active, setActive] = useState<number | null>(null);
  const descId = useId();
  const name = title ?? "Donut chart";
  const pat = patterns && data.length > 1 ? patternBase(descId) : null;
  const total = data.reduce((n, d) => n + Math.max(d.value, 0), 0) || 1;
  const r = (size - thickness) / 2;
  const c = 2 * Math.PI * r;
  const gap = data.length > 1 ? 2 : 0;
  let acc = 0;
  const slices = data.map((d, i) => {
    const frac = Math.max(d.value, 0) / total;
    const s = { ...d, frac, offset: acc, color: d.color ?? toneColor(d.tone, i) };
    acc += frac;
    return s;
  });
  const a = active !== null ? slices[active] : null;

  return (
    <div className={cn("flex flex-wrap items-center gap-6", className)} {...props}>
      {description && <p id={descId} className="sr-only">{description}</p>}
      <div
        className="relative shrink-0 rounded-full"
        style={{ width: size, height: size }}
        {...chartKeyProps({ name, descriptionId: description ? descId : undefined, count: slices.length, hover: active, setHover: setActive })}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true" className="-rotate-90">
          {pat && <SeriesPatterns base={pat} colors={slices.map((s) => s.color)} />}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(var(--fg) / 0.06)" strokeWidth={thickness} />
          {slices.map((s, i) => (
            <circle key={s.label} cx={size / 2} cy={size / 2} r={r} fill="none" stroke={seriesFill(pat, i, s.color)} strokeWidth={active === i ? thickness + 3 : thickness} strokeDasharray={`${Math.max(s.frac * c - gap, 0)} ${c}`} strokeDashoffset={-s.offset * c} onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)} opacity={active === null || active === i ? 1 : 0.5} className="transition-all" />
          ))}
        </svg>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xs text-fg-muted">{a ? a.label : centerLabel}</span>
          <span className="text-xl font-semibold tabular-nums text-fg">{a ? `${Math.round(a.frac * 100)}%` : (centerValue ?? num(total))}</span>
        </div>
      </div>
      {showLegend && (
        <div aria-hidden="true" className="flex min-w-40 flex-1 flex-col gap-2">
          {slices.map((s, i) => (
            <div key={s.label} className="flex items-center justify-between gap-4 text-sm" onPointerEnter={() => setActive(i)} onPointerLeave={() => setActive(null)}>
              <span className="inline-flex items-center gap-2 text-fg-muted"><ChartSwatch color={s.color} index={i} patterns={pat} />{s.label}</span>
              <span className="tabular-nums text-fg">{num(s.value)} <span className="text-xs text-fg-subtle">{Math.round(s.frac * 100)}%</span></span>
            </div>
          ))}
        </div>
      )}
      <ChartDataTable
        caption={name}
        columns={["Segment", "Value", "Share"]}
        rows={slices.map((x) => [x.label, num(x.value), `${Math.round(x.frac * 100)}%`])}
      />
    </div>
  );
}
