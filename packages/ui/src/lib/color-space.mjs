/**
 * @shavin/ui — OKLCH ↔ RGB Color Space Conversion Engine
 *
 * Zero-dependency ESM. Pure functions for converting between sRGB triplets
 * and the OKLCH (OK Lab in polar/cylindrical form) color space.
 *
 * OKLCH provides perceptually uniform lightness (L axis), making it ideal
 * for generating shade scales and dark-mode inversions. This module is the
 * internal math core — users never see OKLCH; they input hex and the output
 * format (RGB triplet or OKLCH CSS string) is chosen by the color-space mode.
 *
 * References:
 *   - Björn Ottosson's OKLab formulation (2020)
 *   - CSS Color Level 4: oklch(L C H / alpha)
 *   - https://bottosson.github.io/posts/oklab/
 *
 * Usage:
 *   import { hexToOklch, oklchToRgbTriplet, oklchToCss } from "./color-space.mjs";
 *   const o = hexToOklch("#FF6B6B");    // { L: 0.7194, C: 0.1533, H: 25.27 }
 *   const rgb = oklchToRgbTriplet(o);   // "255 107 107"
 *   const css = oklchToCss(o);          // "oklch(0.7194 0.1533 25.27)"
 */

// ─────────────────────────────────────────────────────────────────────────────
// Type
// ─────────────────────────────────────────────────────────────────────────────

/** @typedef {{ L: number, C: number, H: number }} Oklch */

// ─────────────────────────────────────────────────────────────────────────────
// Hex → RGB triplet helpers (shared with theme-presets.ts, kept here as
// the canonical implementation so the conversion chain is self-contained)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Parse a hex color (#RGB or #RRGGBB) into an RGB triplet string "R G B".
 * @param {string} hex
 * @returns {string}
 */
