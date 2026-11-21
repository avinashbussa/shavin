#!/usr/bin/env node
/**
 * release-notes: one parser for packages/<pkg>/CHANGELOG.md, three consumers.
 *
 *   node scripts/release-notes.mjs --package @shavin/ui --version 0.1.1   # print that version's notes (GitHub Release body)
 *   node scripts/release-notes.mjs --json                                  # every package's entries as JSON on stdout
 *   node scripts/release-notes.mjs --json out.json                         # ... to a file
 *   node scripts/release-notes.mjs --json out.json --check                 # fail if out.json is stale (npm run releases:check)
 *
 * Reads two shapes under "## x.y.z":
 *   - Changesets output:   "### Major Changes" / "### Minor Changes" / "### Patch Changes" with "- " bullets
 *   - hand-written entries (the 0.1.0 ones): any other "### Heading" blocks, kept as `other`
 * The heading may carry a date or a title: "## 0.1.0 — first npm release", "## 0.1.1 — 2026-12-01".
 * (Changesets itself writes no date; a missing date is null, never invented.)
 *
 * Zero dependencies. Used by scripts/roadmap.mjs, the website changelog and the Release workflow (the mirror ships it).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
/**
 * Published packages: folder under packages/ (the order the Release workflow publishes in). `fx` comes after `ui` (its peer).
 * @shavin/fx is published separately and its source is not in the public repo, so its folder is absent in the public repo:
 * every consumer skips a folder that does not exist.
 */
export const PACKAGE_DIRS = ["block-schema", "ui", "fx", "skills", "cli", "mcp-server"];

const VERSION_HEADING = /^##\s+v?(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)\s*(?:[—–-]+\s*(.*?))?\s*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const LEVELS = { "major changes": "major", "minor changes": "minor", "patch changes": "patch" };

/** Split "- item" bullets (continuation lines indented) out of a block of markdown. Changesets' "abc1234: " commit prefix is dropped. */
function bullets(lines) {
  const items = [];
  for (const line of lines) {
    if (/^[-*]\s+/.test(line)) items.push([line.replace(/^[-*]\s+/, "")]);
    else if (items.length && (/^\s+\S/.test(line))) items[items.length - 1].push(line.trim());
    else if (items.length && line.trim() === "") items[items.length - 1].push("");
  }
  return items.map((i) => i.join("\n").trim().replace(/^[0-9a-f]{7,40}: /, "")).filter(Boolean);
}

/**
 * @param {string} text CHANGELOG.md contents
 * @param {string} name package name, e.g. "@shavin/ui"
 * @returns {{ package: string, version: string, date: string|null, title: string|null,
 *   sections: { major: string[], minor: string[], patch: string[] }, other: { heading: string, markdown: string }[], notes: string }[]}
 *   newest first, as written in the file
 */
export function parseChangelog(text, name) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const starts = [];
  lines.forEach((l, i) => { if (VERSION_HEADING.test(l)) starts.push(i); });
  return starts.map((s, k) => {
    const m = lines[s].match(VERSION_HEADING);
    const rest = (m[2] ?? "").trim();
    const body = lines.slice(s + 1, k + 1 < starts.length ? starts[k + 1] : lines.length);
    const entry = {
      package: name, version: m[1],
      date: DATE.test(rest) ? rest : null,
      title: rest && !DATE.test(rest) ? rest : null,
      sections: { major: [], minor: [], patch: [] }, other: [], notes: body.join("\n").trim(),
    };
    // Group the body by "### Heading".
    const blocks = [];
    let cur = { heading: null, lines: [] };
    for (const l of body) {
      const h = l.match(/^###\s+(.+?)\s*$/);
      if (h) { blocks.push(cur); cur = { heading: h[1], lines: [] }; } else cur.lines.push(l);
    }
    blocks.push(cur);
    for (const b of blocks) {
      const level = b.heading ? LEVELS[b.heading.toLowerCase()] : undefined;
      if (level) entry.sections[level].push(...bullets(b.lines));
      else {
        const markdown = b.lines.join("\n").trim();
        if (markdown) entry.other.push({ heading: b.heading ?? "", markdown });
      }
    }
    return entry;
  });
}

