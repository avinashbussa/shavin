#!/usr/bin/env node
/**
 * docs:check — keeps the command docs honest.
 *   1. Every root npm script is listed in docs/guides/npm-commands.md (when that file exists).
 *   2. Every `npm run <script>` in the guides, READMEs and CONTRIBUTING exists.
 *      Public-facing files (CONTRIBUTING.md, docs/public-repo-copy/) are checked
 *      against the public repo's scripts as written by scripts/mirror-public.mjs.
 * Workspace calls (`npm run x -w pkg`) are skipped.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), "utf8");
const exists = (rel) => fs.existsSync(path.join(ROOT, rel));
const rootScripts = new Set(Object.keys(JSON.parse(read("package.json")).scripts ?? {}));

// The public repo's script names, if this is the monorepo (else the root ones are the public ones).
let publicScripts = rootScripts;
if (exists("scripts/mirror-public.mjs")) {
  const src = read("scripts/mirror-public.mjs");
  const block = src.slice(src.indexOf("  scripts: {"), src.indexOf("\n  },", src.indexOf("  scripts: {")));
  publicScripts = new Set([...block.matchAll(/^\s+"?([\w:.-]+)"?:\s/gm)].map((m) => m[1]).filter((k) => k !== "scripts"));
}

const problems = [];
const ref = "docs/guides/npm-commands.md";
if (exists(ref)) {
  const text = read(ref);
  for (const s of rootScripts) if (!text.includes(`\`${s}\``)) problems.push(`${ref} does not list the root script "${s}"`);
}

const files = [];
const add = (rel) => exists(rel) && files.push(rel);
["README.md", "CONTRIBUTING.md", "docs/README.md"].forEach(add);
// In the public repo the contributor docs live in docs/ itself (no mirror script there).
const IN_PUBLIC_REPO = !exists("scripts/mirror-public.mjs");
for (const dir of ["docs/guides", "docs/public-repo-copy", ...(IN_PUBLIC_REPO ? ["docs"] : [])]) {
  if (exists(dir)) for (const f of fs.readdirSync(path.join(ROOT, dir))) if (f.endsWith(".md")) files.push(`${dir}/${f}`);
}
for (const rel of files) {
  const isPublic = rel === "CONTRIBUTING.md" || rel.startsWith("docs/public-repo-copy/");
  const known = isPublic ? publicScripts : rootScripts;
  read(rel).split("\n").forEach((line, i) => {
    for (const m of line.matchAll(/npm run ([\w:.-]*\w)((?::?<)?)((?:\s+--?[\w-]+)*)/g)) {
      if (m[2] || /\s(-w|--workspace)\b/.test(m[3] || "") || /-w @|--workspace[= ]/.test(line.slice(m.index, m.index + 80))) continue;
      if (!known.has(m[1])) problems.push(`${rel}:${i + 1}: \`npm run ${m[1]}\` does not exist${isPublic ? " in the public repo" : ""}`);
    }
  });
}
if (problems.length) {
  console.error(`✗ command docs out of date (${problems.length}):\n  ${problems.join("\n  ")}`);
  process.exit(1);
}
console.log(`✓ command docs match package.json (${files.length} files checked)`);
