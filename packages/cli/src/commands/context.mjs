import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function loadMcp(targetDir) {
  // 1. Target project's node_modules (@shavin/mcp)
  const candidatePaths = [
    resolve(targetDir, "node_modules", "@shavin", "mcp", "src", "index.mjs"),
    resolve(targetDir, "node_modules", "@shavin", "mcp", "index.mjs"),
  ];

  for (const p of candidatePaths) {
    if (existsSync(p)) {
      try {
        const mod = await import(pathToFileURL(p).href);
        if (mod && mod.extractProjectContext) return mod;
      } catch {}
    }
  }

  // 2. Global / hoisted bare import
  try {
    const mod = await import("@shavin/mcp");
    if (mod && mod.extractProjectContext) return mod;
  } catch {}

  // 3. Monorepo dev sibling fallback
  try {
    const devPath = resolve(__dirname, "..", "..", "mcp-server", "src", "index.mjs");
    if (existsSync(devPath)) {
      const mod = await import(pathToFileURL(devPath).href);
      if (mod && mod.extractProjectContext) return mod;
    }
  } catch {}

  return null;
}

export async function contextCommand(args = {}) {
  const targetDir = args.targetDir || process.cwd();
  const mcp = await loadMcp(targetDir);

  if (!mcp || !mcp.extractProjectContext) {
    console.error("\x1b[31m%s\x1b[0m", "\n[shavin-cli] `shavin context` requires @shavin/mcp.");
    console.error("\x1b[33m%s\x1b[0m", "  Install it with: npm install -D @shavin/mcp");
    console.error("\x1b[33m%s\x1b[0m", "  Then re-run: npx @shavin/cli context\n");
    process.exitCode = 1;
    return;
  }

  const isJson = Boolean(args.json);
  const shouldSave = args.save !== false;

  const context = mcp.extractProjectContext({ targetDir, save: shouldSave });

  if (isJson) {
    console.log(JSON.stringify(context, null, 2));
  } else {
    console.log(context.promptMarkdown);
  }
}