/** Every published package's entries: { packages: [{ name, dir, latest }], releases: [...] }. Deterministic (no timestamps). */
export function collectReleases(root = ROOT) {
  const packages = [];
  const releases = [];
  for (const dir of PACKAGE_DIRS) {
    const pkgJson = join(root, "packages", dir, "package.json");
    if (!existsSync(pkgJson)) continue;
    const { name, version } = JSON.parse(readFileSync(pkgJson, "utf8"));
    const file = join(root, "packages", dir, "CHANGELOG.md");
    const entries = existsSync(file) ? parseChangelog(readFileSync(file, "utf8"), name) : [];
    packages.push({ name, dir: `packages/${dir}`, version, latest: entries[0]?.version ?? null });
    releases.push(...entries);
  }
  // Newest date first; undated entries keep package order, after dated ones.
  const order = new Map(releases.map((r, i) => [r, i]));
  releases.sort((a, b) => (b.date ?? "").localeCompare(a.date ?? "") || order.get(a) - order.get(b));
  return { packages, releases };
}

/** "ui", "mcp", "mcp-server" or "@shavin/ui" → the package name, or null. */
export function resolvePackage(arg, root = ROOT) {
  const names = collectReleases(root).packages.map((p) => p.name);
  const a = String(arg).replace(/^@shavin\//, "");
  return names.find((n) => n === arg || n === `@shavin/${a}` || (a === "mcp-server" && n === "@shavin/mcp")) ?? null;
}

/** The notes to print for one release (the section body; the "## x.y.z" heading is the release title already). */
export function notesFor(name, version, root = ROOT) {
  const { releases } = collectReleases(root);
  return releases.find((r) => r.package === name && r.version === version) ?? null;
}

function main(argv) {
  const opt = (n) => { const i = argv.indexOf(n); return i === -1 ? undefined : (argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : ""); };
  const root = process.env.RELEASE_NOTES_ROOT ? resolve(process.env.RELEASE_NOTES_ROOT) : ROOT;
  if (argv.includes("--json")) {
    const file = opt("--json");
    const json = JSON.stringify(collectReleases(root), null, 2) + "\n";
    if (!file) { process.stdout.write(json); return 0; }
    if (argv.includes("--check")) {
      const have = existsSync(file) ? readFileSync(file, "utf8") : null;
      if (have !== json) { console.error(`[FAIL] ${file} is out of date with the CHANGELOGs. Run: npm run releases:gen`); return 1; }
      console.log(`[OK] ${file} is in sync with packages/*/CHANGELOG.md`);
      return 0;
    }
    writeFileSync(file, json);
    console.log(`[OK] ${JSON.parse(json).releases.length} release entries written to ${file}`);
    return 0;
  }
  const pkgArg = opt("--package"), version = opt("--version");
  if (!pkgArg || !version) {
    console.error("usage: node scripts/release-notes.mjs --package <@shavin/ui|ui|cli|mcp|skills|block-schema> --version <x.y.z>\n       node scripts/release-notes.mjs --json [file] [--check]");
    return 2;
  }
  const name = resolvePackage(pkgArg, root);
  if (!name) { console.error(`Unknown package "${pkgArg}". Use one of: ${collectReleases(root).packages.map((p) => p.name).join(", ")}.`); return 2; }
  const entry = notesFor(name, version, root);
  if (!entry) {
    console.error(`No "## ${version}" entry for ${name} in its CHANGELOG.md.\nRun "npm run version-packages" (it writes the entry from the pending changesets), commit, then retry.`);
    return 1;
  }
  process.stdout.write(entry.notes + "\n");
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
