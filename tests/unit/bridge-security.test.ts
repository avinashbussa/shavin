import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
// @ts-expect-error plain .mjs modules without types
import { ShavinBridgeServer } from "../../packages/mcp-server/src/bridge/server.mjs";
// @ts-expect-error plain .mjs modules without types
import { checkRequest, hostnameOf, isLocalHostname, isLocalOrigin, resolveAllowedOrigins } from "../../packages/mcp-server/src/bridge/security.mjs";

type Res = { status: number; headers: http.IncomingHttpHeaders; body: string };

/** node:http (not fetch) so tests can set Host and Origin freely. */
const call = (port: number, opts: { method?: string; path: string; headers?: Record<string, string>; body?: string }) =>
  new Promise<Res>((resolve, reject) => {
    const req = http.request({ host: "127.0.0.1", port, method: opts.method ?? "GET", path: opts.path, headers: opts.headers }, (res) => {
      let body = "";
      res.on("data", (d) => (body += d));
      res.on("end", () => resolve({ status: res.statusCode ?? 0, headers: res.headers, body }));
    });
    req.on("error", reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });

const EVIL = "https://evil.example";
// An invalid slug: a request that reaches the route is answered 400 and never writes a file, so no test can stage anything.
const BAD_WRITE = JSON.stringify({ slug: "NOT VALID", code: "x" });

describe("bridge request policy (pure)", () => {
  it("hostnameOf strips the port and keeps IPv6 brackets", () => {
    expect(hostnameOf("localhost:7036")).toBe("localhost");
    expect(hostnameOf("127.0.0.1")).toBe("127.0.0.1");
    expect(hostnameOf("[::1]:7036")).toBe("[::1]");
    expect(hostnameOf("EVIL.example:80")).toBe("evil.example");
    expect(hostnameOf("")).toBe("");
  });
  it("only this machine counts as local", () => {
    for (const ok of ["localhost", "127.0.0.1", "[::1]", "app.localhost"]) expect(isLocalHostname(ok), ok).toBe(true);
    for (const bad of ["evil.example", "127.0.0.1.evil.example", "localhost.evil.example", "notlocalhost", "0.0.0.0", ".localhost", "192.168.1.5"]) expect(isLocalHostname(bad), bad).toBe(false);
    expect(isLocalOrigin("http://localhost:3000")).toBe(true);
    expect(isLocalOrigin("https://127.0.0.1:8443")).toBe(true);
    expect(isLocalOrigin("http://[::1]:3100")).toBe(true);
    expect(isLocalOrigin("null")).toBe(false);
    expect(isLocalOrigin("file:///tmp/x.html")).toBe(false);
    expect(isLocalOrigin("http://localhost.evil.example")).toBe(false);
  });
  it("checkRequest: host first, then origin, then sec-fetch-site; allow list is honoured", () => {
    const allow = resolveAllowedOrigins(["https://studio.example/"], { SHAVIN_BRIDGE_ALLOWED_ORIGINS: "https://other.example:8443, bad entry" });
    expect([...allow].sort()).toEqual(["https://other.example:8443", "https://studio.example"]);
    expect(checkRequest({ headers: { host: "evil.example" } }, allow)).toMatchObject({ ok: false });
    expect(checkRequest({ headers: {} }, allow)).toMatchObject({ ok: false });
    expect(checkRequest({ headers: { host: "127.0.0.1:7036", origin: "https://studio.example" } }, allow)).toEqual({ ok: true, allowOrigin: "https://studio.example" });
    expect(checkRequest({ headers: { host: "127.0.0.1:7036", origin: EVIL } }, allow)).toMatchObject({ ok: false });
    expect(checkRequest({ headers: { host: "127.0.0.1:7036", origin: "null" } }, allow)).toMatchObject({ ok: false });
    expect(checkRequest({ headers: { host: "127.0.0.1:7036", "sec-fetch-site": "cross-site" } }, allow)).toMatchObject({ ok: false });
    expect(checkRequest({ headers: { host: "127.0.0.1:7036" } }, allow)).toEqual({ ok: true, allowOrigin: null });
  });
});

describe("bridge server: cross-origin and DNS-rebinding requests are refused", () => {
  const bridge = new ShavinBridgeServer(0, { allowedOrigins: ["https://studio.example"] });
  let port = 0;
  beforeAll(async () => { await bridge.start(); port = (bridge.server.address() as AddressInfo).port; });
  afterAll(async () => { await new Promise((r) => bridge.server.close(r)); });
  const local = () => `127.0.0.1:${port}`;

  it("GET /api/audit from https://evil.example is refused (403) and carries no CORS grant", async () => {
    const r = await call(port, { path: "/api/audit", headers: { host: local(), origin: EVIL } });
    expect(r.status).toBe(403);
    expect(r.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("POST /api/write-block from https://evil.example is refused (403) before the route runs", async () => {
    const r = await call(port, { method: "POST", path: "/api/write-block", headers: { host: local(), origin: EVIL, "content-type": "application/json" }, body: BAD_WRITE });
    expect(r.status).toBe(403);
    expect(r.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("every state-changing route refuses a foreign origin", async () => {
    for (const path of ["/api/audit", "/api/disconnect", "/api/focus-tab", "/api/ping", "/api/rescan"]) {
      const r = await call(port, { method: "POST", path, headers: { host: local(), origin: EVIL, "content-type": "application/json" }, body: "{}" });
      expect(r.status, path).toBe(403);
    }
  });

  it("a local origin works on any port and gets exactly its own origin echoed, with Vary: Origin", async () => {
    for (const origin of ["http://localhost:3000", "http://127.0.0.1:5173", "http://[::1]:3100", "http://app.localhost:3300"]) {
      const r = await call(port, { path: "/api/audit", headers: { host: local(), origin } });
      expect(r.status, origin).toBe(200);
      expect(r.headers["access-control-allow-origin"], origin).toBe(origin);
      expect(r.headers["vary"]).toMatch(/Origin/i);
    }
    const w = await call(port, { method: "POST", path: "/api/write-block", headers: { host: local(), origin: "http://localhost:3200", "content-type": "application/json" }, body: BAD_WRITE });
    expect(w.status).toBe(400); // reached the route, which rejected the invalid slug
  });

  it("no Origin header (curl, Node, the dashboard itself) keeps working and gets no CORS headers", async () => {
    const r = await call(port, { path: "/api/audit", headers: { host: local() } });
    expect(r.status).toBe(200);
    expect(r.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("Origin: null and a cross-site fetch without an Origin are refused", async () => {
    expect((await call(port, { path: "/api/audit", headers: { host: local(), origin: "null" } })).status).toBe(403);
    expect((await call(port, { path: "/api/audit", headers: { host: local(), "sec-fetch-site": "cross-site" } })).status).toBe(403);
  });

  it("a Host header that is not this machine is refused (DNS rebinding), even with no Origin", async () => {
    for (const host of ["evil.example", "127.0.0.1.evil.example", `evil.example:${port}`, "localhost.evil.example"]) {
      const r = await call(port, { path: "/api/audit", headers: { host } });
      expect(r.status, host).toBe(403);
    }
    // a rebinding page is same-origin with itself, so it sends its own Origin too
    const r = await call(port, { path: "/api/audit", headers: { host: "evil.example", origin: "http://evil.example" } });
    expect(r.status).toBe(403);
  });

  it("OPTIONS preflight: 204 with the same policy for a local origin, 403 for a bad origin or host", async () => {
    const pre = (headers: Record<string, string>) => call(port, { method: "OPTIONS", path: "/api/write-block", headers: { "access-control-request-method": "POST", ...headers } });
    const ok = await pre({ host: local(), origin: "http://localhost:3200" });
    expect(ok.status).toBe(204);
    expect(ok.headers["access-control-allow-origin"]).toBe("http://localhost:3200");
    expect(ok.headers["access-control-allow-methods"]).toMatch(/POST/);
    expect(ok.headers["access-control-allow-headers"]).toMatch(/Content-Type/i);
    const bad = await pre({ host: local(), origin: EVIL });
    expect(bad.status).toBe(403);
    expect(bad.headers["access-control-allow-origin"]).toBeUndefined();
    expect((await pre({ host: "evil.example", origin: "http://localhost:3200" })).status).toBe(403);
  });

  it("an explicitly allowed origin works, and Chrome's private-network preflight is answered only for allowed origins", async () => {
    const r = await call(port, { method: "OPTIONS", path: "/api/audit", headers: { host: local(), origin: "https://studio.example", "access-control-request-private-network": "true" } });
    expect(r.status).toBe(204);
    expect(r.headers["access-control-allow-origin"]).toBe("https://studio.example");
    expect(r.headers["access-control-allow-private-network"]).toBe("true");
    const evil = await call(port, { method: "OPTIONS", path: "/api/audit", headers: { host: local(), origin: EVIL, "access-control-request-private-network": "true" } });
    expect(evil.headers["access-control-allow-private-network"]).toBeUndefined();
  });
});
