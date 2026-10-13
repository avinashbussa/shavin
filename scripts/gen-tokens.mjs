#!/usr/bin/env node
/**
 * Token manifest generator (P1.3). Emits a single machine-readable
 * `tokens.json` at the repo root so an agent/tool can learn every legal token
 * name, its meaning, and its light/dark value from ONE JSON file — instead of
 * parsing CSS.
 *
 * Sources of truth (never hand-edit tokens.json — regenerate):
 *   - src/styles/global.css   → foundation scale, semantic light/dark values,
 *                               radius roles, elevation shadows, motion easings
 *   - tailwind-preset.ts      → the PUBLIC list of semantic token names + their
 *                               Tailwind color keys
 *   - src/lib/theme-presets.ts → accent / gray / radius / scaling preset lists
 *
 * Usage:
 *   node scripts/gen-tokens.mjs           # (re)write tokens.json
 *   node scripts/gen-tokens.mjs --check   # exit non-zero if tokens.json is stale (CI)
 *
 * Zero-dependency ESM. Output is deterministic (stable key order) so diffs stay
 * clean.
 */
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { c, g, fmt, printBanner, printCard, startTaskSpinner } from "./lib/term-ui.mjs";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const UI_DIR = existsSync(join(ROOT, "packages", "ui")) ? join(ROOT, "packages", "ui") : ROOT;
const CSS = join(UI_DIR, "src", "styles", "global.css");
const PRESET = existsSync(join(UI_DIR, "tailwind-preset.ts")) ? join(UI_DIR, "tailwind-preset.ts") : join(ROOT, "tailwind-preset.ts");
const THEME = join(UI_DIR, "src", "lib", "theme-presets.ts");
const OUT = join(UI_DIR, "tokens.json");
const ROOT_OUT = join(ROOT, "tokens.json");

// Human-readable meaning for each semantic token. The role, not the value —
// values are derived from global.css below.
const ROLES = {
  "bg-canvas": "App background — the furthest-back surface behind all content.",
  "bg-surface": "Default surface (cards, inputs, panels) sitting on the canvas.",
  "bg-surface-hover": "Hover / active fill for interactive surfaces and list rows.",
  "bg-elevated": "Floating-surface fill (Dialog, Menu, Popover, Select).",
  "hairline": "Default 1px border / divider color.",
  "hairline-strong": "Higher-contrast border for emphasis or nested edges.",
  "fg": "Primary text / icon color (maximum contrast).",
  "fg-muted": "Secondary text — labels, descriptions, less prominent copy.",
  "fg-subtle": "Tertiary text — placeholders, disabled, metadata.",
  "accent": "Primary brand / action color (buttons, selected states).",
  "accent-hover": "Hover / active variant of the accent.",
  "accent-fg": "Foreground (text / icon) rendered on top of an accent fill.",
  "accent-contrast": "WCAG contrast-safe accent color for foreground text, glyphs, and soft buttons.",
  "accent-text": "Alias for accent-contrast (contrast-safe accent text on light/soft surfaces).",
  "accent-subtle": "Subtle transparent accent background fill for soft buttons and badges.",
  "accent-subtle-hover": "Hover background fill for subtle/soft accent components.",
  "success": "Positive / completed status color.",
  "success-fg": "Foreground rendered on top of a success fill.",
  "warning": "Caution / attention status color.",
  "warning-fg": "Foreground rendered on top of a warning fill.",
  "danger": "Destructive / error status color.",
  "danger-fg": "Foreground rendered on top of a danger fill.",
  "link": "Hyperlink affordance color.",
  "code-keyword": "[Internal Utility] Syntax color for keywords (const, function, return, import).",
  "code-string": "[Internal Utility] Syntax color for strings and template literals.",
  "code-num": "[Internal Utility] Syntax color for numeric literals, units, and booleans.",
  "code-fn": "[Internal Utility] Syntax color for function and method declarations/calls.",
  "code-comment": "[Internal Utility] Syntax color for code comments and docstrings.",
  "code-punct": "[Internal Utility] Syntax color for brackets, commas, semicolons, and delimiters.",
  "code-prop": "[Internal Utility] Syntax color for object keys and CSS properties.",
  "code-op": "[Internal Utility] Syntax color for operators (+, =, &&, =>).",
  "code-type": "[Internal Utility] Syntax color for TypeScript types and interfaces.",
  "code-tag": "[Internal Utility] Syntax color for JSX and HTML tag names.",
  "code-attr": "[Internal Utility] Syntax color for JSX and HTML attribute names.",
};

