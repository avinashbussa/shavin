import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

export async function bridgeCommand(options = {}) {
  const port = Number(options.port) || 7428;
  const targetDir = options.targetDir || process.cwd();
  console.log("\x1b[36m%s\x1b[0m", "\n🌉 Starting Shavin Agent-Browser Bridge...\n");

  try {
    let bridgeModule;

    // 1. Target project's node_modules (@shavin/mcp)
    const candidatePaths = [
      resolve(targetDir, "node_modules", "@shavin", "mcp", "src", "bridge", "server.mjs"),
      resolve(targetDir, "node_modules", "@shavin", "mcp", "src", "index.mjs"),
    ];

    for (const p of candidatePaths) {
      if (existsSync(p)) {
        try {
          const mod = await import(pathToFileURL(p).href);
          if (mod && (mod.globalBridge || mod.ShavinBridgeServer)) {
            bridgeModule = mod;
            break;
          }
        } catch {}
      }
    }

    // 2. Global / hoisted bare import
    if (!bridgeModule) {
      try {
        bridgeModule = await import("@shavin/mcp");
      } catch {
        const localPath = resolve(dirname(fileURLToPath(import.meta.url)), "../../../mcp-server/src/bridge/server.mjs");
        if (existsSync(localPath)) {
          bridgeModule = await import(pathToFileURL(localPath).href);
        }
      }
    }

    if (bridgeModule && (bridgeModule.globalBridge || bridgeModule.ShavinBridgeServer)) {
      const bridge = bridgeModule.globalBridge || new bridgeModule.ShavinBridgeServer(port);
      await bridge.start();
      console.log("\x1b[32m%s\x1b[0m", `\u2713 Shavin Bridge Daemon listening on http://127.0.0.1:${port}`);
      console.log("\x1b[36m%s\x1b[0m", `  Monitor Dashboard: http://localhost:${port}/`);
      console.log("\x1b[36m%s\x1b[0m", `  SSE Event Stream:  http://localhost:${port}/api/events`);
      console.log("\x1b[36m%s\x1b[0m", `  Live Audit API:    http://localhost:${port}/api/audit`);
      console.log("\x1b[36m%s\x1b[0m", `  Source Audit API:  http://localhost:${port}/api/source-audit`);
      console.log("\x1b[90m%s\x1b[0m", "\nPress Ctrl+C to stop.\n");
    } else {
      console.error("\x1b[31m%s\x1b[0m", "\u2717 @shavin/mcp not found. Install it with: npm install -D @shavin/mcp");
    }
  } catch (err) {
    console.error("\x1b[31m%s\x1b[0m", `\u2717 Failed to start bridge: ${err.message}`);
  }
}
