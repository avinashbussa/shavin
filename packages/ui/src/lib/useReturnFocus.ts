"use client";
import { useCallback, useLayoutEffect, useRef } from "react";

/**
 * Focus return for Radix dialogs that have no `Dialog.Trigger` (controlled or
 * auto-open dialogs, AlertDialog, Spotlight). Radix returns focus to its trigger
 * ref on close; with no trigger that ref is null and focus falls to <body>
 * (WCAG 2.4.3). This remembers whatever was focused when the dialog opened and
 * returns focus there instead.
 *
 * Pass the result to `onCloseAutoFocus` on the Radix Content. With a trigger,
 * the handler does nothing and Radix's own behaviour applies.
 */
export function useReturnFocus(open: boolean, hasTrigger = false) {
  const previous = useRef<HTMLElement | null>(null);

  // Layout effect: runs before Radix's FocusScope moves focus into the content.
  useLayoutEffect(() => {
    if (open && typeof document !== "undefined") {
      previous.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    }
  }, [open]);

  return useCallback(
    (event: Event) => {
      if (hasTrigger) return;
      const el = previous.current;
      if (el && el.isConnected && el !== document.body) {
        event.preventDefault();
        el.focus();
      }
    },
    [hasTrigger],
  );
}
