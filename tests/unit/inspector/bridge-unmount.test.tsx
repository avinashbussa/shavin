import * as React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, cleanup, waitFor } from "@testing-library/react";
import { ShavinDevTools } from "../../../packages/ui/src/primitives/ShavinDevTools";

/**
 * A bridge request or event stream that answers after the panel is gone (a test file finishing, a route change) must do
 * nothing. Before the fix its handlers set state anyway; once the page was torn down React's scheduler reached for
 * `window`, and the run ended with an unhandled "window is not defined" (a flaky failure under load). The teardown is
 * simulated by removing `window` after the unmount.
 */
class FakeEventSource {
  static all: FakeEventSource[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;
  constructor(public url: string) {
    FakeEventSource.all.push(this);
  }
  close() {
    this.closed = true;
  }
}

interface Pending {
  url: string;
  resolve: (r: Partial<Response>) => void;
  reject: (e: unknown) => void;
  signal?: AbortSignal | null;
}
let pending: Pending[] = [];
const unhandled: unknown[] = [];
const onUnhandled = (e: unknown) => void unhandled.push(e);

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  FakeEventSource.all = [];
  pending = [];
  unhandled.length = 0;
  process.on("unhandledRejection", onUnhandled);
  vi.stubGlobal("EventSource", FakeEventSource);
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => new Promise<Response>((resolve, reject) => pending.push({ url: String(url), resolve: resolve as Pending["resolve"], reject, signal: init?.signal }))),
  );
});
afterEach(() => {
  cleanup();
  process.off("unhandledRejection", onUnhandled);
  vi.unstubAllGlobals();
});

const settle = () => new Promise((r) => setTimeout(r, 50));

describe("DevToolsPanel after unmount", () => {
  it("ignores a late bridge answer, a late failure and a stream error, and cleans up", async () => {
    const view = render(<ShavinDevTools forceShow />);
    await waitFor(() => expect(pending.some((p) => p.url.includes("/api/audit"))).toBe(true), { timeout: 40000 });
    await waitFor(() => expect(FakeEventSource.all.length).toBeGreaterThan(0));
    const audits = pending.filter((p) => p.url.includes("/api/audit"));
    const es = FakeEventSource.all[0]!;
    const handlers = { onopen: es.onopen, onmessage: es.onmessage, onerror: es.onerror };

    view.unmount();
    expect(FakeEventSource.all.every((e) => e.closed)).toBe(true);

    // The page is gone: React would reach for `window` on any state update from here on.
    const realWindow = globalThis.window;
    // @ts-expect-error simulating teardown
    delete globalThis.window;
    try {
      audits[0]!.resolve({ ok: true });
      audits[1]?.reject(new TypeError("Failed to fetch"));
      // A handler captured before the cleanup (the browser can still call it once) must be a no-op too.
      expect(() => (es.onerror ?? handlers.onerror)?.()).not.toThrow();
      expect(() => (es.onopen ?? handlers.onopen)?.()).not.toThrow();
      expect(() => (es.onmessage ?? handlers.onmessage)?.({ data: JSON.stringify({ type: "connected" }) })).not.toThrow();
      await settle();
    } finally {
      globalThis.window = realWindow;
    }
    expect(unhandled).toEqual([]);
  }, 60000);

  it("aborts the bridge request when the panel unmounts", async () => {
    const view = render(<ShavinDevTools forceShow />);
    await waitFor(() => expect(pending.some((p) => p.url.includes("/api/audit"))).toBe(true), { timeout: 40000 });
    const audit = pending.find((p) => p.url.includes("/api/audit"))!;
    expect(audit.signal?.aborted).toBe(false);
    view.unmount();
    expect(audit.signal?.aborted).toBe(true);
  }, 60000);
});
