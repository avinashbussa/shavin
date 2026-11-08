"use client";
import { useEffect, useRef, useState, type KeyboardEvent, type RefObject, type SVGProps } from "react";
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
/*
 * Series cues beyond colour (WCAG 1.4.1). Series 0 stays plain; later series add a fill
 * pattern (bars, donut slices, stacked areas), a dash (lines) and a marker shape (points).
 * The legend and tooltip swatches repeat the same cue, so a series can be matched without
 * telling the colours apart.
 */
const PATTERNS = 6;
const DASHES = [undefined, "6 4", "2 3", "8 3 2 3"];
const SHAPES = ["circle", "square", "triangle", "diamond"] as const;

/** Pattern id prefix for one chart (useId output is not valid inside `url(#…)`). */
export function patternBase(id: string) {
  return `chp${id.replace(/[^a-zA-Z0-9_-]/g, "")}`;
}
/** Fill for series/slice `i`: the plain colour for 0, then a patterned fill. */
export function seriesFill(base: string | null, i: number, color: string) {
  return base && i % PATTERNS ? `url(#${base}-${i})` : color;
}
export function seriesDash(on: boolean, i: number) {
  return on ? DASHES[i % DASHES.length] : undefined;
}

/** `<defs>` with one pattern per series colour. Render inside the chart's `<svg>`. */
export function SeriesPatterns({ base, colors }: { base: string; colors: string[] }) {
  const ink = { stroke: "rgb(var(--bg-surface))", strokeOpacity: 0.6, strokeWidth: 1.5 };
  return (
    <defs>
      {colors.map((color, i) => {
        const k = i % PATTERNS;
        if (!k) return null;
        return (
          <pattern key={i} id={`${base}-${i}`} width={6} height={6} patternUnits="userSpaceOnUse">
            <rect width={6} height={6} fill={color} />
            {k === 1 && <path d="M-1 1 l2 -2 M0 6 l6 -6 M5 7 l2 -2" {...ink} />}
            {k === 2 && <circle cx={3} cy={3} r={1.3} fill="rgb(var(--bg-surface))" fillOpacity={0.65} />}
            {k === 3 && <path d="M-1 1 l2 -2 M0 6 l6 -6 M5 7 l2 -2 M-1 5 l2 2 M0 0 l6 6 M5 -1 l2 2" {...ink} strokeWidth={1} />}
            {k === 4 && <path d="M0 1.5 h6 M0 4.5 h6" {...ink} />}
            {k === 5 && <path d="M1.5 0 v6 M4.5 0 v6" {...ink} />}
          </pattern>
        );
      })}
    </defs>
  );
}

/** A point marker whose shape follows the series index (circle, square, triangle, diamond). */
export function SeriesMarker({ i, cx, cy, r, shaped = true, ...rest }: { i: number; cx: number; cy: number; r: number; shaped?: boolean } & Omit<SVGProps<SVGElement>, "ref">) {
  const shape = shaped ? SHAPES[i % SHAPES.length] : "circle";
  const p = rest as Record<string, unknown>;
  if (shape === "square") return <rect x={cx - r * 0.9} y={cy - r * 0.9} width={r * 1.8} height={r * 1.8} {...p} />;
  if (shape === "triangle") return <polygon points={`${cx},${cy - r * 1.15} ${cx + r * 1.1},${cy + r * 0.8} ${cx - r * 1.1},${cy + r * 0.8}`} {...p} />;
  if (shape === "diamond") return <polygon points={`${cx},${cy - r * 1.2} ${cx + r * 1.2},${cy} ${cx},${cy + r * 1.2} ${cx - r * 1.2},${cy}`} {...p} />;
  return <circle cx={cx} cy={cy} r={r} {...p} />;
}

/** How a swatch draws its series: a filled chip (bars, slices) or a line sample with a marker. */
export interface SwatchSpec {
  color: string;
  index: number;
  /** Pattern base from `patternBase`, or null when patterns are off. */
  patterns: string | null;
  kind?: "fill" | "line";
}
export function ChartSwatch({ color, index, patterns, kind = "fill", size = 10 }: SwatchSpec & { size?: number }) {
  if (kind === "line") {
    return (
      <svg width={18} height={size} aria-hidden="true" className="shrink-0 overflow-visible">
        <line x1={1} x2={17} y1={size / 2} y2={size / 2} stroke={color} strokeWidth={2} strokeDasharray={seriesDash(!!patterns, index)} strokeLinecap="round" />
        <SeriesMarker i={index} shaped={!!patterns} cx={9} cy={size / 2} r={3} fill="rgb(var(--bg-surface))" stroke={color} strokeWidth={1.5} />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} aria-hidden="true" className="shrink-0 rounded-[2px]">
      <rect width={size} height={size} fill={seriesFill(patterns, index, color)} />
    </svg>
  );
}

