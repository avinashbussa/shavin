/**
 * The inspector's side of the bridge routes: send findings, read where they stand, withdraw one. Pure apart from
 * `fetch`, which is injected so every outcome can be tested. Errors are classified so the popover can say the right
 * thing in the right words.
 */
import { bridgeUrl } from "../lib/bridge";
import type { Finding } from "../lib/inspector/schema";

export type SendResult =
  | { ok: true; accepted: string[]; counts: Counts; agentListening: boolean }
  | { ok: false; reason: "bridge-down" | "save-failed" | "too-long" | "too-many" | "rejected" };

export interface Counts {
  pending: number;
  leased: number;
  acked: number;
  withdrawn: number;
}

export interface JournalEntry {
  id: string;
  state: "pending" | "leased" | "acked" | "withdrawn";
  requeued: boolean;
  ackedAt: number;
  updatedAt: number;
}

export interface JournalRead {
  entries: JournalEntry[];
  counts: Counts;
  agentListening: boolean;
}

type Fetch = typeof fetch;

export const MAX_NOTE = 2000;

const get = async (fetchImpl: Fetch, url: string, init?: RequestInit) => {
  const res = await fetchImpl(url, { mode: "cors", ...init });
  return res;
};

export async function sendFindings(
  findings: readonly Finding[],
  meta: { tabId: string; pathname: string; origin: string },
  port: number | undefined,
  fetchImpl: Fetch = fetch,
): Promise<SendResult> {
  if (findings.some((f) => (f.comment ?? "").length > MAX_NOTE)) return { ok: false, reason: "too-long" };
  let res: Response;
  try {
    res = await get(fetchImpl, bridgeUrl("/api/findings", port), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...meta, findings }),
    });
  } catch {
    return { ok: false, reason: "bridge-down" };
  }
  if (res.status === 413) return { ok: false, reason: "too-many" };
  if (res.status === 500) return { ok: false, reason: "save-failed" };
  if (!res.ok) return { ok: false, reason: "rejected" };
  try {
    const body = await res.json();
    return { ok: true, accepted: Array.isArray(body.accepted) ? body.accepted : [], counts: body.counts, agentListening: !!body.agentListening };
  } catch {
    return { ok: false, reason: "save-failed" };
  }
}

export async function readJournal(port: number | undefined, tabId?: string, fetchImpl: Fetch = fetch): Promise<JournalRead | null> {
  try {
    const res = await get(fetchImpl, bridgeUrl(tabId ? `/api/findings?tabId=${encodeURIComponent(tabId)}` : "/api/findings", port));
    if (!res.ok) return null;
    const body = await res.json();
    if (!body || !Array.isArray(body.entries)) return null;
    return { entries: body.entries, counts: body.counts, agentListening: !!body.agentListening };
  } catch {
    return null;
  }
}

export async function withdrawFinding(id: string, port: number | undefined, fetchImpl: Fetch = fetch): Promise<boolean> {
  try {
    const res = await get(fetchImpl, bridgeUrl("/api/findings/withdraw", port), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
