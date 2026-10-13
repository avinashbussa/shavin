/**
 * @shavin/cli — Brand Token Engine (pure functions)
 *
 * Zero-dependency ESM. Shared by:
 *   - scripts/shavin-brand-tokens.mjs (monorepo root)
 *   - packages/cli/src/commands/brand.mjs (consumer CLI: `npx shavin brand`)
 *
 * Exports the luminance engine, CSS parser, CSS rebuilder, and
 * Tailwind preset generator. Deterministic output (stable key order).
 *
 * Color-space aware: all functions support both "rgb" (default, v3+v4-rgb)
 * and "oklch" (v4-oklch path) output modes.
 */

// ── Import the shared OKLCH conversion engine ──────────────────────────────
import {
  hexToOklch,
  oklchToCss,
  oklchToRgbTriplet,
  oklchLuminance,
  oklchForegroundFor,
  oklchHoverFor,
  oklchTextFor,
  oklchAchromaticInversion,
} from "../../../ui/src/lib/color-space.mjs";

// ═══════════════════════════════════════════════════════════════════════
// LUMINANCE ENGINE — identical math to theme-presets.ts
// Duplicated here (pure JS, no React) to keep the script zero-dependency.
// If the thresholds in theme-presets.ts change, mirror them here.
// ═══════════════════════════════════════════════════════════════════════

