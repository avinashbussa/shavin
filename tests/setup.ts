import "@testing-library/jest-dom/vitest";
import { afterEach, expect, vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";

// jest-axe's `expect(results).toHaveNoViolations()` — registered globally so
// every a11y test reads the same. The matcher's TYPE is declared in
// tests/vitest-env.d.ts (jest-axe only ships jest types, not vitest's).
expect.extend(toHaveNoViolations);

// RTL doesn't auto-clean when `globals` is on for every runner path — do it
// explicitly so portaled Radix content (dialogs, select listboxes) is torn
// down between tests and doesn't leak into the next axe(document.body) sweep.
afterEach(() => cleanup());

// --- jsdom shims for Radix primitives ------------------------------------
// jsdom implements none of the layout/pointer APIs Radix Select, Dialog, and
// the Popper-positioned surfaces call when they open. Without these, opening a
// Select or Dialog throws ("Not implemented") rather than testing behavior.
// These are environment shims, not assertions — they make the DOM answer the
// calls; they never fake a component's own logic.

if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as unknown as MediaQueryList;
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver;
}

// jsdom lacks PointerEvent; userEvent/Radix dispatch pointer events on open.
if (typeof window.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? "mouse";
    }
  }
  window.PointerEvent = PointerEventPolyfill as unknown as typeof PointerEvent;
}

// Radix Select/Dialog call these on their trigger/content nodes on open.
Element.prototype.scrollIntoView = vi.fn();
if (typeof Element.prototype.hasPointerCapture !== "function") {
  Element.prototype.hasPointerCapture = () => false;
}
if (typeof Element.prototype.setPointerCapture !== "function") {
  Element.prototype.setPointerCapture = () => {};
}
if (typeof Element.prototype.releasePointerCapture !== "function") {
  Element.prototype.releasePointerCapture = () => {};
}
