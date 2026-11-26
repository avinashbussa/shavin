#!/usr/bin/env node
/**
 * Post-build step for the per-module ESM output in dist/.
 *
 * esbuild's `bundle: false` keeps the extensionless relative specifiers from the TypeScript
 * sources (`./lib/cn`). Bundlers resolve those, but Node's ESM resolver and test runners that load
 * the package unbundled do not. This rewrites every relative specifier in dist/**.js to the exact
 * file (`./lib/cn.js`, `./primitives/Button/index.js`). Windows-safe: posix specifiers only.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "dist");
const SPEC = /(\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)(["'])(\.{1,2}\/[^"']*|\.{1,2})\2/g;

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (e.name.endsWith(".js")) out.push(p);
  }
  return out;
}

function resolveSpec(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  const isFile = (f) => fs.existsSync(f) && fs.statSync(f).isFile();
  if (/\.(m?js|cjs|json|css)$/.test(spec) && isFile(base)) return spec;
  if (isFile(`${base}.js`)) return `${spec}.js`;
  if (isFile(path.join(base, "index.js"))) return `${spec.replace(/\/$/, "")}/index.js`;
  return null;
}

let files = 0, rewritten = 0;
const unresolved = [];
for (const file of walk(DIST)) {
  // Bundled leftovers (tailwind-preset.cjs is not .js; styles/brand-preset.js has no relative imports).
  const src = fs.readFileSync(file, "utf8");
  let changed = false;
  const out = src.replace(SPEC, (m, pre, q, spec) => {
    const r = resolveSpec(file, spec);
    if (!r) { unresolved.push(`${path.relative(DIST, file).split(path.sep).join("/")}: ${spec}`); return m; }
    if (r === spec) return m;
    changed = true; rewritten++;
    return `${pre}${q}${r}${q}`;
  });
  files++;
  if (changed) fs.writeFileSync(file, out);
}
if (unresolved.length) {
  console.error(`rewrite-specifiers: ${unresolved.length} unresolved relative specifier(s):\n  ${unresolved.join("\n  ")}`);
  process.exit(1);
}
console.log(`rewrite-specifiers: ${rewritten} specifiers in ${files} files`);
