"use client";
import { useEffect, useRef, useState, type RefObject } from "react";
import { CONCENTRIC_FLOOR } from "./concentric";

/** Semantic colour tone for a series or datum (resolved to theme tokens). */
export type ChartTone = "accent" | "success" | "danger" | "warning" | "neutral";
/** Y-axis / tooltip value format. */
export type ChartYFormat = "number" | "compact" | "currency" | "percent";
/** Bar corner radius token. `floor` = concentric floor min(radius-lg, radius-panel / 2). */
export type ChartBarRadius = "none" | "sm" | "lg" | "floor";
export interface ChartPadding { top?: number; right?: number; bottom?: number; left?: number }

export const BAR_RADIUS: Record<ChartBarRadius, string> = {
  none: "0px",
  sm: "var(--radius-sm)",
  lg: "var(--radius-lg)",
  floor: CONCENTRIC_FLOOR,
};

function compactNumber(n: number): string {
  const abs = Math.abs(n);
  const units: [number, string][] = [[1e9, "b"], [1e6, "m"], [1e3, "k"]];
  for (const [size, suffix] of units) {
    if (abs >= size) return `${Number((n / size).toFixed(1))}${suffix}`;
  }
  return String(Number(n.toFixed(1)));
}

/** Format a y value for axis ticks (`precise` false) or tooltips (`precise` true). */
export function formatChartValue(value: number, format: ChartYFormat = "number", prefix?: string, suffix?: string, precise = false): string {
  let body: string;
  if (precise) body = value.toLocaleString("en-US", { maximumFractionDigits: 2 });
  else if (format === "number") body = String(Math.round(value));
  else if (format === "percent") body = String(Number(value.toFixed(1)));
  else body = compactNumber(value);
  const pre = prefix ?? (format === "currency" ? "$" : "");
  const suf = suffix ?? (format === "percent" ? "%" : "");
  return `${pre}${body}${suf}`;
}

/** The one default series for single-series charts: values live under `value`. */
export const DEFAULT_SERIES: SeriesSpec[] = [{ key: "value", name: "Value" }];

/** Axis and layout options shared by BarChart and LineChart. Everything is optional. */
export interface AxisProps extends FormatProps {
  /** Chart height in px (default 260). */
  height?: number;
  /** Plot padding in px, merged over the defaults. */
  padding?: ChartPadding;
  /** Number of y-axis intervals (default 4, so 5 ticks). */
  tickCount?: number;
  /** Fixed y-axis maximum; defaults to a rounded data maximum. */
  yMax?: number;
  showYAxis?: boolean;
  showXAxis?: boolean;
  showGrid?: boolean;
  /** Show every Nth x label, starting with the first (default 1). */
  xLabelEvery?: number;
  /** Below the md breakpoint show every Nth label instead (hides the rest on small screens). */
  xLabelEveryMobile?: number;
  /** Explicit x labels to show (matched against each datum's `label`); overrides the stride props. */
  xLabels?: string[];
}

/** How an x label is shown at index `i`: always, hidden, or only above / below the md breakpoint. */
export function xLabelState(label: string, i: number, { xLabelEvery = 1, xLabelEveryMobile, xLabels }: Pick<AxisProps, "xLabelEvery" | "xLabelEveryMobile" | "xLabels">): "show" | "hide" | "desktop" | "mobile" {
  if (xLabels && xLabels.length) return xLabels.includes(label) ? "show" : "hide";
  const desktop = i % Math.max(Math.floor(xLabelEvery), 1) === 0;
  if (xLabelEveryMobile && xLabelEveryMobile > 0) {
    const mobile = i % Math.floor(xLabelEveryMobile) === 0;
    if (desktop && mobile) return "show";
    if (desktop) return "desktop";
    return mobile ? "mobile" : "hide";
  }
  return desktop ? "show" : "hide";
}

export const xLabelClass = (state: ReturnType<typeof xLabelState>) => (state === "desktop" ? "max-md:hidden" : state === "mobile" ? "md:hidden" : undefined);

