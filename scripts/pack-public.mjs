#!/usr/bin/env node
/**
 * pack-public — build and pack the open packages into prod-dist/packages/.
 *
 * The public counterpart to pack:all (scripts/pack-all.mjs stays private — it
 * builds @shavin/fx and @shavin/block-renderer, which never ship). Produces
 * distributable tarballs of the five open packages a contributor can install
 * into a real app:
 *
 *   npm run pack            # → prod-dist/packages/shavin-*-<version>.tgz
 *
 * `npm pack` runs each package's own prepack (so @shavin/mcp bundles its assets);
 * ui and block-schema need dist/, so a full build runs first.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { c, g, fmt, printBanner, printCard, printStage, formatDuration } from "./lib/term-ui.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "prod-dist", "packages");
// Dependency order (block-schema and ui first — the others import them).
const PKGS = [
  ["block-schema", "@shavin/block-schema"],
  ["ui", "@shavin/ui"],
  ["cli", "@shavin/cli"],
  ["mcp-server", "@shavin/mcp"],
  ["skills", "@shavin/skills"],
];
const sh = (cmd, args, cwd) =>
  execFileSync(cmd, args, { cwd: cwd || ROOT, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" } });

const start = Date.now();
process.stdout.write("\n");
printBanner("@shavin/ui", "Open Package Tarballs");

printStage(1, "Build", "Compile ui, block-schema and mcp before packing");
sh("npm", ["run", "build"]);

printStage(2, "Pack", `npm pack the ${PKGS.length} open packages into prod-dist/packages/`);
fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith(".tgz")) fs.rmSync(path.join(OUT, f));

const items = [];
for (const [dir, name] of PKGS) {
  const tgz = sh("npm", ["pack", "--silent", "--pack-destination", OUT], path.join(ROOT, "packages", dir)).trim().split("\n").pop();
  const abs = path.join(OUT, tgz);
  const kb = (fs.statSync(abs).size / 1024).toFixed(0);
  console.log(`  ${c.success}${g.stepDone}${c.reset} ${c.fg}${name}${c.reset} ${c.fgMuted}[${tgz}, ${kb} KB]${c.reset}`);
  items.push({ label: `${name}:`, value: `${fmt.pass(tgz)} ${c.fgMuted}(${kb} KB)${c.reset}` });
}

printCard({
  title: `${c.brand}${g.brand} Pack Complete${c.reset}`,
  items: [...items, { label: "Output:", value: `${c.fgMuted}prod-dist/packages/${c.reset}` }, { label: "Duration:", value: formatDuration(Date.now() - start) }],
  footer: fmt.pass("Tarballs ready — install one with `npm install <path>/shavin-ui-<version>.tgz`."),
  border: c.brandMuted,
});
