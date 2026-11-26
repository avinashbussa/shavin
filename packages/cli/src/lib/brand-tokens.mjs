/**
 * @shavin/cli — Brand Token Engine (pure functions)
 *
 * Zero-dependency ESM. Shared by:
 *   - scripts/shavin-brand-tokens.mjs (repo root)
 *   - packages/cli/src/commands/brand.mjs (consumer CLI: `npx @shavin/cli brand`)
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
  oklchBrandForMode,
  oklchSolidFor,
  oklchSolidHoverFor,
  apcaContrast,
  brandTextSurfaces,
  BRAND_TEXT_CONTRAST,
  rgbTripletToOklch,
} from "./color-space.mjs";

// ═══════════════════════════════════════════════════════════════════════
// CONTRAST ENGINE — identical math to theme-presets.ts
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

export function contrastRatio(a, b) {
  const x = relativeLuminance(a);
  const y = relativeLuminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Text on a solid brand fill: white while it clears 4.5:1, otherwise the higher-contrast ink. */
export function foregroundFor(triplet) {
  const white = contrastRatio("255 255 255", triplet);
  if (white >= 4.5) return "255 255 255";
  return contrastRatio("10 10 12", triplet) > white ? "10 10 12" : "255 255 255";
}

/**
 * Hover fill for a solid brand button. The text keeps foregroundFor(triplet) on hover, so the
 * fill moves the usual way (lighter in dark mode, darker in light mode) only while that keeps
 * contrast with the text; otherwise it moves away from the text colour.
 */
export function hoverFor(triplet, isDark) {
  return hoverWithForeground(triplet, foregroundFor(triplet), isDark);
}

function hoverWithForeground(triplet, fg, isDark) {
  const usual = mix(triplet, isDark ? 255 : 0, 0.12);
  if (contrastRatio(fg, usual) >= Math.min(4.5, contrastRatio(fg, triplet))) return usual;
  return mix(triplet, fg === "255 255 255" ? 0 : 255, 0.12);
}

// ── Solid brand fill: -solid / -solid-hover / -fg (mirror of brandSolidFor in theme-presets.ts) ──
/** How the fill under text on the brand is chosen: "accessible" (default), "exact" or "perceptual". */
export const SOLID_MODES = ["accessible", "exact", "perceptual"];
export const DEFAULT_SOLID_MODE = "accessible";
const WHITE_T = "255 255 255";
const INK_T = "10 10 12";
const perceptualForegroundFor = (fill) =>
  Math.abs(apcaContrast(WHITE_T, fill)) > Math.abs(apcaContrast(INK_T, fill)) ? WHITE_T : INK_T;

/**
 * Solid fill, hover and text for a brand triplet already resolved for its mode (resolveTriplet).
 * accessible: the brand's hue with lightness lowered until white text clears 4.6:1; a genuinely light
 * brand keeps its exact fill and dark text. exact: today's fill and WCAG-picked text. perceptual: exact
 * fill, text white where APCA prefers it (does not meet WCAG 2 AA on every brand).
 */
export function solidFor(triplet, isDark, mode = DEFAULT_SOLID_MODE) {
  if (mode === "exact") return { fill: triplet, hover: hoverFor(triplet, isDark), fg: foregroundFor(triplet) };
  if (mode === "perceptual") {
    const fg = perceptualForegroundFor(triplet);
    return { fill: triplet, hover: hoverWithForeground(triplet, fg, isDark), fg };
  }
  const s = oklchSolidFor(rgbTripletToOklch(triplet));
  const fill = s.changed ? oklchToRgbTriplet(s.fill) : triplet;
  const fg = s.light ? foregroundFor(triplet) : WHITE_T;
  const usual = mix(fill, isDark ? 255 : 0, 0.12);
  const hover = contrastRatio(fg, usual) >= 4.5 ? usual : mix(fill, fg === WHITE_T ? 0 : 255, 0.12);
  return { fill, hover, fg };
}

