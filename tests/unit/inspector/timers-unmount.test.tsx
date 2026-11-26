import * as React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, cleanup, act, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Inspector, RESCAN_EVENT } from "../../../packages/ui/src/inspector/Inspector";
import { useTimeouts } from "../../../packages/ui/src/inspector/useTimeouts";
import { RESCAN_WINDOW_MS } from "../../../packages/ui/src/inspector/journalState";
import { makeFinding } from "../../../packages/ui/src/lib/inspector/schema";

/**
 * Inspector timers must die with the component. A pending rescan timer used to fire after unmount (in CI,
 * after jsdom was torn down: "window is not defined" at Inspector.tsx).
 */
describe("useTimeouts", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
  });

  function Probe({ fn, ms }: { fn: () => void; ms: number }) {
    const later = useTimeouts();
    React.useEffect(() => later(fn, ms), [later, fn, ms]);
    return null;
  }

  it("runs a scheduled callback while mounted", () => {
    const fn = vi.fn();
    render(<Probe fn={fn} ms={1000} />);
    act(() => void vi.advanceTimersByTime(1000));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("does not run it after unmount", () => {
    const fn = vi.fn();
    const { unmount } = render(<Probe fn={fn} ms={1000} />);
    unmount();
    act(() => void vi.advanceTimersByTime(5000));
    expect(fn).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("Inspector rescan timers", () => {
  beforeEach(() => {
    localStorage.clear();
    // The bar starts open here (a real first visit starts collapsed).
    localStorage.setItem("shavin-inspector-bar", JSON.stringify({ anchor: "bottom-right", collapsed: false }));
    sessionStorage.clear();
    sessionStorage.setItem("__shavin_tab_id", "tab_test");
    document.body.innerHTML = `<main><p id="a">Privacy policy</p></main>`;
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("unmounting before the wait is over clears the second rescan and dispatches no event", async () => {
    const f = makeFinding({
      detector: "contrast",
      rule: "contrast.text",
      severity: "error",
      message: "Text is hard to read on its background.",
      evidence: { measured: "3.1:1", expected: "4.5:1" },
      fixHint: "Use text-fg on bg-surface.",
      selector: "#a",
      context: "Footer > Link",
      text: "Privacy policy",
      rect: { x: 10, y: 10, w: 100, h: 20, scrollX: 0, scrollY: 0 },
    });
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => ({
          entries: [{ id: f.id, state: "acked", requeued: false, ackedAt: Date.now(), updatedAt: 1 }],
          counts: { pending: 0, leased: 0, acked: 1, withdrawn: 0 },
          agentListening: false,
        }),
      })) as unknown as typeof fetch,
    );

    // Record the rescan timers (the ones with the long wait) and which of them get cleared.
    const rescanIds = new Set<number>();
    const cleared = new Set<number>();
    const realSet = window.setTimeout.bind(window);
    const realClear = window.clearTimeout.bind(window);
    vi.spyOn(window, "setTimeout").mockImplementation(((fn: TimerHandler, ms?: number, ...rest: unknown[]) => {
      const id = realSet(fn as () => void, ms, ...rest) as unknown as number;
      if (ms === RESCAN_WINDOW_MS) rescanIds.add(id);
      return id;
    }) as typeof window.setTimeout);
    vi.spyOn(window, "clearTimeout").mockImplementation(((id?: number) => {
      if (id !== undefined) cleared.add(id);
      realClear(id);
    }) as typeof window.clearTimeout);

    const events: number[] = [];
    const onRescan = () => events.push(Date.now());
    window.addEventListener(RESCAN_EVENT, onRescan);

    const { unmount } = render(<Inspector findings={[f]} />);
    await userEvent.click(screen.getByRole("button", { name: "Issues" }));
    await waitFor(() => expect(rescanIds.size).toBe(1)); // the acked entry scheduled its second rescan
    expect(events.length).toBeGreaterThanOrEqual(1); // the first rescan is immediate

    const before = events.length;
    unmount();
    expect([...rescanIds].every((id) => cleared.has(id))).toBe(true);
    await act(async () => {
      await new Promise((r) => realSet(r, 50));
    });
    expect(events.length).toBe(before);
    window.removeEventListener(RESCAN_EVENT, onRescan);
  });
});
