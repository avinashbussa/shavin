/**
 * HTTP routes for findings: the page sends what the developer chose to send, and reads back where it stands.
 *
 *   POST /api/findings            { findings: [...] }   store (queued errors first); at most 50 per request
 *   GET  /api/findings            ?state=pending,leased  entries plus counts and whether an agent is listening
 *   POST /api/findings/withdraw   { id }                 the developer ignored it before an agent took it
 *
 * These run after the Host/Origin policy in server.mjs, so a page the developer has open on another site cannot
 * call them. Bodies are size-limited, every field is re-typed and capped, and a tab can only send so often.
 */
import { readBody, MAX_BODY_BYTES } from "./body.mjs";
import { FINDING_ID, sanitizeFinding } from "./findings-shape.mjs";

export const MAX_PER_REQUEST = 50;
const RATE = { windowMs: 60_000, max: 60 };

const json = (res, status, body) => {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(body));
};

/** Sliding-window limit per tab (or per `anon`): the bridge is local, but a runaway page should not fill the disk. */
function allow(bridge, key, now = Date.now()) {
  const hits = (bridge._findingHits ??= new Map());
  const list = (hits.get(key) ?? []).filter((t) => now - t < RATE.windowMs);
  if (list.length >= RATE.max) {
    hits.set(key, list);
    return false;
  }
  list.push(now);
  hits.set(key, list);
  if (hits.size > 200) for (const [k, v] of hits) if (!v.some((t) => now - t < RATE.windowMs)) hits.delete(k);
  return true;
}

const publicEntry = (e) => ({
  id: e.id,
  state: e.state,
  requeued: !!e.requeued,
  severity: e.finding.severity,
  rule: e.finding.rule,
  message: e.finding.message,
  selector: e.finding.selector,
  pathname: e.pathname,
  addedAt: e.addedAt,
  updatedAt: e.updatedAt,
  leaseUntil: e.state === "leased" ? e.leaseUntil : 0,
  ackedAt: e.ackedAt,
});

/**
 * @returns {boolean} true when the request was a findings route (and has been answered or will be)
 */
export function handleFindingsRoute(bridge, req, res, url) {
  const p = url.pathname;
  if (p !== "/api/findings" && p !== "/api/findings/withdraw") return false;
  const journal = bridge.getJournal();

  if (req.method === "GET" && p === "/api/findings") {
    const states = (url.searchParams.get("state") || "").split(",").map((s) => s.trim()).filter(Boolean);
    const tabId = url.searchParams.get("tabId") || "";
    try {
      const entries = journal.list({ states: states.length ? states : undefined, tabId: tabId || undefined });
      json(res, 200, { entries: entries.slice(-300).map(publicEntry), counts: journal.counts(), agentListening: journal.agentListening() });
    } catch (err) {
      json(res, 500, { error: "could not read the journal" });
    }
    return true;
  }

  if (req.method === "POST") {
    readBody(req, MAX_BODY_BYTES.findings)
      .then((body) => {
        const data = JSON.parse(body);
        if (!data || typeof data !== "object" || Array.isArray(data)) throw Object.assign(new Error("invalid payload"), { status: 400 });

        if (p === "/api/findings/withdraw") {
          if (typeof data.id !== "string" || !FINDING_ID.test(data.id)) throw Object.assign(new Error("invalid id"), { status: 400 });
          const r = journal.withdraw(data.id);
          const counts = journal.counts();
          bridge.broadcast?.({ type: "finding_state", counts });
          json(res, 200, { status: r.ok ? "withdrawn" : "unchanged", reason: r.ok ? undefined : r.reason, counts });
          return;
        }

        const tabKey = typeof data.tabId === "string" ? data.tabId.slice(0, 80) : "anon";
        if (!allow(bridge, tabKey)) throw Object.assign(new Error("too many requests, wait a moment"), { status: 429 });
        const list = Array.isArray(data.findings) ? data.findings : data.finding ? [data.finding] : null;
        if (!list || list.length === 0) throw Object.assign(new Error("no findings"), { status: 400 });
        if (list.length > MAX_PER_REQUEST) throw Object.assign(new Error(`at most ${MAX_PER_REQUEST} findings per request`), { status: 413 });
        const clean = list.map(sanitizeFinding).filter(Boolean);
        if (clean.length === 0) throw Object.assign(new Error("no usable findings"), { status: 400 });
        let entries;
        try {
          entries = journal.add(clean, { tabId: tabKey === "anon" ? "" : tabKey, pathname: data.pathname, origin: data.origin });
        } catch {
          throw Object.assign(new Error("could not save the finding"), { status: 500 });
        }
        const counts = journal.counts();
        bridge.broadcast?.({ type: "finding_state", counts });
        json(res, 200, { status: "ok", accepted: entries.map((e) => e.id), rejected: list.length - clean.length, counts, agentListening: journal.agentListening() });
      })
      .catch((err) => {
        const status = err?.status ?? (err instanceof SyntaxError ? 400 : 500);
        json(res, status, { error: status === 500 ? "could not save the finding" : err.message });
      });
    return true;
  }

  json(res, 405, { error: "method not allowed" });
  return true;
}