/** Resolve a datum's colour: its own tone or colour, else the series colour. */
export function datumColor(d: { tone?: string; color?: string }, s: SeriesSpec, i: number): string {
  return (d.tone && TONES[d.tone]) || d.color || seriesColor(s, i);
}

/** One series in a multi-series chart. Values live on each datum under `key`. */
export interface SeriesSpec {
  key: string;
  name: string;
  tone?: ChartTone | (string & {});
  color?: string;
}

const TONES: Record<string, string> = {
  accent: "rgb(var(--accent))",
  success: "rgb(var(--success))",
  danger: "rgb(var(--danger))",
  warning: "rgb(var(--warning))",
  neutral: "rgb(var(--fg-muted) / 0.4)",
};

/** Categorical palette when a series has no tone. Built only from theme tokens. */
export const SERIES_PALETTE = [
  "rgb(var(--accent))",
  "rgb(var(--success))",
  "rgb(var(--warning))",
  "rgb(var(--fg-muted) / 0.7)",
  "rgb(var(--accent) / 0.5)",
  "rgb(var(--danger))",
];

export function seriesColor(s: Pick<SeriesSpec, "tone" | "color">, i: number): string {
  return (s.tone && TONES[s.tone]) || s.color || SERIES_PALETTE[i % SERIES_PALETTE.length];
}

export function toneColor(tone: string | undefined, i = 0): string {
  return (tone && TONES[tone]) || SERIES_PALETTE[i % SERIES_PALETTE.length];
}

/** Rounds a maximum up to a "nice" number and returns evenly spaced ticks from 0. */
export function niceScale(max: number, intervals = 4): { max: number; ticks: number[] } {
  const safe = max > 0 ? max : 1;
  const rough = safe / intervals;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const frac = rough / pow;
  const step = (frac <= 1 ? 1 : frac <= 2 ? 2 : frac <= 2.5 ? 2.5 : frac <= 5 ? 5 : 10) * pow;
  const top = step * Math.ceil(safe / step - 1e-9);
  const ticks: number[] = [];
  for (let v = 0; v <= top + step / 2; v += step) ticks.push(Number(v.toFixed(10)));
  return { max: top, ticks };
}

export function useSize(ref: RefObject<HTMLElement | null>, fallbackHeight = 260) {
  const [size, setSize] = useState({ width: 400, height: fallbackHeight });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0]?.contentRect;
      if (r) setSize({ width: r.width || 400, height: r.height || fallbackHeight });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, fallbackHeight]);
  return size;
}

export function useStableRef<T extends HTMLElement>() {
  return useRef<T>(null);
}

export interface FormatProps {
  yFormat?: ChartYFormat;
  yPrefix?: string;
  ySuffix?: string;
}

export function makeFormatter({ yFormat = "number", yPrefix, ySuffix }: FormatProps) {
  return (v: number, precise = false) => formatChartValue(v, yFormat, yPrefix, ySuffix, precise);
}

/** The shared legend row. */
export function ChartLegend({ series }: { series: SeriesSpec[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {series.map((s, i) => (
        <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: seriesColor(s, i) }} />
          {s.name}
        </span>
      ))}
    </div>
  );
}

/** The shared hover tooltip card. `left` is a px offset inside the chart container. */
export function ChartTooltip({ left, top = 8, title, rows, width }: { left: number; top?: number; title: string; rows: { name: string; value: string; color: string }[]; width: number }) {
  const flip = left > width * 0.62;
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-32 rounded-[var(--radius-lg)] border border-hairline bg-surface px-3 py-2 shadow-panel"
      style={{ left: flip ? undefined : left + 12, right: flip ? width - left + 12 : undefined, top }}
      data-panel
    >
      <div className="mb-1 text-xs font-medium text-fg">{title}</div>
      <div className="flex flex-col gap-0.5">
        {rows.map((r) => (
          <div key={r.name} className="flex items-center justify-between gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-fg-muted">
              <span className="h-2 w-2 rounded-full" style={{ background: r.color }} />
              {r.name}
            </span>
            <span className="font-medium tabular-nums text-fg">{r.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
