import { startDevBridge } from "./start-bridge.mjs";

/**
 * Wrap your `next.config` so the Agent-Browser bridge starts automatically with
 * `next dev` — no separate `npx @shavin/cli bridge` step. It is inert in
 * `next build` / `next start`, and can be turned off with `SHAVIN_BRIDGE=0`.
 *
 *   // next.config.mjs
 *   import { withShavinBridge } from "@shavin/mcp/next";
 *   export default withShavinBridge({ /* your next config *\/ });
 *
 * @param {object} [nextConfig] your existing Next config (returned unchanged).
 * @param {{ port?: number, enabled?: boolean }} [opts]
 */
export function withShavinBridge(nextConfig = {}, opts = {}) {
  // next.config is evaluated for dev, build and start; startDevBridge only acts in dev.
  startDevBridge(opts);
  return nextConfig;
}

export default withShavinBridge;
