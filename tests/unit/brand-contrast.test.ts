import { describe, expect, it } from "vitest";
import {
  BRAND_PRESETS,
  GRAY_PRESETS,
  brandForegroundFor,
  brandHoverFor,
  brandTextFor,
  contrastRatio,
  resolveBrandTriplet,
} from "../../packages/ui/src/lib/theme-presets";
import {
  hexToOklch,
  oklchBrandForMode,
  rgbTripletToOklch,
  oklchForegroundFor,
  oklchHoverFor,
  oklchTextFor,
  oklchToRgbTriplet,
} from "../../packages/ui/src/lib/color-space";
// @ts-expect-error — plain .mjs module without types
import { foregroundFor, hexToTriplet, hoverFor, resolveTriplet, textFor } from "../../packages/cli/src/lib/brand-tokens.mjs";

/** Page fills for one gray preset, as global.css maps them (n-850 is the n-800/n-900 midpoint). */
function surfaces(scale: Record<number, string>, isDark: boolean) {
  if (!isDark) return ["255 255 255", scale[100]];
  const a = scale[800].split(" ").map(Number);
  const b = scale[900].split(" ").map(Number);
  return [scale[950], scale[900], a.map((v, i) => Math.round((v + b[i]) / 2)).join(" ")];
}
const ALL_SURFACES = (isDark: boolean) => GRAY_PRESETS.flatMap((g) => surfaces(g.scale, isDark));

const hexToTrip = (hex: string) => hexToTriplet(hex) as string;
// Presets plus brand colours that sit near the white/ink boundary.
const BRAND_HEXES = [...BRAND_PRESETS.map((p) => p.hex), "#0F766E", "#14B8A6", "#F59E0B", "#8B5E3C", "#6366F1"];

describe("brand hover keeps the button's text readable (text colour does not change on hover)", () => {
  for (const hex of BRAND_HEXES) {
    for (const isDark of [false, true]) {
      const mode = isDark ? "dark" : "light";
      it(`${hex} ${mode}: runtime RGB`, () => {
        const t = hexToTrip(hex);
        const fg = brandForegroundFor(t);
        expect(contrastRatio(fg, brandHoverFor(t, isDark))).toBeGreaterThanOrEqual(Math.min(4.5, contrastRatio(fg, t)));
      });
      it(`${hex} ${mode}: runtime OKLCH`, () => {
        const o = oklchBrandForMode(hexToOklch(hex), isDark);
        const fg = oklchToRgbTriplet(oklchForegroundFor(o));
        const base = contrastRatio(fg, oklchToRgbTriplet(o));
        const hover = oklchToRgbTriplet(oklchHoverFor(o, isDark, 0.12));
        // OKLCH → sRGB rounding moves ratios by a hundredth or so.
        expect(contrastRatio(fg, hover)).toBeGreaterThanOrEqual(Math.min(4.5, base) - 0.02);
      });
      it(`${hex} ${mode}: cli brand`, () => {
        const t = hexToTrip(hex);
        const fg = foregroundFor(t);
        expect(contrastRatio(fg, hoverFor(t, isDark))).toBeGreaterThanOrEqual(Math.min(4.5, contrastRatio(fg, t)));
      });
    }
  }

  it("dark-mode teal: white text stays and the hover fill darkens instead of lightening", () => {
    const t = hexToTrip("#0F766E");
    expect(brandForegroundFor(t)).toBe("255 255 255");
    const hover = brandHoverFor(t, true);
    expect(contrastRatio("255 255 255", hover)).toBeGreaterThan(contrastRatio("255 255 255", t));
  });
});

