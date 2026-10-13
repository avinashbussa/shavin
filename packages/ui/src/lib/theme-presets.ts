// Canonical preset data + apply functions backing `ThemeProvider` and the
// playground's Configurator (which imports these instead of keeping its own
// copy, so the two can never drift). Mutates the same CSS custom properties
// every primitive already reads from `styles.css` — no parallel token system.
//
// Color-space aware: all accent/gray functions branch on colorSpace.
// RGB mode: outputs bare triplets "R G B" (v3 + v4-rgb path, default).
// OKLCH mode: outputs oklch() CSS strings (v4-oklch path).

import {
  type Oklch,
  type ColorSpace,
  hexToOklch,
  oklchToCss,
  oklchLuminance,
  oklchForegroundFor,
  oklchHoverFor,
  oklchTextFor,
  oklchAchromaticInversion,
  oklchMix,
  oklchToRgbTriplet,
  rgbTripletToOklch,
  getColorSpace,
} from "./color-space";

export function hexToTriplet(hex: string): string {
  const m = hex.replace("#", "");
  const full = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `${r} ${g} ${b}`;
}

export function tripletToHex(triplet: string): string {
  const [r, g, b] = triplet.split(" ").map(Number);
  return `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function mix(triplet: string, toward: number, amount: number): string {
  const [r, g, b] = triplet.split(" ").map(Number);
  const m = (c: number) => Math.round(c + (toward - c) * amount);
  return `${m(r)} ${m(g)} ${m(b)}`;
}

// WCAG relative luminance -> pick black or white foreground for contrast.
function relativeLuminance(triplet: string): number {
  const [r, g, b] = triplet.split(" ").map((c) => Number(c) / 255);
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function accentForegroundFor(triplet: string): string {
  return relativeLuminance(triplet) > 0.45 ? "10 10 12" : "255 255 255";
}

export function accentHoverFor(triplet: string, isDark: boolean): string {
  return mix(triplet, isDark ? 255 : 0, 0.12);
}

/**
 * Dynamic WCAG-accessible text color for accents rendered on soft/light backgrounds.
 * - Light mode: High-luminance accents (lum > 0.35, e.g. Lime, Mint, Amber, Sky, Yellow)
 *   dynamically compute a darkened, high-contrast tone. Regular accents (lum <= 0.35,
 *   e.g. Indigo, Violet, Blue, Red, Crimson, Plum, Purple, Monochrome) take var(--accent) directly.
 * - Dark mode: Low-luminance / deep accents (lum < 0.22, e.g. Monochrome, deep Bronze)
 *   dynamically compute a lightened complementing shade. Vibrant accents (lum >= 0.22)
 *   take var(--accent) directly.
 */
export function accentTextFor(triplet: string, isDark: boolean): string {
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

// ── OKLCH-mode equivalents ─────────────────────────────────────────────────
// These return oklch() CSS strings instead of RGB triplets.
// Used when colorSpace === "oklch".

export function accentForegroundForOklch(o: Oklch): string {
  const fg = oklchForegroundFor(o);
  return oklchToCss(fg);
}

export function accentHoverForOklch(o: Oklch, isDark: boolean): string {
  const hover = oklchHoverFor(o, isDark, 0.12);
  return oklchToCss(hover);
}

export function accentTextForOklch(o: Oklch, isDark: boolean): string {
  const text = oklchTextFor(o, isDark);
  return oklchToCss(text);
}

// 24-swatch accent spectrum, Radix-Themes-playground style (a named hue per
// swatch rather than a raw color wheel — easier to reason about than "hue 210").
export const ACCENT_PRESETS: { name: string; hex: string }[] = [
  { name: "Monochrome", hex: "#000000" },
  { name: "Tomato", hex: "#e54d2e" },
  { name: "Red", hex: "#e5484d" },
  { name: "Ruby", hex: "#e54666" },
  { name: "Crimson", hex: "#e93d82" },
  { name: "Pink", hex: "#d6409f" },
  { name: "Plum", hex: "#ab4aba" },
  { name: "Purple", hex: "#8e4ec6" },
  { name: "Violet", hex: "#6e56cf" },
  { name: "Iris", hex: "#5b5bd6" },
  { name: "Indigo", hex: "#3e63dd" },
  { name: "Blue", hex: "#0090ff" },
  { name: "Cyan", hex: "#00a2c7" },
  { name: "Teal", hex: "#12a594" },
  { name: "Jade", hex: "#29a383" },
  { name: "Green", hex: "#30a46c" },
  { name: "Grass", hex: "#46a758" },
  { name: "Lime", hex: "#bdee63" },
  { name: "Mint", hex: "#86ead4" },
  { name: "Sky", hex: "#7ce2fe" },
  { name: "Amber", hex: "#ffc53d" },
  { name: "Gold", hex: "#978365" },
  { name: "Bronze", hex: "#a18072" },
  { name: "Brown", hex: "#ad7f58" },
];

/**
 * Foundation neutral scale swaps. "Zinc" is our shipped default (the values
 * already baked into global.css) — the rest are the same well-known Tailwind
 * gray families, picked for the same reason Radix ships Gray/Mauve/Slate/etc:
 * a different hue temperature under the same semantic roles.
 */
/** 850 is derived (midpoint of 800 and 900) so dark-mode hover/elevated fills follow the gray family instead of falling back to the default neutral. */
export const GRAY_STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 850, 900, 950] as const;

export const GRAY_PRESETS: { name: string; swatch: string; scale: Record<number, string> }[] = [
  {
    name: "Zinc",
    swatch: "#71717a",
    scale: { 50: "250 250 250", 100: "244 244 245", 200: "228 228 231", 300: "212 212 216", 400: "161 161 170", 500: "113 113 122", 600: "82 82 91", 700: "63 63 70", 800: "39 39 42", 900: "24 24 27", 950: "10 10 12" },
  },
  {
    name: "Slate",
    swatch: "#64748b",
    scale: { 50: "248 250 252", 100: "241 245 249", 200: "226 232 240", 300: "203 213 225", 400: "148 163 184", 500: "100 116 139", 600: "71 85 105", 700: "51 65 85", 800: "30 41 59", 900: "15 23 42", 950: "2 6 23" },
  },
  {
    name: "Gray",
    swatch: "#6b7280",
    scale: { 50: "249 250 251", 100: "243 244 246", 200: "229 231 235", 300: "209 213 219", 400: "156 163 175", 500: "107 114 128", 600: "75 85 99", 700: "55 65 81", 800: "31 41 55", 900: "17 24 39", 950: "3 7 18" },
  },
  {
    name: "Neutral",
    swatch: "#737373",
    scale: { 50: "250 250 250", 100: "245 245 245", 200: "229 229 229", 300: "212 212 212", 400: "163 163 163", 500: "115 115 115", 600: "82 82 82", 700: "64 64 64", 800: "38 38 38", 900: "23 23 23", 950: "10 10 10" },
  },
  {
    name: "Stone",
    swatch: "#78716c",
    scale: { 50: "250 250 249", 100: "245 245 244", 200: "231 229 228", 300: "214 211 209", 400: "168 162 158", 500: "120 113 108", 600: "87 83 78", 700: "68 64 60", 800: "41 37 36", 900: "28 25 23", 950: "12 10 9" },
  },
];

for (const preset of GRAY_PRESETS) {
  const a = preset.scale[800].split(" ").map(Number);
  const b = preset.scale[900].split(" ").map(Number);
  preset.scale[850] = a.map((v, k) => Math.round((v + b[k]) / 2)).join(" ");
}

/**
 * `panel` is deliberately NOT 9999px at "full" — it backs Card/Dialog/Menu/
 * Popover/etc, and a whole rectangular panel rendered as a stadium shape is
 * broken, not "rounded". Capped at the same value as "large" instead.
 */
export const RADIUS_PRESETS: { name: string; label: string; lg: string; xl: string; panel: string }[] = [
  { name: "none", label: "None", lg: "0px", xl: "0px", panel: "0px" },
  { name: "small", label: "Small", lg: "0.25rem", xl: "0.375rem", panel: "0.5rem" },
  { name: "medium", label: "Medium", lg: "0.5rem", xl: "0.75rem", panel: "1rem" },
  { name: "large", label: "Large", lg: "0.75rem", xl: "1rem", panel: "1.5rem" },
  { name: "full", label: "Full", lg: "9999px", xl: "9999px", panel: "1.5rem" },
];

export const SCALING_PRESETS = [90, 95, 100, 105, 110] as const;

export function resolveAccentTriplet(nameOrHex: string, isDark: boolean): string {
  return resolveAccent(nameOrHex, isDark, "rgb");
}

/**
 * Color-space-aware accent resolution.
 * Returns RGB triplet ("R G B") in rgb mode, oklch() CSS string in oklch mode.
 */
export function resolveAccent(nameOrHex: string, isDark: boolean, colorSpace: ColorSpace): string {
  const target = nameOrHex || "Monochrome";
  const hex = target.startsWith("#")
    ? target
    : ACCENT_PRESETS.find((p) => p.name.toLowerCase() === target.toLowerCase())?.hex ?? "#000000";

  if (colorSpace === "oklch") {
    let o = hexToOklch(hex);
    o = oklchAchromaticInversion(o, isDark);
    return oklchToCss(o);
  }

  // RGB path (original logic, unchanged)
  let triplet = hexToTriplet(hex);
  const lum = relativeLuminance(triplet);

  // Achromatic Inversion Rule (Radix / Apple / Vercel spec):
  // - Dark achromatic colors (black / dark charcoal, lum < 0.12) invert to white in dark mode.
  // - Light achromatic colors (white / pale tint, lum > 0.85) invert to black in light mode.
  if (isDark && lum < 0.12) {
    triplet = "228 228 231";
  } else if (!isDark && lum > 0.85) {
    triplet = "10 10 12";
  }
  return triplet;
}

/**
 * The five accent tokens for one context (page light/dark, or a dark/light
 * surface scope). Shared by applyAccentColor and scopedThemeVars.
 */
function accentTokenSet(target: string, isDark: boolean, cs: ColorSpace): Record<string, string> {
  if (cs === "oklch") {
    const hex = target.startsWith("#")
      ? target
      : ACCENT_PRESETS.find((p) => p.name.toLowerCase() === target.toLowerCase())?.hex ?? "#000000";
    const o = oklchAchromaticInversion(hexToOklch(hex), isDark);
    return {
      "": oklchToCss(o),
      "-hover": accentHoverForOklch(o, isDark),
      "-fg": accentForegroundForOklch(o),
      "-contrast": accentTextForOklch(o, isDark),
      "-text": accentTextForOklch(o, isDark),
    };
  }
  const t = resolveAccentTriplet(target, isDark);
  return {
    "": t,
    "-hover": accentHoverFor(t, isDark),
    "-fg": accentForegroundFor(t),
    "-contrast": accentTextFor(t, isDark),
    "-text": accentTextFor(t, isDark),
  };
}

/**
 * Accent variants for surface scopes. surface="dark"/"dark-always" (and the light
 * counterparts) read --accent-on-dark* / --accent-on-light* so an achromatic
 * accent flips with the surface (a black Monochrome button on dark media becomes
 * white) while chromatic brand accents keep their hue.
 */
function surfaceAccentVars(target: string, cs: ColorSpace): Record<string, string> {
  const vars: Record<string, string> = {};
  for (const [mode, isDark] of [["dark", true], ["light", false]] as const) {
    for (const [suffix, value] of Object.entries(accentTokenSet(target, isDark, cs))) {
      vars[`--accent-on-${mode}${suffix}`] = value;
    }
  }
  return vars;
}

let lastAppliedAccent: string | null = null;

/** `nameOrHex` may be one of ACCENT_PRESETS' names (case-insensitive) or a literal "#rrggbb". */
export function applyAccentColor(nameOrHex?: string) {
  if (nameOrHex) lastAppliedAccent = nameOrHex;
  const target = lastAppliedAccent || "Monochrome";
  const isDark = typeof document !== "undefined" && document.documentElement.classList.contains("dark");
  const cs = getColorSpace();

  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (cs === "oklch") {
      const o = oklchAchromaticInversion(hexToOklch(
        target.startsWith("#") ? target
        : ACCENT_PRESETS.find((p) => p.name.toLowerCase() === target.toLowerCase())?.hex ?? "#000000"
      ), isDark);
      root.style.setProperty("--accent", oklchToCss(o));
      root.style.setProperty("--accent-hover", accentHoverForOklch(o, isDark));
      root.style.setProperty("--accent-fg", accentForegroundForOklch(o));
      root.style.setProperty("--accent-contrast", accentTextForOklch(o, isDark));
      root.style.setProperty("--accent-text", accentTextForOklch(o, isDark));
      root.style.setProperty("--link", oklchToCss(o));
      root.style.setProperty("--focus", oklchToCss(o));
    } else {
      const triplet = resolveAccentTriplet(target, isDark);
      root.style.setProperty("--accent", triplet);
      root.style.setProperty("--accent-hover", accentHoverFor(triplet, isDark));
      root.style.setProperty("--accent-fg", accentForegroundFor(triplet));
      root.style.setProperty("--accent-contrast", accentTextFor(triplet, isDark));
      root.style.setProperty("--accent-text", accentTextFor(triplet, isDark));
      root.style.setProperty("--link", triplet);
      root.style.setProperty("--focus", triplet);
    }
    for (const [k, v] of Object.entries(surfaceAccentVars(target, cs))) root.style.setProperty(k, v);
  }
}

export function applyGrayColor(name: string) {
  const preset = GRAY_PRESETS.find((g) => g.name.toLowerCase() === name.toLowerCase());
  if (!preset) return;
  const root = document.documentElement;
  const cs = getColorSpace();
  for (const step of GRAY_STEPS) {
    if (cs === "oklch") {
      root.style.setProperty(`--n-${step}`, oklchToCss(rgbTripletToOklch(preset.scale[step])));
    } else {
      root.style.setProperty(`--n-${step}`, preset.scale[step]);
    }
  }
  // --n-450 (dark-surface fg-subtle) sits between n-400 and n-500 of the chosen gray.
  const mid = (a: string, b: string) => a.split(" ").map((v, i) => Math.round((Number(v) + Number(b.split(" ")[i])) / 2)).join(" ");
  const n450 = mid(preset.scale[400], preset.scale[500]);
  root.style.setProperty("--n-450", cs === "oklch" ? oklchToCss(rgbTripletToOklch(n450)) : n450);
}

export function applyRadiusPreset(name: string) {
  const preset = RADIUS_PRESETS.find((r) => r.name.toLowerCase() === name.toLowerCase());
  if (!preset) return;
  const root = document.documentElement;
  root.style.setProperty("--radius-lg", preset.lg);
  root.style.setProperty("--radius-xl", preset.xl);
  root.style.setProperty("--radius-panel", preset.panel);
}

export function applyScalingPreset(pct: number | string) {
  if (typeof document !== "undefined") {
    const num = typeof pct === "string" ? parseInt(pct, 10) : pct;
    // Always write the value, including 100: the ThemeProvider stylesheet may declare a different root
    // font-size (e.g. 95%), and clearing the inline style would let that win, so 100% looked like 95%.
    document.documentElement.style.fontSize = `${num}%`;
  }
}

/** Computes scoped CSS variables for an isolated subtree without mutating document.documentElement. */
export function scopedThemeVars(
  accentNameOrHex?: string,
  grayName?: string,
  radiusName?: string,
  isDark: boolean = false,
  displayFont?: string,
  bodyFont?: string,
  scaling?: number,
  colorSpace: ColorSpace = "rgb",
): Record<string, string> {
  const vars: Record<string, string> = {};
  if (accentNameOrHex) {
    if (colorSpace === "oklch") {
      const hex = accentNameOrHex.startsWith("#")
        ? accentNameOrHex
        : ACCENT_PRESETS.find((p) => p.name.toLowerCase() === accentNameOrHex.toLowerCase())?.hex ?? "#000000";
      const o = oklchAchromaticInversion(hexToOklch(hex), isDark);
      const ocss = oklchToCss(o);
      vars["--accent"] = ocss;
      vars["--accent-hover"] = accentHoverForOklch(o, isDark);
      vars["--accent-fg"] = accentForegroundForOklch(o);
      vars["--accent-contrast"] = accentTextForOklch(o, isDark);
      vars["--accent-text"] = accentTextForOklch(o, isDark);
      vars["--link"] = ocss;
      vars["--focus"] = ocss;
    } else {
      const t = resolveAccentTriplet(accentNameOrHex, isDark);
      vars["--accent"] = t;
      vars["--accent-hover"] = accentHoverFor(t, isDark);
      vars["--accent-fg"] = accentForegroundFor(t);
      vars["--accent-contrast"] = accentTextFor(t, isDark);
      vars["--accent-text"] = accentTextFor(t, isDark);
      vars["--link"] = t;
      vars["--focus"] = t;
    }
    Object.assign(vars, surfaceAccentVars(accentNameOrHex, colorSpace));
  } else {
    // When accent is not explicitly overridden, map to the appearance-specific surface accent variables
    // so achromatic accents (Monochrome) flip correctly between light and dark subtrees
    const mode = isDark ? "dark" : "light";
    vars["--accent"] = `var(--accent-on-${mode}, var(--accent))`;
    vars["--accent-hover"] = `var(--accent-on-${mode}-hover, var(--accent-hover))`;
    vars["--accent-fg"] = `var(--accent-on-${mode}-fg, var(--accent-fg))`;
    vars["--accent-contrast"] = `var(--accent-on-${mode}-contrast, var(--accent-contrast))`;
    vars["--accent-text"] = `var(--accent-on-${mode}-text, var(--accent-text))`;
    vars["--link"] = `var(--accent-on-${mode}, var(--link))`;
    vars["--focus"] = `var(--accent-on-${mode}, var(--focus))`;
  }
  if (grayName) {
    const g = GRAY_PRESETS.find((x) => x.name.toLowerCase() === grayName.toLowerCase());
    if (g) {
      for (const [step, val] of Object.entries(g.scale)) {
        vars[`--n-${step}`] = colorSpace === "oklch"
          ? oklchToCss(rgbTripletToOklch(val as string))
          : (val as string);
      }
    }
  }
  // Semantic role mappings based on appearance mode (isDark)
  if (isDark) {
    vars["--bg-canvas"] = "var(--n-950)";
    vars["--bg-surface"] = "var(--n-900)";
    vars["--bg-surface-hover"] = "var(--n-850)";
    vars["--bg-elevated"] = "var(--n-850)";
    vars["--hairline"] = "var(--n-800)";
    vars["--hairline-strong"] = "var(--n-700)";
    vars["--fg"] = "var(--n-200)";
    vars["--fg-muted"] = "var(--n-400)";
    vars["--fg-subtle"] = "var(--n-500)";
  } else {
    vars["--bg-canvas"] = "var(--n-100)";
    vars["--bg-surface"] = "var(--n-0)";
    vars["--bg-surface-hover"] = "var(--n-100)";
    vars["--bg-elevated"] = "var(--n-0)";
    vars["--hairline"] = "var(--n-200)";
    vars["--hairline-strong"] = "var(--n-300)";
    vars["--fg"] = "var(--n-950)";
    vars["--fg-muted"] = "var(--n-600)";
    vars["--fg-subtle"] = "var(--n-500)";
  }

  if (radiusName) {
    const r = RADIUS_PRESETS.find((x) => x.name.toLowerCase() === radiusName.toLowerCase());
    if (r) {
      vars["--radius-lg"] = r.lg;
      vars["--radius-xl"] = r.xl;
      vars["--radius-panel"] = r.panel;
      // Fallback: no subtraction — containers override this with the correct
      // R_inner = max(floor, R_outer - P) via concentricContainerStyle().
      vars["--radius-panel-inner"] = r.panel;
    }
  }
  if (displayFont) {
    loadGoogleFont(displayFont);
    const fontObj = DISPLAY_FONTS.find((f) => f.name.toLowerCase() === displayFont.toLowerCase());
    const displayVal = fontObj ? fontObj.value : `'${displayFont}', sans-serif`;
    vars["--font-display"] = displayVal;
  }
  if (bodyFont) {
    loadGoogleFont(bodyFont);
    const fontObj = BODY_FONTS.find((f) => f.name.toLowerCase() === bodyFont.toLowerCase());
    const bodyVal = fontObj ? fontObj.value : `'${bodyFont}', sans-serif`;
    vars["--font-body"] = bodyVal;
    vars["fontFamily"] = bodyVal;
  }
  if (scaling) {
    vars["--scaling"] = `${scaling}%`;
  }
  return vars;
}

export function applyPanelBackground(translucent: boolean) {
  document.documentElement.classList.toggle("translucent-panels", translucent);
}

/** Props that describe a theme. Shared by ThemeProvider and the server-rendered theme CSS. */
export interface ThemeConfigInput {
  theme?: string;
  accentColor?: string;
  grayColor?: string;
  radius?: string;
  scaling?: number | string;
  panelBackground?: "solid" | "translucent";
  displayFont?: string;
  bodyFont?: string;
  /** Font for h3-h6 headings: "body" (default), "display", or a font family name. */
  subheadingFont?: string;
}

export interface ResolvedThemeConfig {
  accent?: string;
  gray?: string;
  radius?: string;
  scaling?: number;
  translucentPanels: boolean;
  displayFont?: string;
  bodyFont?: string;
  subheadingFont?: string;
}

/**
 * Resolves props the way ThemeProvider applies them at runtime: a named preset first (or the
 * "Monochrome" preset when nothing is set), then each explicit prop overrides it.
 */
export function resolveThemeConfig(input: ThemeConfigInput = {}): ResolvedThemeConfig {
  const { theme, accentColor, grayColor, radius, scaling, panelBackground, displayFont, bodyFont, subheadingFont } = input;
  const nothingSet = !theme && !accentColor && !grayColor && !radius && !displayFont && !bodyFont;
  const preset = theme
    ? THEME_PRESETS.find((t) => t.name.toLowerCase() === theme.toLowerCase())
    : nothingSet
      ? THEME_PRESETS.find((t) => t.name === "Monochrome")
      : undefined;
  const scale = scaling ?? preset?.scaling;
  return {
    accent: accentColor ?? preset?.accentColor,
    gray: grayColor ?? preset?.grayColor,
    radius: radius ?? preset?.radius,
    scaling: scale === undefined ? undefined : typeof scale === "string" ? parseInt(scale, 10) : scale,
    translucentPanels: (panelBackground ?? preset?.panelBackground) === "translucent",
    displayFont: displayFont ?? preset?.displayFont,
    bodyFont: bodyFont ?? preset?.bodyFont,
    subheadingFont,
  };
}

/** CSS value for `--font-subheading`: "display" follows the display font, otherwise a named font. */
function subheadingFontValue(name: string): string {
  if (name.toLowerCase() === "display") return "var(--font-display)";
  const f = [...DISPLAY_FONTS, ...BODY_FONTS].find((x) => x.name.toLowerCase() === name.toLowerCase());
  return f ? f.value : `'${name}', sans-serif`;
}

// CSS custom property values come from presets or developer props; keep them from closing the <style> tag.
const cssSafe = (v: string) => v.replace(/[<>{};]/g, "");

/**
 * Pure, server-safe CSS for a theme: the accent, neutral scale, radius, fonts and scaling that
 * ThemeProvider otherwise applies in effects after hydration. Rendered into the HTML, it makes the
 * first paint use the brand instead of the neutral CSS defaults. Accent tokens depend on appearance,
 * so light values go on :root and dark values on :root.dark.
 */
export function themeCss(input: ThemeConfigInput & { colorSpace?: ColorSpace } = {}): string {
  const cs: ColorSpace = input.colorSpace ?? "rgb";
  const c = resolveThemeConfig(input);
  const shared: Record<string, string> = {};
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};

  if (c.accent) {
    Object.assign(shared, surfaceAccentVars(c.accent, cs));
    for (const [mode, target] of [[false, light], [true, dark]] as const) {
      const set = accentTokenSet(c.accent, mode, cs);
      for (const [suffix, value] of Object.entries(set)) target[`--accent${suffix}`] = value;
      target["--link"] = set[""];
      target["--focus"] = set[""];
    }
  }
  if (c.gray) {
    const g = GRAY_PRESETS.find((x) => x.name.toLowerCase() === c.gray!.toLowerCase());
    if (g) {
      for (const step of GRAY_STEPS) {
        shared[`--n-${step}`] = cs === "oklch" ? oklchToCss(rgbTripletToOklch(g.scale[step])) : g.scale[step];
      }
    }
  }
  if (c.radius) {
    const r = RADIUS_PRESETS.find((x) => x.name.toLowerCase() === c.radius!.toLowerCase());
    if (r) {
      shared["--radius-lg"] = r.lg;
      shared["--radius-xl"] = r.xl;
      shared["--radius-panel"] = r.panel;
    }
  }
  if (c.displayFont) {
    const f = DISPLAY_FONTS.find((x) => x.name.toLowerCase() === c.displayFont!.toLowerCase());
    shared["--font-display"] = f ? f.value : c.displayFont;
  }
  if (c.bodyFont) {
    const f = BODY_FONTS.find((x) => x.name.toLowerCase() === c.bodyFont!.toLowerCase());
    shared["--font-body"] = f ? f.value : c.bodyFont;
  }
  if (c.subheadingFont && c.subheadingFont.toLowerCase() !== "body") {
    shared["--font-subheading"] = subheadingFontValue(c.subheadingFont);
  }
  if (c.scaling && c.scaling !== 100) shared["font-size"] = `${c.scaling}%`;

  const block = (selector: string, vars: Record<string, string>) => {
    const body = Object.entries(vars).map(([k, v]) => `${k}:${cssSafe(v)}`).join(";");
    return body ? `${selector}{${body}}` : "";
  };
  // :root:root outranks the stylesheet's :root and .dark defaults regardless of source order.
  return [block(":root:root", { ...shared, ...light }), block(":root:root.dark", dark)].filter(Boolean).join("");
}

export const DISPLAY_FONTS = [
  { name: "Aboreto", value: "'Aboreto', sans-serif" },
  { name: "Barlow", value: "'Barlow', sans-serif" },
  { name: "Baskervville", value: "'Baskervville', serif" },
  { name: "BBH Bartle", value: "'BBH Bartle', sans-serif" },
  { name: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
  { name: "Figtree", value: "'Figtree', sans-serif" },
  { name: "Fragment Mono", value: "'Fragment Mono', monospace" },
  { name: "Fraunces", value: "'Fraunces', serif" },
  { name: "Funnel Display", value: "'Funnel Display', sans-serif" },
  { name: "Funnel Sans", value: "'Funnel Sans', sans-serif" },
  { name: "Google Sans", value: "'Google Sans', sans-serif" },
  { name: "Google Sans Flex", value: "'Google Sans Flex', sans-serif" },
  { name: "Host Grotesk", value: "'Host Grotesk', sans-serif" },
  { name: "Inter", value: "'Inter', sans-serif" },
  { name: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { name: "Jura", value: "'Jura', sans-serif" },
  { name: "Lexend", value: "'Lexend', sans-serif" },
  { name: "Lora", value: "'Lora', serif" },
  { name: "Montserrat", value: "'Montserrat', sans-serif" },
  { name: "Montserrat Alternates", value: "'Montserrat Alternates', sans-serif" },
  { name: "Noto Serif", value: "'Noto Serif', serif" },
  { name: "Nunito Sans", value: "'Nunito Sans', sans-serif" },
  { name: "Onest", value: "'Onest', sans-serif" },
  { name: "Open Sans", value: "'Open Sans', sans-serif" },
  { name: "Outfit", value: "'Outfit', sans-serif" },
  { name: "Playfair Display", value: "'Playfair Display', serif" },
  { name: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif" },
  { name: "PT Serif", value: "'PT Serif', serif" },
  { name: "Public Sans", value: "'Public Sans', sans-serif" },
  { name: "Rethink Sans", value: "'Rethink Sans', sans-serif" },
  { name: "Saira", value: "'Saira', sans-serif" },
  { name: "Source Serif 4", value: "'Source Serif 4', serif" },
  { name: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { name: "Staatliches", value: "'Staatliches', sans-serif" },
  { name: "Titillium Web", value: "'Titillium Web', sans-serif" },
  { name: "Urbanist", value: "'Urbanist', sans-serif" },
  { name: "Work Sans", value: "'Work Sans', sans-serif" },
] as const;

export const BODY_FONTS = [
  { name: "Aboreto", value: "'Aboreto', sans-serif" },
  { name: "Barlow", value: "'Barlow', sans-serif" },
  { name: "Baskervville", value: "'Baskervville', serif" },
  { name: "BBH Bartle", value: "'BBH Bartle', sans-serif" },
  { name: "Bebas Neue", value: "'Bebas Neue', sans-serif" },
  { name: "Figtree", value: "'Figtree', sans-serif" },
  { name: "Fragment Mono", value: "'Fragment Mono', monospace" },
  { name: "Funnel Display", value: "'Funnel Display', sans-serif" },
  { name: "Funnel Sans", value: "'Funnel Sans', sans-serif" },
  { name: "Google Sans", value: "'Google Sans', sans-serif" },
  { name: "Google Sans Flex", value: "'Google Sans Flex', sans-serif" },
  { name: "Host Grotesk", value: "'Host Grotesk', sans-serif" },
  { name: "Inter", value: "'Inter', sans-serif" },
  { name: "JetBrains Mono", value: "'JetBrains Mono', monospace" },
  { name: "Jura", value: "'Jura', sans-serif" },
  { name: "Lexend", value: "'Lexend', sans-serif" },
  { name: "Lora", value: "'Lora', serif" },
  { name: "Montserrat", value: "'Montserrat', sans-serif" },
  { name: "Montserrat Alternates", value: "'Montserrat Alternates', sans-serif" },
  { name: "Noto Serif", value: "'Noto Serif', serif" },
  { name: "Nunito Sans", value: "'Nunito Sans', sans-serif" },
  { name: "Onest", value: "'Onest', sans-serif" },
  { name: "Open Sans", value: "'Open Sans', sans-serif" },
  { name: "Outfit", value: "'Outfit', sans-serif" },
  { name: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif" },
  { name: "PT Serif", value: "'PT Serif', serif" },
  { name: "Public Sans", value: "'Public Sans', sans-serif" },
  { name: "Rethink Sans", value: "'Rethink Sans', sans-serif" },
  { name: "Roboto", value: "'Roboto', sans-serif" },
  { name: "Saira", value: "'Saira', sans-serif" },
  { name: "Source Serif 4", value: "'Source Serif 4', serif" },
  { name: "Space Grotesk", value: "'Space Grotesk', sans-serif" },
  { name: "Staatliches", value: "'Staatliches', sans-serif" },
  { name: "Titillium Web", value: "'Titillium Web', sans-serif" },
  { name: "Urbanist", value: "'Urbanist', sans-serif" },
  { name: "Work Sans", value: "'Work Sans', sans-serif" },
] as const;

// ── Google Fonts bundle preload ──
// The full bundle URL with complete variable-font axis specifications for all
// 30 families. Loading this single stylesheet makes every font available for
// instant preview in the DevTools inspector / Studio settings — no per-font
// network round-trip when switching. Dev-only by default (see ThemeProvider).
const GOOGLE_FONTS_BUNDLE_URL =
  "https://fonts.googleapis.com/css2?family=Aboreto&family=BBH+Bartle&family=Barlow:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Baskervville:ital,wght@0,400..700;1,400..700&family=Bebas+Neue&family=Figtree:ital,wght@0,300..900;1,300..900&family=Fragment+Mono:ital@0;1&family=Funnel+Display:wght@300..800&family=Funnel+Sans:ital,wght@0,300..800;1,300..800&family=Google+Sans+Flex:opsz,wght@6..144,1..1000&family=Google+Sans:ital,opsz,wght@0,17..18,400..700;1,17..18,400..700&family=Host+Grotesk:ital,wght@0,300..800;1,300..800&family=Jura:wght@300..700&family=Lexend:wght@100..900&family=Montserrat+Alternates:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Montserrat:ital,wght@0,100..900;1,100..900&family=Noto+Serif:ital,wght@0,100..900;1,100..900&family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&family=Onest:wght@100..900&family=Open+Sans:ital,wght@0,300..800;1,300..800&family=PT+Serif:ital,wght@0,400;0,700;1,400;1,700&family=Plus+Jakarta+Sans:ital,wght@0,200..800;1,200..800&family=Public+Sans:ital,wght@0,100..900;1,100..900&family=Rethink+Sans:ital,wght@0,400..800;1,400..800&family=Saira:ital,wght@0,100..900;1,100..900&family=Source+Serif+4:ital,opsz,wght@0,8..60,200..900;1,8..60,200..900&family=Staatliches&family=Titillium+Web:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700&family=Urbanist:ital,wght@0,100..900;1,100..900&family=Work+Sans:ital,wght@0,100..900;1,100..900&display=swap";

/** Names of every family included in the bundle (used to skip redundant per-font requests). */
const BUNDLE_FONT_NAMES = new Set([
  "aboreto", "bbh bartle", "barlow", "baskervville", "bebas neue", "figtree",
  "fragment mono", "funnel display", "funnel sans", "google sans flex",
  "google sans", "host grotesk", "jura", "lexend", "montserrat alternates",
  "montserrat", "noto serif", "nunito sans", "onest", "open sans", "pt serif",
  "plus jakarta sans", "public sans", "rethink sans", "saira", "source serif 4",
  "staatliches", "titillium web", "urbanist", "work sans",
]);

let _bundleLoaded = false;

/**
 * Loads the complete Google Fonts bundle (preconnect + single stylesheet) so
 * all 30 curated families are available for instant preview. Idempotent.
 * Call once on app mount — typically from `<ThemeProvider preloadFonts>`.
 */
export function preloadGoogleFontsBundle() {
  if (typeof window === "undefined" || _bundleLoaded) return;
  _bundleLoaded = true;

  // preconnect to both origins for faster handshake
  const pc1 = document.createElement("link");
  pc1.rel = "preconnect";
  pc1.href = "https://fonts.googleapis.com";
  document.head.appendChild(pc1);

  const pc2 = document.createElement("link");
  pc2.rel = "preconnect";
  pc2.href = "https://fonts.gstatic.com";
  pc2.crossOrigin = "anonymous";
  document.head.appendChild(pc2);

  const link = document.createElement("link");
  link.id = "gfont-bundle";
  link.rel = "stylesheet";
  link.href = GOOGLE_FONTS_BUNDLE_URL;
  document.head.appendChild(link);
}

export function loadGoogleFont(fontName: string) {
  if (typeof window === "undefined" || !fontName || !fontName.trim()) return;

  let cleanName = fontName.trim();

  // Skip per-font loading if the bundle already covers this family.
  if (_bundleLoaded && BUNDLE_FONT_NAMES.has(cleanName.toLowerCase())) return;

  let url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(cleanName)}:wght@400;500;600;700&display=swap`;

  if (cleanName.includes("fonts.googleapis.com") || cleanName.includes("http")) {
    const match = cleanName.match(/href=["']([^"']+)["']/);
    if (match && match[1]) {
      url = match[1];
    } else {
      url = cleanName;
    }
    const familyMatch = url.match(/family=([^&:]+)/);
    if (familyMatch && familyMatch[1]) {
      cleanName = decodeURIComponent(familyMatch[1]).replace(/\+/g, " ");
    }
  }

  const id = `gfont-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
  if (document.getElementById(id)) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = url;
  document.head.appendChild(link);
}

export function parseGoogleFontEmbed(input: string): { name: string; url: string } | null {
  if (!input || !input.trim()) return null;
  const text = input.trim();

  // 1. Match family=... from Google Fonts URL in <link href="...">, @import url("..."), or raw URL
  const familyMatch = text.match(/family=([^&"'`:\s;]+)/i);
  if (familyMatch && familyMatch[1]) {
    const rawName = decodeURIComponent(familyMatch[1]).replace(/\+/g, " ");
    const hrefMatch = text.match(/href=["']([^"']+)["']/i) || text.match(/url\(["']?([^"']+)["']?\)/i);
    const url = hrefMatch ? hrefMatch[1] : text.startsWith("http") ? text : `https://fonts.googleapis.com/css2?family=${encodeURIComponent(rawName)}:wght@400;500;600;700&display=swap`;
    return { name: rawName, url };
  }

  // 2. Match font-family: "..." or '...' from CSS snippet
  const cssMatch = text.match(/font-family:\s*["']([^"']+)["']/i);
  if (cssMatch && cssMatch[1]) {
    const name = cssMatch[1];
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;500;600;700&display=swap`;
    return { name, url };
  }

  // 3. Fallback: if plain text without HTML tags or CSS braces
  if (!text.includes("<") && !text.includes("{") && text.length < 60) {
    const name = text;
    const url = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(name)}:wght@400;500;600;700&display=swap`;
    return { name, url };
  }

  return null;
}

