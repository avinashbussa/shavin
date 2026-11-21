#!/usr/bin/env node
/**
 * Generates src/primitives/Icon/icon-loaders.generated.ts: for every icon name <Icon name> accepts, a
 * loader that imports only that icon. Bundlers split each import into its own small file, so a page
 * downloads the icons it renders instead of four whole libraries.
 *
 * Names are normalised the way Icon has always matched them (lower case, no "-" or "_"), and the
 * libraries keep their old priority: Lucide, then Phosphor, Radix, Material (MDI).
 *   - Lucide and Phosphor ship one file per icon, so each name gets its own import().
 *   - Radix and MDI ship a single module; their names map to an export of a module loaded once, on
 *     first use of any name from that library.
 *
 * lucide-react and @phosphor-icons/react are pinned to exact versions in package.json: the generated
 * imports name their icon files, which a minor release can rename. Re-run this after bumping them.
 *
 * Run: node packages/ui/scripts/gen-icon-loaders.mjs   (part of `npm run regen` via ui's prebuild)
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(join(here, "../package.json"));
const pkgDir = (name) => dirname(require.resolve(`${name}/package.json`));
const norm = (s) => s.toLowerCase().replace(/[-_]/g, "");
const out = join(here, "../src/primitives/Icon/icon-loaders.generated.ts");
const outMaterial = join(here, "../src/primitives/Icon/icon-names-material.generated.ts");
const outNames = join(here, "../src/primitives/Icon/icon-display-names.generated.ts");
const camel = (s) => s.charAt(0).toLowerCase() + s.slice(1);

const lib = new Map(); // normalised name -> entry; first library to claim a name wins

// 1. Lucide: parse the index's `export { default as A, default as B } from './icons/file.mjs'` lines.
const lucideIndex = readFileSync(join(pkgDir("lucide-react"), "dist/esm/lucide-react.mjs"), "utf8");
const lucideFiles = new Map(); // file -> names
for (const m of lucideIndex.matchAll(/export \{([^}]*)\} from '\.\/icons\/([a-z0-9-]+)\.mjs'/g)) {
  const names = [...m[1].matchAll(/default as (\w+)/g)].map((x) => x[1]);
  lucideFiles.set(m[2], names);
}
for (const [file, names] of lucideFiles) {
  for (const name of names) {
    // Same filter the registry used: no Lucide-prefixed aliases. *Icon aliases are left out too
    // (they only duplicate a shorter name).
    if (name.startsWith("Lucide") || (name.endsWith("Icon") && names.includes(name.slice(0, -4)))) continue;
    const key = norm(name);
    if (!lib.has(key)) lib.set(key, { lib: "lucide", file, display: camel(name) });
  }
}

// 2. Phosphor: one file per icon in dist/csr; the component is the named export without "Icon".
const phosphorDir = join(pkgDir("@phosphor-icons/react"), "dist/csr");
for (const f of readdirSync(phosphorDir)) {
  const m = f.match(/^([A-Z]\w*)\.es\.js$/);
  if (!m) continue;
  const key = norm(m[1]);
  if (!lib.has(key)) lib.set(key, { lib: "phosphor", file: m[1], display: camel(m[1]) });
}

// 3. Radix: one module; exports end in "Icon".
const radix = require("@radix-ui/react-icons");
for (const name of Object.keys(radix)) {
  if (!name.endsWith("Icon")) continue;
  const key = norm(name.slice(0, -4));
  if (!lib.has(key)) lib.set(key, { lib: "radix", exp: name, display: camel(name.slice(0, -4)) });
}

// 4. MDI: one module of SVG path strings named mdiX.
const mdi = require("@mdi/js");
for (const name of Object.keys(mdi)) {
  if (!name.startsWith("mdi") || typeof mdi[name] !== "string") continue;
  const key = norm(name.slice(3));
  if (!lib.has(key)) lib.set(key, { lib: "material", exp: name });
}

const keys = [...lib.keys()].sort();
const lucide = keys.filter((k) => lib.get(k).lib === "lucide");
const phosphor = keys.filter((k) => lib.get(k).lib === "phosphor");
const radixKeys = keys.filter((k) => lib.get(k).lib === "radix");
const mdiKeys = keys.filter((k) => lib.get(k).lib === "material");

// Icons are grouped into one chunk per first letter: a page loads only the groups its icons are in,
// and bundlers handle ~50 chunks instead of ~3,000 (which made dev compiles twice as slow).
const bucketOf = (key) => (/[a-z]/.test(key[0]) ? key[0] : "0");
const bucketDir = join(here, "../src/primitives/Icon/buckets");
rmSync(bucketDir, { recursive: true, force: true });
mkdirSync(bucketDir, { recursive: true });
const ident = (s) => s.replace(/[^A-Za-z0-9]/g, "_");

// Lucide: aliases point several names at one file, so files are bucketed and names reference them.
const lucideFileList = [...new Set(lucide.map((k) => lib.get(k).file))].sort();
const lucideBuckets = [...new Set(lucideFileList.map((f) => bucketOf(norm(f))))].sort();
for (const b of lucideBuckets) {
  const files = lucideFileList.filter((f) => bucketOf(norm(f)) === b);
  writeFileSync(join(bucketDir, `lucide-${b}.ts`), `// AUTO-GENERATED by packages/ui/scripts/gen-icon-loaders.mjs. Do not edit.
/* eslint-disable */
// @ts-nocheck
${files.map((f) => `export { default as ${ident(f)} } from "lucide-react/dist/esm/icons/${f}.mjs";`).join("\n")}
`, "utf8");
}
const phosphorBuckets = [...new Set(phosphor.map((k) => bucketOf(k)))].sort();
for (const b of phosphorBuckets) {
  const names = phosphor.filter((k) => bucketOf(k) === b).map((k) => lib.get(k).file);
  writeFileSync(join(bucketDir, `phosphor-${b}.ts`), `// AUTO-GENERATED by packages/ui/scripts/gen-icon-loaders.mjs. Do not edit.
