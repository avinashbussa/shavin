"use client";
import { useEffect, useRef } from "react";
import { announce, fieldErrorAnnouncementsSilenced } from "./announce";

/**
 * Announces a field error once, politely, when it goes from empty to set (WCAG 4.1.3). It does not
 * re-announce when `enabled` flips back to true while the same error is still showing, and it stays
 * silent while FormErrorSummary owns the announcement after a failed submit. No live role on the
 * error text: a role on a span mounted with its text is unreliable.
 */
export function useFieldErrorAnnouncement(error: string | undefined, enabled = true) {
  const prev = useRef<string | undefined>(undefined);
  useEffect(() => {
    const had = Boolean(prev.current);
    prev.current = error;
    if (!error || had || !enabled || fieldErrorAnnouncementsSilenced()) return;
    announce(error, "polite");
  }, [error, enabled]);
}
