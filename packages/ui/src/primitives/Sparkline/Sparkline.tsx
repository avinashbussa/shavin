"use client";
import { useRef, type HTMLAttributes } from "react";
import { cn } from "../../lib/cn";
import { BAR_RADIUS, toneColor, useSize, type ChartBarRadius, type ChartTone } from "../../lib/chart-kit";

export type SparklinePoint = number | { value: number; label?: string; tone?: ChartTone | (string & {}); color?: string };

export interface SparklineProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Numbers, or objects with a `value` (and an optional per-bar `tone` / `color`). */
  data: SparklinePoint[];
  /** Default "line". */
  type?: "line" | "area" | "bar";
  /** Colour of the line, area or bars. Default accent. */
  tone?: ChartTone;
  /** Line and area only. Default "smooth". */
  curve?: "linear" | "smooth";
  /** Bar corner radius token (default "sm"). */
  barRadius?: ChartBarRadius;
  /** Gap between bars in px (default 4). */
  barGap?: number;
}

const val = (p: SparklinePoint) => (typeof p === "number" ? p : p.value);

/** A tiny, axis-free trend for a card or table cell. It fills its container: size it with className (default h-12 w-full). */
export function Sparkline({ data, type = "line", tone = "accent", curve = "smooth", barRadius = "sm", barGap = 4, className, ...props }: SparklineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { width, height } = useSize(ref, 48);
  const values = data.map(val);
  const max = Math.max(...values, 0) || 1;
  const min = type === "bar" ? 0 : Math.min(...values, 0);
  const span = max - min || 1;
  const color = toneColor(tone);
  const w = Math.max(width, 1);
  const h = Math.max(height, 1);
  const pad = type === "bar" ? 0 : 2;
  const x = (i: number) => (values.length <= 1 ? w / 2 : (i / (values.length - 1)) * w);
  const y = (v: number) => pad + (h - pad * 2) - ((v - min) / span) * (h - pad * 2);
  const pts = values.map((v, i) => ({ x: x(i), y: y(v) }));
  let line = "";
  if (type !== "bar" && pts.length) {
    if (curve === "smooth" && pts.length > 2) {
      line = `M ${pts[0].x} ${pts[0].y}`;
      for (let i = 0; i < pts.length - 1; i++) {
        const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2;
        line += ` C ${p1.x + (p2.x - p0.x) / 6} ${p1.y + (p2.y - p0.y) / 6}, ${p2.x - (p3.x - p1.x) / 6} ${p2.y - (p3.y - p1.y) / 6}, ${p2.x} ${p2.y}`;
      }
    } else line = pts.map((p, i) => `${i ? "L" : "M"} ${p.x} ${p.y}`).join(" ");
  }
  const slot = w / Math.max(values.length, 1);
  const barW = Math.max(slot - barGap, 1);

  return (
    <div ref={ref} className={cn("h-12 w-full", className)} {...props}>
      <svg width={w} height={h} role="presentation" aria-hidden="true">
        {type === "area" && line && <path d={`${line} L ${pts[pts.length - 1].x} ${h} L ${pts[0].x} ${h} Z`} fill={color} opacity={0.15} />}
        {type !== "bar" && line && <path d={line} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
        {type === "bar" && data.map((p, i) => {
          const v = values[i];
          const bh = Math.max(((v - min) / span) * h, v > 0 ? 1 : 0);
          const c = typeof p === "number" ? color : p.tone ? toneColor(p.tone) : p.color ?? color;
          return <rect key={i} x={i * slot + barGap / 2} y={h - bh} width={barW} height={bh} fill={c} style={{ rx: BAR_RADIUS[barRadius] }} />;
        })}
      </svg>
    </div>
  );
}
