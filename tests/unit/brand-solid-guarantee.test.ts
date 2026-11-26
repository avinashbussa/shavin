import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";

import {
  BRAND_PRESETS,
  THEME_PRESETS,
  brandForegroundFor,
  brandSolidFor,
  brandSolidForOklch,
  contrastRatio,
  perceptualAaFailures,
  resolveBrandTriplet,
  themeCss,
  type BrandSolidMode,
} from "../../packages/ui/src/lib/theme-presets";
import {
  BRAND_SOLID_CONTRAST,
  BRAND_SOLID_MAX_DL,
  apcaContrast,
  hexToOklch,
  oklchBrandForMode,
  oklchToHex,
  oklchToRgbTriplet,
  rgbTripletToOklch,
} from "../../packages/ui/src/lib/color-space";
import {
  computeBrandTokens,
  computeBrandTokensOklch,
  hexToTriplet,
  parseBrandTokens,
  resolveTriplet as cliResolve,
  solidFor as cliSolidFor,
  solidForOklch as cliSolidForOklch,
  // @ts-expect-error: plain .mjs module without types
} from "../../packages/cli/src/lib/brand-tokens.mjs";

/**
 * The solid brand fill guarantee (--brand-solid, --brand-solid-hover, --brand-fg), for ANY brand colour.
 *
 *  accessible (default): text on the fill >= 4.5:1 for the default AND the hover fill; white text
 *    wherever the brand is not genuinely light; a light brand (white would need an OKLCH lightness drop
 *    above 0.12) keeps its EXACT fill with dark text.
 *  exact: byte-for-byte what shipped before brandSolid existed (fixture from c21b2df6).
 *  perceptual: exact fill, white text exactly where APCA prefers white; its WCAG 2 failures are counted
 *    and documented.
 * Checked through every code path: runtime RGB, runtime OKLCH, and the CLI (RGB and OKLCH).
 */

type Rgb = [number, number, number];
const parse = (t: string): Rgb => t.trim().split(/\s+/).map(Number) as Rgb;
const WHITE = "255 255 255";
const MIN = 4.5;
const DL_TOL = 1e-3; // oklchToCss rounds L to 4 places

/** oklch(L C H) CSS from oklchToCss back to an RGB triplet, the way a browser would resolve it. */
function cssToTriplet(css: string): string {
  const m = css.match(/^oklch\(([\d.]+) ([\d.]+) ([\d.]+)\)$/);
  if (!m) throw new Error(`not an oklch() colour: ${css}`);
  return oklchToRgbTriplet({ L: Number(m[1]), C: Number(m[2]), H: Number(m[3]) });
}

interface Solid { brand: string; fill: string; hover: string; fg: string }
type Pipeline = (hex: string, isDark: boolean, mode: BrandSolidMode) => Solid;
const pipelines: Record<string, Pipeline> = {
  "runtime rgb": (hex, d, mode) => {
    const brand = resolveBrandTriplet(hex, d);
    const s = brandSolidFor(brand, d, mode);
    return { brand, ...s };
  },
  "runtime oklch": (hex, d, mode) => {
    const o = oklchBrandForMode(hexToOklch(hex), d);
    const s = brandSolidForOklch(o, d, mode);
    return { brand: oklchToRgbTriplet(o), fill: cssToTriplet(s.fill), hover: cssToTriplet(s.hover), fg: cssToTriplet(s.fg) };
  },
  "cli rgb": (hex, d, mode) => {
    const brand = cliResolve(hexToTriplet(hex), d) as string;
    const s = cliSolidFor(brand, d, mode);
    return { brand, ...s };
  },
  "cli oklch": (hex, d, mode) => {
    const o = oklchBrandForMode(hexToOklch(hex), d);
    const s = cliSolidForOklch(o, d, mode);
    return { brand: oklchToRgbTriplet(o), fill: cssToTriplet(s.fill), hover: cssToTriplet(s.hover), fg: cssToTriplet(s.fg) };
  },
};

const presetHexes = BRAND_PRESETS.map((p) => p.hex);
// The same grid as the brand text sweep: hue x chroma x lightness incl. extremes, gamut-clamped to hex.
const hexGrid: string[] = [];
{
  const Ls = [0, 0.02, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.97, 1];
  const Cs = [0, 0.01, 0.03, 0.06, 0.1, 0.15, 0.2, 0.3, 0.4];
  for (let h = 0; h < 360; h += 15) for (const C of Cs) for (const L of Ls) {
    if (C === 0 && h > 0) continue;
    hexGrid.push(oklchToHex({ L, C, H: h }));
  }
  hexGrid.push("#FFFFFF", "#000000", "#FEFEFE", "#010101", "#FFFF00", "#CCFF00", "#00FFFF", "#FFD700", "#84CC16", "#FDE047", "#808080", "#767676", "#777777", "#959595", "#0000FF", "#FF00FF");
}
const uniqueGrid = [...new Set(hexGrid)];

