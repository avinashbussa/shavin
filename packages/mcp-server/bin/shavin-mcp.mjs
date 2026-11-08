#!/usr/bin/env node
import { startMcpServer, startRemoteServer, globalBridge, BRIDGE_PORT } from "../src/index.mjs";

// A stray error in a timer or an unhandled rejection (e.g. a Realtime hiccup)
// must never kill the MCP process: that silently drops the live Studio session.
// Log to stderr (stdout is the MCP protocol channel) and keep serving.
process.on("uncaughtException", (err) => {
  console.error("[shavin-mcp] uncaughtException (kept alive):", err?.stack || err);
});
process.on("unhandledRejection", (err) => {
  console.error("[shavin-mcp] unhandledRejection (kept alive):", err?.stack || err);
});

const args = process.argv;
const isBridgeMode = args.includes("--bridge") || args.includes("bridge");
const isRemoteMode = args.includes("--remote") || args.includes("--http");
const isHybridMode = args.includes("--hybrid"); // stdio + remote

if (isBridgeMode) {
  const portIdx = args.indexOf("--port");
  const port = portIdx !== -1 ? Number(args[portIdx + 1]) || BRIDGE_PORT : BRIDGE_PORT;
  globalBridge.port = port;

  globalBridge.start().then(() => {
    console.log(`[shavin-bridge] Standalone Agent-Browser Bridge listening on http://127.0.0.1:${port}`);
    console.log(`[shavin-bridge] Live Inspection Dashboard: http://localhost:${port}/`);
    console.log(`[shavin-bridge] Press Ctrl+C to stop.`);
  }).catch((err) => {
    console.error("[shavin-bridge] Fatal error starting bridge:", err);
    process.exit(1);
  });

} else if (isRemoteMode) {
  // Remote MCP mode — Streamable HTTP transport for IDE-based AI agents
  // Auth: Supabase JWT Bearer token
  // Endpoint: POST /mcp
  const portIdx = args.indexOf("--port");
  const port = portIdx !== -1 ? Number(args[portIdx + 1]) || 3001 : 3001;

  startRemoteServer({ port }).catch((err) => {
    console.error("[shavin-mcp] Fatal error starting remote server:", err);
    process.exit(1);
  });

} else if (isHybridMode) {
  // Hybrid mode — stdio MCP + remote HTTP simultaneously
  // Useful for local dev where you want both Cursor (stdio) and remote testing
  const portIdx = args.indexOf("--port");
  const port = portIdx !== -1 ? Number(args[portIdx + 1]) || 3001 : 3001;

  // Start stdio server
  startMcpServer().catch((err) => {
    console.error("[shavin-mcp] Fatal stdio server error:", err);
    process.exit(1);
  });

  // Start remote server alongside
  startRemoteServer({ port }).catch((err) => {
    console.error("[shavin-mcp] Fatal remote server error:", err);
    // Don't exit — stdio server may still work
  });

} else {
  // Default: stdio MCP server (existing behavior)
  startMcpServer().catch((err) => {
    console.error("[shavin-mcp] Fatal server startup error:", err);
    process.exit(1);
  });
}
