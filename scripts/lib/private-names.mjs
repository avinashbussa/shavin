/**
 * The one list of names that must never appear in public text: private packages, apps and internal folders.
 * Used by scripts/check-private-refs.mjs (`npm run private-refs:check`) and by the mirror's audit
 * (scripts/mirror-public.mjs), so the two can never disagree.
 *
 * Two sources, merged:
 *   STATIC_PRIVATE   names that must stay covered even when the folder is absent (the public repo has none of
 *                    the private folders; a spike may not be a workspace yet).
 *   derived          every package or app folder that exists here but is not a public package: its `packages/<dir>` or
 *                    `apps/<dir>` path and its npm name (read from package.json). Adding a private package needs no edit here.
 *
 * @shavin/fx is public (free on npm); its npm name is never private. Its SOURCE FOLDER (packages/fx) is not mirrored.
 */
import fs from "node:fs";
import path from "node:path";

/** Public packages, by folder name (kept in step with PACKAGES in scripts/lib/public-set.mjs by a unit test). */
export const OPEN_PACKAGE_DIRS = ["ui", "cli", "mcp-server", "skills", "block-schema"];
/** npm names that are public even though their folder is private. */
const PUBLIC_NAMES = new Set(["@shavin/fx", "@shavin/ui", "@shavin/cli", "@shavin/mcp", "@shavin/skills", "@shavin/block-schema"]);

