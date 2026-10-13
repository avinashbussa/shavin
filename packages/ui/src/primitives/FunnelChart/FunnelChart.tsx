"use client";
import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

export interface FunnelStep {
  name: string;
  value: number;
}

export interface FunnelChartProps extends Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  steps: FunnelStep[];
  /** `horizontal` stacks a bar per step; `vertical` draws a column per step, left to right. */
  orientation?: "horizontal" | "vertical";
  /** `centered` (horizontal only) centres each bar so the stack narrows like a funnel. */
  centered?: boolean;
  /** Height of the columns in px (vertical). */
  height?: number;
  /** Show the drop-off between steps (default true). */
  showDropOff?: boolean;
}

const pct = (n: number, digits = 0) => `${(n * 100).toFixed(digits)}%`;
const num = (n: number) => n.toLocaleString("en");

/** Conversion funnel in either direction: step counts, share of the first step and drop-off between steps. */
export function FunnelChart({ steps, orientation = "horizontal", centered = false, height = 220, showDropOff = true, className, ...props }: FunnelChartProps) {
  if (!steps.length) return null;
  const first = steps[0].value || 1;

  if (orientation === "vertical") {
    return (
      <div className={cn("flex items-end gap-2", className)} {...props}>
        {steps.map((s, i) => {
          const share = s.value / first;
          const prev = i === 0 ? null : s.value / (steps[i - 1].value || 1);
          return (
            <div key={`${s.name}-${i}`} className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex h-9 flex-col justify-end">
                <span className="text-sm font-medium tabular-nums text-fg">{num(s.value)}</span>
                {showDropOff && prev !== null && <span className="text-xs text-danger">−{pct(1 - prev)}</span>}
              </div>
              <div className="flex items-end" style={{ height }}>
                <div className="w-full rounded-t-[var(--radius-lg)] bg-accent" style={{ height: `${Math.max(share * 100, 2)}%`, opacity: 1 - i * Math.min(0.12, 0.6 / steps.length) }} />
              </div>
              <div className="min-w-0 border-t border-hairline pt-2">
                <div className="truncate text-xs text-fg-muted" title={s.name}>{s.name}</div>
                <div className="text-xs text-fg-subtle tabular-nums">{pct(share, share < 0.1 ? 1 : 0)}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-3", className)} {...props}>
      {steps.map((s, i) => {
        const share = s.value / first;
        const prev = i === 0 ? null : s.value / (steps[i - 1].value || 1);
        return (
          <div key={`${s.name}-${i}`} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-fg">{i + 1}. {s.name}</span>
              <span className="text-sm tabular-nums text-fg-muted whitespace-nowrap">
                {num(s.value)}
                {showDropOff && prev !== null && <span className="text-xs text-danger"> · {pct(1 - prev)} drop</span>}
              </span>
            </div>
            <div className={cn("h-8 overflow-hidden rounded-[var(--radius-lg)] bg-fg/[0.06]", centered && "flex justify-center")}>
              <div className="h-full rounded-[var(--radius-lg)] bg-accent" style={{ width: `${Math.max(share * 100, 1.5)}%`, opacity: 1 - i * Math.min(0.12, 0.6 / steps.length) }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