export function hexToTriplet(hex) {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

/**
 * Parse a hex color into {r, g, b} with 0-255 channels.
 * @param {string} hex
 * @returns {{ r: number, g: number, b: number }}
 */
export function hexToRgb(hex) {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

/**
 * Convert an RGB triplet string "R G B" back to a hex string.
 * @param {string} triplet
 * @returns {string}
 */
export function tripletToHex(triplet) {
  const [r, g, b] = triplet.split(" ").map(Number);
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// sRGB ↔ Linear RGB (gamma encoding / decoding)
// ─────────────────────────────────────────────────────────────────────────────

/** @param {number} c — sRGB channel 0..1 → linear RGB */
function srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

/** @param {number} c — linear RGB → sRGB channel 0..1 */
function linearToSrgb(c) {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
}

// ─────────────────────────────────────────────────────────────────────────────
// Linear RGB ↔ OKLab (Ottosson's matrix)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Linear RGB (0..1) → OKLab {L, a, b}.
 * @param {{ r: number, g: number, b: number }} lin
 * @returns {{ L: number, a: number, b: number }}
 */
function linearRgbToOklab(lin) {
  const l = 0.4122214708 * lin.r + 0.5363325363 * lin.g + 0.0514459929 * lin.b;
  const m = 0.2119034982 * lin.r + 0.6806995451 * lin.g + 0.1073969566 * lin.b;
  const s = 0.0883024619 * lin.r + 0.2817188376 * lin.g + 0.6299787005 * lin.b;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_,
  };
}

/**
 * OKLab {L, a, b} → Linear RGB (0..1).
 * @param {{ L: number, a: number, b: number }} lab
 * @returns {{ r: number, g: number, b: number }}
 */
function oklabToLinearRgb(lab) {
  const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m_ = lab.L - 0.1055613458 * lab.a - 0.0638531728 * lab.b;
  const s_ = lab.L - 0.0894841775 * lab.a - 1.2914855480 * lab.b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return {
    r:  4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097570426 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076149664 * s,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// OKLab ↔ OKLCH (cartesian ↔ cylindrical)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * OKLab → OKLCH.
 * @param {{ L: number, a: number, b: number }} lab
 * @returns {Oklch}
 */
function oklabToOklch(lab) {
  const C = Math.sqrt(lab.a ** 2 + lab.b ** 2);
  let H = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L: lab.L, C, H };
}

/**
 * OKLCH → OKLab.
 * @param {Oklch} o
 * @returns {{ L: number, a: number, b: number }}
 */
function oklchToOklab(o) {
  const a = Math.cos((o.H * Math.PI) / 180) * o.C;
  const b = Math.sin((o.H * Math.PI) / 180) * o.C;
  return { L: o.L, a, b };
}

// ─────────────────────────────────────────────────────────────────────────────
// Full chain: Hex → OKLCH and OKLCH → RGB triplet
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a hex color (#RGB or #RRGGBB) to OKLCH.
 * @param {string} hex
 * @returns {Oklch}
 */
export function hexToOklch(hex) {
  const { r, g, b } = hexToRgb(hex);
  const lin = {
    r: srgbToLinear(r / 255),
    g: srgbToLinear(g / 255),
    b: srgbToLinear(b / 255),
  };
  const lab = linearRgbToOklab(lin);
  return oklabToOklch(lab);
}

/**
 * Convert an RGB triplet string "R G B" to OKLCH.
 * @param {string} triplet
 * @returns {Oklch}
 */
export function rgbTripletToOklch(triplet) {
  const [r, g, b] = triplet.split(" ").map(Number);
  const lin = {
    r: srgbToLinear(r / 255),
    g: srgbToLinear(g / 255),
    b: srgbToLinear(b / 255),
  };
  const lab = linearRgbToOklab(lin);
  return oklabToOklch(lab);
}

/**
 * Convert OKLCH to an RGB triplet string "R G B" with gamut clamping.
 * @param {Oklch} o
 * @returns {string}
 */
export function oklchToRgbTriplet(o) {
  const lab = oklchToOklab(o);
  const lin = oklabToLinearRgb(lab);
  const to255 = (c) => {
    const srgb = linearToSrgb(c);
    // Clamp to 0..1 (gamut), then scale to 0..255
    return Math.max(0, Math.min(255, Math.round(srgb * 255)));
  };
  return `${to255(lin.r)} ${to255(lin.g)} ${to255(lin.b)}`;
}

/**
 * Convert OKLCH to a hex string.
 * @param {Oklch} o
 * @returns {string}
 */
export function oklchToHex(o) {
  return tripletToHex(oklchToRgbTriplet(o));
}

/**
 * Format an OKLCH object as a CSS oklch() string.
 * Rounds to 4 decimal places for L/C and 2 for H.
 * @param {Oklch} o
 * @param {number} [alpha=1] — optional alpha 0..1
 * @returns {string}
 */
export function oklchToCss(o, alpha = 1) {
  const L = Math.round(o.L * 1e4) / 1e4;
  const C = Math.round(o.C * 1e4) / 1e4;
  const H = Math.round(o.H * 100) / 100;
  if (alpha >= 1) return `oklch(${L} ${C} ${H})`;
  return `oklch(${L} ${C} ${H} / ${alpha})`;
}

// ─────────────────────────────────────────────────────────────────────────────
// OKLCH-aware luminance & mixing (replaces WCAG RGB luminance math)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Perceptual lightness of an OKLCH color. OKLCH's L channel IS the
 * perceptual lightness (0 = black, 1 = white), so no gamma math is needed —
 * unlike WCAG's relativeLuminance which requires sRGB→linear conversion.
 * @param {Oklch} o
 * @returns {number} — 0..1 perceptual lightness
 */
export function oklchLuminance(o) {
  return o.L;
}

// WCAG 2.x contrast is defined on sRGB luminance, so OKLCH brand colours are measured
// after conversion and get the same guarantees as the RGB path (theme-presets.ts).
const OK_WHITE = { L: 1, C: 0, H: 0 };
const OK_INK = { L: 0.18, C: 0, H: 0 };
function tripletLuminance(triplet) {
  const [r, g, b] = triplet.split(" ").map((c) => Number(c) / 255);
  const lin = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function tripletContrast(a, b) {
  const x = tripletLuminance(a);
  const y = tripletLuminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

// Text colour target. 4.6 gives 0.1 of headroom over WCAG AA (4.5:1) for rounding in the sRGB
// round-trip and for the browser quantising tint alpha.
export const BRAND_TEXT_CONTRAST = 4.6;
// Fills brand text, links and focus rings sit on, for every gray preset (Zinc, Slate, Gray,
// Neutral, Stone): light = white surface and n-100 canvas; dark = n-950 canvas, n-900 surface,
// n-850 hover/elevated (midpoint of n-800 and n-900, plus Zinc's stylesheet value) and n-800
// (elevated-hover).
const LIGHT_TEXT_SURFACES = ["255 255 255", "244 244 245", "241 245 249", "243 244 246", "245 245 245", "245 245 244"];
const DARK_TEXT_SURFACES = [
  "24 24 27", "10 10 12", "30 30 33", "32 32 35", "39 39 42", // Zinc
  "15 23 42", "2 6 23", "23 32 51", "30 41 59", // Slate
  "17 24 39", "3 7 18", "24 33 47", "31 41 55", // Gray
  "23 23 23", "10 10 10", "31 31 31", "38 38 38", // Neutral
  "28 25 23", "12 10 9", "35 31 30", "41 37 36", // Stone
];
// Brand tints brand text is drawn on: Badge soft 0.08, callout/alert 0.10, Button and IconButton
// soft 0.12 light / 0.15 dark (hover 0.18 / 0.22), Avatar soft 0.15.
const LIGHT_TINT_ALPHAS = [0.08, 0.1, 0.12, 0.15, 0.18];
const DARK_TINT_ALPHAS = [0.08, 0.1, 0.15, 0.18, 0.22];

/**
 * Every background brand text must clear BRAND_TEXT_CONTRAST on: the page fills of every gray
 * preset, plus the brand fill's own translucent tint composited over each of them (browsers
 * quantise alpha to 8 bits before blending, and so does this). The tint depends on the fill, so
 * the list does too.
 */
export function brandTextSurfaces(fill, isDark) {
  const base = isDark ? DARK_TEXT_SURFACES : LIGHT_TEXT_SURFACES;
  const alphas = isDark ? DARK_TINT_ALPHAS : LIGHT_TINT_ALPHAS;
  const f = fill.split(" ").map(Number);
  const out = [...base];
  for (const s of base) {
    const c = s.split(" ").map(Number);
    for (const a of alphas) {
      const q = Math.round(a * 255) / 255;
      out.push(f.map((v, i) => Math.round(v * q + c[i] * (1 - q))).join(" "));
    }
  }
  return out;
}

/** Lowest contrast of a text colour over a list of backgrounds. */
function minContrastOn(rgb, bgLums) {
  const x = tripletLuminance(rgb);
  let min = Infinity;
  for (const y of bgLums) min = Math.min(min, (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05));
  return min;
}

/**
 * Text on a solid brand fill: white while it clears 4.5:1, otherwise the higher-contrast ink.
 * @param {Oklch} o
 * @returns {Oklch}
 */
export function oklchForegroundFor(o) {
  const fill = oklchToRgbTriplet(o);
  const white = tripletContrast("255 255 255", fill);
  if (white >= 4.5) return OK_WHITE;
  return tripletContrast(oklchToRgbTriplet(OK_INK), fill) > white ? OK_INK : OK_WHITE;
}

/**
 * Hover variant: lighten/darken by interpolating L toward white or black.
 * @param {Oklch} o
 * @param {boolean} isDark — in dark mode, lighten (toward L=1); in light, darken (toward L=0)
 * @param {number} [amount=0.08] — interpolation factor
 * @returns {Oklch}
 */
/**
 * Hover fill for a solid brand. The text colour stays oklchForegroundFor(o) on hover, so the
 * fill moves the usual way (lighter in dark mode, darker in light mode) only while that keeps
 * contrast with the text; otherwise it moves away from the text colour.
 */
export function oklchHoverFor(o, isDark, amount = 0.08) {
  const fg = oklchToRgbTriplet(oklchForegroundFor(o));
  const shift = (targetL) => ({ L: o.L + (targetL - o.L) * amount, C: o.C, H: o.H });
  const usual = shift(isDark ? 1 : 0);
  const base = tripletContrast(fg, oklchToRgbTriplet(o));
  if (tripletContrast(fg, oklchToRgbTriplet(usual)) >= Math.min(4.5, base)) return usual;
  return shift(fg === "255 255 255" ? 0 : 1);
}

/**
 * Brand for text, links and focus rings: L is moved toward black (light) or white (dark)
 * until it clears 4.6:1 on every page surface and brand tint (brandTextSurfaces). Mirrors brandTextFor() in theme-presets.ts.
 * @param {Oklch} o
 * @param {boolean} isDark
 * @returns {Oklch}
 */
export function oklchTextFor(o, isDark) {
  const bgs = brandTextSurfaces(oklchToRgbTriplet(o), isDark).map(tripletLuminance);
  for (let step = 0; step <= 50; step++) {
    const candidate = { L: o.L + ((isDark ? 1 : 0) - o.L) * (step / 50), C: o.C, H: o.H };
    if (minContrastOn(oklchToRgbTriplet(candidate), bgs) >= BRAND_TEXT_CONTRAST) return candidate;
  }
  return isDark ? OK_WHITE : { L: 0, C: 0, H: 0 };
}

/**
 * The brand fill for one page mode. A fill that would vanish on the page is adjusted:
 * too dark for a dark page (sRGB luminance < 0.12) or too pale for a light page (> 0.85).
 * - Grays and near-neutrals (chroma < 0.03) flip to a light gray (dark mode) or near-black
 *   (light mode), as Radix and Apple do for black and white brand colours.
 * - chromatic brand colours (navy, burgundy, forest, cream) keep their hue and chroma and move only
 *   in lightness until the fill reaches 3:1 against the page canvas (WCAG 1.4.11 non-text
 *   contrast), so a navy brand stays navy in dark mode instead of turning gray.
 * Any other colour is returned unchanged (the same object).
 */
export function oklchBrandForMode(o, isDark) {
  const lum = tripletLuminance(oklchToRgbTriplet(o));
  if (isDark ? lum >= 0.12 : lum <= 0.85) return o;
  const flipped = isDark ? { L: 0.92, C: 0, H: 0 } : { L: 0.18, C: 0, H: 0 };
  if (o.C < 0.03) return flipped;
  const canvas = isDark ? "10 10 12" : "255 255 255";
  for (let step = 1; step <= 100; step++) {
    const candidate = { L: o.L + ((isDark ? 1 : 0) - o.L) * (step / 100), C: o.C, H: o.H };
    if (tripletContrast(oklchToRgbTriplet(candidate), canvas) >= 3) return candidate;
  }
  return flipped;
}

// ── Solid brand fills (buttons, badges, selected states, anything with text ON the brand) ────────
// The raw brand fill is the right colour for the brand's identity, but white text on it often
// misses 4.5:1 (most presets) and dark text on a mid-tone brand looks wrong. An "accessible"
// solid fill keeps the hue and chroma and lowers only OKLCH lightness, in 0.001 steps, until white
// text clears BRAND_SOLID_CONTRAST. A genuinely light brand (white would need a ΔL above
// BRAND_SOLID_MAX_DL: lime, mint, sky, amber, yellow) keeps its exact fill and dark text instead.

/** Contrast target for white text on a solid fill: 4.5:1 (WCAG AA) plus 0.1 of headroom, like BRAND_TEXT_CONTRAST. */
export const BRAND_SOLID_CONTRAST = 4.6;
/** Largest OKLCH lightness drop a solid fill may take; past it the brand is light and keeps its exact fill. */
export const BRAND_SOLID_MAX_DL = 0.12;

const roundTo = (v, places) => Math.round(v * 10 ** places) / 10 ** places;

/** The colour at lightness L with as much of chroma C as fits in sRGB, rounded the way oklchToCss prints it. */
function fitChroma(L, C, H) {
  let c = C;
  for (let i = 0; i <= 60; i++) {
    const candidate = { L: roundTo(L, 4), C: roundTo(c, 4), H: roundTo(H, 2) };
    if (c <= 0 || Math.abs(rgbTripletToOklch(oklchToRgbTriplet(candidate)).C - candidate.C) < 0.004) return candidate;
    c -= C / 60;
  }
  return { L: roundTo(L, 4), C: 0, H: roundTo(H, 2) };
}

/** @typedef {{ fill: Oklch, changed: boolean, light: boolean, dL: number }} OklchSolid */

/**
 * Accessible solid fill for a brand already resolved for its page mode (oklchBrandForMode).
 * Pure and deterministic; the RGB runtime, the OKLCH runtime and the CLI all derive from it.
 */
/** @param {Oklch} o @returns {OklchSolid} */
export function oklchSolidFor(o) {
  if (tripletContrast("255 255 255", oklchToRgbTriplet(o)) >= BRAND_SOLID_CONTRAST) return { fill: o, changed: false, light: false, dL: 0 };
  for (let step = 1; step * 0.001 <= BRAND_SOLID_MAX_DL + 1e-9; step++) {
    const candidate = fitChroma(o.L - step * 0.001, o.C, o.H);
    if (tripletContrast("255 255 255", oklchToRgbTriplet(candidate)) >= BRAND_SOLID_CONTRAST) {
      return { fill: candidate, changed: true, light: false, dL: o.L - candidate.L };
    }
  }
  return { fill: o, changed: false, light: true, dL: 0 };
}

/**
 * Hover fill for a solid brand. Moves the usual way (lighter on dark pages, darker on light pages)
 * only while `fg` keeps 4.5:1 on it; otherwise away from `fg`, which always raises the contrast.
 */
/** @param {Oklch} fill @param {Oklch} fg @param {boolean} isDark @param {number} [amount] @returns {Oklch} */
export function oklchSolidHoverFor(fill, fg, isDark, amount = 0.12) {
  const fgT = oklchToRgbTriplet(fg);
  const shift = (targetL) => ({ L: roundTo(fill.L + (targetL - fill.L) * amount, 4), C: roundTo(fill.C, 4), H: roundTo(fill.H, 2) });
  const usual = shift(isDark ? 1 : 0);
  if (tripletContrast(fgT, oklchToRgbTriplet(usual)) >= 4.5) return usual;
  return shift(fgT === "255 255 255" ? 0 : 1);
}

// ── APCA (perceptual contrast, SAPC 0.98G-4g) ────────────────────────────────
// Used only by brandSolid="perceptual", which picks the text colour the way designers read
// contrast. APCA is NOT part of WCAG 2: that mode does not make the WCAG 2 AA claim.
function apcaY(triplet) {
  const [r, g, b] = triplet.split(" ").map((c) => (Number(c) / 255) ** 2.4);
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  return y < 0.022 ? y + (0.022 - y) ** 1.414 : y;
}

/** APCA lightness contrast Lc of text over a background (RGB triplets "R G B"). Positive = dark text on light, negative = light text on dark. */
export function apcaContrast(text, bg) {
  const yt = apcaY(text);
  const yb = apcaY(bg);
  if (Math.abs(yb - yt) < 0.0005) return 0;
  if (yb > yt) {
    const s = (yb ** 0.56 - yt ** 0.57) * 1.14;
    return s < 0.1 ? 0 : (s - 0.027) * 100;
  }
  const s = (yb ** 0.65 - yt ** 0.62) * 1.14;
  return s > -0.1 ? 0 : (s + 0.027) * 100;
}

/**
 * Mix two OKLCH colors by interpolating all three channels.
 * @param {Oklch} from
 * @param {Oklch} to
 * @param {number} amount — 0 = from, 1 = to
 * @returns {Oklch}
 */
export function oklchMix(from, to, amount) {
  // Handle hue interpolation across the 0/360 boundary
  let deltaH = to.H - from.H;
  if (deltaH > 180) deltaH -= 360;
  if (deltaH < -180) deltaH += 360;
  return {
    L: from.L + (to.L - from.L) * amount,
    C: from.C + (to.C - from.C) * amount,
    H: (from.H + deltaH * amount + 360) % 360,
  };
}

/**
 * Generate a perceptually even shade scale from a single OKLCH color.
 * Produces N steps from dark to light with even L spacing.
 *
 * This is the key advantage over RGB/HSL: the steps are visually even
 * regardless of hue, because OKLCH's L axis is perceptually uniform.
 *
 * @param {Oklch} base — the anchor color (typically placed at the midpoint)
 * @param {number} steps — number of steps to generate (e.g. 11 for 0..1000)
 * @param {number} [anchorIndex] — which step the base color occupies (default: middle)
 * @returns {Oklch[]}
 */
export function oklchScale(base, steps, anchorIndex) {
  const anchor = anchorIndex ?? Math.floor(steps / 2);
  const minL = 0.05; // near-black but not pure black
  const maxL = 0.98; // near-white but not pure white

  // Generate L values so that the anchor sits at base.L and the rest
  // distribute evenly between minL and maxL. This guarantees monotonicity.
  const Lleft = anchor; // steps below anchor
  const Lright = steps - 1 - anchor; // steps above anchor
  const stepDown = Lleft > 0 ? (base.L - minL) / Lleft : 0;
  const stepUp = Lright > 0 ? (maxL - base.L) / Lright : 0;

  const scale = [];
  for (let i = 0; i < steps; i++) {
    const L = i <= anchor
      ? base.L - stepDown * (anchor - i)
      : base.L + stepUp * (i - anchor);
    // Chroma: peak at anchor, taper toward extremes
    const distFromAnchor = Math.abs(i - anchor) / Math.max(anchor, steps - 1 - anchor);
    const C = base.C * (1 - distFromAnchor * 0.6);
    scale.push({ L, C: Math.max(0, C), H: base.H });
  }

  return scale;
}

// ── Color-space state (used by ThemeProvider) ──────────────────────────

/**
 * Read the active color space from the document root.
 * Set by ThemeProvider via `data-color-space` attribute on <html>.
 * Defaults to "rgb" for backward compatibility.
 */
export function getColorSpace() {
  if (typeof document !== "undefined") {
    const attr = document.documentElement.dataset.colorSpace;
    if (attr === "oklch") return "oklch";
  }
  return "rgb";
}

/**
 * Set the active color space on the document root.
 * Called by ThemeProvider when colorSpace prop is provided.
 */
export function setColorSpace(cs) {
  if (typeof document !== "undefined") {
    if (cs === "oklch") {
      document.documentElement.dataset.colorSpace = "oklch";
    } else {
      delete document.documentElement.dataset.colorSpace;
    }
  }
}
