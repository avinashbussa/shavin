/**
 * Connection config for the local Agent-Browser bridge (the dev daemon that
 * `<ShavinDevTools>` streams DOM snapshots to, and that `npx @shavin/cli bridge`
 * starts).
 *
 * `@shavin/ui` ships standalone — it does not depend on `@shavin/mcp` — so the
 * default port lives here as well as in the server's canonical constant
 * (`packages/mcp-server/src/bridge/constants.mjs`). The two MUST stay equal;
 * `npm run verify` checks it.
 *
 * A consumer who runs the bridge on a non-default port tells the browser by
 * setting `NEXT_PUBLIC_SHAVIN_BRIDGE_PORT` (Next.js) or `VITE_SHAVIN_BRIDGE_PORT`
 * (Vite), or by passing `bridgePort` to `<ThemeProvider>` / `<ShavinDevTools>`.
 */
export const DEFAULT_BRIDGE_PORT = 7036;
export const BRIDGE_HOST = "127.0.0.1";

/** Read a port override injected at build time. Guards so it never throws under any bundler. */
function envBridgePort(): number | undefined {
  try {
    const p = typeof process !== "undefined" ? process.env?.NEXT_PUBLIC_SHAVIN_BRIDGE_PORT : undefined;
    if (p) {
      const n = Number(p);
      if (Number.isFinite(n)) return n;
    }
  } catch {
    /* process not defined / inaccessible */
  }
  try {
    // import.meta.env is Vite-only; in other bundlers it is simply undefined.
    const meta = typeof import.meta !== "undefined" ? (import.meta as unknown as { env?: Record<string, string | undefined> }).env : undefined;
    const p = meta?.VITE_SHAVIN_BRIDGE_PORT;
    if (p) {
      const n = Number(p);
      if (Number.isFinite(n)) return n;
    }
  } catch {
    /* import.meta unavailable */
  }
  return undefined;
}

/** Resolve the bridge port: explicit argument → build-time env → default. */
export function resolveBridgePort(explicit?: number): number {
  if (typeof explicit === "number" && Number.isFinite(explicit)) return explicit;
  return envBridgePort() ?? DEFAULT_BRIDGE_PORT;
}

/** `http://127.0.0.1:<port>` — the origin the browser connects to. */
export function bridgeOrigin(port?: number): string {
  return `http://${BRIDGE_HOST}:${resolveBridgePort(port)}`;
}

/** Build a bridge API URL, e.g. `bridgeUrl("/api/audit")`. */
export function bridgeUrl(path: string, port?: number): string {
  return `${bridgeOrigin(port)}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Human-facing dashboard URL (uses `localhost` for readability). */
export function bridgeDashboardUrl(port?: number): string {
  return `http://localhost:${resolveBridgePort(port)}/`;
}