/** solidFor for the OKLCH output path: oklch() CSS strings. `o` is the brand resolved for its mode (oklchBrandForMode). */
export function solidForOklch(o, isDark, mode = DEFAULT_SOLID_MODE) {
  if (mode === "exact") {
    return { fill: oklchToCss(o), hover: oklchToCss(oklchHoverFor(o, isDark, 0.12)), fg: oklchToCss(oklchForegroundFor(o)) };
  }
  if (mode === "perceptual") {
    const fgO = perceptualForegroundFor(oklchToRgbTriplet(o)) === WHITE_T ? { L: 1, C: 0, H: 0 } : { L: 0.18, C: 0, H: 0 };
    return { fill: oklchToCss(o), hover: oklchToCss(oklchSolidHoverFor(o, fgO, isDark)), fg: oklchToCss(fgO) };
  }
  const s = oklchSolidFor(o);
  const fgO = s.light ? oklchForegroundFor(o) : { L: 1, C: 0, H: 0 };
  return { fill: oklchToCss(s.fill), hover: oklchToCss(oklchSolidHoverFor(s.fill, fgO, isDark)), fg: oklchToCss(fgO) };
}

/**
 * Brand-coloured text on the page: keeps the colour when it already clears the target on
 * every page surface and on the brand's own soft tints over them, otherwise darkens it (light
 * mode) or lightens it (dark mode) in small steps until it does, so the hue is kept. Same
 * surfaces and target as the runtime engine (brandTextSurfaces in color-space.mjs).
 */
export function textFor(triplet, isDark) {
  const bgs = brandTextSurfaces(triplet, isDark).map(relativeLuminance);
  for (let step = 0; step <= 50; step++) {
    const candidate = mix(triplet, isDark ? 255 : 0, step / 50);
    const x = relativeLuminance(candidate);
    const min = Math.min(...bgs.map((y) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)));
    if (min >= BRAND_TEXT_CONTRAST) return candidate;
  }
  return isDark ? "255 255 255" : "0 0 0";
}

