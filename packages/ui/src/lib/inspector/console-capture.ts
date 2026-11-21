/**
 * Keeps the last few console errors and uncaught errors so the inspector can report them.
 * Dev only, idempotent, and it never throws: a failure here must not break the page being inspected.
 */
import { clampText } from "./schema";

const MAX_KEPT = 20;
const MAX_LENGTH = 300;
const KEY = "__shavinConsoleCapture";

export interface ConsoleCapture {
  errors(): string[];
  /** Calls `fn` each time a new error is recorded (never throws into the page). Returns an unsubscribe function. */
  subscribe(fn: () => void): () => void;
  clear(): void;
  dispose(): void;
}

type Holder = { [KEY]?: { count: number; capture: ConsoleCapture } };

function describe(arg: unknown): string {
  if (arg instanceof Error) return `${arg.name}: ${arg.message}`;
  if (typeof arg === "string") return arg;
  try {
    return typeof arg === "object" ? JSON.stringify(arg) ?? String(arg) : String(arg);
  } catch {
    return "[unprintable]";
  }
}

/** Installs the capture once per window; every caller gets the same handle and `dispose` is reference counted. */
export function installConsoleCapture(target: Window & typeof globalThis = globalThis as Window & typeof globalThis): ConsoleCapture {
  const holder = target as unknown as Holder;
  const existing = holder[KEY];
  if (existing) {
    existing.count++;
    return release(existing, holder);
  }

  const kept: string[] = [];
  const listeners = new Set<() => void>();
  const push = (message: string) => {
    const text = clampText(message, MAX_LENGTH);
    if (!text) return;
    const known = kept.includes(text);
    const at = kept.indexOf(text);
    if (at !== -1) kept.splice(at, 1);
    kept.push(text);
    if (kept.length > MAX_KEPT) kept.shift();
    if (!known) {
      for (const fn of Array.from(listeners)) {
        try {
          fn();
        } catch {
          /* a listener must not break the page */
        }
      }
    }
  };

  const original = target.console?.error;
  let patched = false;
  if (typeof original === "function") {
    target.console.error = function patchedError(this: Console, ...args: unknown[]) {
      try {
        push(args.map(describe).join(" "));
      } catch {
        /* keep the page working */
      }
      return original.apply(this, args as []);
    };
    patched = true;
  }

  const onError = (e: ErrorEvent) => push(e.error instanceof Error ? describe(e.error) : e.message);
  const onRejection = (e: PromiseRejectionEvent) => push(`Unhandled rejection: ${describe(e.reason)}`);
  target.addEventListener?.("error", onError);
  target.addEventListener?.("unhandledrejection", onRejection);

  const capture: ConsoleCapture = {
    errors: () => kept.slice().reverse(),
    subscribe: (fn) => {
      listeners.add(fn);
      return () => void listeners.delete(fn);
    },
    clear: () => {
      kept.length = 0;
    },
    dispose: () => {},
  };
  const entry = { count: 1, capture };
  holder[KEY] = entry;
  const teardown = () => {
    if (patched && original) target.console.error = original;
    target.removeEventListener?.("error", onError);
    target.removeEventListener?.("unhandledrejection", onRejection);
    delete holder[KEY];
  };
  (entry as { teardown?: () => void }).teardown = teardown;
  return release(entry, holder);
}

function release(entry: { count: number; capture: ConsoleCapture }, holder: Holder): ConsoleCapture {
  let released = false;
  return {
    errors: () => entry.capture.errors(),
    subscribe: (fn) => entry.capture.subscribe(fn),
    clear: () => entry.capture.clear(),
    dispose: () => {
      if (released) return;
      released = true;
      entry.count--;
      if (entry.count <= 0) (entry as unknown as { teardown?: () => void }).teardown?.();
      else if (holder[KEY] !== entry) return;
    },
  };
}
