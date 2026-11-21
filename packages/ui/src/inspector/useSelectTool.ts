import { useEffect, useRef, useState } from "react";

const INSPECTOR = "[data-shavin-inspector], .shavin-dev-tools-root, [data-radix-popper-content-wrapper]";
const HOVER_INTENT_MS = 40;

export const isInspectorElement = (el: Element | null): boolean => !!el && !!el.closest(INSPECTOR);

/** The element under the pointer that is not part of the inspector. */
export function pickElement(x: number, y: number): Element | null {
  const el = document.elementFromPoint(x, y);
  if (!el || isInspectorElement(el)) return null;
  if (el === document.documentElement || el === document.body) return null;
  return el;
}

export interface SelectToolOptions {
  active: boolean;
  /** A click on a page element (the click itself is swallowed so the page does not react). */
  onSelect: (el: Element) => void;
}

/**
 * While the Select tool is active: tracks the hovered element (with a short intent delay so the highlight does not
 * chase the pointer), turns a click into a selection, and keeps the page from reacting to that click.
 * Everything is removed when the tool turns off or the component unmounts.
 */
export function useSelectTool({ active, onSelect }: SelectToolOptions): { hovered: Element | null; setHovered: (el: Element | null) => void } {
  const [hovered, setHovered] = useState<Element | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;

  useEffect(() => {
    if (!active) {
      setHovered(null);
      return;
    }
    let timer = 0;
    let frame = 0;
    let pending: Element | null = null;
    let last = { x: 0, y: 0 };

    const settle = () => {
      frame = 0;
      const el = pickElement(last.x, last.y);
      if (el === pending) return;
      pending = el;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setHovered(pending), HOVER_INTENT_MS);
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType === "touch") return;
      last = { x: e.clientX, y: e.clientY };
      if (!frame) frame = requestAnimationFrame(settle);
    };
    const swallow = (e: Event) => {
      const t = e.target as Element | null;
      if (!t || isInspectorElement(t)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
    };
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t || isInspectorElement(t)) return;
      const el = pickElement(e.clientX, e.clientY) ?? t;
      e.preventDefault();
      e.stopImmediatePropagation();
      if (el !== document.documentElement && el !== document.body) select.current(el);
    };

    document.addEventListener("pointermove", onMove, { capture: true, passive: true });
    document.addEventListener("click", onClick, true);
    for (const type of ["auxclick", "dblclick", "submit"]) document.addEventListener(type, swallow, true);
    return () => {
      window.clearTimeout(timer);
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener("pointermove", onMove, { capture: true } as EventListenerOptions);
      document.removeEventListener("click", onClick, true);
      for (const type of ["auxclick", "dblclick", "submit"]) document.removeEventListener(type, swallow, true);
    };
  }, [active]);

  return { hovered, setHovered };
}

/** Keyboard walk through the DOM from the selected element: up to the parent, down to the first child, sideways. */
export function walk(el: Element, key: "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight"): Element | null {
  const ok = (n: Element | null) => (n && !isInspectorElement(n) && n !== document.body && n !== document.documentElement ? n : null);
  switch (key) {
    case "ArrowUp":
      return ok(el.parentElement);
    case "ArrowDown":
      return ok(el.firstElementChild);
    case "ArrowLeft":
      return ok(el.previousElementSibling);
    case "ArrowRight":
      return ok(el.nextElementSibling);
  }
}
