import { describe, it, expect, vi } from "vitest";
import { MAX_NOTE, readJournal, sendFindings, withdrawFinding } from "../../../packages/ui/src/inspector/journalClient";
import { RESCAN_WINDOW_MS, canSendAgain, countsFor, rowState, stripSummary } from "../../../packages/ui/src/inspector/journalState";
import { STR } from "../../../packages/ui/src/inspector/strings";
import { makeFinding } from "../../../packages/ui/src/lib/inspector/schema";

const finding = (comment?: string) =>
  makeFinding({ detector: "contrast", rule: "contrast.text", severity: "error", message: "m", fixHint: "f", selector: "a", comment });
const meta = { tabId: "t1", pathname: "/p", origin: "http://localhost:3000" };
const res = (status: number, body: unknown = {}) => ({ ok: status >= 200 && status < 300, status, json: async () => body }) as Response;

describe("sendFindings", () => {
  it("posts the findings with the tab and page, to the bridge port, and returns what was accepted", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(res(200, { accepted: ["f_00000001"], counts: { pending: 1, leased: 0, acked: 0, withdrawn: 0 }, agentListening: true }));
    const r = await sendFindings([finding("hi")], meta, 7036, fetchImpl as unknown as typeof fetch);
    expect(r).toMatchObject({ ok: true, accepted: ["f_00000001"], agentListening: true });
    const [url, init] = fetchImpl.mock.calls[0]!;
    expect(url).toBe("http://127.0.0.1:7036/api/findings");
    expect(init.method).toBe("POST");
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ tabId: "t1", pathname: "/p", origin: "http://localhost:3000" });
    expect(body.findings[0].comment).toBe("hi");
  });

  it("a refused connection means the bridge is down", async () => {
    const r = await sendFindings([finding()], meta, 7036, vi.fn().mockRejectedValue(new TypeError("Failed to fetch")) as unknown as typeof fetch);
    expect(r).toEqual({ ok: false, reason: "bridge-down" });
  });

  it("classifies the bridge's answers", async () => {
    const send = (status: number) => sendFindings([finding()], meta, 7036, vi.fn().mockResolvedValue(res(status)) as unknown as typeof fetch);
    expect(await send(500)).toEqual({ ok: false, reason: "save-failed" });
    expect(await send(413)).toEqual({ ok: false, reason: "too-many" });
    expect(await send(403)).toEqual({ ok: false, reason: "rejected" });
    expect(await send(400)).toEqual({ ok: false, reason: "rejected" });
  });

  it("refuses a note over 2,000 characters without calling the bridge", async () => {
    const fetchImpl = vi.fn();
    const r = await sendFindings([{ ...finding(), comment: "x".repeat(MAX_NOTE + 1) }], meta, 7036, fetchImpl as unknown as typeof fetch);
    expect(r).toEqual({ ok: false, reason: "too-long" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("an answer that is not JSON counts as a failed save", async () => {
    const bad = { ok: true, status: 200, json: async () => { throw new Error("x"); } } as unknown as Response;
    const r = await sendFindings([finding()], meta, 7036, vi.fn().mockResolvedValue(bad) as unknown as typeof fetch);
    expect(r).toEqual({ ok: false, reason: "save-failed" });
  });

  it("uses a non-default port", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(res(200, { accepted: [], counts: {}, agentListening: false }));
    await sendFindings([finding()], meta, 7100, fetchImpl as unknown as typeof fetch);
    expect(fetchImpl.mock.calls[0]![0]).toBe("http://127.0.0.1:7100/api/findings");
  });
});

describe("readJournal and withdrawFinding", () => {
  it("reads entries for this tab", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(res(200, { entries: [{ id: "f_00000001", state: "leased" }], counts: { pending: 0, leased: 1, acked: 0, withdrawn: 0 }, agentListening: true }));
    const r = await readJournal(7036, "tab a/b", fetchImpl as unknown as typeof fetch);
    expect(r!.entries).toHaveLength(1);
    expect(fetchImpl.mock.calls[0]![0]).toBe("http://127.0.0.1:7036/api/findings?tabId=tab%20a%2Fb");
  });

  it("returns null when the bridge is down or answers oddly", async () => {
    expect(await readJournal(7036, "t", vi.fn().mockRejectedValue(new Error("x")) as unknown as typeof fetch)).toBeNull();
    expect(await readJournal(7036, "t", vi.fn().mockResolvedValue(res(500)) as unknown as typeof fetch)).toBeNull();
    expect(await readJournal(7036, "t", vi.fn().mockResolvedValue(res(200, { nope: 1 })) as unknown as typeof fetch)).toBeNull();
  });

  it("withdraw posts the id and says whether it worked", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(res(200, { status: "withdrawn" }));
    expect(await withdrawFinding("f_00000001", 7036, fetchImpl as unknown as typeof fetch)).toBe(true);
    expect(JSON.parse(fetchImpl.mock.calls[0]![1].body)).toEqual({ id: "f_00000001" });
    expect(await withdrawFinding("f_00000001", 7036, vi.fn().mockRejectedValue(new Error("x")) as unknown as typeof fetch)).toBe(false);
  });
});