/* eslint-disable */
// @ts-nocheck
${names.map((n) => `export { ${n} } from "@phosphor-icons/react/dist/csr/${n}";`).join("\n")}
`, "utf8");
}
const lb = new Map(lucideBuckets.map((b, i) => [b, i]));
const pb = new Map(phosphorBuckets.map((b, i) => [b, i]));

const q = JSON.stringify;
const src = `// AUTO-GENERATED by packages/ui/scripts/gen-icon-loaders.mjs. Do not edit.
// ${lucide.length} Lucide names (${lucideFileList.length} files), ${phosphor.length} Phosphor, ${radixKeys.length} Radix, ${mdiKeys.length} Material.
/* eslint-disable */

export type IconModuleLoader = () => Promise<Record<string, unknown>>;

/** Lucide icons grouped by first letter; each group is one chunk. */
export const LUCIDE_BUCKETS: IconModuleLoader[] = [
${lucideBuckets.map((b) => `  () => import("./buckets/lucide-${b}"),`).join("\n")}
];

/** Normalised Lucide name -> [group index, export name in that group]. */
export const LUCIDE_NAMES: Record<string, [number, string]> = {${lucide.map((k) => { const f = lib.get(k).file; return `${q(k)}:[${lb.get(bucketOf(norm(f)))},${q(ident(f))}]`; }).join(",")}};

/** Phosphor icons grouped by first letter; each group is one chunk. */
export const PHOSPHOR_BUCKETS: IconModuleLoader[] = [
${phosphorBuckets.map((b) => `  () => import("./buckets/phosphor-${b}"),`).join("\n")}
];

/** Normalised Phosphor name -> [group index, export name]. */
export const PHOSPHOR: Record<string, [number, string]> = {${phosphor.map((k) => `${q(k)}:[${pb.get(bucketOf(k))},${q(lib.get(k).file)}]`).join(",")}};

/** Radix and Material ship one module each, loaded on first use of any of their names. */
export const loadRadix: IconModuleLoader = () => import("@radix-ui/react-icons");
export const loadMaterial: IconModuleLoader = () => import("@mdi/js");

/** Normalised Radix name -> export name. */
export const RADIX: Record<string, string> = {${radixKeys.map((k) => `${q(k)}:${q(lib.get(k).exp)}`).join(",")}};

/** Material names live in their own file, loaded only when a name isn't Lucide, Phosphor or Radix. */
export const loadMaterialNames = () => import("./icon-names-material.generated");
`;
writeFileSync(out, src, "utf8");
writeFileSync(outNames, `// AUTO-GENERATED by packages/ui/scripts/gen-icon-loaders.mjs. Do not edit.
/* eslint-disable */
/** Readable names of every Lucide, Phosphor and Radix icon <Icon name> accepts (Material names load on demand). */
export const ICON_NAMES: readonly string[] = ${q([...lucide, ...phosphor, ...radixKeys].map((k) => lib.get(k).display).sort())};
`, "utf8");
writeFileSync(outMaterial, `// AUTO-GENERATED by packages/ui/scripts/gen-icon-loaders.mjs. Do not edit.
/* eslint-disable */
/** Normalised Material name -> @mdi/js export (an SVG path string). */
export const MATERIAL: Record<string, string> = {${mdiKeys.map((k) => `${q(k)}:${q(lib.get(k).exp)}`).join(",")}};
`, "utf8");
console.log(`icon loaders: ${lucide.length} lucide (${lucideFileList.length} files, ${lucideBuckets.length} groups), ${phosphorBuckets.length} phosphor groups, ${phosphor.length} phosphor, ${radixKeys.length} radix, ${mdiKeys.length} material → ${out}`);
