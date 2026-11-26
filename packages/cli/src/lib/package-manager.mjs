/**
 * Package-manager helpers shared by `init` and `add`. Pure apart from reading
 * the project folder; no installs happen here.
 */
import { readJsonFile } from "./json-file.mjs";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/** npm, pnpm, yarn or bun, from the lockfile in `cwd` (npm when none is found). */
export function detectPackageManager(cwd) {
  if (existsSync(resolve(cwd, "pnpm-lock.yaml"))) return "pnpm";
  if (existsSync(resolve(cwd, "yarn.lock"))) return "yarn";
  if (existsSync(resolve(cwd, "bun.lockb")) || existsSync(resolve(cwd, "bun.lock"))) return "bun";
  return "npm";
}

/** The shell command that installs `specs` (e.g. ["@shavin/ui@^0.2.0"]) with `pm`. */
export function installCommand(pm, specs, { dev = false } = {}) {
  const list = specs.map((s) => (/[\s^~<>|*]/.test(s) ? `"${s}"` : s)).join(" ");
  if (pm === "npm") return `npm install${dev ? " -D" : ""} ${list}`;
  return `${pm} add${dev ? " -D" : ""} ${list}`;
}

/** Dependencies and devDependencies declared in `cwd/package.json` ({} when unreadable). */
export function readDeclaredDeps(cwd) {
  try {
    const pkg = readJsonFile(resolve(cwd, "package.json"));
    return { ...(pkg.devDependencies || {}), ...(pkg.dependencies || {}) };
  } catch {
    return {};
  }
}

/** Lowest version a range can resolve to, as [major, minor, patch], or null if it has none. */
export function minVersion(range) {
  if (typeof range !== "string") return null;
  const m = range.trim().match(/^(?:\^|~|>=|=|v)?\s*(\d+)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?/);
  if (!m) return null;
  const n = (v) => (v === undefined || v === "x" || v === "*" ? 0 : Number(v));
  return [n(m[1]), n(m[2]), n(m[3])];
}

/**
 * Is the project's declared `installed` range new enough for a block that needs
 * `required`? Ranges we cannot compare (workspace:, file:, git URLs, tags such as
 * "latest") count as satisfied, so we never downgrade or fight a local link.
 */
export function satisfiesMinimum(installed, required) {
  const have = minVersion(installed);
  const need = minVersion(required);
  if (!have || !need) return true;
  for (let i = 0; i < 3; i++) {
    if (have[i] !== need[i]) return have[i] > need[i];
  }
  return true;
}

/** npm packages a block's source imports (react and relative paths excluded), each at "latest". */
export function importedPackages(rawCode = "") {
  const deps = {};
  for (const m of rawCode.matchAll(/from\s+["']([^"'.][^"']*)["']/g)) {
    const spec = m[1];
    const pkg = spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0];
    if (pkg === "react" || pkg === "react-dom" || pkg.startsWith("node:")) continue;
    deps[pkg] = "latest";
  }
  return deps;
}

/**
 * Which of a block's npm dependencies the project still needs.
 * Returns install specs ("pkg@range" or "pkg") split into missing and outdated.
 */
export function planDependencies(cwd, npmDependencies = {}) {
  const declared = readDeclaredDeps(cwd);
  const missing = [];
  const outdated = [];
  for (const [pkg, range] of Object.entries(npmDependencies)) {
    const spec = range && range !== "latest" ? `${pkg}@${range}` : pkg;
    if (!(pkg in declared)) missing.push(spec);
    else if (range && range !== "latest" && !satisfiesMinimum(declared[pkg], range)) {
      outdated.push({ spec, have: declared[pkg], need: range });
    }
  }
  return { missing, outdated };
}
