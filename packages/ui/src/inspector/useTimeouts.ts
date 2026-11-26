import * as React from "react";

/**
 * Timeouts that die with the component. `schedule(fn, ms)` runs `fn` later like window.setTimeout, but every
 * pending timer is cleared on unmount, so nothing fires into a torn-down page (a pending timer used to throw
 * "window is not defined" after a test's jsdom was gone). A no-op during server rendering.
 */
export function useTimeouts(): (fn: () => void, ms: number) => void {
  const pending = React.useRef(new Set<number>());
  React.useEffect(() => {
    const ids = pending.current;
    return () => {
      if (typeof window !== "undefined") for (const id of ids) window.clearTimeout(id);
      ids.clear();
    };
  }, []);
  return React.useCallback((fn: () => void, ms: number) => {
    if (typeof window === "undefined") return;
    const id = window.setTimeout(() => {
      pending.current.delete(id);
      fn();
    }, ms);
    pending.current.add(id);
  }, []);
}
