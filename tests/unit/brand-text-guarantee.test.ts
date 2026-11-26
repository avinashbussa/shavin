import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

import { BRAND_PRESETS, GRAY_PRESETS, brandTextFor, resolveBrandTriplet } from "../../packages/ui/src/lib/theme-presets";
import { oklchBrandForMode, oklchTextFor, oklchToHex, oklchToRgbTriplet, hexToOklch } from "../../packages/ui/src/lib/color-space";
// @ts-expect-error — plain .mjs module without types
import { textFor as cliTextFor, resolveTriplet as cliResolve, hexToTriplet } from "../../packages/cli/src/lib/brand-tokens.mjs";

/**
 * The brand text guarantee, for ANY brand colour.
 *
 * --brand-text / --brand-contrast / --link / --focus all come from brandTextFor (and its OKLCH and
 * CLI twins). Shavin users pick arbitrary brand colours, so this checks the derived colour, not a
 * list of presets, against the real surfaces:
 *   (a) text >= 4.5:1 (WCAG 1.4.3) on every page surface of every gray preset, light and dark, AND on
 *       the brand's own translucent tint over each of them at every alpha the components use
 *       (Badge soft, Button/IconButton soft + hover, Avatar soft);
 *   (b) >= 3:1 (WCAG 1.4.11) for link underlines and focus rings (2px outline, 2px offset, so the
 *       neighbouring pixels are the page surface) against those same page surfaces.
 * Surfaces and alphas are read from tokens.css / Badge.tsx / the gray presets here, not from the
 * implementation, so a change to either side is caught.
 */

const TEXT_MIN = 4.5;
const RING_MIN = 3;
type Rgb = [number, number, number];
const parse = (t: string): Rgb => t.trim().split(/\s+/).map(Number) as Rgb;
const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (c: Rgb) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratioL = (a: number, b: number) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

const tokensCss = readFileSync(resolve(process.cwd(), "packages/ui/src/styles/tokens.css"), "utf8");
const badgeSrc = readFileSync(resolve(process.cwd(), "packages/ui/src/primitives/Badge/Badge.tsx"), "utf8");

// Every tint alpha the shipped components lay over a surface and draw brand text on.
const alphaSet = new Set<number>();
for (const m of tokensCss.matchAll(/--brand-subtle(?:-hover)?:\s*rgb\(var\(--brand[\w-]*\)\s*\/\s*([\d.]+)\)/g)) alphaSet.add(Number(m[1]));
const badgeSoft = badgeSrc.match(/variant: "soft", tone: "brand", class: "[^"]*bg-brand\/(?:\[([\d.]+)\]|(\d+))/);
if (!badgeSoft) throw new Error("Badge brand soft tint not found in Badge.tsx");
alphaSet.add(badgeSoft[1] ? Number(badgeSoft[1]) : Number(badgeSoft[2]) / 100);
alphaSet.add(0.15); // Avatar soft (bg-brand/15 text-brand-text)
alphaSet.add(0.1); // callouts / alerts (bg-brand/10)
// Strongest tint a component uses per mode (Button soft hover: 0.18 light, 0.22 dark), asserted against tokens.css below.
const MAX_ALPHA = { light: 0.18, dark: 0.22 };
// Dense sweep up to that, so a tint between the named ones cannot hide a dip.
for (let a = 0.05; a <= 0.22001; a += 0.01) alphaSet.add(Math.round(a * 100) / 100);
const ALPHAS = { light: [...alphaSet].filter((a) => a <= MAX_ALPHA.light + 1e-9).sort((a, b) => a - b), dark: [...alphaSet].filter((a) => a <= MAX_ALPHA.dark + 1e-9).sort((a, b) => a - b) };

/** Page surfaces per mode and gray preset (bg-canvas, bg-surface, hover, elevated, elevated-hover). */
function pageSurfaces(isDark: boolean): Rgb[] {
  const out: Rgb[] = [];
  for (const g of GRAY_PRESETS) {
    const s = g.scale;
    const steps = isDark ? [950, 900, 850, 800] : [0, 100];
    for (const st of steps) out.push(st === 0 ? [255, 255, 255] : parse(s[st]));
  }
  return out;
}
const PAGE = { light: pageSurfaces(false), dark: pageSurfaces(true) };

/** Chromium quantises tint alpha to 8 bits, then rounds the composite to 8-bit channels. */
const blend = (fill: Rgb, base: Rgb, a: number): Rgb => {
  const q = Math.round(a * 255) / 255;
  return base.map((v, i) => Math.round(fill[i] * q + v * (1 - q))) as Rgb;
};

const PAGE_LUM = { light: PAGE.light.map(lum), dark: PAGE.dark.map(lum) };
function tintLums(fill: Rgb, isDark: boolean): number[] {
  const out: number[] = [];
  for (const base of isDark ? PAGE.dark : PAGE.light) for (const a of ALPHAS[isDark ? "dark" : "light"]) out.push(lum(blend(fill, base, a)));
  return out;
}

interface Verdict { textMin: number; pageMin: number; ok: boolean }
function check(text: Rgb, fill: Rgb, isDark: boolean): Verdict {
  const t = lum(text);
  const page = Math.min(...PAGE_LUM[isDark ? "dark" : "light"].map((y) => ratioL(t, y)));
  const tint = Math.min(...tintLums(fill, isDark).map((y) => ratioL(t, y)));
  const textMin = Math.min(page, tint);
  return { textMin, pageMin: page, ok: textMin >= TEXT_MIN && page >= RING_MIN };
}