interface Tally { total: number; fails: string[]; changed: number; light: number; maxDL: number; sumDL: number }
function sweepAccessible(run: Pipeline, hexes: string[]): Tally {
  const t: Tally = { total: 0, fails: [], changed: 0, light: 0, maxDL: 0, sumDL: 0 };
  for (const hex of hexes) for (const d of [false, true]) {
    const s = run(hex, d, "accessible");
    t.total++;
    const where = `${hex} ${d ? "dark" : "light"}`;
    const dL = rgbTripletToOklch(s.brand).L - rgbTripletToOklch(s.fill).L;
    // The OKLCH paths print L to 4 places, so an unchanged fill can read back 1/255 off: classify by dL, not by string.
    const changed = dL > 5e-4;
    const light = !changed && contrastRatio(WHITE, s.brand) < BRAND_SOLID_CONTRAST - 0.05; // kept its fill although white would not pass
    const onFill = contrastRatio(s.fg, s.fill);
    const onHover = contrastRatio(s.fg, s.hover);
    if (onFill < MIN) t.fails.push(`${where}: fg on fill ${onFill.toFixed(2)}`);
    if (onHover < MIN) t.fails.push(`${where}: fg on hover ${onHover.toFixed(2)}`);
    if (changed) {
      t.changed++;
      t.maxDL = Math.max(t.maxDL, dL);
      t.sumDL += dL;
      if (s.fg !== WHITE) t.fails.push(`${where}: darkened fill must take white text, got ${s.fg}`);
      if (contrastRatio(WHITE, s.fill) < BRAND_SOLID_CONTRAST - 0.05) t.fails.push(`${where}: white on darkened fill ${contrastRatio(WHITE, s.fill).toFixed(2)}`);
      if (dL > BRAND_SOLID_MAX_DL + DL_TOL) t.fails.push(`${where}: dL ${dL.toFixed(3)} > ${BRAND_SOLID_MAX_DL}`);
    } else if (light) {
      t.light++;
      if (!sameWithin1(s.fill, s.brand)) t.fails.push(`${where}: light brand must keep its exact fill`);
      if (s.fg === WHITE) t.fails.push(`${where}: light brand must take dark text`);
    } else if (s.fg !== WHITE) {
      t.fails.push(`${where}: passes with white already, got ${s.fg}`);
    }
  }
  return t;
}

const sameWithin1 = (a: string, b: string) => parse(a).every((v, i) => Math.abs(v - parse(b)[i]) <= 1);
const line = (name: string, t: Tally) => `${name}: ${t.fails.length} failures in ${t.total} brand x mode (${t.fails.slice(0, 4).join("; ")})`;

describe("brand solid (accessible, default): shipped presets, light and dark", () => {
  for (const [name, run] of Object.entries(pipelines)) {
    it(`${name}: text >= 4.5:1 on fill and hover, white unless the brand is light, dL <= ${BRAND_SOLID_MAX_DL}`, () => {
      const t = sweepAccessible(run, presetHexes);
      expect(t.total).toBe(48);
      expect(t.fails, line(name, t)).toEqual([]);
      // 14 of 24 presets move in each mode; Lime, Mint, Sky, Amber and dark-mode Monochrome are light and keep their exact fill (documented in the report).
      expect(t.changed, `changed ${t.changed}`).toBe(28);
      expect(t.light).toBe(9);
      expect(t.maxDL).toBeLessThan(0.11);
    });
  }
  it("all four paths agree on the fill to within one 8-bit step per channel (chromatic brands; the achromatic dark-mode flip differs per engine, as it did before)", () => {
    for (const hex of presetHexes.filter((h) => hexToOklch(h).C >= 0.03)) for (const d of [false, true]) {
      const a = parse(pipelines["runtime rgb"](hex, d, "accessible").fill);
      for (const other of ["runtime oklch", "cli rgb", "cli oklch"]) {
        const b = parse(pipelines[other](hex, d, "accessible").fill);
        a.forEach((v, i) => expect(Math.abs(v - b[i]), `${hex} ${d ? "dark" : "light"} ${other}`).toBeLessThanOrEqual(1));
      }
    }
  });
});

const GRID_SWEEP_TIMEOUT_MS = 60_000;

