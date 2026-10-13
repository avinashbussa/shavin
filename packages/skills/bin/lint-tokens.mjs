#!/usr/bin/env node
/**
 * bin/lint-tokens.mjs
 *
 * Deterministic, MCP-independent equivalent of @shavin/mcp's `validate_code` /
 * `autofix_code` tools. The regexes below are copied verbatim from
 * mcp-server/src/tools/validation.mjs so that a No-MCP install (this package
 * has zero runtime dependency on @shavin/mcp — see package.json) gets the
 * same enforcement an MCP-connected agent would get via `validate_code`,
 * instead of falling back to a purely self-graded checklist.
 *
 * Usage:
 *   node bin/lint-tokens.mjs <file-or-glob> [--fix] [--dense]
 *
 * Exit code: 0 if clean (or after --fix), 1 if violations remain.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { globSync } from "node:fs";
import { findHexViolations, matchHexColors } from "./hex-policy.mjs";

function validateCode(code) {
  const violations = [];
  // Media overlay scrims carry data-overlay="true" — intentional, skip those lines.
  // Also strip bgOverlays/bgImage/bgVideo prop values — they contain hex colors
  // and rgba() as DATA for the bg-media feature, not styling. Users intentionally
  // try different color shades to enhance background media.
  code = code.split(/\r?\n/)
    .filter((l) => !/data-overlay/.test(l))
    .map((l) => l.replace(/\bbg(Overlays|Image|Video)\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`)/g, "bg$1=\"\""))
    .join("\n");

  const hexMatches = matchHexColors(code);
  if (hexMatches.length > 0) {
    violations.push(
      `Hardcoded hex colors found: ${hexMatches.join(", ")}. Use semantic token utilities (bg-surface, text-fg, border-hairline, …) instead.`
    );
  }

  if (/rgb\s*\(|rgba\s*\(/.test(code)) {
    violations.push("Raw rgb()/rgba() literals found. Use semantic CSS custom properties via Tailwind utilities instead.");
  }

  const foundationVars = code.match(/--n-\d+/g) ?? [];
  if (foundationVars.length > 0) {
    violations.push(`Direct foundation variable references found: ${foundationVars.join(", ")}. Nothing outside global.css should reference --n-* directly.`);
  }

  const rawRadius = code.match(/\brounded-(sm|md|lg|xl|2xl|3xl|full)\b/g) ?? [];
  const radiusInClasses = rawRadius.filter((m) => !/import|type|interface/.test(code));
  if (radiusInClasses.length > 0) {
    violations.push(
      `Literal radius utilities found: ${radiusInClasses.join(", ")}. Use rounded-[var(--radius-lg)] or rounded-[var(--radius-panel)].`
    );
  }

  const rawColors = code.match(
    /\b(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g
  ) ?? [];
  if (rawColors.length > 0) {
    violations.push(
      `Raw Tailwind color scale utilities found: ${rawColors.join(", ")}. Use semantic utilities (bg-surface, text-fg, text-fg-muted, border-hairline, bg-accent, …) instead.`
    );
  }

  return violations;
}

function autofixCode(code) {
  let fixedCode = code;
  const fixesApplied = [];
  // Only rewrite hex the shared policy calls a colour — never ids in copy.
  let colorAt = new Set(findHexViolations(code).map((v) => v.index));

  fixedCode = fixedCode.replace(/#ffffff|#fff\b/gi, (match, offset, str) => {
    // skip intentional media-overlay scrim lines (data-overlay="true")
    const lineStart = str.lastIndexOf("\n", offset) + 1;
    const line = str.slice(lineStart, offset + match.length);
    if (/data-overlay/.test(line)) return match;
    // skip hex inside bgOverlays/bgImage/bgVideo prop values — DATA for bg-media
    if (/bg(Overlays|Image|Video)\s*=/.test(line)) return match;
    if (!colorAt.has(offset)) return match;
    fixesApplied.push("Replaced white hex with bg-surface / text-fg");
    return "var(--bg-surface)";
  });

  colorAt = new Set(findHexViolations(fixedCode).map((v) => v.index));
  fixedCode = fixedCode.replace(/#000000|#000\b/gi, (match, offset, str) => {
    const lineStart = str.lastIndexOf("\n", offset) + 1;
    const line = str.slice(lineStart, offset + match.length);
    if (/data-overlay/.test(line)) return match;
    // skip hex inside bgOverlays/bgImage/bgVideo prop values — DATA for bg-media
    if (/bg(Overlays|Image|Video)\s*=/.test(line)) return match;
    if (!colorAt.has(offset)) return match;
    fixesApplied.push("Replaced black hex with text-fg");
    return "var(--fg)";
  });

  fixedCode = fixedCode.replace(/\brounded-(lg|xl|2xl|3xl)\b/g, (match) => {
    fixesApplied.push(`Replaced literal ${match} with rounded-[var(--radius-panel)]`);
    return "rounded-[var(--radius-panel)]";
  });

  fixedCode = fixedCode.replace(/\brounded-(sm|md)\b/g, (match) => {
    fixesApplied.push(`Replaced literal ${match} with rounded-[var(--radius-lg)]`);
    return "rounded-[var(--radius-lg)]";
  });

  return { fixedCode, fixesApplied };
}

const args = process.argv.slice(2);
const doFix = args.includes("--fix");
const dense = args.includes("--dense");
const targets = args.filter((a) => !a.startsWith("--"));

if (targets.length === 0) {
  console.error("Usage: node bin/lint-tokens.mjs <file-or-glob> [--fix] [--dense]");
  process.exit(2);
}

let files = [];
for (const t of targets) {
  try {
    files.push(...globSync(t));
  } catch {
    files.push(t);
  }
}
files = [...new Set(files)];

let hadViolations = false;

for (const file of files) {
  let code;
  try {
    code = readFileSync(file, "utf8");
  } catch {
    console.error(`Could not read ${file}`);
    continue;
  }

  const violations = validateCode(code);

  if (violations.length === 0) {
    if (!dense) console.log(`PASS  ${file}`);
    continue;
  }

  hadViolations = true;

  if (dense) {
    console.log(`FAIL (${violations.length})  ${file}`);
  } else {
    console.log(`\n⚠ ${file} — ${violations.length} violation(s):`);
    violations.forEach((v, i) => console.log(`  ${i + 1}. ${v}`));
  }

  if (doFix) {
    const { fixedCode, fixesApplied } = autofixCode(code);
    if (fixesApplied.length > 0) {
      writeFileSync(file, fixedCode, "utf8");
      console.log(`  Applied ${fixesApplied.length} autofix(es) to ${file}:`);
      fixesApplied.forEach((f) => console.log(`    - ${f}`));
      console.log("  (raw Tailwind color-scale utilities and foundation vars are NOT autofixed — fix those by hand)");
    }
  }
}

process.exit(hadViolations && !doFix ? 1 : 0);