type Pipeline = (hex: string, isDark: boolean) => { fill: Rgb; text: Rgb };
const pipelines: Record<string, Pipeline> = {
  "runtime rgb": (hex, d) => {
    const f = resolveBrandTriplet(hex, d);
    return { fill: parse(f), text: parse(brandTextFor(f, d)) };
  },
  "runtime oklch": (hex, d) => {
    const o = oklchBrandForMode(hexToOklch(hex), d);
    return { fill: parse(oklchToRgbTriplet(o)), text: parse(oklchToRgbTriplet(oklchTextFor(o, d))) };
  },
  "cli brand-tokens": (hex, d) => {
    const f = cliResolve(hexToTriplet(hex), d) as string;
    return { fill: parse(f), text: parse(cliTextFor(f, d)) };
  },
  // brandTextFor is public and may be handed any fill, resolved for the mode or not.
  "brandTextFor(raw fill)": (hex, d) => {
    const f = hexToTriplet(hex) as string;
    return { fill: parse(f), text: parse(brandTextFor(f, d)) };
  },
};

function sweep(hexes: string[]) {
  const res: Record<string, { fails: number; total: number; worstText: number; worstPage: number; worst: string }> = {};
  for (const [name, run] of Object.entries(pipelines)) {
    const r = { fails: 0, total: 0, worstText: Infinity, worstPage: Infinity, worst: "" };
    for (const hex of hexes) for (const d of [false, true]) {
      const { fill, text } = run(hex, d);
      const v = check(text, fill, d);
      r.total++;
      if (!v.ok) r.fails++;
      if (v.textMin < r.worstText) { r.worstText = v.textMin; r.worst = `${hex} ${d ? "dark" : "light"} text ${text.join(" ")}`; }
      r.worstPage = Math.min(r.worstPage, v.pageMin);
    }
    res[name] = r;
  }
  return res;
}

// --- shipped presets: 24 brands x 5 grays x light/dark (grays live inside PAGE) -----------------
const presetHexes = BRAND_PRESETS.map((p) => p.hex);

// --- property sweep: hue x chroma x lightness incl. extremes, built from OKLCH, gamut-clamped to hex -----
const hexGrid: string[] = [];
{
  const Ls = [0, 0.02, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.97, 1];
  const Cs = [0, 0.01, 0.03, 0.06, 0.1, 0.15, 0.2, 0.3, 0.4];
  for (let h = 0; h < 360; h += 15) for (const C of Cs) for (const L of Ls) {
    if (C === 0 && h > 0) continue; // greys do not depend on hue
    hexGrid.push(oklchToHex({ L, C, H: h }));
  }
  // Hard cases by hand: near-white, near-black, saturated yellow / lime / cyan, mid greys.
  hexGrid.push("#FFFFFF", "#000000", "#FEFEFE", "#010101", "#FFFF00", "#CCFF00", "#00FFFF", "#FFD700", "#84CC16", "#FDE047", "#808080", "#767676", "#777777", "#959595", "#0000FF", "#FF00FF");
}
const uniqueGrid = [...new Set(hexGrid)];

const reportLine = (name: string, r: ReturnType<typeof sweep>[string]) =>
  `${name}: ${r.fails}/${r.total} brand x mode fail (worst text ${r.worstText.toFixed(2)} @ ${r.worst}; worst page ${r.worstPage.toFixed(2)})`;

describe("brand text guarantee: shipped presets (24 brands x 5 grays x light/dark)", () => {
  it("covers all presets and all five grays", () => {
    expect(BRAND_PRESETS.length).toBe(24);
    expect(GRAY_PRESETS.length).toBe(5);
    expect(ALPHAS.light.length).toBeGreaterThan(12);
    // The sweep reaches the strongest brand tint tokens.css defines (0.18 hover in light, 0.22 hover in dark).
    expect(tokensCss).toContain("--brand-subtle-hover: rgb(var(--brand) / 0.18)");
    expect(tokensCss).toContain("--brand-subtle-hover: rgb(var(--brand) / 0.22)");
    expect(Math.max(...alphaSet)).toBeGreaterThanOrEqual(0.22);
  });
  const results = sweep(presetHexes);
  for (const [name, r] of Object.entries(results)) {
    it(`${name}: >= ${TEXT_MIN}:1 on every surface and brand tint, >= ${RING_MIN}:1 for rings/links`, () => {
      expect(r.fails, reportLine(name, r)).toBe(0);
    });
  }
});

describe("brand text guarantee: arbitrary brand colours (hue x chroma x lightness grid)", () => {
  it("generates a broad grid", () => {
    expect(uniqueGrid.length).toBeGreaterThan(1500);
  });
  const results = sweep(uniqueGrid);
  for (const [name, r] of Object.entries(results)) {
    it(`${name}: holds for all ${uniqueGrid.length} colours, light and dark`, () => {
      expect(r.fails, reportLine(name, r)).toBe(0);
    });
  }
});

describe("brand text keeps colours that already pass", () => {
  it("Monochrome and a deep navy are unchanged in light mode", () => {
    const navy = hexToTriplet("#1E3A8A") as string;
    expect(brandTextFor(navy, false)).toBe(navy);
    const mono = resolveBrandTriplet("Monochrome", false);
    expect(brandTextFor(mono, false)).toBe(mono);
  });
  it("is deterministic", () => {
    const t = hexToTriplet("#84CC16") as string;
    expect(brandTextFor(t, false)).toBe(brandTextFor(t, false));
  });
});

if (process.env.BRAND_TABLE) {
  it("prints the table", () => {
    const rows: string[] = [];
    for (const [label, hexes] of [["presets", presetHexes], ["grid", uniqueGrid]] as const)
      for (const [name, r] of Object.entries(sweep(hexes))) rows.push(`${label}\t${reportLine(name, r)}`);
    console.log("\n" + rows.join("\n"));
  });
}