export function applyDisplayFontPreset(name: string) {
  const font = DISPLAY_FONTS.find((f) => f.name.toLowerCase() === name.toLowerCase());
  const val = font ? font.value : name;
  if (font) {
    loadGoogleFont(font.name);
  }
  document.documentElement.style.setProperty("--font-display", val);
}

/** h3-h6 heading font: "body" resets to the default, "display" follows the display font. */
export function applySubheadingFont(name: string) {
  const root = document.documentElement;
  if (!name || name.toLowerCase() === "body") {
    root.style.removeProperty("--font-subheading");
    return;
  }
  const f = [...DISPLAY_FONTS, ...BODY_FONTS].find((x) => x.name.toLowerCase() === name.toLowerCase());
  if (f) loadGoogleFont(f.name);
  root.style.setProperty("--font-subheading", subheadingFontValue(name));
}

export function applyBodyFontPreset(name: string) {
  const font = BODY_FONTS.find((f) => f.name.toLowerCase() === name.toLowerCase());
  const val = font ? font.value : name;
  if (font) {
    loadGoogleFont(font.name);
  }
  document.documentElement.style.setProperty("--font-body", val);
}

/**
 * Curated theme presets — each bundles a full brand config (accent, neutrals,
 * radius, density, panel style, appearance, and a display/body font pairing).
 * Powers the Configurator/Builder's "Theme" dropdown and `<ThemeProvider theme="…">`.
 * Font pairings are drawn from common editorial/geometric/serif combinations
 * (Fontshare/Google-Fonts style). `appearance` is advisory — apply it via the
 * `.dark` class at the app level (the DS keeps appearance app-controlled).
 */
