// Brand-tinted neutrals: the default grey scale (--n-0 .. --n-1000), re-hued toward the brand colour at
// very low chroma. Every step keeps the WCAG relative luminance of the default scale, so each contrast
// pair that scale was validated for (fg-subtle on canvas, border-control, dark-surface text, ...) still
// holds. Pure functions, no DOM. packages/cli/src/lib/neutrals.mjs carries the same maths for the CLI;
// tests/unit/neutral-tint-parity.test.ts keeps the two identical.

import { hexToOklch, rgbTripletToOklch, oklchToRgbTriplet, oklchToCss, type ColorSpace } from "./color-space";

/** How strongly the brand hue shows in the greys. */
export type NeutralsAmount = "subtle" | "medium";
export type NeutralsMode = "brand" | "neutral";

export const NEUTRALS_AMOUNTS: readonly NeutralsAmount[] = ["subtle", "medium"];
export const DEFAULT_NEUTRALS_MODE: NeutralsMode = "neutral";
export const DEFAULT_NEUTRALS_AMOUNT: NeutralsAmount = "subtle";

export function isNeutralsAmount(v: unknown): v is NeutralsAmount {
  return v === "subtle" || v === "medium";
}

/** The shipped default scale (tokens.css). */
export const BASE_NEUTRALS: Record<number, string> = {
  0: "255 255 255", 50: "250 250 250", 100: "244 244 245", 200: "228 228 231", 300: "212 212 216",
  400: "161 161 170", 450: "137 137 146", 500: "110 110 119", 600: "82 82 91", 700: "63 63 70",
  800: "39 39 42", 850: "30 30 33", 900: "24 24 27", 950: "10 10 12", 1000: "0 0 0",
};
export const NEUTRAL_STEPS = Object.keys(BASE_NEUTRALS).map(Number);

/** OKLCH chroma at the strongest step. Subtle reads as a faint warm or cool cast, medium as a clear one. */
const PEAK_CHROMA: Record<NeutralsAmount, number> = { subtle: 0.007, medium: 0.015 };

/** Share of the peak at each step: pure white and black stay pure; the page tones carry the tint. */
const STEP_WEIGHT: Record<number, number> = {
  0: 0, 50: 0.55, 100: 0.85, 200: 1, 300: 1, 400: 0.9, 450: 0.85, 500: 0.85, 600: 0.85, 700: 0.8,
  800: 0.8, 850: 0.8, 900: 0.8, 950: 0.75, 1000: 0,
};

/** Brands below this OKLCH chroma are greys: they get no tint. Between this and FULL_AT the tint fades in. */
const GREY_BELOW = 0.02;
const FULL_AT = 0.07;

function relLum(triplet: string): number {
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const [r, g, b] = triplet.split(" ").map((v) => lin(Number(v) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** 0 for a grey or monochrome brand, 1 for a clearly coloured one. */
export function neutralsBrandStrength(hex: string): number {
  const c = hexToOklch(hex).C;
  const t = Math.min(1, Math.max(0, (c - GREY_BELOW) / (FULL_AT - GREY_BELOW)));
  return t * t * (3 - 2 * t);
}

/**
 * The tinted scale as RGB triplets, or undefined when the brand is grey/monochrome (keep the default scale).
 * Each step is the brand hue at low chroma, with lightness searched so the 8-bit result has the same
 * relative luminance as the default step (a bisection on OKLab L, judged on the rounded triplet).
 */
export function tintedNeutralTriplets(hex: string, amount: NeutralsAmount = DEFAULT_NEUTRALS_AMOUNT): Record<number, string> | undefined {
  const strength = neutralsBrandStrength(hex);
  if (strength <= 0) return undefined;
  const hue = hexToOklch(hex).H;
  const out: Record<number, string> = {};
  for (const step of NEUTRAL_STEPS) {
    const base = BASE_NEUTRALS[step];
    const chroma = PEAK_CHROMA[amount] * STEP_WEIGHT[step] * strength;
    if (chroma <= 0) {
      out[step] = base;
      continue;
    }
    const target = relLum(base);
    let lo = 0;
    let hi = 1;
    let best = base;
    let bestErr = Infinity;
    for (let i = 0; i < 28; i++) {
      const mid = (lo + hi) / 2;
      const triplet = oklchToRgbTriplet({ L: mid, C: chroma, H: hue });
      const y = relLum(triplet);
      const err = Math.abs(y - target);
      if (err < bestErr) {
        bestErr = err;
        best = triplet;
      }
      if (y < target) lo = mid;
      else hi = mid;
    }
    out[step] = best;
  }
  return out;
}

/** CSS custom properties (`--n-<step>`) for the tinted scale in the given colour space; {} for a grey brand. */
export function tintedNeutralVars(hex: string, amount: NeutralsAmount, colorSpace: ColorSpace = "rgb"): Record<string, string> {
  const scale = tintedNeutralTriplets(hex, amount);
  if (!scale) return {};
  const vars: Record<string, string> = {};
  for (const step of NEUTRAL_STEPS) {
    vars[`--n-${step}`] = colorSpace === "oklch" ? oklchToCss(rgbTripletToOklch(scale[step])) : scale[step];
  }
  return vars;
}