/** The brand triplet for one page mode: grays that vanish flip, coloured brands keep their hue. */
export function resolveTriplet(triplet, isDark) {
  const lum = relativeLuminance(triplet);
  if (!(isDark && lum < 0.12) && !(!isDark && lum > 0.85)) return triplet;
  // Grays flip; coloured brands keep their hue and move to 3:1 against the canvas (as @shavin/ui does).
  const o = rgbTripletToOklch(triplet);
  if (o.C < 0.03) return isDark ? "255 255 255" : "10 10 12";
  return oklchToRgbTriplet(oklchBrandForMode(o, isDark));
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
 *   isVarRef:  true if value is `var(--brand)` or similar
 *   isHex:     true if value is a #hex literal
 */
/**
 * The core brand colour owns --brand, --brand-fg, --brand-hover and the rest, so a custom brand colour
 * may not use those suffixes as its name (a colour named "subtle" would write --brand-subtle).
 */
export const RESERVED_BRAND_NAMES = ["fg", "hover", "solid", "solid-hover", "solid-mode", "contrast", "text", "subtle", "subtle-hover", "on-dark", "on-light"];

/** Custom brand colour names that clash with the core brand tokens. */
export function reservedBrandNames(declarations) {
  return declarations
    .map((d) => d.name)
    .filter((n) => RESERVED_BRAND_NAMES.includes(n) || n.startsWith("on-dark-") || n.startsWith("on-light-"));
}

export function parseBrandTokens(cssText) {
  const declarations = [];
  let solidMode = DEFAULT_SOLID_MODE;

  // Extract the content between the INPUT section marker and the
  // GENERATED section marker. We anchor on the box-drawing marker
  // pattern (─── INPUT ───) to avoid matching the word "INPUT" in
  // the header comment text.
  const inputMatch = cssText.match(/─{3}\s*INPUT[\s\S]*?(?=─{3}\s*GENERATED)/);
  if (!inputMatch) return { declarations, solidMode };

  const inputSection = inputMatch[0];

  // Match all `--brand-{name}: {value};` declarations (active ones
  // only — commented-out lines are skipped because they start with
  // `/*` not `--brand-`).
  const declRegex = /^\s*--brand-([\w-]+)\s*:\s*([^;]+);/gm;
  let match;
  while ((match = declRegex.exec(inputSection)) !== null) {
    const [, name, rawValue] = match;
    const value = rawValue.trim();
    // --brand-solid-mode: accessible | exact | perceptual chooses how every colour's -solid / -fg is derived.
    if (name === "solid-mode") {
      if (SOLID_MODES.includes(value)) solidMode = value;
      continue;
    }
    const isVarRef = /^var\(/.test(value);
    const isHex = /^#[0-9a-fA-F]{3,8}$/.test(value);
    declarations.push({ name, value, isVarRef, isHex });
  }

  return { declarations, solidMode };
}

// ═══════════════════════════════════════════════════════════════════════
// TOKEN GENERATOR — computes all derived tokens for each brand color
// ═══════════════════════════════════════════════════════════════════════

/**
 * For each brand color with a hex value, compute the full cluster:
 *   --brand-{name}              (resolved triplet, achromatic inversion)
 *   --brand-{name}-solid        (fill under text: accessible by default, see --brand-solid-mode)
 *   --brand-{name}-solid-hover  (its hover fill; -fg keeps >= 4.5:1 on it)
 *   --brand-{name}-fg           (text on -solid: white, or dark ink for a light brand)
 *   --brand-{name}-hover        (±12% mix of the exact brand)
 *   --brand-{name}-contrast     (WCAG-safe text color)
 *   --brand-{name}-text         (alias of contrast)
 *   --brand-{name}-subtle       (rgb(... / 0.12) light, 0.15 dark)
 *   --brand-{name}-subtle-hover (rgb(... / 0.18) light, 0.22 dark)
 *
 * For var() aliases (like --brand-ocean: var(--brand-teal)), just pass
 * through — no computation needed.
 *
 * Returns:
 *   lightLines: string[]   CSS lines for :root GENERATED section
 *   darkLines:  string[]   CSS lines for .dark GENERATED section
 *   colorNames: string[]   List of color names (for Tailwind preset)
 *   aliasNames: string[]   List of alias names (for Tailwind preset)
 */
export function computeBrandTokens(declarations, solidMode = DEFAULT_SOLID_MODE) {
  const lightLines = [];
  const darkLines = [];
  const colorNames = []; // hex-based colors → full derived token set
  const aliasNames = []; // var() aliases → just the base token

  for (const decl of declarations) {
    if (decl.isVarRef) {
      // Pass-through alias (e.g. --brand-ocean: var(--brand-teal))
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
    const lightSolid = solidFor(lightTriplet, false, solidMode);
    lightLines.push(`  --brand-${n}-fg: ${lightSolid.fg};`);
    lightLines.push(`  --brand-${n}-hover: ${hoverFor(lightTriplet, false)};`);
    lightLines.push(`  --brand-${n}-solid: ${lightSolid.fill};`);
    lightLines.push(`  --brand-${n}-solid-hover: ${lightSolid.hover};`);
    lightLines.push(`  --brand-${n}-contrast: ${textFor(lightTriplet, false)};`);
    lightLines.push(`  --brand-${n}-text: ${textFor(lightTriplet, false)};`);
    lightLines.push(`  --brand-${n}-subtle: rgb(var(--brand-${n}) / 0.12);`);
    lightLines.push(`  --brand-${n}-subtle-hover: rgb(var(--brand-${n}) / 0.18);`);

    // Dark mode
    darkLines.push(`  --brand-${n}: ${darkTriplet};`);
    const darkSolid = solidFor(darkTriplet, true, solidMode);
    darkLines.push(`  --brand-${n}-fg: ${darkSolid.fg};`);
    darkLines.push(`  --brand-${n}-hover: ${hoverFor(darkTriplet, true)};`);
    darkLines.push(`  --brand-${n}-solid: ${darkSolid.fill};`);
    darkLines.push(`  --brand-${n}-solid-hover: ${darkSolid.hover};`);
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
export function computeBrandTokensOklch(declarations, solidMode = DEFAULT_SOLID_MODE) {
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
    const lightO = oklchBrandForMode(baseOklch, false);
    const darkO = oklchBrandForMode(baseOklch, true);

    colorNames.push(n);

    // Light mode
    lightLines.push(`  --brand-${n}: ${oklchToCss(lightO)};`);
    const lightSolid = solidForOklch(lightO, false, solidMode);
    lightLines.push(`  --brand-${n}-fg: ${lightSolid.fg};`);
    lightLines.push(`  --brand-${n}-hover: ${oklchToCss(oklchHoverFor(lightO, false, 0.12))};`);
    lightLines.push(`  --brand-${n}-solid: ${lightSolid.fill};`);
    lightLines.push(`  --brand-${n}-solid-hover: ${lightSolid.hover};`);
    lightLines.push(`  --brand-${n}-contrast: ${oklchToCss(oklchTextFor(lightO, false))};`);
    lightLines.push(`  --brand-${n}-text: ${oklchToCss(oklchTextFor(lightO, false))};`);
    lightLines.push(`  --brand-${n}-subtle: color-mix(in oklch, var(--brand-${n}) 12%, transparent);`);
    lightLines.push(`  --brand-${n}-subtle-hover: color-mix(in oklch, var(--brand-${n}) 18%, transparent);`);

    // Dark mode
    darkLines.push(`  --brand-${n}: ${oklchToCss(darkO)};`);
    const darkSolid = solidForOklch(darkO, true, solidMode);
    darkLines.push(`  --brand-${n}-fg: ${darkSolid.fg};`);
    darkLines.push(`  --brand-${n}-hover: ${oklchToCss(oklchHoverFor(darkO, true, 0.12))};`);
    darkLines.push(`  --brand-${n}-solid: ${darkSolid.fill};`);
    darkLines.push(`  --brand-${n}-solid-hover: ${darkSolid.hover};`);
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
     Your main brand colour is --brand (bg-brand, text-brand-contrast …),
     set with <ThemeProvider brandColor>; it is not set here.
     Add extra colours as hex values, e.g. --brand-coral: #FF6B6B;
     fg, hover, solid, solid-hover, contrast, text, subtle and on-dark/on-light are reserved
     names: they belong to --brand itself.
     ──────────────────────────────────────────────────────────────────── */
  /* --brand-coral: #FF6B6B; */
  /* --brand-solid-mode: accessible; */ /* or exact | perceptual: how -solid and -fg are derived (default accessible) */
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
     Your main brand colour is --brand (bg-brand, text-brand-contrast …),
     set with <ThemeProvider brandColor>; it is not set here.
     Add extra colours as hex values, e.g. --brand-coral: #FF6B6B;
     fg, hover, solid, solid-hover, contrast, text, subtle and on-dark/on-light are reserved
     names: they belong to --brand itself.
     ──────────────────────────────────────────────────────────────────── */
  /* --brand-coral: #FF6B6B; */
  /* --brand-solid-mode: accessible; */ /* or exact | perceptual: how -solid and -fg are derived (default accessible) */
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
   the same WCAG luminance engine that powers --brand, then writes the
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
    entries.push({ key: `--color-brand-${name}-solid`, value: `var(--brand-${name}-solid)` });
    entries.push({ key: `--color-brand-${name}-solid-hover`, value: `var(--brand-${name}-solid-hover)` });
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
 * For hex-based colors, all 9 tokens are exposed:
 *   brand-{name}, brand-{name}-fg, brand-{name}-hover, brand-{name}-solid, brand-{name}-solid-hover,
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
    entries.push({ key: `brand-${name}-solid`, value: `rgb(var(--brand-${name}-solid) / <alpha-value>)` });
    entries.push({ key: `brand-${name}-solid-hover`, value: `rgb(var(--brand-${name}-solid-hover) / <alpha-value>)` });
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
 * @param {string[]} aliasNames — alias-based brand color names (e.g. ["brand-2"])
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
    entries.push({ key: `--color-brand-${name}-solid`, value: `rgb(var(--brand-${name}-solid))` });
    entries.push({ key: `--color-brand-${name}-solid-hover`, value: `rgb(var(--brand-${name}-solid-hover))` });
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
 * Declares no colours: the main brand colour comes from ThemeProvider brandColor, and extra colours are added here.
 */
export const DEFAULT_BRAND_TOKENS_CSS = `/* =========================================================================
   Shavin Brand Color Tokens

   This file lets you declare custom brand colors alongside the design
   system's semantic tokens. Enter ONLY hex values in the INPUT section
   below — the \`shavin brand:gen\` predev script auto-computes every
   derived token (fg, hover, contrast, text, subtle backgrounds) using
   the same WCAG luminance engine that powers --brand, then writes the
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
     Your main brand colour is --brand (bg-brand, text-brand-contrast …),
     set with <ThemeProvider brandColor>; it is not set here.
     Add extra colours as hex values, e.g. --brand-coral: #FF6B6B;
     fg, hover, solid, solid-hover, contrast, text, subtle and on-dark/on-light are reserved
     names: they belong to --brand itself.
     ──────────────────────────────────────────────────────────────────── */
  /* --brand-coral: #FF6B6B; */
  /* --brand-solid-mode: accessible; */ /* or exact | perceptual: how -solid and -fg are derived (default accessible) */

  /* ─── GENERATED ───────────────────────────────────────────────────────
     Do NOT edit — auto-computed by shavin-brand-tokens.
     ──────────────────────────────────────────────────────────────────── */
  /* (no brand colors defined — add hex values in the INPUT section above) */

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
    // Root (workspace or flat)
    { css: "brand-tokens.css", preset: "brand-preset.mjs" },
    // Repository source (for running within this repository)
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
