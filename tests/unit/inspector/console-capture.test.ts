// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from "vitest";
import { installConsoleCapture } from "../../../packages/ui/src/lib/inspector/console-capture";

const original = console.error;
afterEach(() => {
  console.error = original;
  vi.restoreAllMocks();
});

describe("installConsoleCapture", () => {
  it("records console.error calls, newest first, and still calls the original", () => {
    const spy = vi.fn();
    console.error = spy;
    const cap = installConsoleCapture();
    console.error("first", 1);
    console.error(new TypeError("second"));
    expect(spy).toHaveBeenCalledTimes(2);
    expect(cap.errors()).toEqual(["TypeError: second", "first 1"]);
    cap.dispose();
  });

  it("restores console.error on dispose", () => {
    const spy = vi.fn();
    console.error = spy;
    const cap = installConsoleCapture();
    expect(console.error).not.toBe(spy);
    cap.dispose();
    expect(console.error).toBe(spy);
  });

  it("is shared and reference counted: the first dispose keeps it alive for the second user", () => {
    const spy = vi.fn();
    console.error = spy;
    const a = installConsoleCapture();
    const b = installConsoleCapture();
    console.error("shared");
    a.dispose();
    expect(console.error).not.toBe(spy);
    expect(b.errors()).toEqual(["shared"]);
    b.dispose();
    expect(console.error).toBe(spy);
  });

  it("dispose is safe to call twice", () => {
    const spy = vi.fn();
    console.error = spy;
    const a = installConsoleCapture();
    const b = installConsoleCapture();
    a.dispose();
    a.dispose();
    expect(console.error).not.toBe(spy);
    b.dispose();
    expect(console.error).toBe(spy);
  });

  it("records uncaught errors and unhandled rejections", () => {
    console.error = vi.fn();
    const cap = installConsoleCapture();
    window.dispatchEvent(new ErrorEvent("error", { message: "Script error one", error: new Error("kaboom") }));
    const rejection = new Event("unhandledrejection") as Event & { reason?: unknown };
    rejection.reason = new Error("nope");
    window.dispatchEvent(rejection);
    expect(cap.errors()).toEqual(["Unhandled rejection: Error: nope", "Error: kaboom"]);
    cap.dispose();
  });

  it("deduplicates, keeps the newest 20 and strips control characters", () => {
    console.error = vi.fn();
    const cap = installConsoleCapture();
    console.error("same");
    console.error("same");
    expect(cap.errors()).toEqual(["same"]);
    for (let i = 0; i < 30; i++) console.error(`e${i}`);
    expect(cap.errors()).toHaveLength(20);
    expect(cap.errors()[0]).toBe("e29");
    console.error("a\u0000b");
    expect(cap.errors()[0]).toBe("ab");
    cap.clear();
    expect(cap.errors()).toEqual([]);
    cap.dispose();
  });

  it("tells subscribers about each new error once, not about repeats, and never breaks the page when one throws", () => {
    console.error = vi.fn();
    const cap = installConsoleCapture();
    const seen = vi.fn();
    const bad = vi.fn(() => {
      throw new Error("listener bug");
    });
    const off = cap.subscribe(seen);
    cap.subscribe(bad);
    console.error("first");
    console.error("first");
    console.error("second");
    expect(seen).toHaveBeenCalledTimes(2);
    expect(bad).toHaveBeenCalledTimes(2);
    off();
    console.error("third");
    expect(seen).toHaveBeenCalledTimes(2);
    cap.dispose();
  });

  it("never throws when an argument cannot be printed", () => {
    console.error = vi.fn();
    const cap = installConsoleCapture();
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    expect(() => console.error(circular)).not.toThrow();
    expect(cap.errors()).toHaveLength(1);
    cap.dispose();
  });
});