describe("rowState", () => {
  const entry = (state: "pending" | "leased" | "acked" | "withdrawn", over: Record<string, unknown> = {}) => ({ id: "f_00000001", state, requeued: false, ackedAt: 0, updatedAt: 0, ...over }) as Parameters<typeof rowState>[0];
  const NOW = 100_000;

  it("says nothing before it was sent or after it was withdrawn", () => {
    expect(rowState(undefined, true, NOW)).toBeNull();
    expect(rowState(entry("withdrawn"), true, NOW)).toBeNull();
  });

  it("uses the exact wording for waiting, with the agent, and back in the queue", () => {
    expect(rowState(entry("pending"), true, NOW)).toEqual({ kind: "waiting", text: "Sent. Waiting for the agent." });
    expect(rowState(entry("leased"), true, NOW)).toEqual({ kind: "agent", text: "Agent is working on it." });
    expect(rowState(entry("pending", { requeued: true }), true, NOW)).toEqual({ kind: "back", text: "Back in the queue. The agent did not finish." });
  });

  it("after an ack: rescanning for 8 seconds, resolved once the scan no longer has it, still there if it does", () => {
    const acked = entry("acked", { ackedAt: NOW - 2000 });
    expect(rowState(acked, true, NOW)).toEqual({ kind: "rescanning", text: "Agent marked it done. Rescanning…" });
    expect(rowState(acked, false, NOW)).toEqual({ kind: "resolved", text: "Resolved." });
    const late = entry("acked", { ackedAt: NOW - RESCAN_WINDOW_MS - 1 });
    expect(rowState(late, true, NOW)).toEqual({ kind: "still", text: "Agent marked it done, but the issue is still on the page." });
    expect(canSendAgain(rowState(late, true, NOW))).toBe(true);
    expect(canSendAgain(rowState(acked, true, NOW))).toBe(false);
    expect(canSendAgain(null)).toBe(false);
  });

  it("the wording is the design's, verbatim", () => {
    expect(STR.noAgent).toBe("Sent. No agent is waiting yet. Ask your agent to call `await_finding`, or use Copy as prompt.");
    expect(STR.bridgeDown).toBe("Agent not connected. Start the bridge with `npx @shavin/cli bridge`, then press Send again. Your comment is kept.");
    expect(STR.saveFailed).toBe("Could not save the finding. Check the bridge terminal for the error, then press Send again.");
    expect(STR.tooLong).toBe("Comment is too long. Keep it under 2,000 characters.");
    expect(STR.copied).toBe("Copied. Paste it into your agent's chat.");
  });
});

describe("stripSummary and countsFor", () => {
  it("hides zeros and is empty when nothing was sent", () => {
    expect(stripSummary({ pending: 2, leased: 1, acked: 4, withdrawn: 9 })).toBe("2 waiting · 1 with the agent · 4 done");
    expect(stripSummary({ pending: 0, leased: 1, acked: 0, withdrawn: 0 })).toBe("1 with the agent");
    expect(stripSummary({ pending: 0, leased: 0, acked: 0, withdrawn: 3 })).toBe("");
    expect(stripSummary(null)).toBe("");
  });

  it("counts only the findings it is given, and never counts withdrawn ones in the strip", () => {
    const entries = [
      { id: "f_00000001", state: "pending" },
      { id: "f_00000002", state: "leased" },
      { id: "f_00000003", state: "acked" },
      { id: "f_00000004", state: "pending" },
    ] as never[];
    expect(countsFor(entries, new Set(["f_00000001", "f_00000003"]))).toEqual({ pending: 1, leased: 0, acked: 1, withdrawn: 0 });
  });
});
