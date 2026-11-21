import { useEffect, useState } from "react";
import type { Rect } from "./geometry";

const same = (a: Rect | null, b: Rect | null) => (a === b) || (!!a && !!b && a.x === b.x && a.y === b.y && a.w === b.w && a.h === b.h);

/** Viewport rect of an element, kept current on scroll (any scroller), resize and size changes, at most once a frame. */
export function useTrackedRect(el: Element | null): Rect | null {
  const [rect, setRect] = useState<Rect | null>(null);
  useEffect(() => {
    if (!el || !el.isConnected) {
      setRect(null);
      return;
    }
    let frame = 0;
    const read = () => {
      frame = 0;
      if (!el.isConnected) return setRect(null);
      const r = el.getBoundingClientRect();
      const next = { x: r.x, y: r.y, w: r.width, h: r.height };
      setRect((prev) => (same(prev, next) ? prev : next));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", schedule, { capture: true, passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(schedule) : null;
    ro?.observe(el);
    // Layout can change without a scroll or resize (animations, late content): a slow poll catches the rest.
    const poll = window.setInterval(schedule, 500);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule, { capture: true } as EventListenerOptions);
      window.removeEventListener("resize", schedule);
      ro?.disconnect();
      window.clearInterval(poll);
    };
  }, [el]);
  return rect;
}
