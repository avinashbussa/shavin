#!/usr/bin/env node
/**
 * Fails when agent-facing or contributor-facing text in the open packages names a
 * private package, app or internal folder. Scans every .md file in the open packages
 * (skills, commands, READMEs, templates, MCP assets), the contributor docs, plus the public and consumer
 * renderings of AGENTS.md / CLAUDE.md.
 *
 * Usage: node scripts/check-private-refs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderAgents, renderClaude } from "./gen-agents.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OPEN = ["ui", "cli", "mcp-server", "skills", "block-schema"];
// Never shipped or mirrored, so they may talk about internals.
const SKIP = new Set(["packages/skills/MAINTAINERS.md"]);
const SKIP_DIRS = new Set(["node_modules", "dist", "scripts"]);
const PRIVATE = [
  /blocks-pro/i, /block-renderer/i, /@shavin\/cloud\b/i, /packages\/(cloud|fx)\b/i,
  /apps\/(studio|docs|website|community|kits|figma)\b/i, /\bsrc\/engine\b/i,
  /\bsupabase\b/i, /\bdocs\/agents\b/i, /^kits\//m, /\bkit:pack\b/i,
];

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
  const p = path.join(dir, e.name);
  if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(p);
  return e.name.endsWith(".md") ? [p] : [];
});

const texts = [];
for (const pkg of OPEN) {
  const dir = path.join(ROOT, "packages", pkg);
  if (!fs.existsSync(dir)) continue;
  for (const f of walk(dir)) {
    const rel = path.relative(ROOT, f);
    if (!SKIP.has(rel)) texts.push([rel, fs.readFileSync(f, "utf8")]);
  }
}
// Contributor docs: docs/public-repo-copy here, docs/ in the public repo (no docs/agents there).
const contribDocs = fs.existsSync(path.join(ROOT, "docs/public-repo-copy"))
  ? "docs/public-repo-copy"
  : fs.existsSync(path.join(ROOT, "docs")) && !fs.existsSync(path.join(ROOT, "docs/agents")) ? "docs" : null;
if (contribDocs) for (const f of walk(path.join(ROOT, contribDocs))) texts.push([path.relative(ROOT, f), fs.readFileSync(f, "utf8")]);
texts.push(["AGENTS.md (public rendering)", renderAgents("public")]);
texts.push(["AGENTS.md (consumer rendering)", renderAgents("consumer")]);
texts.push(["CLAUDE.md (public rendering)", renderClaude("public")]);

const hits = [];
for (const [name, text] of texts) {
  text.split("\n").forEach((line, i) => {
    const re = PRIVATE.find((r) => r.test(line));
    if (re) hits.push(`${name}:${i + 1}: ${re} → ${line.trim().slice(0, 140)}`);
  });
}
if (hits.length) {
  console.error(`✗ private names in open-package text (${hits.length}):\n  ${hits.join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ no private package or app names in ${texts.length} open-package texts`);
