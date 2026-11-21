/**
 * Request policy for the local Agent-Browser bridge (pure functions, unit-tested).
 *
 * The bridge listens on 127.0.0.1 and serves live audit data and a route that stages files, so a web page the developer
 * happens to have open must not be able to talk to it:
 *
 *   1. Host check (DNS rebinding): the Host header must name this machine (localhost, 127.0.0.1, [::1], *.localhost).
 *      A rebinding page reaches the bridge under its own hostname, which is refused.
 *   2. Origin allowlist (CORS): an Origin header is accepted only from a local origin on any port, or from an origin listed
 *      in `allowedOrigins` / SHAVIN_BRIDGE_ALLOWED_ORIGINS. Everything else, including "null", gets 403 and no CORS headers.
 *   3. A cross-site fetch that carries no Origin header (a plain cross-site GET) is refused through Sec-Fetch-Site.
 *
 * Requests without an Origin (curl, Node, the MCP tools, the dashboard fetching itself) keep working: they are not a browser
 * cross-origin request, and the socket is loopback-only.
 */

const LOCAL_NAMES = new Set(["localhost", "127.0.0.1", "[::1]"]);

/** Split a Host header (or URL host) into a lowercase hostname without the port; IPv6 keeps its brackets. */
export function hostnameOf(hostHeader) {
  if (typeof hostHeader !== "string" || !hostHeader) return "";
  const h = hostHeader.trim().toLowerCase();
  if (h.startsWith("[")) {
    const end = h.indexOf("]");
    return end === -1 ? "" : h.slice(0, end + 1);
  }
  const colon = h.lastIndexOf(":");
  return colon === -1 ? h : h.slice(0, colon);
}

export function isLocalHostname(name) {
  return LOCAL_NAMES.has(name) || (name.endsWith(".localhost") && name.length > ".localhost".length);
}

/** Is `origin` (e.g. "http://localhost:3000") an origin of this machine? */
export function isLocalOrigin(origin) {
  try {
    const u = new URL(origin);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    return isLocalHostname(hostnameOf(u.host));
  } catch {
    return false;
  }
}

/** Normalize an allow-list entry or Origin header to "scheme://host[:port]" (lowercase, no path). */
export function normalizeOrigin(value) {
  try {
    const u = new URL(String(value).trim());
    return `${u.protocol}//${u.host}`.toLowerCase();
  } catch {
    return "";
  }
}

/** Extra origins from an option and/or the SHAVIN_BRIDGE_ALLOWED_ORIGINS env (comma separated). */
export function resolveAllowedOrigins(option, env = process.env) {
  const fromEnv = String(env.SHAVIN_BRIDGE_ALLOWED_ORIGINS || "").split(",");
  const list = [...(Array.isArray(option) ? option : []), ...fromEnv].map(normalizeOrigin).filter(Boolean);
  return new Set(list);
}

/**
 * Decide what to do with a request.
 * @param {{ headers: Record<string, string | string[] | undefined> }} req
 * @param {Set<string>} [allowedOrigins] extra origins (already normalized)
 * @returns {{ ok: true, allowOrigin: string | null } | { ok: false, reason: string }}
 */
export function checkRequest(req, allowedOrigins = new Set()) {
  const h = req.headers || {};
  const host = typeof h.host === "string" ? h.host : "";
  if (!isLocalHostname(hostnameOf(host))) return { ok: false, reason: "forbidden host" };

  const origin = typeof h.origin === "string" ? h.origin : undefined;
  if (origin === undefined) {
    if (h["sec-fetch-site"] === "cross-site") return { ok: false, reason: "forbidden cross-site request" };
    return { ok: true, allowOrigin: null };
  }
  const norm = normalizeOrigin(origin);
  if (norm && (isLocalOrigin(origin) || allowedOrigins.has(norm))) return { ok: true, allowOrigin: norm };
  return { ok: false, reason: "forbidden origin" };
}
