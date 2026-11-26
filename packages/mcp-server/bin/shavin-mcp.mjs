#!/usr/bin/env node
// `shavin-mcp --hook`: the Claude Code PostToolUse edit hook (registered by `shavin init`). It is a mode of this
// bin, not a second bin: a package with two bins breaks `npx @shavin/mcp` ("could not determine executable").
if (process.argv.includes("--hook")) {
  const { readPayload, runHook } = await import("../src/hook.mjs");
  try {
    const { code, message } = runHook(await readPayload());
    if (message) process.stderr.write(`${message}\n`);
    process.exit(code);
  } catch (e) {
    // A broken hook must never block the agent's work.
    process.stderr.write(`[shavin-mcp --hook] skipped: ${e?.message || e}\n`);
    process.exit(0);
  }
}

// --help prints the usage and starts nothing (the server would otherwise sit waiting on stdin).
if (process.argv.includes("--help") || process.argv.includes("-h")) {
  process.stdout.write(`shavin-mcp: the Shavin MCP server for coding agents

Usage:
  npx @shavin/mcp                    stdio server (what an MCP client starts)
  npx @shavin/mcp --bridge [--port <port>]   the browser bridge and dashboard only
  npx @shavin/mcp --remote           streamable HTTP server
  npx @shavin/mcp --hybrid           stdio and HTTP together
  npx @shavin/mcp --help             show this help

SHAVIN_MCP_ALL_TOOLS=1 lists every tool; by default the Studio and live-audit tools appear once they can work.
`);
  process.exit(0);
}

const { startMcpServer, startRemoteServer, globalBridge, BRIDGE_PORT } = await import("../src/index.mjs");

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
