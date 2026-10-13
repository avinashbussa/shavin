"use client";
import { useMemo, useRef, useState, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import {
  BAR_RADIUS, ChartLegend, ChartTooltip, DEFAULT_SERIES, datumColor, makeFormatter, niceScale, xLabelClass, xLabelState, useSize,
  type AxisProps, type ChartBarRadius, type SeriesSpec,
} from "../../lib/chart-kit";

export interface BarChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children">, AxisProps {
  /**
   * One record per category: `label` plus a number under each series `key`.
   * Without `series`, the number is `value`, and a datum may carry its own `tone` or `color`.
   */
  data: Record<string, any>[];
  /** Omit for a single series of `value`s. */
  series?: SeriesSpec[];
  /** `horizontal` puts categories on the y axis, good for long labels and rankings. */
  orientation?: "vertical" | "horizontal";
  /** `grouped` puts the series side by side per category (comparison); `stacked` adds them up. */
  mode?: "grouped" | "stacked";
  showLegend?: boolean;
  /** Bar corner radius token (default "sm"). */
  barRadius?: ChartBarRadius;
  /** Gap between categories in px (default: 30% of the slot). */
  barGap?: number;
  /** Maximum bar width in px. */
  maxBarWidth?: number;
}

/** Vertical or horizontal bars: single, grouped (compare two or more per category) or stacked. Values may be negative (vertical). */
export function BarChart({
  data, series = DEFAULT_SERIES, orientation = "vertical", mode = "grouped", height = 260, showLegend = true,
  showGrid = true, showYAxis = true, showXAxis = true, xLabelEvery, xLabelEveryMobile, xLabels, tickCount = 4, yMax,
  padding: paddingProp, barRadius = "sm", barGap, maxBarWidth, yFormat, yPrefix, ySuffix, className, ...props
}: BarChartProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { width } = useSize(ref, height);
  const [hover, setHover] = useState<number | null>(null);
  const fmt = makeFormatter({ yFormat, yPrefix, ySuffix });
  const horizontal = orientation === "horizontal";
  const single = series === DEFAULT_SERIES;
  const longest = Math.max(...data.map((d) => String(d.label).length), 1);
  const PAD = {
    top: 12,
    right: 16,
    bottom: showXAxis || horizontal ? 28 : 4,
    left: horizontal ? Math.min(160, Math.max(56, longest * 6.4 + 16)) : showYAxis ? 44 : 8,
    ...paddingProp,
  };
  const innerW = Math.max(width - PAD.left - PAD.right, 40);
  const innerH = Math.max(height - PAD.top - PAD.bottom, 40);

  const scale = useMemo(() => {
    const vals = data.flatMap((d) => series.map((s) => Number(d[s.key] ?? 0)));
    const stackedMax = Math.max(0, ...data.map((d) => series.reduce((n, s) => n + Math.max(Number(d[s.key] ?? 0), 0), 0)));
    const top = mode === "stacked" ? stackedMax : Math.max(0, ...vals);
    const low = horizontal || mode === "stacked" ? 0 : Math.min(0, ...vals);
    const intervals = Math.max(Math.floor(tickCount), 1);
    const abs = Math.max(top, -low);
    const nice = niceScale(yMax ?? abs, intervals);
    const hi = yMax ?? nice.max;
    if (low >= 0) {
      const ticks = yMax !== undefined ? Array.from({ length: intervals + 1 }, (_, i) => (yMax / intervals) * i) : nice.ticks;
      return { lo: 0, hi, ticks };
    }
    return { lo: -hi, hi, ticks: [...nice.ticks.slice(1).map((t) => -t).reverse(), ...nice.ticks] };
  }, [data, series, mode, tickCount, yMax, horizontal]);

  const span = scale.hi - scale.lo || 1;
  const along = (v: number) => (horizontal ? PAD.left + ((v - scale.lo) / span) * innerW : PAD.top + innerH - ((v - scale.lo) / span) * innerH);
  const zero = along(0);

  const slot = (horizontal ? innerH : innerW) / Math.max(data.length, 1);
  const groupW = Math.min(
    barGap !== undefined ? Math.max(slot - barGap, 1) : slot * (single ? 0.55 : 0.7),
    (maxBarWidth ?? 56) * (mode === "grouped" ? series.length : 1),
  );
  const barW = mode === "grouped" ? Math.max(groupW / series.length - (series.length > 1 ? 2 : 0), 3) : groupW;
  const rx = BAR_RADIUS[barRadius] ?? BAR_RADIUS.sm;

  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      {showLegend && series.length > 1 && <ChartLegend series={series} />}
      <div ref={ref} className="relative w-full" style={{ height }}>
        <svg width={width} height={height} onPointerLeave={() => setHover(null)} role="img" aria-label="Bar chart">
          {scale.ticks.map((t) => {
            const pos = along(t);
            return (
              <g key={t}>
                {showGrid && (horizontal ? <line x1={pos} x2={pos} y1={PAD.top} y2={PAD.top + innerH} stroke="rgb(var(--hairline))" strokeDasharray="3 4" /> : <line x1={PAD.left} x2={width - PAD.right} y1={pos} y2={pos} stroke="rgb(var(--hairline))" strokeDasharray="3 4" />)}
                {showYAxis && (horizontal ? <text x={pos} y={height - 6} textAnchor="middle" className="fill-fg-subtle text-[11px]">{fmt(t)}</text> : <text x={PAD.left - 8} y={pos + 4} textAnchor="end" className="fill-fg-subtle text-[11px]">{fmt(t)}</text>)}
              </g>
            );
          })}
          {data.map((d, i) => {
            const center = (horizontal ? PAD.top : PAD.left) + slot * (i + 0.5);
            let run = 0;
            const state = xLabelState(String(d.label), i, { xLabelEvery, xLabelEveryMobile, xLabels });
            return (
              <g key={i} onPointerEnter={() => setHover(i)} opacity={hover === null || hover === i ? 1 : 0.55}>
                <rect x={horizontal ? PAD.left : center - slot / 2} y={horizontal ? center - slot / 2 : PAD.top} width={horizontal ? innerW : slot} height={horizontal ? slot : innerH} fill="transparent" />
                {series.map((s, si) => {
                  const v = Number(d[s.key] ?? 0);
                  const from = mode === "stacked" ? run : 0;
                  const to = mode === "stacked" ? run + v : v;
                  if (mode === "stacked") run += v;
                  const a0 = along(from), a1 = along(to);
                  const lo = Math.min(a0, a1), len = Math.abs(a1 - a0);
                  const cross = mode === "grouped" ? center - groupW / 2 + si * (groupW / series.length) + (series.length > 1 ? 1 : 0) : center - barW / 2;
                  const last = mode === "grouped" || si === series.length - 1;
                  const attrs = horizontal ? { x: lo, y: cross, width: len, height: barW } : { x: cross, y: lo, width: barW, height: len };
                  const fill = single ? datumColor(d, s, i) : datumColor({}, s, si);
                  return <rect key={s.key} {...attrs} style={{ rx: last ? rx : "0px" }} fill={fill} />;
                })}
                {horizontal
                  ? <text x={PAD.left - 8} y={center + 4} textAnchor="end" className="fill-fg-muted text-[11px]">{d.label}</text>
                  : showXAxis && state !== "hide" && <text x={center} y={height - 8} textAnchor="middle" className={cn("fill-fg-subtle text-[11px]", xLabelClass(state))}>{d.label}</text>}
              </g>
            );
          })}
          {scale.lo < 0 && !horizontal && <line x1={PAD.left} x2={width - PAD.right} y1={zero} y2={zero} stroke="rgb(var(--hairline-strong))" />}
        </svg>
        {hover !== null && (
          <ChartTooltip left={horizontal ? PAD.left + innerW / 2 : PAD.left + slot * (hover + 0.5)} top={horizontal ? PAD.top + slot * (hover + 0.5) : 8} width={width} title={String(data[hover].name ?? data[hover].label)} rows={series.map((s, si) => ({ name: s.name, value: fmt(Number(data[hover][s.key] ?? 0), true), color: single ? datumColor(data[hover], s, hover) : datumColor({}, s, si) }))} />
        )}
      </div>
    </div>
  );
}
