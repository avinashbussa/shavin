/**
 * What the developer sees about a finding they sent: one short line per finding and a one-line summary, computed
 * from the journal entries and the latest scan. Pure.
 */
import { STR } from "./strings";
import type { Counts, JournalEntry } from "./journalClient";

/** How long after an agent marks a finding done we wait for a scan to confirm it is gone before saying it is still there. */
export const RESCAN_WINDOW_MS = 8000;

export type RowState =
  | { kind: "waiting"; text: string }
  | { kind: "agent"; text: string }
  | { kind: "back"; text: string }
  | { kind: "rescanning"; text: string }
  | { kind: "resolved"; text: string }
  | { kind: "still"; text: string };

/**
 * @param entry the journal entry for this finding, if it was sent
 * @param stillOnPage whether the latest scan still contains this finding
 * @param now ms since the epoch
 */
export function rowState(entry: JournalEntry | undefined, stillOnPage: boolean, now: number): RowState | null {
  if (!entry || entry.state === "withdrawn") return null;
  switch (entry.state) {
    case "pending":
      return entry.requeued ? { kind: "back", text: STR.backInQueue } : { kind: "waiting", text: STR.waiting };
    case "leased":
      return { kind: "agent", text: STR.leased };
    case "acked":
      if (!stillOnPage) return { kind: "resolved", text: STR.resolved };
      return now - entry.ackedAt < RESCAN_WINDOW_MS ? { kind: "rescanning", text: STR.acked } : { kind: "still", text: STR.stillThere };
  }
}

/** True when a finding was sent, the agent said it is done, a scan ran, and the problem is still on the page. */
export const canSendAgain = (s: RowState | null) => !!s && s.kind === "still";

/** "2 waiting · 1 with the agent · 4 done", zeros hidden. Empty when nothing was sent. */
export function stripSummary(counts: Counts | null | undefined): string {
  if (!counts) return "";
  const parts = [
    counts.pending > 0 ? `${counts.pending} waiting` : "",
    counts.leased > 0 ? `${counts.leased} with the agent` : "",
    counts.acked > 0 ? `${counts.acked} done` : "",
  ].filter(Boolean);
  return parts.join(" · ");
}

/** Counts for the findings of this page only: a journal can hold entries from other pages and sessions. */
export function countsFor(entries: readonly JournalEntry[], ids: ReadonlySet<string>): Counts {
  const c: Counts = { pending: 0, leased: 0, acked: 0, withdrawn: 0 };
  for (const e of entries) if (ids.has(e.id)) c[e.state]++;
  return c;
}