describe("brand solid (accessible): arbitrary colours (hue x chroma x lightness grid)", () => {
  it("generates a broad grid", () => {
    expect(uniqueGrid.length).toBeGreaterThan(1500);
  });
  for (const [name, run] of Object.entries(pipelines)) {
    it(`${name}: holds for all ${uniqueGrid.length} colours, light and dark`, () => {
      const t = sweepAccessible(run, uniqueGrid);
      expect(t.fails, line(name, t)).toEqual([]);
      expect(t.maxDL).toBeLessThanOrEqual(BRAND_SOLID_MAX_DL + DL_TOL);
      // The sweep is CPU-bound (about 1 s locally, 5 to 10 s on a loaded Windows CI runner), so it gets a generous timeout, not a smaller grid.
    }, GRID_SWEEP_TIMEOUT_MS);
  }
});

describe("brand solid: why the default changed (exact = the previous behaviour)", () => {
  // The invariant the new default adds: wherever a brand is not genuinely light, text on the fill is white.
  // exact does not meet it for the presets below (near-black text on a mid-tone fill).
  const violators = (isDark: boolean) =>
    BRAND_PRESETS.filter((p) => {
      const f = resolveBrandTriplet(p.hex, isDark);
      const acc = brandSolidFor(f, isDark, "accessible");
      const ex = brandSolidFor(f, isDark, "exact");
      return acc.fg === WHITE && ex.fg !== WHITE;
    }).map((p) => p.name);
  it("exact picks near-black text on 14 of 24 presets that accessible gives white text, in each mode", () => {
    expect(violators(false)).toHaveLength(14);
    expect(violators(true)).toHaveLength(14);
  });
  it("exact still meets 4.5:1 with its own text (it is the look, not WCAG, that changed)", () => {
    for (const p of BRAND_PRESETS) for (const d of [false, true]) {
      const f = resolveBrandTriplet(p.hex, d);
      expect(contrastRatio(brandSolidFor(f, d, "exact").fg, f)).toBeGreaterThanOrEqual(MIN);
    }
  });
});

// ── exact: byte-for-byte what shipped before ────────────────────────────────────────────────────────
interface BaseFixture {
  base: string;
  tokens: Record<string, { rgb: Solid; oklch: Solid; cli: { fill: string; hover: string; fg: string } }>;
  css: Record<string, { sha: string; len: number }>;
  cliLines: Record<"rgb" | "oklch", Record<"light" | "dark", string[]>>;
}
const fixture: BaseFixture = JSON.parse(readFileSync(resolve(process.cwd(), "tests/unit/fixtures/brand-solid-base.json"), "utf8"));
const sha = (s: string) => createHash("sha256").update(s).digest("hex").slice(0, 16);

/** Removes the new --brand-solid / --brand-solid-hover declarations (page and on-dark/on-light) from theme CSS. */
function withoutSolid(css: string): string {
  return css.replace(/([^{}]+)\{([^}]*)\}/g, (_m, sel: string, body: string) => {
    const kept = body.split(";").filter((d) => !/^--brand(-on-(dark|light))?-solid(-hover)?:/.test(d));
    return `${sel}{${kept.join(";")}}`;
  });
}