export function hexToTriplet(hex) {
  const m = hex.replace("#", "");
  const full = m.length === 3
    ? m.split("").map((c) => c + c).join("")
    : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function mix(triplet, toward, amount) {
  const [r, g, b] = triplet.split(" ").map(Number);
  const m = (c) => Math.round(c + (toward - c) * amount);
  return `${m(r)} ${m(g)} ${m(b)}`;
}

export function relativeLuminance(triplet) {
  const [r, g, b] = triplet.split(" ").map((c) => Number(c) / 255);
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function foregroundFor(triplet) {
  return relativeLuminance(triplet) > 0.45 ? "10 10 12" : "255 255 255";
}

export function hoverFor(triplet, isDark) {
  return mix(triplet, isDark ? 255 : 0, 0.12);
}

export function textFor(triplet, isDark) {
  const lum = relativeLuminance(triplet);
  if (isDark) {
    if (lum < 0.22) {
      const amount = Math.min(0.80, Math.max(0.45, 0.70 - lum * 1.8));
      return mix(triplet, 255, amount);
    }
    return triplet;
  }
  if (lum > 0.35) {
    const amount = Math.min(0.68, Math.max(0.42, 0.28 + lum * 0.45));
    return mix(triplet, 0, amount);
  }
  return triplet;
}

/** Resolves a brand color triplet with achromatic inversion. */
export function resolveTriplet(triplet, isDark) {
  const lum = relativeLuminance(triplet);
  if (isDark && lum < 0.12) return "255 255 255";
  if (!isDark && lum > 0.85) return "10 10 12";
  return triplet;
}

// ═══════════════════════════════════════════════════════════════════════
// CSS PARSER — extracts brand color declarations from the INPUT
// section only (everything between "INPUT" and "GENERATED" markers).
// ═══════════════════════════════════════════════════════════════════════

/**
 * Parses brand-tokens.css and returns declarations from the INPUT
 * section of the :root block.
 *
 * Each declaration: { name, value, isVarRef, isHex }
 *   name:      the color name without the --brand- prefix
 *   value:     raw string after the colon (trimmed, without ;)
 *   isVarRef:  true if value is `var(--accent)` or similar
 *   isHex:     true if value is a #hex literal
 */
export function parseBrandTokens(cssText) {
  const declarations = [];

  // Extract the content between the INPUT section marker and the
  // GENERATED section marker. We anchor on the box-drawing marker
  // pattern (─── INPUT ───) to avoid matching the word "INPUT" in
  // the header comment text.
  const inputMatch = cssText.match(/─{3}\s*INPUT[\s\S]*?(?=─{3}\s*GENERATED)/);
  if (!inputMatch) return { declarations };

  const inputSection = inputMatch[0];

  // Match all `--brand-{name}: {value};` declarations (active ones
  // only — commented-out lines are skipped because they start with
  // `/*` not `--brand-`).
  const declRegex = /^\s*--brand-([\w-]+)\s*:\s*([^;]+);/gm;
  let match;
  while ((match = declRegex.exec(inputSection)) !== null) {
    const [, name, rawValue] = match;
    const value = rawValue.trim();
    const isVarRef = /^var\(/.test(value);
    const isHex = /^#[0-9a-fA-F]{3,8}$/.test(value);
    declarations.push({ name, value, isVarRef, isHex });
  }

  return { declarations };
}

// ═══════════════════════════════════════════════════════════════════════
// TOKEN GENERATOR — computes all derived tokens for each brand color
// ═══════════════════════════════════════════════════════════════════════

/**
 * For each brand color with a hex value, compute the full cluster:
 *   --brand-{name}              (resolved triplet, achromatic inversion)
 *   --brand-{name}-fg           (black or white foreground for solid fills)
 *   --brand-{name}-hover        (±12% mix)
 *   --brand-{name}-contrast     (WCAG-safe text color)
 *   --brand-{name}-text         (alias of contrast)
 *   --brand-{name}-subtle       (rgb(... / 0.12) light, 0.15 dark)
 *   --brand-{name}-subtle-hover (rgb(... / 0.18) light, 0.22 dark)
 *
 * For var() aliases (like --brand-primary: var(--accent)), just pass
 * through — no computation needed.
 *
 * Returns:
 *   lightLines: string[]   CSS lines for :root GENERATED section
 *   darkLines:  string[]   CSS lines for .dark GENERATED section
 *   colorNames: string[]   List of color names (for Tailwind preset)
 *   aliasNames: string[]   List of alias names (for Tailwind preset)
 */
export function computeBrandTokens(declarations) {
  const lightLines = [];
  const darkLines = [];
  const colorNames = []; // hex-based colors → full derived token set
  const aliasNames = []; // var() aliases → just the base token

  for (const decl of declarations) {
    if (decl.isVarRef) {
      // Pass-through alias (e.g. --brand-primary: var(--accent))
      lightLines.push(`  --brand-${decl.name}: ${decl.value};`);
      aliasNames.push(decl.name);
      continue;
    }

    if (!decl.isHex) continue;

    const baseTriplet = hexToTriplet(decl.value);
    const lightTriplet = resolveTriplet(baseTriplet, false);
    const darkTriplet = resolveTriplet(baseTriplet, true);
    const n = decl.name;

    colorNames.push(n);

    // Light mode
    lightLines.push(`  --brand-${n}: ${lightTriplet};`);
    lightLines.push(`  --brand-${n}-fg: ${foregroundFor(lightTriplet)};`);
    lightLines.push(`  --brand-${n}-hover: ${hoverFor(lightTriplet, false)};`);
    lightLines.push(`  --brand-${n}-contrast: ${textFor(lightTriplet, false)};`);
    lightLines.push(`  --brand-${n}-text: ${textFor(lightTriplet, false)};`);
    lightLines.push(`  --brand-${n}-subtle: rgb(var(--brand-${n}) / 0.12);`);
    lightLines.push(`  --brand-${n}-subtle-hover: rgb(var(--brand-${n}) / 0.18);`);

    // Dark mode
    darkLines.push(`  --brand-${n}: ${darkTriplet};`);
    darkLines.push(`  --brand-${n}-fg: ${foregroundFor(darkTriplet)};`);
    darkLines.push(`  --brand-${n}-hover: ${hoverFor(darkTriplet, true)};`);
    darkLines.push(`  --brand-${n}-contrast: ${textFor(darkTriplet, true)};`);
    darkLines.push(`  --brand-${n}-text: ${textFor(darkTriplet, true)};`);
    darkLines.push(`  --brand-${n}-subtle: rgb(var(--brand-${n}) / 0.15);`);
    darkLines.push(`  --brand-${n}-subtle-hover: rgb(var(--brand-${n}) / 0.22);`);
  }

  return { lightLines, darkLines, colorNames, aliasNames };
}

// ═══════════════════════════════════════════════════════════════════════════
// OKLCH-MODE TOKEN GENERATOR — produces oklch() CSS strings for v4-oklch path
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Same as computeBrandTokens but outputs oklch() CSS strings instead of
 * RGB triplets. Used when colorSpace === "oklch".
 *
 * Key differences from RGB path:
 * - Base color: oklch() with achromatic inversion
 * - Foreground: oklch() black/white (L=0.18 or L=1)
 * - Hover: oklch() mixed toward white (dark) or black (light)
 * - Contrast/Text: oklch() with perceptual lightening/darkening
 * - Subtle: color-mix(in oklch, var(--brand-N) 12%, transparent)
 *
 * @param {Array} declarations — parsed from parseBrandTokens()
 * @returns {{ lightLines, darkLines, colorNames, aliasNames }}
 */
export function computeBrandTokensOklch(declarations) {
  const lightLines = [];
  const darkLines = [];
  const colorNames = [];
  const aliasNames = [];

  for (const decl of declarations) {
    if (decl.isVarRef) {
      lightLines.push(`  --brand-${decl.name}: ${decl.value};`);
      aliasNames.push(decl.name);
      continue;
    }

    if (!decl.isHex) continue;

    const n = decl.name;
    const baseOklch = hexToOklch(decl.value);
    const lightO = oklchAchromaticInversion(baseOklch, false);
    const darkO = oklchAchromaticInversion(baseOklch, true);

    colorNames.push(n);

    // Light mode
    lightLines.push(`  --brand-${n}: ${oklchToCss(lightO)};`);
    lightLines.push(`  --brand-${n}-fg: ${oklchToCss(oklchForegroundFor(lightO))};`);
    lightLines.push(`  --brand-${n}-hover: ${oklchToCss(oklchHoverFor(lightO, false, 0.12))};`);
    lightLines.push(`  --brand-${n}-contrast: ${oklchToCss(oklchTextFor(lightO, false))};`);
    lightLines.push(`  --brand-${n}-text: ${oklchToCss(oklchTextFor(lightO, false))};`);
    lightLines.push(`  --brand-${n}-subtle: color-mix(in oklch, var(--brand-${n}) 12%, transparent);`);
    lightLines.push(`  --brand-${n}-subtle-hover: color-mix(in oklch, var(--brand-${n}) 18%, transparent);`);

    // Dark mode
    darkLines.push(`  --brand-${n}: ${oklchToCss(darkO)};`);
    darkLines.push(`  --brand-${n}-fg: ${oklchToCss(oklchForegroundFor(darkO))};`);
    darkLines.push(`  --brand-${n}-hover: ${oklchToCss(oklchHoverFor(darkO, true, 0.12))};`);
    darkLines.push(`  --brand-${n}-contrast: ${oklchToCss(oklchTextFor(darkO, true))};`);
    darkLines.push(`  --brand-${n}-text: ${oklchToCss(oklchTextFor(darkO, true))};`);
    darkLines.push(`  --brand-${n}-subtle: color-mix(in oklch, var(--brand-${n}) 15%, transparent);`);
    darkLines.push(`  --brand-${n}-subtle-hover: color-mix(in oklch, var(--brand-${n}) 22%, transparent);`);
  }

  return { lightLines, darkLines, colorNames, aliasNames };
}

// ═══════════════════════════════════════════════════════════════════════
// CSS REBUILDER — reconstructs the file from a template, preserving
// only the INPUT section from the original and injecting fresh
// GENERATED content.
// ═══════════════════════════════════════════════════════════════════════

/**
 * Extracts the INPUT section content (the actual CSS declarations
 * and comments between the INPUT and GENERATED markers) from the
 * original file, so we can preserve it verbatim in the rebuilt file.
 */
export function extractInputSection(cssText) {
  // We need to extract the INPUT section content from within the
  // :root/.light selector block only, not from the header comment.
  //
  // Strategy: find the first `:root` or `.light` selector, then
  // within that block find the INPUT comment block through the
  // declarations, stopping before the GENERATED comment block.
  const rootMatch = cssText.match(/(:root\s*,?\s*\.light\s*\{)([\s\S]*?)\}/);
  if (!rootMatch) return null;
  const blockContent = rootMatch[2];

  // Match from the opening `/*` of the INPUT comment to just before
  // the opening `/*` of the GENERATED comment.
  const inputSpan = blockMatch(blockContent);
  if (!inputSpan) return null;
  return inputSpan;
}

/**
 * Within a selector block's content, find the INPUT→GENERATED span.
 * Returns the content from the INPUT comment's `/*` through all
 * declarations, up to (but not including) the GENERATED comment's `/*`.
 */
function blockMatch(blockContent) {
  // Find the INPUT marker position (the box-drawing chars + "INPUT")
  const inputMarkerIdx = blockContent.indexOf("INPUT");
  if (inputMarkerIdx === -1) return null;

  // Backtrack from the INPUT marker to find the opening `/*` of its comment
  const inputCommentStart = blockContent.lastIndexOf("/*", inputMarkerIdx);
  if (inputCommentStart === -1) return null;

  // Include any leading whitespace (indentation) before the `/*`
  // but only spaces/tabs, not newlines (to avoid extra blank lines).
  let startPos = inputCommentStart;
  while (startPos > 0 && /[^\S\n]/.test(blockContent[startPos - 1])) {
    startPos--;
  }

  // Find the GENERATED marker position (must be after INPUT)
  const genMarkerIdx = blockContent.indexOf("GENERATED", inputMarkerIdx + 1);
  if (genMarkerIdx === -1) return null;

  // Backtrack from the GENERATED marker to find the opening `/*` of its comment
  const genCommentStart = blockContent.lastIndexOf("/*", genMarkerIdx);
  if (genCommentStart === -1 || genCommentStart <= inputCommentStart) return null;

  // Return the content from the leading whitespace before INPUT's `/*`
  // to just before GENERATED's `/*`, trimmed of trailing whitespace.
  return blockContent.slice(startPos, genCommentStart).trimEnd();
}

/**
// ═══════════════════════════════════════════════════════════════════════════
// OKLCH CSS REBUILDER — same structure as rebuildCSS but for oklch() output
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Same as rebuildCSS but the GENERATED sections use oklch() values
 * and color-mix() for subtle backgrounds instead of rgb(... / alpha).
 */
export function rebuildCSOklch(originalText, tokens) {
  const inputContent = extractInputSection(originalText);
  const inputBlock = inputContent
    ? `\n${inputContent}`
    : `\n  /* ─── INPUT ───────────────────────────────────────────────────────────
     Enter hex values only. Do not delete --brand-primary.
     --brand-primary always aliases --accent by default so the system
     works with zero customization. Override with a #hex to set a
     custom primary that still gets all derived tokens.
     ──────────────────────────────────────────────────────────────────── */
  --brand-primary: var(--accent);
  /* --brand-coral: #FF6B6B; */
  /* --brand-teal: #14B8A6; */
`;

  const lightGenerated = tokens.lightLines.length > 0
    ? tokens.lightLines.join("\n")
    : "  /* (no brand colors defined — add hex values in the INPUT section above) */";

  const darkGenerated = tokens.darkLines.length > 0
    ? tokens.darkLines.join("\n")
    : "  /* (no brand colors defined — add hex values in the INPUT section above) */";

  return `/* =========================================================================
   Shavin Brand Color Tokens (OKLCH)

   This file lets you declare custom brand colors alongside the design
   system's semantic tokens. Enter ONLY hex values in the INPUT section
   below — the \`shavin brand:gen\` predev script auto-computes every
   derived token (fg, hover, contrast, text, subtle backgrounds) using
   the OKLCH perceptual color engine, then writes the results to the
   GENERATED section in oklch() format.

   This is the OKLCH variant — import this instead of brand-tokens.css
   when using @shavin/ui/global-oklch.css (Tailwind v4 OKLCH path).

   ── Workflow ──────────────────────────────────────────────────────────
   1. Add a line like  --brand-coral: #FF6B6B;  in the INPUT section.
   2. Run \`npm run brand:gen\` (or \`npm run dev\` — predev fires it).
   3. Use the tokens via Tailwind utilities: bg-brand-coral,
      text-brand-coral, border-brand-coral/50, bg-brand-coral-subtle,
      text-brand-coral-contrast, etc.
   ========================================================================= */

:root,
.light {
${inputBlock}

  /* ─── GENERATED ──────────────────────────────────────────────────────
     Do NOT edit — auto-computed by shavin-brand-tokens (OKLCH mode).
     ──────────────────────────────────────────────────────────────────── */
${lightGenerated}

}

.dark {

  /* ─── GENERATED (dark overrides) ─────────────────────────────────────
     Do NOT edit — auto-computed by shavin-brand-tokens (OKLCH mode).
     ──────────────────────────────────────────────────────────────────── */
${darkGenerated}

}
`;
}

/**
 * Rebuilds the entire CSS file using a stable template structure.
 * The header comment and INPUT section are preserved; GENERATED
 * sections are injected fresh.
 */
export function rebuildCSS(originalText, tokens) {
  // Extract the INPUT section content from the original file.
  // This preserves user-entered hex values and comments verbatim.
  const inputContent = extractInputSection(originalText);

  // Fallback: if we can't extract INPUT, use the default template
  const inputBlock = inputContent
    ? `\n${inputContent}`
    : `
  /* ─── INPUT ───────────────────────────────────────────────────────────
     Enter hex values only. Do not delete --brand-primary.
     --brand-primary always aliases --accent by default so the system
     works with zero customization. Override with a #hex to set a
     custom primary that still gets all derived tokens.
     ──────────────────────────────────────────────────────────────────── */
  --brand-primary: var(--accent);
  /* --brand-coral: #FF6B6B; */
  /* --brand-teal: #14B8A6; */
`;

  const lightGenerated = tokens.lightLines.length > 0
    ? tokens.lightLines.join("\n")
    : "  /* (no brand colors defined — add hex values in the INPUT section above) */";

  const darkGenerated = tokens.darkLines.length > 0
    ? tokens.darkLines.join("\n")
    : "  /* (no brand colors defined — add hex values in the INPUT section above) */";

  return `/* =========================================================================
   Shavin Brand Color Tokens

   This file lets you declare custom brand colors alongside the design
   system's semantic tokens. Enter ONLY hex values in the INPUT section
   below — the \`shavin-brand-tokens\` predev script auto-computes every
   derived token (fg, hover, contrast, text, subtle backgrounds) using
   the same WCAG luminance engine that powers --accent, then writes the
   results to the GENERATED section.

   After the first \`npm run dev\`, this file stays static in source —
   zero runtime JavaScript needed. Re-run \`npm run brand:gen\` whenever
   you add or change a hex value.

   ── Workflow ────────────────────────────────────────────────────────────
   1. Add a line like  --brand-coral: #FF6B6B;  in the INPUT section.
   2. Run \`npm run dev\` (predev fires \`brand:gen\` automatically) or
      \`npm run brand:gen\` manually.
   3. Use the tokens via Tailwind utilities: bg-brand-coral,
      text-brand-coral, border-brand-coral/50, bg-brand-coral-subtle,
      text-brand-coral-contrast, etc.
   ========================================================================= */

:root,
.light {
${inputBlock}

  /* ─── GENERATED ───────────────────────────────────────────────────────
     Do NOT edit — auto-computed by shavin-brand-tokens.
     ──────────────────────────────────────────────────────────────────── */
${lightGenerated}

}

.dark {

  /* ─── GENERATED (dark overrides) ──────────────────────────────────────
     Do NOT edit — auto-computed by shavin-brand-tokens.
     ──────────────────────────────────────────────────────────────────── */
${darkGenerated}

}
`;
}

// ═══════════════════════════════════════════════════════════════════════
// TAILWIND PRESET GENERATOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * OKLCH variant of the Tailwind v4 @theme inline generator.
 * Instead of wrapping in rgb(), it references the oklch() values directly
 * via var() — since the brand tokens are already in oklch() format.
 *
 * For v4-oklch path: import brand-theme-v4-oklch.css after
 * @shavin/ui/theme-v4-oklch.css in your global CSS.
 */
export function generateThemeV4CSSOklch(colorNames, aliasNames) {
  const entries = [];

  for (const name of aliasNames) {
    entries.push({ key: `--color-brand-${name}`, value: `var(--brand-${name})` });
  }

  for (const name of colorNames) {
    entries.push({ key: `--color-brand-${name}`, value: `var(--brand-${name})` });
    entries.push({ key: `--color-brand-${name}-fg`, value: `var(--brand-${name}-fg)` });
    entries.push({ key: `--color-brand-${name}-hover`, value: `var(--brand-${name}-hover)` });
    entries.push({ key: `--color-brand-${name}-contrast`, value: `var(--brand-${name}-contrast)` });
    entries.push({ key: `--color-brand-${name}-text`, value: `var(--brand-${name}-text)` });
    entries.push({ key: `--color-brand-${name}-subtle`, value: `var(--brand-${name}-subtle)` });
    entries.push({ key: `--color-brand-${name}-subtle-hover`, value: `var(--brand-${name}-subtle-hover)` });
  }

  const themeBlock = entries.length > 0
    ? entries.map((e) => `  ${e.key}: ${e.value};`).join("\n")
    : `  /* (no brand colors defined yet — add hex values in brand-tokens.css) */`;

  return `/* =========================================================================
   AUTO-GENERATED by @shavin/cli brand — DO NOT EDIT.
   Regenerated on every \`npm run dev\` (predev) or \`npm run brand:gen\`.

   Tailwind v4 @theme inline block for brand colors (OKLCH mode).
   Import this after @shavin/ui/theme-v4-oklch.css in your global CSS:
     @import "@shavin/ui/theme-v4-oklch.css";
     @import "./brand-theme-v4-oklch.css";
   ========================================================================= */

@theme inline {
${themeBlock}
}
`;
}
// ═══════════════════════════════════════════════════════════════════════

/**
 * Generates a Tailwind partial preset exposing every brand color +
 * derived tokens as utilities.
 *
 * Color naming: CSS var `--brand-coral` → Tailwind key `brand-coral`
 *   → bg-brand-coral, text-brand-coral, border-brand-coral/50, etc.
 *
 * For hex-based colors, all 7 tokens are exposed:
 *   brand-{name}, brand-{name}-fg, brand-{name}-hover,
 *   brand-{name}-contrast, brand-{name}-text,
 *   brand-{name}-subtle, brand-{name}-subtle-hover
 *
 * For var() aliases, only the base token is exposed:
 *   brand-{name}
 */
export function generateTailwindPreset(colorNames, aliasNames) {
  const entries = [];

  // Aliases first (just the base token)
  for (const name of aliasNames) {
    entries.push({
      key: `brand-${name}`,
      value: `rgb(var(--brand-${name}) / <alpha-value>)`,
    });
  }

  // Hex-based colors (full derived token set)
  for (const name of colorNames) {
    entries.push({ key: `brand-${name}`, value: `rgb(var(--brand-${name}) / <alpha-value>)` });
    entries.push({ key: `brand-${name}-fg`, value: `rgb(var(--brand-${name}-fg) / <alpha-value>)` });
    entries.push({ key: `brand-${name}-hover`, value: `rgb(var(--brand-${name}-hover) / <alpha-value>)` });
    entries.push({ key: `brand-${name}-contrast`, value: `rgb(var(--brand-${name}-contrast) / <alpha-value>)` });
    entries.push({ key: `brand-${name}-text`, value: `rgb(var(--brand-${name}-text) / <alpha-value>)` });
    entries.push({ key: `brand-${name}-subtle`, value: `var(--brand-${name}-subtle)` });
    entries.push({ key: `brand-${name}-subtle-hover`, value: `var(--brand-${name}-subtle-hover)` });
  }

  const colorsBlock = entries.length > 0
    ? entries.map((e) => `        "${e.key}": "${e.value}"`).join(",\n")
    : `        /* (no brand colors defined yet — add hex values in brand-tokens.css) */`;

  return `// ════════════════════════════════════════════════════════════════════════
// AUTO-GENERATED by @shavin/cli brand — DO NOT EDIT.
// Regenerated on every \`npm run dev\` (predev) or \`npm run brand:gen\`.
//
// Add this to your tailwind.config.ts presets array:
//   import shavinPreset from "@shavin/ui/tailwind-preset";
//   import brandPreset from "./brand-preset.mjs";
//   export default { presets: [shavinPreset, brandPreset], /* ... */ };
// ════════════════════════════════════════════════════════════════════════

/** @type {import('tailwindcss').Config} */
export default {
  theme: {
    extend: {
      colors: {
${colorsBlock}
      },
    },
  },
};
`;
}


/**
 * Generate a Tailwind v4 @theme inline CSS block for brand colors.
 * This is the v4 equivalent of generateTailwindPreset() — instead of a JS
 * config object, it produces CSS custom properties under @theme inline that
 * Tailwind v4 reads to generate bg-brand-*, text-brand-*, etc. utilities.
 *
 * @param {string[]} colorNames — hex-based brand color names (e.g. ["primary"])
 * @param {string[]} aliasNames — alias-based brand color names (e.g. ["accent-2"])
 * @returns {string} — CSS file content with @theme inline block
 */
export function generateThemeV4CSS(colorNames, aliasNames) {
  const entries = [];

  // Aliases first (just the base token)
  for (const name of aliasNames) {
    entries.push({ key: `--color-brand-${name}`, value: `rgb(var(--brand-${name}))` });
  }

  // Hex-based colors (full derived token set)
  for (const name of colorNames) {
    entries.push({ key: `--color-brand-${name}`, value: `rgb(var(--brand-${name}))` });
    entries.push({ key: `--color-brand-${name}-fg`, value: `rgb(var(--brand-${name}-fg))` });
    entries.push({ key: `--color-brand-${name}-hover`, value: `rgb(var(--brand-${name}-hover))` });
    entries.push({ key: `--color-brand-${name}-contrast`, value: `rgb(var(--brand-${name}-contrast))` });
    entries.push({ key: `--color-brand-${name}-text`, value: `rgb(var(--brand-${name}-text))` });
    entries.push({ key: `--color-brand-${name}-subtle`, value: `var(--brand-${name}-subtle)` });
    entries.push({ key: `--color-brand-${name}-subtle-hover`, value: `var(--brand-${name}-subtle-hover)` });
  }

  const themeBlock = entries.length > 0
    ? entries.map((e) => `  ${e.key}: ${e.value};`).join("\n")
    : `  /* (no brand colors defined yet — add hex values in brand-tokens.css) */`;

  return `/* =========================================================================
   AUTO-GENERATED by @shavin/cli brand — DO NOT EDIT.
   Regenerated on every \`npm run dev\` (predev) or \`npm run brand:gen\`.
   
   Tailwind v4 @theme inline block for brand colors.
   Import this after @shavin/ui/theme-v4.css in your global CSS:
     @import "@shavin/ui/theme-v4.css";
     @import "./brand-theme-v4.css";
   ========================================================================= */

@theme inline {
${themeBlock}
}
`;
}

// ═══════════════════════════════════════════════════════════════════════
// DEFAULT TEMPLATE — used when scaffolding into a consumer project
// ═══════════════════════════════════════════════════════════════════════

/**
 * The default brand-tokens.css template for consumer projects.
 * Contains only --brand-primary: var(--accent) as a zero-config alias.
 */
export const DEFAULT_BRAND_TOKENS_CSS = `/* =========================================================================
   Shavin Brand Color Tokens

   This file lets you declare custom brand colors alongside the design
   system's semantic tokens. Enter ONLY hex values in the INPUT section
   below — the \`shavin brand:gen\` predev script auto-computes every
   derived token (fg, hover, contrast, text, subtle backgrounds) using
   the same WCAG luminance engine that powers --accent, then writes the
   results to the GENERATED section.

   After the first \`npm run dev\`, this file stays static in source —
   zero runtime JavaScript needed. Re-run \`npm run brand:gen\` whenever
   you add or change a hex value.

   ── Workflow ────────────────────────────────────────────────────────────
   1. Add a line like  --brand-coral: #FF6B6B;  in the INPUT section.
   2. Run \`npm run dev\` (predev fires \`brand:gen\` automatically) or
      \`npm run brand:gen\` manually.
   3. Use the tokens via Tailwind utilities: bg-brand-coral,
      text-brand-coral, border-brand-coral/50, bg-brand-coral-subtle,
      text-brand-coral-contrast, etc.
   ========================================================================= */

:root,
.light {

  /* ─── INPUT ───────────────────────────────────────────────────────────
     Enter hex values only. Do not delete --brand-primary.
     --brand-primary always aliases --accent by default so the system
     works with zero customization. Override with a #hex to set a
     custom primary that still gets all derived tokens.
     ──────────────────────────────────────────────────────────────────── */
  --brand-primary: var(--accent);

  /* ─── GENERATED ───────────────────────────────────────────────────────
     Do NOT edit — auto-computed by shavin-brand-tokens.
     ──────────────────────────────────────────────────────────────────── */
  --brand-primary: var(--accent);

}

.dark {

  /* ─── GENERATED (dark overrides) ──────────────────────────────────────
     Do NOT edit — auto-computed by shavin-brand-tokens.
     ──────────────────────────────────────────────────────────────────── */
  /* (no brand colors defined — add hex values in the INPUT section above) */

}
`;

/**
 * Path detection for consumer projects.
 * Searches for brand-tokens.css in common locations.
 * Returns { cssPath, presetPath } or null if not found.
 */
export function detectBrandTokensPath(cwd) {
  const { existsSync } = require("node:fs");
  const { join } = require("node:path");

  const candidates = [
    // Next.js app router
    { css: "src/app/brand-tokens.css", preset: "src/app/brand-preset.mjs" },
    // Next.js / common
    { css: "src/styles/brand-tokens.css", preset: "src/styles/brand-preset.mjs" },
    { css: "styles/brand-tokens.css", preset: "styles/brand-preset.mjs" },
    // Vite / React
    { css: "src/brand-tokens.css", preset: "src/brand-preset.mjs" },
    // Root (monorepo or flat)
    { css: "brand-tokens.css", preset: "brand-preset.mjs" },
    // Monorepo source (for running within the monorepo)
    { css: "packages/ui/src/styles/brand-tokens.css", preset: "packages/ui/src/styles/brand-preset.mjs" },
  ];

  for (const c of candidates) {
    const cssPath = join(cwd, c.css);
    if (existsSync(cssPath)) {
      return { cssPath, presetPath: join(cwd, c.preset) };
    }
  }

  return null;
}
