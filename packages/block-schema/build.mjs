#!/usr/bin/env node

/**
 * @shavin/block-schema — Authored Block Schemas & AST Serialization Build Pipeline
 * Compiles Zod validation schemas, AST serialization contracts, and catalog types
 * with Shavin TrueColor terminal styling, animated loaders, and structured cards.
 */

import path from "node:path";
import { fileURLToPath } from "node:url";
import { c, g, fmt, printBanner, printCard, printStage, formatDuration, runTask } from "../../scripts/lib/term-ui.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PKG_DIR = __dirname;

const VERBOSE = process.argv.includes("--verbose");

async function main() {
  process.stdout.write("\n");
  printBanner("@shavin/block-schema", "Block Catalog & Validation Schemas Build Pipeline");

  const startTime = Date.now();

  printStage(1, "Schema Compilation", "Bundle Zod schemas, AST serialization contracts & types via tsup");

  await runTask({
    prefix: "[1/1]",
    name: "Compile @shavin/block-schema",
    desc: "Bundle Zod schemas & TypeScript contracts",
    cmd: "npx tsup",
    cwd: PKG_DIR,
    verbose: VERBOSE,
  });

  const totalTime = Date.now() - startTime;

  printCard({
    title: `${c.brand}${g.brand} @shavin/block-schema Build Complete${c.reset}`,
    items: [
      { label: "Target:", value: `${c.bold}${c.fg}Authored block contracts & AST serialization${c.reset}` },
      { label: "Bundle Output:", value: `${c.fg}dist/index.js (${c.fgSubtle}ESM + DTS${c.reset})` },
      { label: "Total Duration:", value: `${c.bold}${c.fg}${formatDuration(totalTime)}${c.reset}` },
      { label: "Pipeline Status:", value: `${fmt.pass("SUCCESS")} ${fmt.badge("READY", c.success)}` },
    ],
    footer: `${c.fgSubtle}Block schemas and serialization contracts compiled cleanly.${c.reset}`,
  });
}

main().catch((err) => {
  console.error(`\n  ${c.error}${g.stepFail} Build failed:${c.reset} ${err.message}`);
  process.exit(1);
});
