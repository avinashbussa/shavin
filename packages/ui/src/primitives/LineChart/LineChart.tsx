"use client";
import { useId, useMemo, useRef, useState, type HTMLAttributes, type PointerEvent } from "react";
import { cn } from "../../lib/cn";
import {
  ChartDataTable, ChartLegend, ChartTooltip, DEFAULT_SERIES, SeriesMarker, SeriesPatterns, chartKeyProps, makeFormatter, niceScale, patternBase, seriesColor, seriesDash, seriesFill, xLabelClass, xLabelState, useSize,
  type AxisProps, type ChartA11yProps, type SeriesSpec,
} from "../../lib/chart-kit";

export interface LineChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children" | "title">, AxisProps, ChartA11yProps {
  /** One record per x position: `label` plus a number under each series `key` (`value` when `series` is omitted). */
  data: Record<string, any>[];
  /** Omit for a single series of `value`s. */
  series?: SeriesSpec[];
  /** `area` fills under each line (stacked areas when `stacked`). */
  type?: "line" | "area";
  /** Stack the series on top of each other instead of overlaying them. */
  stacked?: boolean;
  /** `step` holds each value until the next point (balances, plans, queue depth). */
  curve?: "linear" | "smooth" | "step";
  showLegend?: boolean;
  /** Draw a dot on every point (default true when 16 points or fewer). */
  showDots?: boolean;
}

function smoothPath(pts: { x: number; y: number }[]) {
  if (pts.length < 3) return pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

/** Line or area chart, single or multi-series, with nice axis ticks, a legend and a shared hover tooltip. */
export function LineChart({
  data, series = DEFAULT_SERIES, type = "line", stacked = false, curve = "smooth", height = 260, showLegend = true,
  showGrid = true, showYAxis = true, showXAxis = true, showDots, xLabelEvery, xLabelEveryMobile, xLabels, tickCount = 4, yMax,
  padding: paddingProp, yFormat, yPrefix, ySuffix, title, description, patterns = true, className, ...props
}: LineChartProps) {
  const descId = useId();
  const pat = patterns && series.length > 1 ? patternBase(descId) : null;
  const name = title ?? (type === "area" ? "Area chart" : "Line chart");
  const ref = useRef<HTMLDivElement>(null);
  const { width } = useSize(ref, height);
  const [hover, setHover] = useState<number | null>(null);
  const fmt = makeFormatter({ yFormat, yPrefix, ySuffix });
  const PAD = { top: 16, right: 16, bottom: showXAxis ? 28 : 8, left: showYAxis ? 44 : 8, ...paddingProp };
  const innerW = Math.max(width - PAD.left - PAD.right, 40);
  const innerH = Math.max(height - PAD.top - PAD.bottom, 40);
  const dots = showDots ?? data.length <= 16;

  const { scale, stacks } = useMemo(() => {
    const cumulative = data.map((d) => {
      let run = 0;
      return series.map((s) => {
        const v = Number(d[s.key] ?? 0);
        const base = stacked ? run : 0;
        run += v;
        return { v, y0: base, y1: stacked ? run : v };
      });
    });
    const max = Math.max(0, ...cumulative.flat().map((c) => c.y1));
    const intervals = Math.max(Math.floor(tickCount), 1);
    const nice = niceScale(yMax ?? max, intervals);
    const ticks = yMax !== undefined ? Array.from({ length: intervals + 1 }, (_, i) => (yMax / intervals) * i) : nice.ticks;
    return { scale: { max: yMax ?? nice.max, ticks }, stacks: cumulative };
  }, [data, series, stacked, tickCount, yMax]);

  const x = (i: number) => PAD.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / scale.max) * innerH;

  function onMove(e: PointerEvent<SVGSVGElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left - PAD.left) / innerW;
    setHover(Math.min(data.length - 1, Math.max(0, Math.round(rel * (data.length - 1)))));
  }

  const path = (pts: { x: number; y: number }[]) =>
    curve === "smooth" ? smoothPath(pts) : curve === "step" ? pts.map((p, i) => (i ? `H ${p.x} V ${p.y}` : `M ${p.x} ${p.y}`)).join(" ") : pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");

  const paths = series.map((s, si) => {
    const pts = data.map((_, i) => ({ x: x(i), y: y(stacks[i][si].y1) }));
    const line = path(pts);
    const low = data.map((_, i) => ({ x: x(i), y: y(stacks[i][si].y0) })).reverse();
    const area = `${line} L ${low.map((p) => `${p.x} ${p.y}`).join(" L ")} Z`;
    return { line, area, color: seriesColor(s, si) };
  });

  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      {showLegend && series.length > 1 && <ChartLegend series={series} patterns={pat} kind="line" />}
      {description && <p id={descId} className="sr-only">{description}</p>}
      <div
        ref={ref}
        className="relative w-full rounded-[var(--radius-lg)]"
        style={{ height }}
        {...chartKeyProps({ name, descriptionId: description ? descId : undefined, count: data.length, hover, setHover })}
      >
        <svg width={width} height={height} onPointerMove={onMove} onPointerLeave={() => setHover(null)} aria-hidden="true">
          {pat && <SeriesPatterns base={pat} colors={paths.map((p) => p.color)} />}
          {scale.ticks.map((t) => (
            <g key={t}>
              {showGrid && <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="rgb(var(--hairline))" strokeDasharray="3 4" />}
              {showYAxis && <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" className="fill-fg-subtle text-[11px]">{fmt(t)}</text>}
            </g>
          ))}
          {showXAxis && data.map((d, i) => {
            const state = xLabelState(String(d.label), i, { xLabelEvery, xLabelEveryMobile, xLabels });
            return state !== "hide" && <text key={i} x={x(i)} y={height - 8} textAnchor="middle" className={cn("fill-fg-subtle text-[11px]", xLabelClass(state))}>{d.label}</text>;
          })}
          {type === "area" && paths.map((p, i) => <path key={`a${i}`} d={p.area} fill={stacked ? seriesFill(pat, i, p.color) : p.color} opacity={stacked ? 0.55 : 0.12} />)}
          {paths.map((p, i) => <path key={i} d={p.line} fill="none" stroke={p.color} strokeWidth={2} strokeDasharray={seriesDash(!!pat, i)} strokeLinejoin="round" strokeLinecap="round" />)}
          {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="rgb(var(--hairline-strong))" />}
          {dots && series.map((s, si) => data.map((_, i) => <SeriesMarker key={`${si}-${i}`} i={si} shaped={!!pat} cx={x(i)} cy={y(stacks[i][si].y1)} r={hover === i ? 4 : 2.5} fill="rgb(var(--bg-surface))" stroke={paths[si].color} strokeWidth={2} />))}
          {!dots && hover !== null && series.map((s, si) => <SeriesMarker key={si} i={si} shaped={!!pat} cx={x(hover)} cy={y(stacks[hover][si].y1)} r={4} fill="rgb(var(--bg-surface))" stroke={paths[si].color} strokeWidth={2} />)}
        </svg>
        {hover !== null && (
          <ChartTooltip left={x(hover)} width={width} title={String(data[hover].name ?? data[hover].label)} rows={series.map((s, si) => ({ name: s.name, value: fmt(stacks[hover][si].v, true), color: paths[si].color, index: si, patterns: pat, kind: "line" as const }))} />
        )}
      </div>
      <ChartDataTable
        caption={name}
        columns={["Label", ...series.map((x) => x.name)]}
        rows={data.map((d) => [String(d.name ?? d.label), ...series.map((x) => fmt(Number(d[x.key] ?? 0), true))])}
      />
    </div>
  );
}
