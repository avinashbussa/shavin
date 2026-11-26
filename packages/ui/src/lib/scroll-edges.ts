"use client";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";

export type ScrollEdges = { start: boolean; end: boolean };

const FADE_PX = 28;

/**
 * Tells a horizontally scrolling container which edges still have content beyond them, and gives the style that
 * fades those edges out. A scrolling table or strip that just stops at the container edge reads as clipped text:
 * the fade says "there is more". Nothing is applied until the content actually overflows, so a table that fits is untouched.
 */
export function useScrollEdges<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [edges, setEdges] = useState<ScrollEdges>({ start: false, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const next = { start: max > 1 && el.scrollLeft > 1, end: max > 1 && el.scrollLeft < max - 1 };
    setEdges((prev) => (prev.start === next.start && prev.end === next.end ? prev : next));
  }, []);

  const setRef = useCallback(
    (el: T | null) => {
      ref.current = el;
      if (el) update();
    },
    [update],
  );

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    for (const child of Array.from(el.children)) ro?.observe(child);
    return () => {
      el.removeEventListener("scroll", update);
      ro?.disconnect();
    };
  }, [update]);

  const scrollable = edges.start || edges.end;
  const mask = scrollable
    ? `linear-gradient(to right, transparent 0, black ${edges.start ? FADE_PX : 0}px, black calc(100% - ${edges.end ? FADE_PX : 0}px), transparent 100%)`
    : undefined;
  const fadeStyle: CSSProperties | undefined = mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined;

  return { ref: setRef, edges, scrollable, fadeStyle };
}
