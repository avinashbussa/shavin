"use client";
import React, { useEffect, useMemo, useRef } from "react";
import { cn } from "../../lib/cn";
import { getMurmurState, makeDots, type MurmurOut } from "./engine";

/** Free states: idle, thinking, working, listening. Other names resolve to states registered with registerMurmurState (Pro, from @shavin/fx). */
export type MurmurState = "idle" | "thinking" | "working" | "listening" | (string & {});

export interface MurmurProps extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  /** Which motion to play. Default "thinking". */
  state?: MurmurState;
  /** Diameter in px. Default 24. */
  size?: number;
  /** Live input level 0-1 that drives "listening". */
  level?: number;
  /** Speed multiplier. Default 1. */
  speed?: number;
  /** Number of dots. Default scales with size. */
  dots?: number;
  /** Dot size multiplier. Default 1. */
  dotSize?: number;
  /** Accessible name. Default is the state, e.g. "Thinking". Pass "" to hide it from assistive tech when a visible label sits beside it. */
  label?: string;
}

/**
 * A living dot-sphere that shows what an AI is doing. Colour follows the text colour
 * (accent by default), motion pauses off screen and stops under prefers-reduced-motion.
 */
export function Murmur({ state = "thinking", size = 24, level = 0, speed = 1, dots, dotSize = 1, label, className, style, ...props }: MurmurProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ state, level, speed, dotSize });
  live.current = { state, level, speed, dotSize };
  const count = dots ?? Math.max(32, Math.min(200, Math.round(size * 1.8)));
  const swarm = useMemo(() => makeDots(count), [count]);

  useEffect(() => {
    const el = canvas.current;
    const ctx = el?.getContext("2d");
    if (!el || !ctx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    el.width = Math.round(size * dpr);
    el.height = Math.round(size * dpr);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const out: MurmurOut = { x: 0, y: 0, z: 0, size: 1, alpha: 1 };
    let raf = 0;
    let visible = true;
    let color = "";
    let colorAt = -1e9;
    const start = performance.now();

    const draw = (now: number) => {
      if (now - colorAt > 500) {
        color = getComputedStyle(el).color;
        colorAt = now;
      }
      const { state: s, level: l, speed: sp, dotSize: ds } = live.current;
      const fn = getMurmurState(s);
      const frame = { t: reduced ? 0 : now - start, level: l, speed: sp };
      const c = size / 2;
      const R = c * 0.78;
      const base = (0.3 + size * 0.022) * ds;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = color;
      for (const d of swarm) {
        fn(d, frame, out);
        const persp = 1 / (1 - out.z * 0.3);
        const depth = 0.55 + 0.45 * ((out.z + 1.2) / 2.4);
        ctx.globalAlpha = Math.max(0, Math.min(1, out.alpha * depth));
        ctx.beginPath();
        ctx.arc(c + out.x * R * persp, c + out.y * R * persp, Math.max(0.25, base * out.size * persp), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };

    const loop = (now: number) => {
      if (visible) draw(now);
      raf = requestAnimationFrame(loop);
    };
    if (reduced) {
      draw(performance.now());
    } else {
      raf = requestAnimationFrame(loop);
    }
    const io = typeof IntersectionObserver !== "undefined" ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; }) : null;
    io?.observe(el);
    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
    };
  }, [size, swarm, state]);

  const name = label ?? state.charAt(0).toUpperCase() + state.slice(1);
  return (
    <span
      role={name ? "img" : undefined}
      aria-label={name || undefined}
      aria-hidden={name ? undefined : true}
      className={cn("inline-flex shrink-0 align-middle text-accent-contrast", className)}
      style={{ width: size, height: size, ...style }}
      {...props}
    >
      <canvas ref={canvas} style={{ width: size, height: size }} aria-hidden />
    </span>
  );
}