/** [label, RegExp, options?]. Case-insensitive, matched per line. `markdownOnly`: skip code files (a public dependency may use the name). */
export const STATIC_PRIVATE = [
  ["blocks-pro", /blocks-pro/i],
  ["block-renderer", /block-renderer/i],
  ["@shavin/cloud", /@shavin\/cloud\b/i],
  ["@shavin/engines", /@shavin\/engines\b/i],
  ["packages/cloud|fx|engines", /packages\/(cloud|fx|engines)\b/i],
  ["apps/*", /apps\/(studio|docs|website|community|kits|figma)\b/i],
  ["labs/", /(^|[\s"'`(])labs\//i],
  ["src/engine", /\bsrc\/engine\b/i],
  // Supabase is a normal dependency of the MCP server's remote mode, so only prose (Markdown) is checked for it.
  ["supabase", /\bsupabase\b/i, { markdownOnly: true }],
  ["docs/agents", /(^|[\s"'`(])docs\/agents\b/i],
  ["kits/", /^kits\//m],
  ["kit:pack", /\bkit:pack\b/i],
];

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const readJson = (p) => { try { return JSON.parse(fs.readFileSync(p, "utf8")); } catch { return null; } };

/** Names derived from the folders that exist under `root`: [label, RegExp][] for private packages and apps. */
export function derivedPrivate(root) {
  const out = [];
  for (const base of ["packages", "apps", "kits"]) {
    const dir = path.join(root, base);
    if (!fs.existsSync(dir)) continue;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (!e.isDirectory() || (base === "packages" && OPEN_PACKAGE_DIRS.includes(e.name))) continue;
      const pkg = readJson(path.join(dir, e.name, "package.json"));
      if (base !== "kits") out.push([`${base}/${e.name}`, new RegExp(`\\b${escapeRe(`${base}/${e.name}`)}\\b`, "i")]);
      if (pkg?.name && !PUBLIC_NAMES.has(pkg.name)) out.push([pkg.name, new RegExp(`${escapeRe(pkg.name)}(?![\\w-])`, "i")]);
    }
  }
  const labs = path.join(root, "labs");
  if (fs.existsSync(labs)) for (const e of fs.readdirSync(labs, { withFileTypes: true })) if (e.isDirectory()) out.push([`labs/${e.name}`, new RegExp(`labs/${escapeRe(e.name)}\\b`, "i")]);
  return out;
}

export function privatePatterns(root) {
  const seen = new Set();
  return [...STATIC_PRIVATE, ...derivedPrivate(root)].filter(([label]) => (seen.has(label) ? false : seen.add(label)));
}

/**
 * Files that may name private things, with the reason. A reason is required: an entry without one throws.
 * Match is exact path or a trailing-slash prefix.
 */
export const ALLOW = [
  { path: "scripts/lib/private-names.mjs", reason: "defines the list of private names" },
  { path: "scripts/gen-agents.mjs", reason: "reads the maintainer-only agent sources from a private folder when it exists; the paths are code, not prose" },
  { path: "scripts/gen-manifest.mjs", reason: "checks docs routes and block stats against the private apps when they exist (code paths and failure messages)" },
  { path: "scripts/lint-tokens.mjs", reason: "lint roots include private package folders; each is skipped when absent" },
  { path: "scripts/lint-classes.mjs", reason: "lint roots include private package folders; each is skipped when absent" },
  { path: "scripts/lib/shavin-fixture.mjs", reason: "builds an optional private package for the test fixture when its folder exists" },
  { path: "tests/unit/focus-ring-sweep.test.ts", reason: "scans the private source roots too when they exist; each root is skipped when absent" },
  { path: "tests/unit/no-aaa-claim.test.ts", reason: "scans the private source roots too when they exist; each root is skipped when absent" },
  { path: "tests/unit/agent-files.test.ts", reason: "its regex is the list of names the generated agent files must not contain" },
];
for (const a of ALLOW) if (!a.reason?.trim()) throw new Error(`private-names ALLOW entry ${a.path} needs a reason`);
export const isAllowed = (rel) => ALLOW.some((a) => rel === a.path || (a.path.endsWith("/") && rel.startsWith(a.path)));

/**
 * Internal phrases that must not appear in public text: contributors fork, branch, test, sign off and open a PR;
 * maintainers review and merge. Wording about the maintainers' private workflow, tooling or people does not belong
 * in anything public-bound. [label, RegExp]; a monorepo that a USER owns ("your monorepo") is fine and not matched.
 * Add a phrase here when a new internal term shows up; the check prints the fix.
 */
export const DENY_PHRASES = [
  ["a person's name used as a gate (say \"the maintainers\")", /\bAvin\b/],
  ["internal tooling or team name", /OSS-SYNC|OSS-PLAYBOOK|oss-gatekeeper|roadmap-keeper|cavecrew|\bHQ\b/],
  ["\"upstream\" (say \"maintained separately\" or \"by the maintainers\")", /\bupstream\b/i],
  ["\"private repo\" (say \"this repository\" or name what is not included)", /\bprivate (repo|repository|monorepo|Verdaccio)\b/i],
  ["our own \"monorepo\" (say \"this repository\")", /\b(upstream|private|Shavin|our|this) monorepo\b|\bmonorepo (source|sources|checkout|sibling)\b|\b(inside|within|in) the monorepo\b/i],
  ["mirror tooling (the one-way copy is not a public concept)", /mirror-public|import-public\b|\bOSS mirror\b/],
  ["roadmap process", /roadmap\.json|docs\/Roadmaps|roadmap:(check|build)/],
  ["\"public repo snapshot\"", /public repo snapshot/i],
];

/**
 * Files that may contain a denied phrase, with the reason (required). Exact path or trailing-slash prefix.
 * Keep it short: a hit is normally fixed by rewording.
 */
export const PHRASE_ALLOW = [
  { path: "scripts/lib/private-names.mjs", reason: "defines the deny list" },
  { path: "scripts/check-private-refs.mjs", reason: "names the phrases it guards and finds the maintainers' checkout by scripts/mirror-public.mjs" },
  { path: "scripts/check-docs-scripts.mjs", reason: "reads scripts/mirror-public.mjs when present to learn the public script names (a code path, skipped here)" },
  { path: "scripts/gen-agents.mjs", reason: "detects the maintainers' checkout by its docs folder; code paths, not prose" },
  { path: "scripts/gen-manifest.mjs", reason: "lists scripts/mirror-public/README.md among the files whose primitive count it verifies (a code path, skipped here)" },
];
for (const a of PHRASE_ALLOW) if (!a.reason?.trim()) throw new Error(`private-names PHRASE_ALLOW entry ${a.path} needs a reason`);
export const isPhraseAllowed = (rel) => PHRASE_ALLOW.some((a) => rel === a.path || (a.path.endsWith("/") && rel.startsWith(a.path)));

/** Find denied phrases in `text`: [{ line, label, text }]. */
export function findDeniedPhrases(text) {
  const hits = [];
  text.split("\n").forEach((line, i) => {
    for (const [label, re] of DENY_PHRASES) if (re.test(line)) { hits.push({ line: i + 1, label, text: line.trim().slice(0, 140) }); break; }
  });
  return hits;
}

/** Find private names in `text`: [{ line, label, text }]. */
export function findPrivateNames(text, patterns, file = "x.md") {
  const hits = [];
  const isMd = /\.mdx?$|\(\w+ rendering\)$/i.test(file);
  text.split("\n").forEach((line, i) => {
    for (const [label, re, opts] of patterns) if ((isMd || !opts?.markdownOnly) && re.test(line)) { hits.push({ line: i + 1, label, text: line.trim().slice(0, 140) }); break; }
  });
  return hits;
}

/** Personal email addresses that must not ship in package metadata or generated files. */
const PERSONAL_DOMAINS = /@(gmail|googlemail|outlook|hotmail|live|yahoo|icloud|me|proton(mail)?|pm)\.(com|me|net)\b/i;
export const personalEmailIn = (text) => text.match(new RegExp(`[A-Za-z0-9._%+-]+${PERSONAL_DOMAINS.source}`, "i"))?.[0] ?? null;

/** Problems with a package.json that goes public or to npm: an email in `author`/`contributors`/`maintainers`. */
export function authorProblems(pkg) {
  const out = [];
  const people = [pkg.author, ...(pkg.contributors ?? []), ...(pkg.maintainers ?? [])].filter(Boolean);
  for (const p of people) {
    const email = typeof p === "string" ? p.match(/<([^>]+)>/)?.[1] : p.email;
    if (email) out.push(`person entry carries an email (${email})`);
  }
  return out;
}
