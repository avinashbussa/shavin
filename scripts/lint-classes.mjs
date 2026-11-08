#!/usr/bin/env node
/**
 * Class-validity lint (P0.3). Catches the silent-failure class of bug that
 * TypeScript and the build both miss: a misspelled or non-existent utility
 * that Tailwind never generates, so it renders NOTHING (e.g. `shadow-panl`,
 * `text-fg-mutedd`, `bg-surfce`).
 *
 * Scope of what it validates: the design system's OWN vocabulary — the custom
 * `shadow-*` utilities and the semantic color tokens — across the families
 * where those tokens are unambiguous (bg/fill/stroke/caret/from/via/to,
 * plus text- and border- with their size/side keywords split out). The
 * semantic allowlist is DERIVED from tailwind-preset.ts, so it can never drift
 * from the real tokens. Stock structural utilities (flex, px-4, grid…) and any
 * arbitrary value (`bg-[...]`, `shadow-[...]`) are left alone.
 *
 * This is deliberately not a full Tailwind validator — it targets exactly the
 * classes whose typos fail silently, which are the DS's custom/semantic ones.
 *
 * Escape hatch: // ds-lint-disable-next-line no-unknown-class — <reason>
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { stripComments, walk } from "./lib/scan.mjs";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");

// --- derive the semantic color-token allowlist from the preset (no drift) ---
const presetPath = existsSync(join(ROOT, "packages", "ui", "tailwind-preset.ts"))
  ? join(ROOT, "packages", "ui", "tailwind-preset.ts")
  : join(ROOT, "tailwind-preset.ts");
const presetSrc = readFileSync(presetPath, "utf8");
// keys look like:  canvas: tok("bg-canvas"),   "surface-hover": tok(...),
const SEMANTIC = new Set();
for (const m of presetSrc.matchAll(/(?:^|\s)(?:"([\w-]+)"|([\w-]+))\s*:\s*(?:tok\(|"(?:var|rgb)\()/g)) {
  SEMANTIC.add(m[1] ?? m[2]);
}

// App-extended colors from apps/*/tailwind.config.* (e.g. Studio-scoped canvas/selection tokens)
const appsDir = join(ROOT, "apps");
if (existsSync(appsDir)) {
  for (const app of readdirSync(appsDir)) {
    for (const ext of ["ts", "js", "mjs"]) {
      const cfgPath = join(appsDir, app, `tailwind.config.${ext}`);
      if (existsSync(cfgPath)) {
        const cfgSrc = readFileSync(cfgPath, "utf8");
        for (const m of cfgSrc.matchAll(/(?:^|\s)(?:"([\w-]+)"|([\w-]+))\s*:\s*(?:"(?:var|rgb)\(|tok\()/g)) {
          SEMANTIC.add(m[1] ?? m[2]);
        }
      }
    }
  }
}
// custom boxShadow keys:  panel: "var(--shadow-panel)",
const SHADOW_KEYS = new Set(["", "sm", "md", "lg", "xl", "2xl", "inner", "none"]);
for (const m of presetSrc.matchAll(/boxShadow:\s*\{([\s\S]*?)\}/g)) {
  for (const k of m[1].matchAll(/(?:^|\s)([\w-]+)\s*:/g)) SHADOW_KEYS.add(k[1]);
}

// universal color keywords valid in any color family
const COLOR_KEYWORDS = new Set(["transparent", "current", "inherit", "black", "white", "none"]);
// text- utilities that are NOT colors (size / align / wrap / overflow)
const TEXT_NONCOLOR = new Set([
  "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl", "7xl", "8xl", "9xl",
  "left", "center", "right", "justify", "start", "end",
  "wrap", "nowrap", "balance", "pretty", "ellipsis", "clip",
]);
// border- utilities that are width/side/style, not color
const BORDER_NONCOLOR = new Set([
  "", "0", "2", "4", "8", "x", "y", "s", "e", "t", "r", "b", "l",
  "solid", "dashed", "dotted", "double", "hidden", "none", "collapse", "separate",
  "color", "width", "style", "spacing",
]);

const isArbitrary = (v) => v.includes("[");
// strip the /opacity modifier (bg-black/40 → black) before validating a color
const colorPart = (v) => v.split("/")[0];
const okColor = (v) => {
  const c = colorPart(v);
  return SEMANTIC.has(c) || COLOR_KEYWORDS.has(c) || isArbitrary(v);
};

/** Given a bare utility (variants already stripped), return an error msg or null. */
function checkUtility(u) {
  if (isArbitrary(u)) return null; // any arbitrary value is Tailwind-legal
  const dash = u.indexOf("-");
  const family = dash === -1 ? u : u.slice(0, dash);
  const rest = dash === -1 ? "" : u.slice(dash + 1);
  const rc = colorPart(rest);

  if (family === "shadow") {
    return SHADOW_KEYS.has(rest) ? null : `unknown shadow utility "shadow-${rest}" — did you mean shadow-panel/shadow-modal?`;
  }
// unambiguous color-only families (with structural bg exceptions)
  if (["bg", "fill", "stroke", "caret", "from", "via", "to"].includes(family)) {
    if (rest === "") return null;
    if (family === "bg" && (rest.startsWith("gradient-to-") || /^(?:cover|contain|center|top|bottom|left|right|no-repeat|repeat|fixed|local|scroll|clip-text)$/.test(rest))) {
      return null;
    }
    return okColor(rest) ? null : `unknown color token "${family}-${rest}" — not a semantic token (see tailwind-preset.ts)`;
  }
  // families that are color OR width/structure — allow their keywords too
  if (["ring", "outline", "divide"].includes(family)) {
    if (/^(?:[xy](?:-\d+)?|\d+|offset-\d+|inset|solid|dashed|dotted|none|reverse)$/.test(rest)) return null;
    if (rest === "") return null;
    // ring-offset-<color>: strip the width keyword, validate the color part
    const offsetColor = rest.startsWith("offset-") ? rest.slice("offset-".length) : rest;
    return okColor(offsetColor) ? null : `unknown color token "${family}-${rest}" — not a semantic token`;
  }
  if (family === "text") {
    if (rest === "") return null;
    if (rest.startsWith("opacity-") || rest.startsWith("decoration-")) return null;
    if (SEMANTIC.has(rc) || COLOR_KEYWORDS.has(rc) || TEXT_NONCOLOR.has(rest)) return null;
    return `unknown text utility "text-${rest}" — not a semantic color or size keyword`;
  }
  if (family === "border") {
    if (rest === "" || rest.startsWith("opacity-")) return null;
    if (BORDER_NONCOLOR.has(rest) || SEMANTIC.has(rc) || COLOR_KEYWORDS.has(rc)) return null;
    const seg = rest.split("-")[0];
    if (BORDER_NONCOLOR.has(seg)) return null;
    return `unknown border token "border-${rest}" — not a semantic color`;
  }
  return null; // family we don't validate
}

// strip leading variants (hover:, focus:, data-[..]:, dark:, sm:, active:, disabled:, group-*: …) and ! important
function baseUtility(cls) {
  let c = cls;
  // remove variant segments: split on ":" but respect [] brackets (data-[state=open]:)
  let depth = 0, lastColon = -1;
  for (let i = 0; i < c.length; i++) {
    const ch = c[i];
    if (ch === "[") depth++;
    else if (ch === "]") depth--;
    else if (ch === ":" && depth === 0) lastColon = i;
  }
  if (lastColon !== -1) c = c.slice(lastColon + 1);
  if (c.startsWith("!")) c = c.slice(1);
  return c;
}

// extract candidate class tokens from a line: contents of every string literal,
// split on whitespace. (Comments already stripped upstream.)
function classCandidates(line) {
  const out = [];
  for (const m of line.matchAll(/["'`]([^"'`]*)["'`]/g)) {
    const body = m[1];
    // only treat as classes if it looks class-ish (no spaces-only prose with punctuation)
    for (const tok of body.split(/\s+/)) {
      if (!tok) continue;
      if (!/^[A-Za-z[]/.test(tok)) continue; // classes start with a letter or [
      // prose/JS, not a class. Backslash/quote fragments come from escaped
      // quotes inside generated rawCode string literals (e.g. JSON payload
      // samples like \"text-fg\": \"var(--fg)\") — never real class tokens.
      if (/[.,;()<>{}=?!\\"]/.test(tok)) continue; // prose/JS, not a class
      out.push(tok);
    }
  }
  return out;
}

// WCAG 2.4.7: `focus:outline-none` / `focus-visible:outline-none` beats the global
// `*:focus-visible` ring, so in @shavin/ui it needs a visible replacement in the same
// string. Floating panels (shadow-panel / shadow-modal) are exempt: they only take
// programmatic focus from Radix, never keyboard focus of their own.
function checkFocusRemoval(line) {
  for (const m of line.matchAll(/["'`]([^"'`]*)["'`]/g)) {
    const body = m[1];
    const hit = body.match(/(?:^|\s)(focus(?:-visible)?:outline-none)(?=\s|$)/);
    if (!hit) continue;
    if (/\bshadow-(?:panel|modal)\b/.test(body)) continue;
    if (/focus-visible:(?:ring-[2-9]|outline-\d|outline-\[)|focus-ring-within/.test(body)) continue;
    return { cls: hit[1], msg: "removes the focus ring with no replacement (WCAG 2.4.7); drop it, or add focus-visible:outline-2 / ring-2" };
  }
  return null;
}

// Every kit under kits/<name>/src (private, sold separately).
function kitSourceDirs() {
  const dir = join(ROOT, "kits");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => join(dir, d.name, "src"));
}

const targets = [
  join(ROOT, "packages", "ui", "src"),
  join(ROOT, "packages", "block-schema", "src"),
  join(ROOT, "packages", "block-schema", "blocks"),
  join(ROOT, "packages", "blocks-pro", "blocks"),
  join(ROOT, "packages", "blocks-pro", "src"),
  join(ROOT, "packages", "block-renderer", "src"),
  join(ROOT, "apps", "docs", "src"),
  join(ROOT, "apps", "website", "src"),
  join(ROOT, "apps", "studio", "src"),
  join(ROOT, "apps", "community", "src"),
  join(ROOT, "apps", "kits", "src"),
  join(ROOT, "playground", "src"),
  ...kitSourceDirs(),
  join(ROOT, "src"),
].filter(existsSync);
const files = targets.flatMap((d) => walk(d));
const violations = [];
for (const file of files) {
  const rel = relative(ROOT, file);
  const raw = readFileSync(file, "utf8").split("\n");
  const lines = stripComments(raw.join("\n")).split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (/ds-lint-disable-line\s+no-unknown-class\b/.test(raw[i] || "")) continue;
    if (/ds-lint-disable-next-line\s+no-unknown-class\b/.test(raw[i - 1] || "")) continue;
    // Skip html: prop lines — these strings are JSX source displayed as code
    // samples (Docs/Studio), never rendered, so their class tokens are
    // content, not live utilities. (Same reason data-swatch is ignored.)
    if (/^\s*html:\s*["'`]/.test(lines[i] || "")) continue;
    for (const cls of classCandidates(lines[i])) {
      const msg = checkUtility(baseUtility(cls));
      if (msg) violations.push({ rel, ln: i + 1, cls, msg });
    }
    const focusMsg = rel.startsWith(join("packages", "ui", "src")) ? checkFocusRemoval(lines[i]) : null;
    if (focusMsg) violations.push({ rel, ln: i + 1, cls: focusMsg.cls, msg: focusMsg.msg });
  }
}

import { c, g, fmt } from './lib/term-ui.mjs';

if (violations.length === 0) {
  console.log(`  ${c.success}${g.stepDone}${c.reset} ${c.fg}class-lint:${c.reset} ${c.fgSubtle}${files.length} files clean (${SEMANTIC.size} tokens, ${SHADOW_KEYS.size} shadows verified)${c.reset}`);
  process.exit(0);
}
console.error(`\n  ${c.error}${g.stepFail}${c.reset} ${c.bold}${c.error}class-lint:${c.reset} ${violations.length} unknown/misspelled class(es) found:\n`);
for (const v of violations) {
  console.error(`    ${c.brand}${v.rel}:${v.ln}${c.reset}  "${c.error}${v.cls}${c.reset}"  ${v.msg}`);
}
console.error(`\n  ${c.fgMuted}Fix the spelling, or if intentional add:\n    // ds-lint-disable-next-line no-unknown-class — <reason>${c.reset}\n`);
process.exit(1);
