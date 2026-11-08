import { useRef } from "react";

/**
 * Preview of a data-motion entrance preset. Presets replay on HOVER (the real runtime binds reveals to
 * scroll position, which doesn't play in a static tile). The parallax preview uses the REAL
 * data-motion-scroll="parallax" attribute, so it drifts with actual page scroll — no script. Honors
 * reduced-motion (hover is a no-op).
 */
export type Effect = "fade" | "fade-up" | "fade-down" | "scale-in" | "blur-in" | "mask-up";

const DIST: Record<string, string> = { xs: "4px", sm: "8px", md: "16px", lg: "28px" };
const DUR: Record<string, number> = { instant: 320, fast: 440, base: 560, slow: 760, enter: 820 };
const EASE: Record<string, string> = {
  out: "cubic-bezier(0.23,1,0.32,1)",
  standard: "cubic-bezier(0.4,0,0.2,1)",
  in: "cubic-bezier(0.4,0,1,1)",
  overshoot: "cubic-bezier(0.34,1.56,0.64,1)",
};

function framesFor(effect: Effect, distPx: string): Keyframe[] {
  switch (effect) {
    case "fade": return [{ opacity: 0 }, { opacity: 1 }];
    case "fade-down": return [{ opacity: 0, translate: `0 -${distPx}` }, { opacity: 1, translate: "0 0" }];
    case "scale-in": return [{ opacity: 0, scale: "0.9" }, { opacity: 1, scale: "1" }];
    case "blur-in": return [{ opacity: 0, filter: "blur(10px)" }, { opacity: 1, filter: "blur(0px)" }];
    case "mask-up": return [{ opacity: 0, translate: `0 ${distPx}`, clipPath: "inset(0 0 100% 0)" }, { opacity: 1, translate: "0 0", clipPath: "inset(0 0 0 0)" }];
    case "fade-up": default: return [{ opacity: 0, translate: `0 ${distPx}` }, { opacity: 1, translate: "0 0" }];
  }
}

export function MotionPreview({
  effect = "fade-up", dist = "md", dur = "enter", ease = "out", label, note, parallax = false,
}: { effect?: Effect; dist?: string; dur?: string; ease?: string; label?: string; note?: string; parallax?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  if (parallax) {
    // Real scroll-driven parallax: the inner element drifts as it moves through the viewport (CSS
    // animation-timeline: view(), supplied by @shavin/ui global styles). Scroll the page to see it.
    return (
      <div className="flex h-44 items-center justify-center overflow-hidden rounded-[var(--radius-panel)] border border-hairline bg-surface">
        <div data-motion-scroll="parallax" className="flex h-24 w-full items-center justify-center bg-surface-hover text-[13px] text-fg-muted">
          I drift with page scroll
        </div>
      </div>
    );
  }

  const replay = () => {
    const el = ref.current;
    if (!el) return;
    if (typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    el.animate(framesFor(effect, DIST[dist] ?? "16px"), { duration: DUR[dur] ?? 820, easing: EASE[ease] ?? EASE.out, fill: "both" });
  };

  return (
    <div
      ref={ref}
      onMouseEnter={replay}
      title="Hover to replay"
      className="flex min-h-[96px] cursor-default flex-col justify-center gap-1 rounded-[var(--radius-panel)] border border-hairline bg-surface px-5 py-4"
    >
      <code className="w-fit font-mono text-xs text-accent">{label ?? effect}</code>
      {note && <span className="text-sm text-fg-muted">{note}</span>}
    </div>
  );
}
