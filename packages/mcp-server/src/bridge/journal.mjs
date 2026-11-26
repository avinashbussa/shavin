/**
 * The findings journal: what a developer chose to send to the agent, kept in a file so it survives a restart and is
 * shared by every process that touches it (the page-facing bridge, the MCP tools, the CLI).
 *
 * The file is an append-only list of JSON lines; each line is the full latest state of one entry, and the last line
 * for an id wins. States: `pending` (stored, no agent has it), `leased` (an agent holds it for a while), `acked`
 * (the agent said it is done), `withdrawn` (the developer ignored it before an agent took it). A lease that runs out
 * returns the entry to `pending`, so a crashed agent never loses a finding. Every read re-reads the file when it
 * changed, so two processes agree without talking to each other.
 *
 * Everything in an entry that came from a page or a person is re-typed and capped by `sanitizeFinding` before it is
 * stored and again when it is read back from disk, so an edited or corrupt line cannot smuggle anything in.
 */
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { sanitizeFinding, FINDING_ID } from "./findings-shape.mjs";

export const JOURNAL_FILE = "findings.jsonl";
export const LEASE_MS = 120_000;
export const LISTEN_WINDOW_MS = 40_000;
const RETENTION_MS = 24 * 60 * 60 * 1000;
const MAX_FILE_BYTES = 1_000_000;
const MAX_ENTRIES = 2000;
const SEVERITY_RANK = { error: 0, warning: 1 };
const STATES = new Set(["pending", "leased", "acked", "withdrawn"]);

const newLeaseId = () => randomBytes(6).toString("hex");

/**
 * @param {{ dir: string, now?: () => number, fsImpl?: typeof fs, leaseMs?: number }} options
 */
