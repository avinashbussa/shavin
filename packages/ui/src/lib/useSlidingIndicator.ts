"use client";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Shared measurement for an animated "sliding active indicator" — a single pill/underline that glides to
 * the active item instead of each item drawing its own background. Used by Tabs and SegmentedControl.
 *
 * Attach `ref` to the container (the list/root) and `indicatorRef` to the absolutely-positioned indicator
 * span. It tracks the active element (matched by `activeSelector`, e.g. `[data-state="active"]`) and reports
 * where to move the indicator via a `translate`. Position is the active item's `offsetLeft/Top` minus the
 * indicator's OWN `offsetLeft/Top` (its untransformed `left-0`/`top-0` base) — self-calibrating, so it lands
 * exactly regardless of how a given container's padding/border affect offsets. A MutationObserver on
 * `data-state` re-measures on every selection (controlled or uncontrolled, click or keyboard) without a
 * React re-render.
 *
 * `transitionClass` is empty until the first measurement so the indicator snaps into place instead of
 * animating from the origin; after that it carries the transition (reduced-motion aware). Render the
 * indicator whenever sliding is enabled (so `indicatorRef` exists) and gate its visibility on `on`.
 */
export function useSlidingIndicator<
  T extends HTMLElement = HTMLDivElement,
  I extends HTMLElement = HTMLSpanElement,
>({
  enabled,
  orientation = "horizontal",
  activeSelector,
}: {
  enabled: boolean;
  orientation?: "horizontal" | "vertical";
  activeSelector: string;
}) {
  const ref = useRef<T>(null);
  const indicatorRef = useRef<I>(null);
  const [state, setState] = useState({ pos: 0, size: 0, on: false, ready: false });
  const horizontal = orientation !== "vertical";

  const measure = useCallback(() => {
    const root = ref.current;
    if (!root) return;
    const el = root.querySelector<HTMLElement>(activeSelector);
    if (!el) { setState((s) => ({ ...s, on: false })); return; }
    // Base = the indicator's own untransformed offset (offsetLeft/Top ignore CSS transforms). Subtracting it
    // from the item's offset gives the exact translate, independent of container padding/border quirks.
    const ind = indicatorRef.current;
    const base = ind ? (horizontal ? ind.offsetLeft : ind.offsetTop) : 0;
    setState((s) => ({
      pos: (horizontal ? el.offsetLeft : el.offsetTop) - base,
      size: horizontal ? el.offsetWidth : el.offsetHeight,
      on: true,
      ready: s.on || s.ready,
    }));
  }, [horizontal, activeSelector]);

  useEffect(() => {
    if (!enabled) return;
    const root = ref.current;
    if (!root) return;
    measure();
    const ro = new ResizeObserver(() => measure());
    // Observe the root AND every item: variants that animate an item's own width (e.g. the
    // label-reveal `expand` rail) resize the active cell without resizing the root, so the
    // indicator must track the item box itself, not just the container.
    const observeAll = () => {
      ro.disconnect();
      ro.observe(root);
      for (const child of Array.from(root.children)) ro.observe(child);
    };
    observeAll();
    const mo = new MutationObserver(() => { observeAll(); measure(); });
    mo.observe(root, { attributes: true, childList: true, subtree: true, attributeFilter: ["data-state"] });
    return () => { mo.disconnect(); ro.disconnect(); };
  }, [enabled, measure]);

  const transitionClass = state.ready
    ? "transition-[transform,width,height] duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] motion-reduce:transition-none"
    : "";

  return { ref, indicatorRef, pos: state.pos, size: state.size, on: state.on, transitionClass };
}