// ---------------------------------------------------------------------------
// tiny parsing helpers (regex/scanner over the raw files — no CSS/TS parser)
// ---------------------------------------------------------------------------

/** Strip /* *\/ block comments from CSS (custom-prop values never contain them). */
function stripCssComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "");
}

/**
 * Return the body of the first CSS rule whose selector text ends with `sel`
 * (e.g. ":root", ".dark"), matched by scanning to the balanced closing brace.
 */
function cssBlock(src, sel) {
  const re = new RegExp(`(^|[\\s,}])${sel.replace(/[.\\]/g, "\\$&")}(?:[^\\{\\}]*)\\{`, "m");
  const m = re.exec(src);
  if (!m) throw new Error(`selector not found: ${sel}`);
  let i = src.indexOf("{", m.index);
  let depth = 0;
  const start = i + 1;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return src.slice(start, i);
  }
  throw new Error(`unbalanced block: ${sel}`);
}

/** Parse `--name: value;` declarations from a block body into a plain object. */
function cssVars(body) {
  const out = {};
  const re = /--([a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let m;
  while ((m = re.exec(body))) out[m[1]] = m[2].trim();
  return out;
}

/** Extract the balanced `[ ... ]` array literal that follows `export const NAME`. */
function arrayLiteral(src, name) {
  const at = src.indexOf(`export const ${name}`);
  if (at === -1) throw new Error(`export not found: ${name}`);
  // anchor on the `=` so a `[]` in the TS type annotation isn't picked up
  const eq = src.indexOf("=", at);
  let i = src.indexOf("[", eq);
  let depth = 0;
  const start = i;
  for (; i < src.length; i++) {
    if (src[i] === "[") depth++;
    else if (src[i] === "]" && --depth === 0) return src.slice(start, i + 1);
  }
  throw new Error(`unbalanced array: ${name}`);
}

// ---------------------------------------------------------------------------
// build the manifest
// ---------------------------------------------------------------------------

function build() {
  const cssRaw = stripCssComments(readFileSync(CSS, "utf8"));
  const root = cssVars(cssBlock(cssRaw, ":root"));
  const dark = cssVars(cssBlock(cssRaw, ".dark"));

  // --- foundation: theme-independent --n-* scale, sorted numerically ---
  const foundation = {};
  Object.keys(root)
    .filter((k) => /^n-\d+$/.test(k))
    .sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)))
    .forEach((k) => (foundation[k] = root[k]));

  // Resolve a semantic value: if it's `var(--n-XXX)`, swap in the triplet and
  // remember the reference; otherwise it's already a literal triplet.
  const resolve = (val) => {
    const m = /^var\(--(n-\d+)\)$/.exec(val || "");
    if (m && foundation[m[1]]) return { value: foundation[m[1]], ref: `var(--${m[1]})` };
    return { value: val };
  };

  // --- semantic: names + tailwind color keys come from tailwind-preset.ts ---
  const presetSrc = readFileSync(PRESET, "utf8");
  // matches e.g.  canvas: tok("bg-canvas"),   "surface-hover": tok("bg-surface-hover"),
  const tokRe = /["']?([a-z0-9-]+)["']?\s*:\s*tok\(\s*["']([a-z0-9-]+)["']\s*\)/gi;
  const semantic = {};
  let tm;
  while ((tm = tokRe.exec(presetSrc))) {
    const [, tailwindKey, varName] = tm;
    const light = resolve(root[varName]);
    const drk = resolve(dark[varName] ?? root[varName]);
    const entry = { role: ROLES[varName] || "", light: light.value };
    if (light.ref) entry.lightRef = light.ref;
    entry.dark = drk.value;
    if (drk.ref) entry.darkRef = drk.ref;
    entry.tailwind = tailwindKey;
    semantic[varName] = entry;
  }

  // --- radius roles ---
  const radius = {
    lg: root["radius-lg"],
    xl: root["radius-xl"],
    panel: root["radius-panel"],
  };

  // --- elevation shadows (themed) ---
  const shadow = {
    panel: { light: root["shadow-panel"], dark: dark["shadow-panel"] ?? root["shadow-panel"] },
    modal: { light: root["shadow-modal"], dark: dark["shadow-modal"] ?? root["shadow-modal"] },
  };

  // --- motion easings ---
  const easing = {
    out: root["ease-out"],
    "in-out": root["ease-in-out"],
    drawer: root["ease-drawer"],
  };

  // --- motion durations (semantic utilities reference these; zero under reduced-motion) ---
  const duration = {
    instant: root["dur-instant"],
    fast: root["dur-fast"],
    base: root["dur-base"],
    slow: root["dur-slow"],
    enter: root["dur-enter"],
  };

  // --- motion distances (entrance travel & parallax bounds; zero under reduced-motion) ---
  const distance = {
    xs: root["dist-xs"],
    sm: root["dist-sm"],
    md: root["dist-md"],
    lg: root["dist-lg"],
  };

  // --- stagger interval between sequentially revealed elements ---
  const stagger = root["stagger"];

  // --- presets from theme-presets.ts (parsed, not executed) ---
  const themeSrc = readFileSync(THEME, "utf8");

  const accents = [];
  const accentRe = /\{\s*name:\s*"([^"]+)",\s*hex:\s*"([^"]+)"\s*\}/g;
  let am;
  while ((am = accentRe.exec(arrayLiteral(themeSrc, "ACCENT_PRESETS")))) {
    accents.push({ name: am[1], hex: am[2] });
  }

  const grays = [];
  const grayRe = /name:\s*"([^"]+)",\s*swatch:\s*"([^"]+)"/g;
  let gm;
  while ((gm = grayRe.exec(arrayLiteral(themeSrc, "GRAY_PRESETS")))) {
    grays.push({ name: gm[1], swatch: gm[2] });
  }

  const radiusPresets = [];
  const rpRe = /\{\s*name:\s*"([^"]+)",\s*label:\s*"([^"]+)",\s*lg:\s*"([^"]+)",\s*xl:\s*"([^"]+)",\s*panel:\s*"([^"]+)"\s*\}/g;
  let rm;
  while ((rm = rpRe.exec(arrayLiteral(themeSrc, "RADIUS_PRESETS")))) {
    radiusPresets.push({ name: rm[1], label: rm[2], lg: rm[3], xl: rm[4], panel: rm[5] });
  }

  const scaling = (arrayLiteral(themeSrc, "SCALING_PRESETS").match(/-?\d+(?:\.\d+)?/g) || [])
    .map(Number);

  return {
    generated: "by scripts/gen-tokens.mjs — do not edit by hand (run: npm run tokens:gen)",
    foundation,
    semantic,
    radius,
    shadow,
    easing,
    duration,
    distance,
    stagger,
    presets: { accents, grays, radius: radiusPresets, scaling },
  };
}