export function createJournal({ dir, now = Date.now, fsImpl = fs, leaseMs = LEASE_MS }) {
  const file = path.join(dir, JOURNAL_FILE);
  /** @type {Map<string, any>} */
  let entries = new Map();
  let seen = { size: -1, mtimeMs: -1 };
  let seq = 0;
  let lastWaitAt = 0;

  function ensureDir() {
    fsImpl.mkdirSync(dir, { recursive: true, mode: 0o700 });
  }

  function parseLine(line) {
    let raw;
    try {
      raw = JSON.parse(line);
    } catch {
      return null;
    }
    if (!raw || typeof raw !== "object" || !FINDING_ID.test(raw.id) || !STATES.has(raw.state)) return null;
    const finding = sanitizeFinding(raw.finding);
    if (!finding || finding.id !== raw.id) return null;
    const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : 0);
    const text = (v, max) => (typeof v === "string" ? v.slice(0, max) : "");
    return {
      id: raw.id,
      state: raw.state,
      finding,
      tabId: text(raw.tabId, 80),
      pathname: text(raw.pathname, 300),
      origin: text(raw.origin, 200),
      seq: num(raw.seq),
      addedAt: num(raw.addedAt),
      updatedAt: num(raw.updatedAt),
      leaseId: text(raw.leaseId, 40),
      leaseUntil: num(raw.leaseUntil),
      lastLeaseId: text(raw.lastLeaseId, 40),
      ackedAt: num(raw.ackedAt),
      attempts: num(raw.attempts),
    };
  }

  /** Re-reads the file when its size or modification time changed since the last read. */
  function refresh() {
    let st;
    try {
      st = fsImpl.statSync(file);
    } catch {
      entries = new Map();
      seen = { size: -1, mtimeMs: -1 };
      return;
    }
    if (st.size === seen.size && st.mtimeMs === seen.mtimeMs) return;
    const next = new Map();
    let text = "";
    try {
      text = fsImpl.readFileSync(file, "utf8");
    } catch {
      return;
    }
    for (const line of text.split("\n")) {
      if (!line.trim()) continue;
      const e = parseLine(line);
      if (e) next.set(e.id, e);
    }
    entries = next;
    seen = { size: st.size, mtimeMs: st.mtimeMs };
    for (const e of entries.values()) seq = Math.max(seq, e.seq);
  }

  function persist(entry) {
    ensureDir();
    const line = `${JSON.stringify(entry)}\n`;
    fsImpl.appendFileSync(file, line, { mode: 0o600 });
    entries.set(entry.id, entry);
    try {
      const st = fsImpl.statSync(file);
      seen = { size: st.size, mtimeMs: st.mtimeMs };
    } catch {
      seen = { size: -1, mtimeMs: -1 };
    }
  }

  /** `leased` with a lease that ran out counts as `pending`. */
  const effective = (e, t = now()) => (e.state === "leased" && e.leaseUntil <= t ? "pending" : e.state);

  const view = (e, t = now()) => ({ ...e, state: effective(e, t), requeued: e.state === "leased" && effective(e, t) === "pending" });

  return {
    file,

    /** Stores findings the developer sent. Findings in one call are queued errors first, then in the order given. */
    add(findings, meta = {}) {
      refresh();
      const t = now();
      const list = (Array.isArray(findings) ? findings : [findings]).map(sanitizeFinding).filter(Boolean);
      const ordered = list.map((f, i) => ({ f, i })).sort((a, b) => SEVERITY_RANK[a.f.severity] - SEVERITY_RANK[b.f.severity] || a.i - b.i);
      const out = [];
      for (const { f } of ordered) {
        const prev = entries.get(f.id);
        const live = prev && (effective(prev, t) === "pending" || effective(prev, t) === "leased");
        const entry = live
          ? { ...prev, finding: f, updatedAt: t }
          : {
              id: f.id,
              state: "pending",
              finding: f,
              tabId: String(meta.tabId ?? "").slice(0, 80),
              pathname: String(meta.pathname ?? "").slice(0, 300),
              origin: String(meta.origin ?? "").slice(0, 200),
              seq: ++seq,
              addedAt: t,
              updatedAt: t,
              leaseId: "",
              leaseUntil: 0,
              lastLeaseId: "",
              ackedAt: 0,
              attempts: prev ? prev.attempts : 0,
            };
        persist(entry);
        out.push(view(entry, t));
      }
      return out;
    },

    /** Gives the oldest pending entry to an agent for `leaseMs`. Returns null when nothing waits. */
    lease(options = {}) {
      refresh();
      const t = now();
      const ms = Math.max(5_000, Math.min(options.leaseMs ?? leaseMs, 600_000));
      const next = [...entries.values()].filter((e) => effective(e, t) === "pending").sort((a, b) => a.seq - b.seq)[0];
      if (!next) return null;
      const leased = { ...next, state: "leased", leaseId: newLeaseId(), leaseUntil: t + ms, lastLeaseId: next.leaseId || next.lastLeaseId, attempts: next.attempts + 1, updatedAt: t };
      persist(leased);
      return view(leased, t);
    },

    /** Marks a leased entry done. A late ack (the lease ran out but nobody else took it) still counts. */
    ack(id, options = {}) {
      refresh();
      const t = now();
      const e = entries.get(id);
      if (!e) return { ok: false, reason: "unknown finding" };
      if (e.state === "acked") return { ok: true, entry: view(e, t), already: true };
      if (e.state === "withdrawn") return { ok: false, reason: "the developer withdrew this finding" };
      if (e.state !== "leased") return { ok: false, reason: "not leased" };
      // An expired lease nobody took over still counts: the work was done. Another agent's lease does not.
      if (options.leaseId && options.leaseId !== e.leaseId) return { ok: false, reason: "another agent holds this lease" };
      const done = { ...e, state: "acked", ackedAt: t, updatedAt: t, leaseUntil: 0 };
      persist(done);
      return { ok: true, entry: view(done, t) };
    },

    /** Puts a leased entry back in the queue (the agent could not fix it). */
    nack(id, options = {}) {
      refresh();
      const t = now();
      const e = entries.get(id);
      if (!e || e.state !== "leased") return { ok: false, reason: "not leased" };
      if (options.leaseId && options.leaseId !== e.leaseId) return { ok: false, reason: "another agent holds this lease" };
      const back = { ...e, state: "pending", leaseUntil: 0, lastLeaseId: e.leaseId, leaseId: "", updatedAt: t };
      persist(back);
      return { ok: true, entry: view(back, t) };
    },

    /** The developer ignored a finding: it leaves the queue if no agent has it yet. */
    withdraw(id) {
      refresh();
      const t = now();
      const e = entries.get(id);
      if (!e) return { ok: false, reason: "unknown finding" };
      if (effective(e, t) !== "pending") return { ok: false, reason: e.state === "withdrawn" ? "already withdrawn" : "an agent already has it" };
      const w = { ...e, state: "withdrawn", updatedAt: t };
      persist(w);
      return { ok: true, entry: view(w, t) };
    },

    get(id) {
      refresh();
      const e = entries.get(id);
      return e ? view(e) : null;
    },

    list(filter = {}) {
      refresh();
      const t = now();
      const states = filter.states ? new Set(filter.states) : null;
      return [...entries.values()]
        .map((e) => view(e, t))
        .filter((e) => (!states || states.has(e.state)) && (!filter.tabId || e.tabId === filter.tabId))
        .sort((a, b) => a.seq - b.seq);
    },

    counts() {
      refresh();
      const t = now();
      const c = { pending: 0, leased: 0, acked: 0, withdrawn: 0 };
      for (const e of entries.values()) c[effective(e, t)]++;
      return c;
    },

    /** An agent called a waiting tool just now (so it is probably listening). */
    markListening() {
      lastWaitAt = now();
      try {
        ensureDir();
        fsImpl.writeFileSync(path.join(dir, "agent-listening"), String(lastWaitAt), { mode: 0o600 });
      } catch {
        /* the marker is a hint only */
      }
    },

    /** True when any process called `markListening` in the last 40 seconds. */
    agentListening() {
      let at = lastWaitAt;
      try {
        at = Math.max(at, Number(fsImpl.readFileSync(path.join(dir, "agent-listening"), "utf8")) || 0);
      } catch {
        /* no marker yet */
      }
      return now() - at < LISTEN_WINDOW_MS;
    },

    /** Drops acked and withdrawn entries older than a day, keeps the newest 2,000, rewrites the file in one step. */
    compact(options = {}) {
      refresh();
      const t = now();
      const retention = options.retentionMs ?? RETENTION_MS;
      let size = 0;
      try {
        size = fsImpl.statSync(file).size;
      } catch {
        return { kept: 0, dropped: 0 };
      }
      const all = [...entries.values()];
      const keep = all
        .filter((e) => !((e.state === "acked" || e.state === "withdrawn") && t - e.updatedAt > retention))
        .sort((a, b) => a.seq - b.seq)
        .slice(-MAX_ENTRIES);
      const dropped = all.length - keep.length;
      if (dropped === 0 && size <= MAX_FILE_BYTES) return { kept: keep.length, dropped: 0 };
      ensureDir();
      const tmp = path.join(dir, `${JOURNAL_FILE}.${process.pid}.tmp`);
      fsImpl.writeFileSync(tmp, keep.map((e) => JSON.stringify(e)).join("\n") + (keep.length ? "\n" : ""), { mode: 0o600 });
      fsImpl.renameSync(tmp, file);
      seen = { size: -1, mtimeMs: -1 };
      entries = new Map(keep.map((e) => [e.id, e]));
      return { kept: keep.length, dropped };
    },
  };
}
