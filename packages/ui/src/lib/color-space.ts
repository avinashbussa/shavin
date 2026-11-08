/**
 * @shavin/ui — OKLCH ↔ RGB Color Space Conversion (TypeScript runtime)
 *
 * This is the typed runtime counterpart to color-space.mjs (used by build scripts).
 * Both files share identical math — .ts for React/ThemeProvider imports, .mjs for
 * Node CLI scripts (gen-oklch.mjs, brand-tokens.mjs).
 */

export type Oklch = { L: number; C: number; H: number };

// ── Hex ↔ RGB triplet ──────────────────────────────────────────────────────

export function hexToTriplet(hex: string): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function tripletToHex(triplet: string): string {
  const [r, g, b] = triplet.split(" ").map(Number);
  return `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("")}`;
}

// ── sRGB ↔ Linear RGB ──────────────────────────────────────────────────────

function srgbToLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function linearToSrgb(c: number): number {
  return c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055;
}

// ── Linear RGB ↔ OKLab ─────────────────────────────────────────────────────

function linearRgbToOklab(lin: { r: number; g: number; b: number }): { L: number; a: number; b: number } {
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

function oklabToLinearRgb(lab: { L: number; a: number; b: number }): { r: number; g: number; b: number } {
  const l_ = lab.L + 0.3963377774 * lab.a + 0.2158037573 * lab.b;
  const m_ = lab.L - 0.1055613458 * lab.a - 0.0638531728 * lab.b;
  const s_ = lab.L - 0.0894841775 * lab.a - 1.2914855480 * lab.b;

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  return {
    r: 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    g: -1.2684380046 * l + 2.6097570426 * m - 0.3413193965 * s,
    b: -0.0041960863 * l - 0.7034186147 * m + 1.7076149664 * s,
  };
}

// ── OKLab ↔ OKLCH ──────────────────────────────────────────────────────────

function oklabToOklch(lab: { L: number; a: number; b: number }): Oklch {
  const C = Math.sqrt(lab.a ** 2 + lab.b ** 2);
  let H = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;
  if (H < 0) H += 360;
  return { L: lab.L, C, H };
}

function oklchToOklab(o: Oklch): { L: number; a: number; b: number } {
  const a = Math.cos((o.H * Math.PI) / 180) * o.C;
  const b = Math.sin((o.H * Math.PI) / 180) * o.C;
  return { L: o.L, a, b };
}

// ── Full chain conversions ─────────────────────────────────────────────────

export function hexToOklch(hex: string): Oklch {
  const { r, g, b } = hexToRgb(hex);
  const lin = {
    r: srgbToLinear(r / 255),
    g: srgbToLinear(g / 255),
    b: srgbToLinear(b / 255),
  };
  return oklabToOklch(linearRgbToOklab(lin));
}

export function rgbTripletToOklch(triplet: string): Oklch {
  const [r, g, b] = triplet.split(" ").map(Number);
  const lin = {
    r: srgbToLinear(r / 255),
    g: srgbToLinear(g / 255),
    b: srgbToLinear(b / 255),
  };
  return oklabToOklch(linearRgbToOklab(lin));
}

export function oklchToRgbTriplet(o: Oklch): string {
  const lin = oklabToLinearRgb(oklchToOklab(o));
  const to255 = (c: number) => {
    const srgb = linearToSrgb(c);
    return Math.max(0, Math.min(255, Math.round(srgb * 255)));
  };
  return `${to255(lin.r)} ${to255(lin.g)} ${to255(lin.b)}`;
}

export function oklchToHex(o: Oklch): string {
  return tripletToHex(oklchToRgbTriplet(o));
}

export function oklchToCss(o: Oklch, alpha: number = 1): string {
  const L = Math.round(o.L * 1e4) / 1e4;
  const C = Math.round(o.C * 1e4) / 1e4;
  const H = Math.round(o.H * 100) / 100;
  if (alpha >= 1) return `oklch(${L} ${C} ${H})`;
  return `oklch(${L} ${C} ${H} / ${alpha})`;
}

// ── OKLCH-aware luminance, foreground, hover, text ─────────────────────────

export function oklchLuminance(o: Oklch): number {
  return o.L;
}

// WCAG 2.x contrast is defined on sRGB luminance, so OKLCH accents are measured
// after conversion and get the same guarantees as the RGB path (theme-presets.ts).
const OK_WHITE: Oklch = { L: 1, C: 0, H: 0 };
const OK_INK: Oklch = { L: 0.18, C: 0, H: 0 };
const OK_LIGHT_SURFACES = ["255 255 255", "244 244 245"];
const OK_DARK_SURFACES = ["24 24 27", "10 10 12", "30 30 33"];

function tripletLuminance(triplet: string): number {
  const [r, g, b] = triplet.split(" ").map((c) => Number(c) / 255);
  const lin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function tripletContrast(a: string, b: string): number {
  const x = tripletLuminance(a);
  const y = tripletLuminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/** Text on a solid accent fill: white while it clears 4.5:1, otherwise the higher-contrast ink. */
export function oklchForegroundFor(o: Oklch): Oklch {
  const fill = oklchToRgbTriplet(o);
  const white = tripletContrast("255 255 255", fill);
  if (white >= 4.5) return OK_WHITE;
  return tripletContrast(oklchToRgbTriplet(OK_INK), fill) > white ? OK_INK : OK_WHITE;
}

export function oklchHoverFor(o: Oklch, isDark: boolean, amount: number = 0.08): Oklch {
  const targetL = isDark ? 1 : 0;
  return {
    L: o.L + (targetL - o.L) * amount,
    C: o.C,
    H: o.H,
  };
}

/** Accent for text, links and focus rings: L is moved toward black (light) or white (dark) until it clears 4.5:1 on every page surface. */
export function oklchTextFor(o: Oklch, isDark: boolean): Oklch {
  const surfaces = isDark ? OK_DARK_SURFACES : OK_LIGHT_SURFACES;
  for (let step = 0; step <= 50; step++) {
    const candidate: Oklch = { L: o.L + ((isDark ? 1 : 0) - o.L) * (step / 50), C: o.C, H: o.H };
    const rgb = oklchToRgbTriplet(candidate);
    if (Math.min(...surfaces.map((s) => tripletContrast(rgb, s))) >= 4.6) return candidate;
  }
  return isDark ? OK_WHITE : { L: 0, C: 0, H: 0 };
}

export function oklchAchromaticInversion(o: Oklch, isDark: boolean): Oklch {
  if (isDark && o.L < 0.12) return { L: 0.92, C: 0, H: 0 };
  if (!isDark && o.L > 0.85) return { L: 0.18, C: 0, H: 0 };
  return o;
}

export function oklchMix(from: Oklch, to: Oklch, amount: number): Oklch {
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
 * Generate a perceptually-uniform lightness scale from a base OKLCH color.
 * Used for gray scale generation and accent ramp construction.
 */
export function oklchScale(base: Oklch, steps: number, anchorIndex?: number): Oklch[] {
  const anchor = anchorIndex ?? Math.floor(steps / 2);
  const minL = 0.05;
  const maxL = 0.98;

  const Lleft = anchor;
  const Lright = steps - 1 - anchor;
  const stepDown = Lleft > 0 ? (base.L - minL) / Lleft : 0;
  const stepUp = Lright > 0 ? (maxL - base.L) / Lright : 0;

  const scale: Oklch[] = [];
  for (let i = 0; i < steps; i++) {
    const L = i <= anchor
      ? base.L - stepDown * (anchor - i)
      : base.L + stepUp * (i - anchor);
    const distFromAnchor = Math.abs(i - anchor) / Math.max(anchor, steps - 1 - anchor);
    const C = base.C * (1 - distFromAnchor * 0.6);
    scale.push({ L, C: Math.max(0, C), H: base.H });
  }

  return scale;
}

// ── Color space type & detection ───────────────────────────────────────────

export type ColorSpace = "rgb" | "oklch";

/**
 * Read the active color space from the document root.
 * Set by ThemeProvider via `data-color-space` attribute on <html>.
 * Defaults to "rgb" for backward compatibility.
 */
export function getColorSpace(): ColorSpace {
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
export function setColorSpace(cs: ColorSpace): void {
  if (typeof document !== "undefined") {
    if (cs === "oklch") {
      document.documentElement.dataset.colorSpace = "oklch";
    } else {
      delete document.documentElement.dataset.colorSpace;
    }
  }
}
