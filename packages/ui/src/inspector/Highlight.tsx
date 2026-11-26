"use client";
import * as React from "react";
import { backdropOf } from "../lib/inspector/collect";
import { describeElement } from "../lib/inspector/selector";
import { isLight } from "../lib/inspector/color";
import { useTrackedRect } from "./useTrackedRect";

export interface HighlightProps {
  /** The element to outline, or null for none. */
  target: Element | null;
  /** Hover is a light touch; selected is a little stronger. */
  mode: "hover" | "selected";
  /** Show the tag, class and size chip. */
  label?: boolean;
}

/** Edge colour of the halo that keeps the outline visible on any page: the opposite of what is behind the element. */
function haloFor(el: Element): string {
  const b = backdropOf(el);
  if (b.kind === "unknown") return "var(--shavin-halo-default, 255 255 255)";
  return isLight(b.rgb) ? "10 10 12" : "255 255 255";
}

/**
 * One container for the whole page: it never remounts, it glides (translate and size) between elements, and its
 * transitions are zero under reduced motion because the motion tokens are. It ignores the pointer.
 */
export function Highlight({ target, mode, label = true }: HighlightProps): React.JSX.Element {
  const rect = useTrackedRect(target);
  const [halo, setHalo] = React.useState("255 255 255");
  const [radius, setRadius] = React.useState("6px");
  const shown = !!target && !!rect && rect.w > 0 && rect.h > 0;
  const first = React.useRef(true);
  const [animate, setAnimate] = React.useState(false);

  React.useEffect(() => {
    if (!target) return;
    setHalo(haloFor(target));
    setRadius(getComputedStyle(target).borderRadius || "6px");
  }, [target]);

  // The first appearance snaps into place; later moves glide.
  React.useEffect(() => {
    if (shown && first.current) {
      first.current = false;
      const id = requestAnimationFrame(() => setAnimate(true));
      return () => cancelAnimationFrame(id);
    }
    if (!shown) {
      first.current = true;
      setAnimate(false);
    }
  }, [shown]);

  const selected = mode === "selected";
  const r = rect ?? { x: 0, y: 0, w: 0, h: 0 };
  const dim = target && rect ? `${describeElement(target)} ${Math.round(rect.w)}×${Math.round(rect.h)}` : "";

  return (
    <div
      aria-hidden="true"
      data-shavin-highlight=""
      style={{
        position: "fixed",
        left: 0,
        top: 0,
        width: r.w,
        height: r.h,
        transform: `translate(${r.x}px, ${r.y}px)`,
        borderRadius: radius,
        opacity: shown ? 1 : 0,
        pointerEvents: "none",
        border: `${selected ? 2 : 1.5}px solid rgb(var(--shavin-element) / 0.85)`,
        background: `rgb(var(--shavin-element) / ${selected ? 0.06 : 0.09})`,
        boxShadow: `0 0 0 2px rgb(${halo} / 0.6)${selected ? ", 0 0 0 6px rgb(var(--shavin-element) / 0.16)" : ""}`,
        // ds-lint-disable-next-line no-unknown-class — a CSS value, not a class
        boxSizing: "border-box",
        transition: animate
          // ds-lint-disable-next-line no-unknown-class — a CSS value, not a class
          ? "transform var(--dur-fast) var(--ease-out), width var(--dur-fast) var(--ease-out), height var(--dur-fast) var(--ease-out), border-radius var(--dur-fast) var(--ease-out), opacity var(--dur-instant) linear"
          : "opacity var(--dur-instant) linear",
        willChange: "transform, width, height",
      }}
    >
      {label && shown && dim ? (
        <span
          data-shavin-chip=""
          className="absolute left-0 whitespace-nowrap rounded-[6px] border border-hairline bg-elevated px-1.5 py-0.5 text-[11px] leading-4 text-fg shadow-panel"
          style={{ left: Math.max(0, 8 - r.x), bottom: r.y > 28 ? "calc(100% + 6px)" : "auto", top: r.y > 28 ? "auto" : "calc(100% + 6px)", maxWidth: Math.max(80, Math.min(Math.max(160, r.w + 80), (typeof window === "undefined" ? 1280 : window.innerWidth) - r.x - 8)), overflow: "hidden", textOverflow: "ellipsis", borderColor: "rgb(var(--shavin-element) / 0.6)" }}
        >
          {dim}
        </span>
      ) : null}
    </div>
  );
}
