/**
 * Canonical configuration for the Agent-Browser bridge.
 *
 * The bridge server (@shavin/mcp) and the CLI resolve the port from here.
 * The browser client ships in @shavin/ui, which is a standalone package with no
 * dependency on @shavin/mcp, so it keeps its own copy of the default in
 * `packages/ui/src/lib/bridge.ts`. The two MUST stay in sync; `npm run verify`
 * checks that they match.
 */
export const BRIDGE_PORT = 7036;
export const BRIDGE_HOST = "127.0.0.1";
