/**
 * Fails when public text names a private package, app or internal folder, or when package metadata that goes
 * public carries a personal email. "Public text" is every text file the public repo would contain: the five
 * open packages, the contributor docs, the allow-listed root scripts, tests and evals, the playground, and the
 * public and consumer renderings of AGENTS.md / CLAUDE.md. In the public repo itself every tracked file counts.
 *
 * The names come from scripts/lib/private-names.mjs (one list, shared with the mirror's audit). A file that must
 * name them is listed there in ALLOW, with a reason.
 *
 * Usage: node scripts/check-private-refs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { renderAgents, renderClaude } from "./gen-agents.mjs";
import { findPrivateNames, findDeniedPhrases, privatePatterns, isAllowed, isPhraseAllowed, authorProblems, personalEmailIn, OPEN_PACKAGE_DIRS } from "./lib/private-names.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
// Never shipped or mirrored, so they may talk about internals.
const SKIP = new Set(["packages/skills/MAINTAINERS.md"]);
const SKIP_DIRS = new Set(["node_modules", "dist", ".next", ".turbo", "out", ".git"]);
const SKIP_FILES = /(^|\/)(package-lock\.json|[^/]+\.(png|jpe?g|gif|webp|avif|ico|woff2?|ttf|otf|mp4|webm|mov|zip|gz|pdf|map|tsbuildinfo))$/i;
// Template the mirror renders into the public README.
const EXTRA_PUBLIC = ["scripts/mirror-public/README.md"];

// The public set definition exists only where the mirror runs. Loaded by a computed path so the mirror does not
// copy it (and the mirror tooling it belongs to) into the public repo.
const PS = fs.existsSync(path.join(ROOT, "scripts/mirror-public.mjs")) ? await import(/* @vite-ignore */ pathToFileURL(path.join(ROOT, "scripts", "lib", `${"public-set"}.mjs`)).href) : null;
const PUBLIC_DOCS = PS?.PUBLIC_DOCS ?? "docs/public-repo-copy";
const PACKAGE_EXCLUDES = PS?.PACKAGE_EXCLUDES ?? {};

const posix = (p) => p.split(path.sep).join("/");

function listFiles(root) {
  if (fs.existsSync(path.join(root, ".git"))) {
    try {
      return execFileSync("git", ["ls-files", "-co", "--exclude-standard", "-z"], { cwd: root, maxBuffer: 1 << 28 }).toString().split("\0").filter(Boolean)
        .filter((f) => fs.existsSync(path.join(root, f)));
    } catch { /* fall through to a plain walk */ }
  }
  const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return SKIP_DIRS.has(e.name) ? [] : walk(p);
    return [posix(path.relative(root, p))];
  });
  return walk(root);
}

/** Is `rel` part of the public set? In the private monorepo only the open files; in the public repo all of them. */
function inPublicSet(rel, mode) {
  if (mode === "public") return true;
  if (rel.startsWith(`${PUBLIC_DOCS}/`)) return true;
  if (rel.startsWith("docs/")) return false;
  if (EXTRA_PUBLIC.includes(rel)) return true;
  if (!PS) throw new Error("monorepo mode needs scripts/lib/public-set.mjs");
  return PS.classifyPublicPath(rel).kind === "import";
}