export type ThemePreset = {
  name: string;
  accentColor: string;
  grayColor: string;
  radius: "none" | "small" | "medium" | "large" | "full";
  scaling: number;
  panelBackground: "solid" | "translucent";
  appearance: "light" | "dark";
  displayFont: string;
  bodyFont: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  { name: "Monochrome", accentColor: "Monochrome", grayColor: "Zinc", radius: "medium", scaling: 95, panelBackground: "solid", appearance: "dark", displayFont: "Space Grotesk", bodyFont: "Inter" },
  { name: "Linear", accentColor: "Violet", grayColor: "Zinc", radius: "medium", scaling: 100, panelBackground: "translucent", appearance: "dark", displayFont: "Inter", bodyFont: "Inter" },
  { name: "Nordic", accentColor: "Teal", grayColor: "Gray", radius: "large", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Outfit", bodyFont: "Inter" },
  { name: "Vanguard", accentColor: "Red", grayColor: "Zinc", radius: "medium", scaling: 100, panelBackground: "solid", appearance: "dark", displayFont: "Space Grotesk", bodyFont: "Inter" },
  { name: "Cyber", accentColor: "Lime", grayColor: "Zinc", radius: "large", scaling: 100, panelBackground: "translucent", appearance: "dark", displayFont: "JetBrains Mono", bodyFont: "Inter" },
  { name: "Editorial", accentColor: "Bronze", grayColor: "Stone", radius: "medium", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Fraunces", bodyFont: "Inter" },
  { name: "Neo Tokyo", accentColor: "Ruby", grayColor: "Zinc", radius: "medium", scaling: 100, panelBackground: "translucent", appearance: "dark", displayFont: "Space Grotesk", bodyFont: "Inter" },
  { name: "Oasis", accentColor: "Jade", grayColor: "Stone", radius: "large", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Outfit", bodyFont: "Inter" },
  { name: "Ocean", accentColor: "Mint", grayColor: "Zinc", radius: "medium", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Space Grotesk", bodyFont: "Inter" },
  { name: "Velvet", accentColor: "Plum", grayColor: "Slate", radius: "large", scaling: 100, panelBackground: "translucent", appearance: "dark", displayFont: "Playfair Display", bodyFont: "Inter" },
  { name: "Minimal", accentColor: "Monochrome", grayColor: "Gray", radius: "small", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Outfit", bodyFont: "Inter" },
  { name: "Warm", accentColor: "Amber", grayColor: "Stone", radius: "large", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Lora", bodyFont: "Inter" },
  { name: "Playful", accentColor: "Iris", grayColor: "Slate", radius: "large", scaling: 100, panelBackground: "solid", appearance: "light", displayFont: "Space Grotesk", bodyFont: "Space Grotesk" },
  { name: "Sunset", accentColor: "Crimson", grayColor: "Stone", radius: "large", scaling: 100, panelBackground: "translucent", appearance: "dark", displayFont: "Outfit", bodyFont: "Inter" },
  { name: "Midnight", accentColor: "Cyan", grayColor: "Zinc", radius: "medium", scaling: 100, panelBackground: "translucent", appearance: "dark", displayFont: "Space Grotesk", bodyFont: "Inter" },
  { name: "Terminal", accentColor: "Green", grayColor: "Zinc", radius: "none", scaling: 100, panelBackground: "solid", appearance: "dark", displayFont: "JetBrains Mono", bodyFont: "JetBrains Mono" },
];

/** Apply a whole theme preset by name (accent/gray/radius/scaling/panel/fonts/appearance). */
export function applyThemePreset(name: string, overrideAppearance: boolean = false) {
  const p = THEME_PRESETS.find((t) => t.name.toLowerCase() === name.toLowerCase());
  if (!p) return;
  if (overrideAppearance && typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", p.appearance === "dark");
  }
  applyAccentColor(p.accentColor);
  applyGrayColor(p.grayColor);
  applyRadiusPreset(p.radius);
  applyScalingPreset(p.scaling);
  applyPanelBackground(p.panelBackground === "translucent");
  applyDisplayFontPreset(p.displayFont);
  applyBodyFontPreset(p.bodyFont);
}

