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

/**
 * Pick black or white foreground for maximum contrast on a given OKLCH color.
 * OKLCH L=0.45 is roughly the perceptual midpoint (analogous to the WCAG
 * threshold of 0.45 in the RGB luminance function).
 * @param {Oklch} o
 * @returns {Oklch} — near-black (L=0.18) or white (L=1)
 */
export function oklchForegroundFor(o) {
  return o.L > 0.45 ? { L: 0.18, C: 0, H: 0 } : { L: 1, C: 0, H: 0 };
}

/**
 * Hover variant: lighten/darken by interpolating L toward white or black.
 * @param {Oklch} o
 * @param {boolean} isDark — in dark mode, lighten (toward L=1); in light, darken (toward L=0)
 * @param {number} [amount=0.08] — interpolation factor
 * @returns {Oklch}
 */
export function oklchHoverFor(o, isDark, amount = 0.08) {
  const targetL = isDark ? 1 : 0;
  return {
    L: o.L + (targetL - o.L) * amount,
    C: o.C,
    H: o.H,
  };
}

/**
 * WCAG-accessible text color for accent colors on soft/light backgrounds.
 * Mirrors the logic of accentTextFor() but in OKLCH space.
 *
 * - Light mode: High-luminance accents (L > 0.70) get darkened toward L=0.25
 *   for contrast. Regular accents (L <= 0.70) stay as-is.
 * - Dark mode: Low-luminance accents (L < 0.40) get lightened toward L=0.75.
 *   Vibrant accents (L >= 0.40) stay as-is.
 * @param {Oklch} o
 * @param {boolean} isDark
 * @returns {Oklch}
 */
export function oklchTextFor(o, isDark) {
  if (isDark) {
    if (o.L < 0.40) {
      const amount = Math.min(0.50, Math.max(0.30, 0.55 - o.L * 0.6));
      return {
        L: o.L + (1 - o.L) * amount,
        C: o.C,
        H: o.H,
      };
    }
    return o;
  }
  if (o.L > 0.70) {
    const amount = Math.min(0.55, Math.max(0.30, 0.15 + o.L * 0.35));
    return {
      L: o.L + (0 - o.L) * amount,
      C: o.C,
      H: o.H,
      };
  }
  return o;
}

/**
 * Achromatic inversion — for near-black or near-white accents that need to
 * flip in dark mode (e.g. Monochrome: #000 in light → #fff in dark).
 * @param {Oklch} o
 * @param {boolean} isDark
 * @returns {Oklch}
 */
export function oklchAchromaticInversion(o, isDark) {
  if (isDark && o.L < 0.12) return { L: 0.92, C: 0, H: 0 };
  if (!isDark && o.L > 0.85) return { L: 0.18, C: 0, H: 0 };
  return o;
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
