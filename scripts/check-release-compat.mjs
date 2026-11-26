#!/usr/bin/env node
/**
 * check-release-compat — the gate the Release workflow runs before it publishes anything.
 *
 *   PACKAGES=all node scripts/check-release-compat.mjs        # or a comma list: ui,cli,mcp
 *
 * For every package this run would publish (its version is not on npm yet) it checks:
 *   1. packages/<pkg>/CHANGELOG.md has a "## <version>" entry (the GitHub Release notes come from it);
 *   2. for cli, mcp, skills and fx: the @shavin/ui version being published (this run's, or the one already on npm
 *      when ui is not in this run) is inside the package's `shavin.compat` range;
 *   3. every package.json version matches its entry (and the root's) in package-lock.json;
 *   4. a FIRST publish (a name that is not on npm at all) has no pending `.changeset/*.md` (the CHANGELOG sections are the
 *      release notes; a pending changeset would announce the same change again), and its packages, the root package.json
 *      and SHAVIN_META.version all carry one version.
 * Every message gives the exact recovery step. Exit 0 = ok, 1 = problems.
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { runSync } from "./lib/spawn-cross.mjs";
import { fileURLToPath } from "node:url";
import { satisfies } from "../packages/cli/src/lib/compat.mjs";
import { notesFor, PACKAGE_DIRS } from "./release-notes.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SHORT = { "block-schema": "block-schema", ui: "ui", fx: "fx", skills: "skills", cli: "cli", mcp: "mcp-server" };

const readJson = (p) => JSON.parse(readFileSync(p, "utf8"));
/** The default registry lookup: the version on npm, or null when the name or version is not there. */
function npmView(spec) {
  try { return runSync("npm", ["view", spec, "version"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim() || null; } catch { return null; }
}

/**
 * @param {{ root?: string, selected?: string, onNpm?: (spec: string) => string | null }} opts
 *   selected: "all" or a comma list of block-schema, ui, fx, skills, cli, mcp (as the workflow input; fx exists only where its source is kept)
 *   onNpm: returns the version of an npm spec ("@shavin/ui", "@shavin/cli@0.1.0") or null; injected by tests
 * @returns {string[]} problems, each with its fix
 */
export function releaseProblems({ root = ROOT, selected = "all", onNpm = npmView } = {}) {
  const want = selected.trim() === "all" ? null : new Set(selected.split(",").map((s) => s.trim()).filter(Boolean));
  const problems = [];
  // @shavin/fx lives only where its source is kept (published to npm, source not in the public repo): skip folders that are absent.
  const pkgs = PACKAGE_DIRS.filter((dir) => existsSync(join(root, "packages", dir, "package.json"))).map((dir) => {
    const json = readJson(join(root, "packages", dir, "package.json"));
    const short = Object.entries(SHORT).find(([, d]) => d === dir)[0];
    return { short, dir, name: json.name, version: json.version, compat: json.shavin?.compat };
  });
  const chosen = pkgs.filter((p) => !want || want.has(p.short));
  // Only what this run would really publish: a version already on npm is skipped by the workflow.
  const toPublish = chosen.filter((p) => onNpm(`${p.name}@${p.version}`) === null);

  for (const p of toPublish) {
    const file = `packages/${p.dir}/CHANGELOG.md`;
    if (!existsSync(join(root, file))) problems.push(`${p.name}@${p.version}: ${file} is missing. Run "npm run version-packages" (or add the file) and retry.`);
    else if (!notesFor(p.name, p.version, root)) problems.push(`${p.name}@${p.version}: ${file} has no "## ${p.version}" entry, so the GitHub Release would have no notes. Run "npm run version-packages" (it writes the entry from the pending changesets), commit, and retry.`);
  }

  // 3. package-lock.json agrees with every package.json (a stale lock makes `npm ci` fail in CI).
  const lockFile = join(root, "package-lock.json");
  const rootPkgFile = join(root, "package.json");
  const rootVersion = existsSync(rootPkgFile) ? readJson(rootPkgFile).version : undefined;
  if (existsSync(lockFile)) {
    const lock = readJson(lockFile).packages ?? {};
    const check = (label, want, entry) => {
      if (entry && want && entry.version !== want) problems.push(`${label}: package.json says ${want} but package-lock.json says ${entry.version}. Run "npm install --package-lock-only" and commit the lock.`);
    };
    check("root package", rootVersion, lock[""]);
    for (const p of pkgs) check(p.name, p.version, lock[`packages/${p.dir}`]);
  }

  // 4. A first publish: no pending changesets, and one version everywhere.
  const first = toPublish.filter((p) => onNpm(p.name) === null);
  if (first.length) {
    const csDir = join(root, ".changeset");
    const pending = existsSync(csDir) ? readdirSync(csDir).filter((f) => f.endsWith(".md") && f.toLowerCase() !== "readme.md") : [];
    if (pending.length) problems.push(`${first.map((p) => p.name).join(", ")} ${first.length > 1 ? "have" : "has"} never been published, but .changeset/ holds ${pending.join(", ")}. The first release's notes are the CHANGELOG "## <version>" sections; delete the pending changeset(s) so the first Changesets release does not announce the same change again.`);
    const versions = new Set(first.map((p) => p.version));
    const metaFile = join(root, "packages", "ui", "src", "lib", "meta.ts");
    const metaVersion = existsSync(metaFile) ? readFileSync(metaFile, "utf8").match(/\bversion: "([^"]+)"/)?.[1] : undefined;
    for (const v of [rootVersion, metaVersion]) if (v) versions.add(v);
    if (versions.size > 1) problems.push(`The first release must carry one version everywhere, but found ${[...versions].join(", ")} across ${first.map((p) => `${p.name}@${p.version}`).join(", ")}${rootVersion ? `, the root package.json (${rootVersion})` : ""}${metaVersion ? ` and SHAVIN_META (${metaVersion})` : ""}. Align them, run "npm run manifest:gen", and retry.`);
  }

  const withCompat = toPublish.filter((p) => p.compat?.["@shavin/ui"]);
  if (withCompat.length) {
    const ui = pkgs.find((p) => p.name === "@shavin/ui");
    const uiInRun = toPublish.some((p) => p.name === "@shavin/ui");
    const uiVersion = uiInRun ? ui.version : onNpm("@shavin/ui");
    if (!uiVersion) {
      problems.push(`@shavin/ui is not on npm yet and is not part of this run, so ${withCompat.map((p) => p.name).join(", ")} would document a package nobody can install. Run again with packages "all" (or include ui).`);
    } else {
      for (const p of withCompat) {
        const range = p.compat["@shavin/ui"];
        if (satisfies(uiVersion, range) !== false) continue; // in range, or a range we cannot read: not blocked
        problems.push(`${p.name}@${p.version} documents @shavin/ui ${range}, but this release ${uiInRun ? "publishes" : "relies on the published"} @shavin/ui ${uiVersion}. Fix: edit "shavin.compat" in packages/${p.dir}/package.json so the range includes ${uiVersion} (describe it in a changeset for ${p.name}), run "npm run version-packages", sync the mirror and run the workflow again.`);
      }
    }
  }
  return problems;
}

if (process.argv[1] && join(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const problems = releaseProblems({ selected: process.env.PACKAGES || "all" });
  if (problems.length) {
    for (const p of problems) console.error(`::error::${p}`);
    console.error(`\nRelease blocked: ${problems.length} problem(s). Nothing was published.`);
    process.exit(1);
  }
  console.log("Release compatibility check passed.");
}