export function ChartLegend({ series, patterns = null, kind = "fill" }: { series: SeriesSpec[]; patterns?: string | null; kind?: "fill" | "line" }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
      {series.map((s, i) => (
        <span key={s.key} className="inline-flex items-center gap-1.5 text-xs text-fg-muted">
          <ChartSwatch color={seriesColor(s, i)} index={i} patterns={patterns} kind={kind} size={kind === "line" ? 10 : 8} />
          {s.name}
        </span>
      ))}
    </div>
  );
}
export function ChartTooltip({ left, top = 8, title, rows, width }: { left: number; top?: number; title: string; rows: ({ name: string; value: string } & SwatchSpec)[]; width: number }) {
  const flip = left > width * 0.62;
  return (
    <div
      className="pointer-events-none absolute z-10 min-w-32 rounded-[var(--radius-lg)] border border-hairline bg-surface px-3 py-2 shadow-panel"
      style={{ left: flip ? undefined : left + 12, right: flip ? width - left + 12 : undefined, top }}
      data-panel
    >
      <div className="mb-1 text-xs font-medium text-fg">{title}</div>
      <div className="flex flex-col gap-0.5">
        {rows.map(({ name, value, ...swatch }) => (
          <div key={name} className="flex items-center justify-between gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-fg-muted">
              <ChartSwatch {...swatch} size={swatch.kind === "line" ? 10 : 8} />
              {name}
            </span>
            <span className="font-medium tabular-nums text-fg">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Accessibility ───────────────────────────────────────────────────────────
// The SVG is a picture; the information goes to screen readers as a real table
// (WCAG 1.1.1, 1.3.1), and keyboard users step through the points to see the
// same tooltip a pointer gets (WCAG 2.1.1).

export interface ChartA11yProps {
  /** Accessible name, e.g. "Monthly revenue, 2026". Read by screen readers and used as the data table caption. */
  title?: string;
  /** One-sentence takeaway, e.g. "Revenue doubled after the March launch." */
  description?: string;
  /**
   * Tell series apart by more than colour: fill patterns on bars and slices, dashes and
   * marker shapes on lines, repeated in the legend and tooltip (WCAG 1.4.1). Default true.
   * Turn off only when every series is labelled directly on the chart.
   */
  patterns?: boolean;
}

/** Visually hidden table of the chart's data. First column is the row header. */
export function ChartDataTable({ caption, columns, rows }: { caption: string; columns: string[]; rows: string[][] }) {
  return (
    <table className="sr-only">
      <caption>{caption}</caption>
      <thead>
        <tr>
          {columns.map((c) => (
            <th key={c} scope="col">{c}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i}>
            {r.map((cell, j) => (j === 0 ? <th key={j} scope="row">{cell}</th> : <td key={j}>{cell}</td>))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/**
 * Props for the focusable plot area: a named group whose arrow keys move the
 * highlighted point (Left/Right, or Up/Down for horizontal bars; Home/End).
 * Focus shows the first point; blur clears it.
 */
export function chartKeyProps(
  { name, descriptionId, count, hover, setHover, vertical = false }: {
    name: string;
    descriptionId?: string;
    count: number;
    hover: number | null;
    setHover: (i: number | null) => void;
    vertical?: boolean;
  },
) {
  return {
    tabIndex: count > 0 ? 0 : -1,
    role: "group",
    "aria-roledescription": "chart",
    "aria-label": `${name}. Use the arrow keys to read each value.`,
    "aria-describedby": descriptionId,
    onFocus: () => {
      if (hover === null) setHover(0);
    },
    onBlur: () => setHover(null),
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
      const prev = vertical ? "ArrowUp" : "ArrowLeft";
      const next = vertical ? "ArrowDown" : "ArrowRight";
      const at = hover ?? 0;
      let to: number | null = null;
      if (e.key === next) to = Math.min(count - 1, at + 1);
      else if (e.key === prev) to = Math.max(0, at - 1);
      else if (e.key === "Home") to = 0;
      else if (e.key === "End") to = count - 1;
      else if (e.key === "Escape") to = null;
      else return;
      e.preventDefault();
      setHover(to);
    },
  } as const;
}
