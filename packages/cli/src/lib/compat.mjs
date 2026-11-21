/**
 * Package compatibility: `cli`, `mcp` and `skills` describe and lint the user's installed @shavin/ui without
 * depending on it, so each declares the @shavin/ui range it documents in package.json:
 *
 *   "shavin": { "compat": { "@shavin/ui": ">=0.1.0 <0.2.0" } }
 *
 * `@shavin/fx` is not a tool but declares the same range (next to its real `@shavin/ui` peer dependency) so one check covers it.
 * This module compares those ranges with what is installed. Pure: reads package.json files, writes nothing.
 * Small on purpose (no semver dependency); a range it cannot read counts as satisfied, so it never nags.
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { installCommand } from "./package-manager.mjs";

/** The tools that carry a `shavin.compat` range, and the package they are checked against. */
export const COMPAT_TOOLS = ["@shavin/cli", "@shavin/mcp", "@shavin/skills", "@shavin/fx"];
export const COMPAT_TARGET = "@shavin/ui";
/** A runtime dependency of the app (not a dev tool): its upgrade command must not use -D. */
export const FX = "@shavin/fx";

const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };

/** "1.2.3" or "1.2.3-beta.1" → { n: [1,2,3], pre: "beta.1" }, or null. */
function parse(v) {
  const m = String(v ?? "").trim().replace(/^v/, "").match(/^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+.*)?$/);
  return m ? { n: [Number(m[1]), Number(m[2]), Number(m[3])], pre: m[4] ?? "" } : null;
}
/** -1, 0 or 1. A prerelease sorts below its release. */
function cmp(a, b) {
  for (let i = 0; i < 3; i++) if (a.n[i] !== b.n[i]) return a.n[i] > b.n[i] ? 1 : -1;
  if (a.pre === b.pre) return 0;
  if (!a.pre) return 1;
  if (!b.pre) return -1;
  return a.pre < b.pre ? -1 : 1;
}

/** One comparator token → [{op, v}] pairs, or null when it is not understood. */
function comparators(tok) {
  const m = tok.match(/^(>=|<=|>|<|=|\^|~)?\s*v?(\d+|x|\*)(?:\.(\d+|x|\*))?(?:\.(\d+|x|\*))?(?:-([0-9A-Za-z.-]+))?$/);
  if (!m) return null;
  const [, op = "=", a, b, c, pre = ""] = m;
  const wild = (x) => x === undefined || x === "x" || x === "*";
  if (wild(a)) return []; // "*" matches everything
  const major = Number(a), minor = wild(b) ? 0 : Number(b), patch = wild(c) ? 0 : Number(c);
  const v = (n) => ({ n, pre: "" });
  const here = { n: [major, minor, patch], pre };
  if (op === "^") {
    const hi = major > 0 || wild(b) ? [major + 1, 0, 0] : minor > 0 || wild(c) ? [0, minor + 1, 0] : [0, 0, patch + 1];
    return [{ op: ">=", v: here }, { op: "<", v: v(hi) }];
  }
  if (op === "~") return [{ op: ">=", v: here }, { op: "<", v: v(wild(b) ? [major + 1, 0, 0] : [major, minor + 1, 0]) }];
  if (op === "=" && (wild(b) || wild(c))) return [{ op: ">=", v: here }, { op: "<", v: v(wild(b) ? [major + 1, 0, 0] : [major, minor + 1, 0]) }];
  return [{ op, v: here }];
}

/** Does `version` satisfy `range`? Supports ">=a <b", "^", "~", "x" ranges, "||". `null` when the range cannot be read. */
export function satisfies(version, range) {
  const ver = parse(version);
  if (!ver || typeof range !== "string" || !range.trim()) return null;
  let understood = true;
  const anySet = range.split("||").some((set) => {
    const toks = set.trim().replace(/(>=|<=|>|<|=|\^|~)\s+/g, "$1").split(/\s+/).filter(Boolean);
    const all = toks.map(comparators);
    if (all.some((c) => c === null)) { understood = false; return false; }
    return all.flat().every(({ op, v }) => {
      const r = cmp(ver, v);
      return op === ">=" ? r >= 0 : op === ">" ? r > 0 : op === "<=" ? r <= 0 : op === "<" ? r < 0 : r === 0;
    });
  });
  return understood ? anySet : null;
}

/** Lowest version the range allows, "x.y.z", or null. Used to say which @shavin/ui to install. */
export function lowerBound(range) {
  const m = String(range ?? "").match(/(?:>=|\^|~|=|^)\s*v?(\d+)\.(\d+)\.(\d+)/);
  return m ? `${m[1]}.${m[2]}.${m[3]}` : null;
}

/** The version of `name` installed for `cwd`, found the way Node resolves it (this folder's node_modules, then each parent's). */
export function installedPackage(cwd, name) {
  for (let dir = cwd; ; dir = dirname(dir)) {
    const j = readJson(join(dir, "node_modules", name, "package.json"));
    if (j?.version) return j;
    if (dirname(dir) === dir) return null;
  }
}

/**
 * Compare each installed tool's declared @shavin/ui range with the installed @shavin/ui.
 * Returns { compared, mismatches: [{ tool, toolVersion, range, uiVersion, direction, message, fix }] }.
 * Nothing is compared (compared === 0) when @shavin/ui is absent or no tool is installed or declares a range.
 */
export function checkCompat(cwd, pm = "npm") {
  const ui = installedPackage(cwd, COMPAT_TARGET)?.version;
  const out = { compared: 0, mismatches: [] };
  if (!ui) return out;
  for (const tool of COMPAT_TOOLS) {
    const pkg = installedPackage(cwd, tool);
    const range = pkg?.shavin?.compat?.[COMPAT_TARGET];
    if (!pkg?.version || typeof range !== "string") continue;
    const ok = satisfies(ui, range);
    if (ok === null) continue;
    out.compared++;
    if (ok) continue;
    const low = lowerBound(range);
    const uiOlder = low ? cmp(parse(ui), parse(low)) < 0 : false;
    // ui older than the range → upgrade ui to the range; ui newer → the tool is behind, upgrade it.
    const fix = uiOlder ? installCommand(pm, [`${COMPAT_TARGET}@^${low}`]) : installCommand(pm, [`${tool}@latest`], { dev: tool !== FX });
    out.mismatches.push({
      tool, toolVersion: pkg.version, range, uiVersion: ui, direction: uiOlder ? "ui-older" : "ui-newer",
      message: `${tool} ${pkg.version} documents ${COMPAT_TARGET} ${range}, but ${ui} is installed`,
      fix,
    });
  }
  return out;
}
