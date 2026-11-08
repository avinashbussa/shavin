import { startDevBridge } from "./start-bridge.mjs";

/**
 * Vite plugin that starts the Agent-Browser bridge with the dev server — no
 * separate `npx @shavin/cli bridge` step. Dev-only (`apply: "serve"`), and can
 * be turned off with `SHAVIN_BRIDGE=0`.
 *
 *   // vite.config.ts
 *   import { shavinBridge } from "@shavin/mcp/vite";
 *   export default defineConfig({ plugins: [shavinBridge()] });
 *
 * @param {{ port?: number, enabled?: boolean }} [opts]
 */
export function shavinBridge(opts = {}) {
  return {
    name: "shavin-bridge",
    apply: "serve",
    configureServer() {
      startDevBridge(opts);
    },
  };
}

export default shavinBridge;