function serialize(manifest) {
  return JSON.stringify(manifest, null, 2) + "\n";
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

const check = process.argv.includes("--check");

if (!check) {
  process.stdout.write("\n");
  printBanner("@shavin/ui", "Design Token Generator");
}

const spinner = !check
  ? startTaskSpinner({ name: "Tokens Manifest", desc: "Parsing foundation, semantic and preset scales" })
  : null;

const manifest = build();
const next = serialize(manifest);

if (check) {
  const current = existsSync(OUT) ? readFileSync(OUT, "utf8") : null;
  if (current === next) {
    console.log(`  ${c.success}${g.stepDone}${c.reset} tokens.json: up to date`);
    process.exit(0);
  }
  console.error(
    `  ${c.error}${g.stepFail}${c.reset} tokens.json is stale. Regenerate it with \`npm run tokens:gen\` and commit the result.`,
  );
  process.exit(1);
}

writeFileSync(OUT, next);
if (OUT !== ROOT_OUT) {
  writeFileSync(ROOT_OUT, next);
}

const semanticCount = Object.keys(manifest.semantic || {}).length;
const foundationCount = Object.keys(manifest.foundation || {}).length;
const accentsCount = manifest.presets?.accents?.length ?? 0;
const graysCount = manifest.presets?.grays?.length ?? 0;

spinner?.succeed(`Compiled ${semanticCount} semantic tokens & ${foundationCount} foundation scales`);

printCard({
  title: `${c.brand}${g.brand} Design Tokens Synchronized${c.reset}`,
  items: [
    { label: "Semantic Tokens:", value: `${c.fg}${semanticCount} active role tokens${c.reset}` },
    { label: "Foundation Scale:", value: `${c.fg}${foundationCount} neutral steps (--n-*)${c.reset}` },
    { label: "Presets:", value: `${c.fg}${accentsCount} accents, ${graysCount} neutral scales${c.reset}` },
    { label: "Geometry & Motion:", value: `${c.fg}Radius, shadows, easings & durations synced${c.reset}` },
  ],
  footer: `${c.fgSubtle}Target: ${OUT}${c.reset}`,
});
