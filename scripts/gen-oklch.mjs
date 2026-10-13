#!/usr/bin/env node
/**
 * OKLCH CSS Generator — transforms global.css (RGB source) into global-oklch.css.
 *
 * This is the build-time script that produces the v4-native OKLCH CSS file from
 * the existing RGB-authored global.css. The transform is purely mechanical:
 *
 *   1. Bare RGB triplets ("R G B") in custom property values → oklch(L C H)
 *   2. rgb(var(--token))                          → var(--token)
 *   3. rgb(var(--token) / <number>)               → color-mix(in oklch, var(--token), transparent Y%)
 *   4. rgb(var(--token) / var(--var))             → color-mix(in oklch, var(--token), transparent calc(100% - var(--var) * 100%))
 *   5. Literal rgb(0 0 0 / X) in shadows          → stays as-is (literal black, no benefit)
 *   6. Everything else (motion, radius, animations, @keyframes) → identical
 *
 * Usage:
 *   node scripts/gen-oklch.mjs               # write global-oklch.css
 *   node scripts/gen-oklch.mjs --check       # exit non-zero if stale (CI)
 *
 * Zero-dependency ESM. Imports the conversion engine from @shavin/ui.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { hexToRgb, rgbTripletToOklch, oklchToCss } from "../packages/ui/src/lib/color-space.mjs";
import { c, g, fmt, printBanner, printCard, startTaskSpinner } from "./lib/term-ui.mjs";

const ROOT = join(fileURLToPath(import.meta.url), "..", "..");
const SRC = join(ROOT, "packages", "ui", "src", "styles", "global.css");
const OUT = join(ROOT, "packages", "ui", "src", "styles", "global-oklch.css");

// ─────────────────────────────────────────────────────────────────────────────
// Transform pipeline
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a bare RGB triplet string "R G B" to an oklch() CSS string.
 * @param {string} triplet
 * @returns {string}
 */
function tripletToOklchCss(triplet) {
  const oklch = rgbTripletToOklch(triplet);
  return oklchToCss(oklch);
}

/**
 * Transform the full CSS source from RGB to OKLCH.
 * @param {string} css
 * @returns {string}
 */
function transform(css) {
  let out = css;

  // ── Step 1: Replace header ────────────────────────────────────────────────
  // Find the first */ in the file (end of the header comment) and replace
  // everything before it with the generated header.
  const headerEnd = out.indexOf("*/");
  if (headerEnd !== -1) {
    out = `/* =========================================================================\n   Shavin design system — OKLCH variant (GENERATED, do not edit).\n   Source: global.css (RGB). Regenerate via: npm run tokens:oklch\n   All color custom properties use oklch() values. Opacity is handled via\n   color-mix() instead of rgb(var() / alpha).\n   ========================================================================= */` + out.slice(headerEnd + 2);
  }

  // ── Step 2: Convert bare RGB triplets in custom property definitions ──────
  // Pattern: --name: R G B;  (three integers, no units, in a CSS variable)
  // Must NOT match: shadow values (have units like px), durations (ms), etc.
  out = out.replace(
    /(--[a-z][a-z0-9-]*:\s*)(\d{1,3}\s+\d{1,3}\s+\d{1,3})(\s*;)/g,
    (match, prefix, triplet, suffix) => tripletToOklchCss(triplet) === "NaN NaN NaN"
      ? match // safety: skip if conversion fails
      : `${prefix}${tripletToOklchCss(triplet)}${suffix}`
  );

  // ── Step 3: Convert rgb(var(--token) / var(--var)) → color-mix ───────────
  // Handle dynamic opacity (e.g. --panel-opacity, --overlay-opacity)
  out = out.replace(
    /rgb\(var\((--[a-z][a-z0-9-]*)\)\s*\/\s*var\((--[a-z][a-z0-9-]*)\)\)/g,
    "color-mix(in oklch, var($1), transparent calc(100% - var($2) * 100%))"
  );

  // ── Step 4: Convert rgb(var(--token) / <number>) → color-mix ─────────────
  // Handle fixed opacity (e.g. / 0.12, / 0.2)
  out = out.replace(
    /rgb\(var\((--[a-z][a-z0-9-]*)\)\s*\/\s*(0?\.\d+|\d+\.?\d*)\)/g,
    (_, token, alpha) => {
      const pct = Math.round((1 - parseFloat(alpha)) * 100);
      return `color-mix(in oklch, var(${token}), transparent ${pct}%)`;
    }
  );

  // ── Step 5: Convert rgb(var(--token)) → var(--token) ─────────────────────
  // Simple wrapper removal — OKLCH values are already valid CSS colors
  out = out.replace(
    /rgb\(var\((--[a-z][a-z0-9-]*)\)\)/g,
    "var($1)"
  );

  // ── Step 6: Update @import for brand-tokens ───────────────────────────────
  out = out.replace(
    /@import "\.\/brand-tokens\.css"/,
    '@import "./brand-tokens-oklch.css"'
  );

  return out;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

function main() {
  const check = process.argv.includes("--check");

  if (!check) {
    process.stdout.write("\n");
    printBanner("@shavin/ui", "OKLCH CSS Generator");
  }

  const spinner = !check
    ? startTaskSpinner({ name: "OKLCH Transform", desc: "Converting bare RGB triplets and color-mix opacity" })
    : null;

  const src = readFileSync(SRC, "utf8");
  const generated = transform(src);

  if (check) {
    let existing = "";
    try {
      existing = readFileSync(OUT, "utf8");
    } catch {
      console.error(`  ${c.error}${g.stepFail}${c.reset} global-oklch.css does not exist. Run: \`npm run tokens:oklch\``);
      process.exit(1);
    }
    if (existing !== generated) {
      console.error(`  ${c.error}${g.stepFail}${c.reset} global-oklch.css is stale. Run: \`npm run tokens:oklch\``);
      process.exit(1);
    }
    console.log(`  ${c.success}${g.stepDone}${c.reset} global-oklch.css: up to date`);
    process.exit(0);
  }

  writeFileSync(OUT, generated, "utf8");
  const lines = generated.split("\n").length;

  spinner?.succeed(`Transformed ${lines} lines into native oklch() CSS`);

  printCard({
    title: `${c.brand}${g.brand} OKLCH Stylesheet Generated${c.reset}`,
    items: [
      { label: "Lines:", value: `${c.fg}${lines} CSS lines${c.reset}` },
      { label: "Color Spaces:", value: `${c.fg}sRGB to OKLCH perceptual lightness & chroma${c.reset}` },
      { label: "Opacity Engine:", value: `${c.fg}color-mix(in oklch, ...) for dynamic/fixed alphas${c.reset}` },
    ],
    footer: `${c.fgSubtle}Target: ${OUT}${c.reset}`,
  });
}

main();