describe("brand text clears 4.5:1 on every gray preset's page fills", () => {
  for (const hex of BRAND_HEXES) {
    for (const isDark of [false, true]) {
      const mode = isDark ? "dark" : "light";
      it(`${hex} ${mode}`, () => {
        const t = hexToTrip(hex);
        for (const s of ALL_SURFACES(isDark)) {
          expect(contrastRatio(brandTextFor(t, isDark), s)).toBeGreaterThanOrEqual(4.5);
          expect(contrastRatio(textFor(t, isDark), s)).toBeGreaterThanOrEqual(4.5);
          const o = oklchBrandForMode(hexToOklch(hex), isDark);
          expect(contrastRatio(oklchToRgbTriplet(oklchTextFor(o, isDark)), s)).toBeGreaterThanOrEqual(4.45);
        }
      });
    }
  }
});

describe("brand fill per page mode keeps the hue of chromatic brand colours", () => {
  const DARK_CANVAS = "10 10 12";
  const WHITE = "255 255 255";
  const hue = (triplet: string) => rgbTripletToOklch(triplet).H;
  const chroma = (triplet: string) => rgbTripletToOklch(triplet).C;
  const hueDelta = (a: number, b: number) => Math.min(Math.abs(a - b), 360 - Math.abs(a - b));

  // Brand colours too dark for a dark page.
  const DARK_BRANDS = { navy: "#1E3A8A", midnight: "#172554", forest: "#14532D", burgundy: "#7F1D1D", aubergine: "#3B0764" };
  for (const [name, hex] of Object.entries(DARK_BRANDS)) {
    it(`${name} stays ${name} in dark mode and reaches 3:1 on the canvas (RGB, OKLCH, cli brand)`, () => {
      const fills = {
        rgb: resolveBrandTriplet(hex, true),
        oklch: oklchToRgbTriplet(oklchBrandForMode(hexToOklch(hex), true)),
        cli: resolveTriplet(hexToTrip(hex), true) as string,
      };
      for (const [path, fill] of Object.entries(fills)) {
        expect(contrastRatio(fill, DARK_CANVAS), `${path} ${fill}`).toBeGreaterThanOrEqual(3);
        expect(chroma(fill), `${path} ${fill} kept its colour`).toBeGreaterThan(0.05);
        expect(hueDelta(hue(fill), hexToOklch(hex).H), `${path} ${fill} kept its hue`).toBeLessThan(12);
      }
    });
  }

  it("a pale brand (cream) keeps its hue in light mode and reaches 3:1 on white", () => {
    for (const fill of [
      resolveBrandTriplet("#FEF3C7", false),
      oklchToRgbTriplet(oklchBrandForMode(hexToOklch("#FEF3C7"), false)),
      resolveTriplet(hexToTrip("#FEF3C7"), false) as string,
    ]) {
      expect(contrastRatio(fill, WHITE)).toBeGreaterThanOrEqual(3);
      expect(hueDelta(hue(fill), hexToOklch("#FEF3C7").H)).toBeLessThan(12);
    }
  });

  it("black and charcoal still flip to a light gray in dark mode, white to near-black in light mode", () => {
    expect(resolveBrandTriplet("#000000", true)).toBe("228 228 231");
    expect(resolveBrandTriplet("#18181B", true)).toBe("228 228 231");
    expect(resolveBrandTriplet("#FFFFFF", false)).toBe("10 10 12");
    expect(oklchBrandForMode(hexToOklch("#000000"), true)).toEqual({ L: 0.92, C: 0, H: 0 });
    expect(resolveTriplet(hexToTrip("#000000"), true)).toBe("255 255 255");
  });

  it("the RGB and OKLCH paths agree on which colours change (charcoal #3F3F46 flips in both)", () => {
    expect(resolveBrandTriplet("#3F3F46", true)).toBe("228 228 231");
    expect(oklchBrandForMode(hexToOklch("#3F3F46"), true).C).toBe(0);
  });

  it("no brand preset changes", () => {
    for (const p of BRAND_PRESETS.filter((p) => p.name !== "Monochrome")) {
      for (const isDark of [false, true]) {
        expect(resolveBrandTriplet(p.hex, isDark), `${p.name} ${isDark ? "dark" : "light"}`).toBe(hexToTrip(p.hex));
        const o = hexToOklch(p.hex);
        expect(oklchBrandForMode(o, isDark)).toBe(o);
      }
    }
  });

});