/** scripts/lib helpers the mirror copies: only those a mirrored script imports (same rule as the mirror). */
function mirroredScripts(root) {
  const seen = new Set(PS.ROOT_FILES.filter((f) => /^scripts\/.*\.m?js$/.test(f)));
  const queue = [...seen];
  while (queue.length) {
    const rel = queue.pop();
    const f = path.join(root, rel);
    if (!fs.existsSync(f)) continue;
    for (const m of fs.readFileSync(f, "utf8").matchAll(/(?:from\s+|import\(\s*)["'](\.{1,2}\/[^"']+\.m?js)["']/g)) {
      const t = path.posix.normalize(path.posix.join(path.posix.dirname(rel), m[1]));
      if (t.startsWith("scripts/") && !seen.has(t)) { seen.add(t); queue.push(t); }
    }
  }
  return seen;
}

const isBinary = (buf) => buf.subarray(0, 8000).includes(0);

/**
 * Scan a tree. Returns { hits: string[], scanned: number }.
 * `mode`: "monorepo" (only the public set) or "public" (every file); default: monorepo when scripts/mirror-public.mjs exists.
 * `extraTexts`: [name, text][] scanned too (the AGENTS.md renderings).
 */
export function scanPublicText(root = ROOT, { mode, extraTexts = [], patterns } = {}) {
  mode ??= fs.existsSync(path.join(root, "scripts/mirror-public.mjs")) ? "monorepo" : "public";
  const scripts = mode === "monorepo" ? mirroredScripts(root) : null;
  patterns ??= privatePatterns(root);
  const hits = [];
  const phraseHits = [];
  let scanned = 0;
  const texts = [...extraTexts];
  const phraseTexts = [...extraTexts];
  for (const rel of listFiles(root).map(posix)) {
    if (SKIP.has(rel) || SKIP_FILES.test(rel) || !inPublicSet(rel, mode)) continue;
    if (scripts && rel.startsWith("scripts/lib/") && !scripts.has(rel)) continue; // mirror tooling, not copied
    if (rel.split("/").some((s) => SKIP_DIRS.has(s))) continue;
    const pkgDir = rel.match(/^packages\/([^/]+)\/(.*)$/);
    if (pkgDir && (PACKAGE_EXCLUDES[pkgDir[1]] ?? []).some((e) => pkgDir[2] === e || pkgDir[2].startsWith(e))) continue;
    const buf = fs.readFileSync(path.join(root, rel));
    if (isBinary(buf)) continue;
    const text = buf.toString("utf8");
    if (!isAllowed(rel)) texts.push([rel, text]);
    if (!isPhraseAllowed(rel)) phraseTexts.push([rel, text]);
  }
  for (const [name, text] of texts) {
    scanned++;
    for (const h of findPrivateNames(text, patterns, name)) hits.push(`${name}:${h.line}: ${h.label} → ${h.text}`);
  }
  for (const [name, text] of phraseTexts) for (const h of findDeniedPhrases(text)) phraseHits.push(`${name}:${h.line}: ${h.label} → ${h.text}`);
  // Personal emails in package metadata that goes public or to npm.
  for (const pkg of OPEN_PACKAGE_DIRS) {
    const f = path.join(root, "packages", pkg, "package.json");
    if (!fs.existsSync(f)) continue;
    const rel = `packages/${pkg}/package.json`;
    let json;
    try { json = JSON.parse(fs.readFileSync(f, "utf8")); } catch { hits.push(`${rel}: not valid JSON`); continue; }
    for (const p of authorProblems(json)) hits.push(`${rel}: ${p}`);
    const mail = personalEmailIn(JSON.stringify(json));
    if (mail && !authorProblems(json).length) hits.push(`${rel}: personal email ${mail}`);
  }
  return { hits: [...hits, ...phraseHits], phraseHits, scanned };
}

export const RECOVERY = [
  "How to fix:",
  "  1. Reword the line so it names nothing private (\"the docs site\", \"the block renderer\" is still a private name: say what it does instead).",
  "  2. A personal email in package.json: use `\"author\": { \"name\": \"...\", \"url\": \"https://...\" }`, no email.",
  "  3. If the file truly must name it (a guard, a generator that lists private paths), add it to ALLOW in scripts/lib/private-names.mjs WITH a reason.",
  "  4. A new private package or app is picked up automatically from its folder; a private name with no folder yet goes in STATIC_PRIVATE there.",
  "  5. Skills text (packages/skills) is frozen content: report the hit to the skills owner instead of editing it here.",
  "  6. An internal PHRASE (\"Avin\", \"upstream monorepo\", \"private repo\", mirror or roadmap tooling): public text is written for contributors, who fork, branch,",
  "     test, sign off and open a PR while maintainers review and merge. Say \"the maintainers\" or \"this repository\". A genuine code path that must name the tooling",
  "     goes in PHRASE_ALLOW (scripts/lib/private-names.mjs) WITH a reason; the phrase list itself is DENY_PHRASES there.",
  "  Then re-run: npm run private-refs:check",
].join("\n");

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const extraTexts = [
    ["AGENTS.md (public rendering)", renderAgents("public")],
    ["AGENTS.md (consumer rendering)", renderAgents("consumer")],
    ["CLAUDE.md (public rendering)", renderClaude("public")],
  ];
  const { hits, scanned } = scanPublicText(ROOT, { extraTexts });
  if (hits.length) {
    console.error(`✗ private names, internal phrases or personal emails in public text (${hits.length}):\n  ${hits.join("\n  ")}\n\n${RECOVERY}`);
    process.exit(1);
  }
  console.log(`✓ no private package or app names, no internal phrases, no personal emails, in ${scanned} public texts`);
}