describe("brand solid: exact reproduces the previous output byte-for-byte", () => {
  it("fixture is from the base commit", () => {
    expect(fixture.base).toBe("c21b2df6");
    expect(Object.keys(fixture.tokens).length).toBeGreaterThan(100);
  });
  it("runtime RGB and OKLCH tokens match for every fixture colour, light and dark", () => {
    for (const [key, base] of Object.entries(fixture.tokens)) {
      const [hex, mode] = key.split("|");
      const d = mode === "dark";
      const rgb = brandSolidFor(resolveBrandTriplet(hex, d), d, "exact");
      expect(rgb, `rgb ${key}`).toEqual({ fill: base.rgb.fill, hover: base.rgb.hover, fg: base.rgb.fg });
      const o = oklchBrandForMode(hexToOklch(hex), d);
      expect(brandSolidForOklch(o, d, "exact"), `oklch ${key}`).toEqual({ fill: base.oklch.fill, hover: base.oklch.hover, fg: base.oklch.fg });
      expect(cliSolidFor(cliResolve(hexToTriplet(hex), d), d, "exact"), `cli ${key}`).toEqual(base.cli);
      expect(brandForegroundFor(resolveBrandTriplet(hex, d))).toBe(base.rgb.fg);
    }
  });
  it("themeCss with brandSolid=exact equals the base first-paint CSS once the new solid tokens are removed (every theme preset, rgb and oklch)", () => {
    let n = 0;
    for (const t of THEME_PRESETS) for (const cs of ["rgb", "oklch"] as const) {
      const css = withoutSolid(themeCss({ theme: t.name, colorSpace: cs, brandSolid: "exact" }));
      const base = fixture.css[`${t.name}|${cs}`];
      expect({ sha: sha(css), len: css.length }, `${t.name} ${cs}`).toEqual(base);
      n++;
    }
    expect(n).toBe(THEME_PRESETS.length * 2);
  });
  it("the CLI emits the previous lines plus -solid and -solid-hover in exact mode", () => {
    const decls = ["#FF6B6B", "#14B8A6", "#CCFF00", "#1E3A8A", "#FFFFFF", "#000000"].map((value, i) => ({ name: `c${i}`, value, isVarRef: false, isHex: true }));
    const strip = (lines: string[]) => lines.filter((l) => !/-solid(-hover)?:/.test(l));
    const rgb = computeBrandTokens(decls, "exact");
    const oklch = computeBrandTokensOklch(decls, "exact");
    expect(strip(rgb.lightLines)).toEqual(fixture.cliLines.rgb.light);
    expect(strip(rgb.darkLines)).toEqual(fixture.cliLines.rgb.dark);
    expect(strip(oklch.lightLines)).toEqual(fixture.cliLines.oklch.light);
    expect(strip(oklch.darkLines)).toEqual(fixture.cliLines.oklch.dark);
  });
  it("the CLI reads --brand-solid-mode from the INPUT section", () => {
    const css = (mode: string) => `/* ─── INPUT ───\n */\n  --brand-coral: #FF6B6B;\n  --brand-solid-mode: ${mode};\n/* ─── GENERATED ─── */`;
    expect(parseBrandTokens(css("exact")).solidMode).toBe("exact");
    expect(parseBrandTokens(css("perceptual")).solidMode).toBe("perceptual");
    expect(parseBrandTokens(css("nonsense")).solidMode).toBe("accessible");
    expect(parseBrandTokens(css("exact")).declarations.map((x: { name: string }) => x.name)).toEqual(["coral"]);
  });
});

// ── perceptual: APCA-preferred text on the exact fill ───────────────────────────────────────────────
describe("brand solid: perceptual (APCA text on the exact fill)", () => {
  it("APCA implementation reproduces the reference values", () => {
    expect(apcaContrast("0 0 0", "255 255 255")).toBeCloseTo(106.04, 1);
    expect(apcaContrast("255 255 255", "0 0 0")).toBeCloseTo(-107.88, 1);
  });
  it("keeps the exact fill and uses white exactly where APCA prefers white over ink, in every path", () => {
    const INK = "10 10 12";
    for (const [name, run] of Object.entries(pipelines)) for (const hex of [...presetHexes, ...uniqueGrid.slice(0, 600)]) for (const d of [false, true]) {
      const s = run(hex, d, "perceptual");
      expect(sameWithin1(s.fill, s.brand), `${name} ${hex} fill ${s.fill} vs ${s.brand}`).toBe(true);
      const prefersWhite = Math.abs(apcaContrast(WHITE, s.brand)) > Math.abs(apcaContrast(INK, s.brand));
      expect(s.fg === WHITE, `${name} ${hex} ${d ? "dark" : "light"}`).toBe(prefersWhite);
    }
  });
  it("documents how many shipped presets miss WCAG 2 AA with it: 14 of 24, in each mode", () => {
    const light = perceptualAaFailures(false);
    const dark = perceptualAaFailures(true);
    expect(light.map((f) => f.name)).toEqual(["Tomato", "Red", "Ruby", "Crimson", "Pink", "Blue", "Cyan", "Teal", "Jade", "Green", "Grass", "Gold", "Bronze", "Brown"]);
    expect(dark).toEqual(light);
    for (const f of light) expect(f.ratio).toBeLessThan(MIN);
    // and every one of them is worse than accessible, which passes all
    for (const f of light) {
      const hex = BRAND_PRESETS.find((p) => p.name === f.name)!.hex;
      const acc = brandSolidFor(resolveBrandTriplet(hex, false), false, "accessible");
      expect(contrastRatio(acc.fg, acc.fill)).toBeGreaterThanOrEqual(MIN);
    }
  });
});

describe("brand solid: determinism and API", () => {
  it("is a pure function", () => {
    const f = resolveBrandTriplet("#0090FF", false);
    expect(brandSolidFor(f, false)).toEqual(brandSolidFor(f, false));
    expect(brandSolidFor(f, false)).toEqual(brandSolidFor(f, false, "accessible"));
  });
  it("leaves a colour that already passes alone (same string)", () => {
    const indigo = resolveBrandTriplet("#3E63DD", false);
    expect(brandSolidFor(indigo, false).fill).toBe(indigo);
  });
  it("BRAND_SOLID_CONTRAST matches the brand text target and leaves headroom over AA", () => {
    expect(BRAND_SOLID_CONTRAST).toBe(4.6);
  });
});
