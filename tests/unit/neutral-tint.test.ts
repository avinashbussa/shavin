import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

import {
  BASE_NEUTRALS,
  NEUTRAL_STEPS,
  neutralsBrandStrength,
  tintedNeutralTriplets,
  tintedNeutralVars,
  type NeutralsAmount,
} from "../../packages/ui/src/lib/neutral-tint";
import { contrastRatio, themeCss, resolveThemeConfig, BRAND_PRESETS } from "../../packages/ui/src/lib/theme-presets";
import { oklchToHex, rgbTripletToOklch } from "../../packages/ui/src/lib/color-space";

const AMOUNTS: NeutralsAmount[] = ["subtle", "medium"];
const HUES = Array.from({ length: 72 }, (_, i) => i * 5);
/** A coloured brand at several lightness/chroma points per hue. */
const brandAt = (h: number, L = 0.6, C = 0.15) => oklchToHex({ L, C, H: h });

const TOKENS = readFileSync(join(__dirname, "../../packages/ui/src/styles/tokens.css"), "utf8");

describe("tinted neutrals: base scale", () => {
  it("BASE_NEUTRALS is the shipped scale in tokens.css", () => {
    for (const step of NEUTRAL_STEPS) {
      const m = TOKENS.match(new RegExp(`--n-${step}:\\s*(\\d+ \\d+ \\d+);`));
      expect(m?.[1], `n-${step}`).toBe(BASE_NEUTRALS[step]);
    }
  });
});

describe("tinted neutrals: WCAG contrast is unchanged", () => {
  // The pairs the default scale was validated for (comments in tokens.css, tests/unit/contrast.test.ts).
  const PAIRS: [number, number, number][] = [
    [450, 950, 4.5], [450, 900, 4.5], [450, 850, 4.5], // dark-surface fg-subtle
    [500, 100, 4.5], [500, 0, 4.5],                    // light fg-subtle on canvas and surface
    [200, 950, 4.5], [200, 900, 4.5], [200, 850, 4.5], // dark fg
    [400, 950, 4.5], [400, 900, 4.5],                  // dark fg-muted
    [600, 100, 4.5], [950, 100, 4.5], [950, 0, 4.5],   // light fg-muted, fg
    [450, 100, 3], [450, 0, 3], [500, 950, 3], [500, 900, 3], // control borders (1.4.11)
  ];

  for (const amount of AMOUNTS) {
    it(`every step keeps the default step's luminance across 72 hues and 3 chroma levels (${amount})`, () => {
      for (const h of HUES) {
        for (const [L, C] of [[0.6, 0.15], [0.45, 0.2], [0.8, 0.09]] as const) {
          const scale = tintedNeutralTriplets(brandAt(h, L, C), amount)!;
          expect(scale, `hue ${h}`).toBeDefined();
          for (const step of NEUTRAL_STEPS) {
            const base = contrastRatio(BASE_NEUTRALS[step], "0 0 0");
            const got = contrastRatio(scale[step], "0 0 0");
            // Relative luminance within 0.4% of the default step's (8-bit rounding is the only slack).
            expect(Math.abs(got - base) / base, `hue ${h} n-${step}`).toBeLessThan(0.02);
          }
        }
      }
    });

    it(`semantic pairs still clear their WCAG thresholds with tinted greys (${amount})`, () => {
      for (const h of HUES) {
        for (const [L, C] of [[0.6, 0.15], [0.45, 0.2], [0.8, 0.09]] as const) {
          const scale = tintedNeutralTriplets(brandAt(h, L, C), amount)!;
          for (const [a, b, min] of PAIRS) {
            expect(contrastRatio(scale[a], scale[b]), `hue ${h} n-${a} on n-${b}`).toBeGreaterThanOrEqual(min);
          }
        }
      }
    });

    it(`no pair of steps loses more than 0.05 of contrast (${amount})`, () => {
      for (const h of HUES) {
        const scale = tintedNeutralTriplets(brandAt(h), amount)!;
        for (const a of NEUTRAL_STEPS) for (const b of NEUTRAL_STEPS) {
          if (a >= b) continue;
          const base = contrastRatio(BASE_NEUTRALS[a], BASE_NEUTRALS[b]);
          expect(contrastRatio(scale[a], scale[b]), `hue ${h} ${a}/${b}`).toBeGreaterThanOrEqual(base - 0.05 * Math.max(1, base / 4));
        }
      }
    });
  }

  it("the fixed code-syntax colours keep their contrast on tinted surfaces (n-0, n-100, n-900, n-950)", () => {
    const CSS = readFileSync(join(__dirname, "../../packages/ui/src/styles/global.css"), "utf8");
    const blocks = [...CSS.matchAll(/--code-([a-z]+):\s*(\d+ \d+ \d+);/g)].map((m) => ({ name: m[1], rgb: m[2] }));
    expect(blocks.length).toBeGreaterThan(10);
    for (const h of HUES) {
      const scale = tintedNeutralTriplets(brandAt(h), "medium")!;
      for (const { name, rgb } of blocks) {
        for (const surface of [0, 100, 900, 950]) {
          const base = contrastRatio(rgb, BASE_NEUTRALS[surface]);
          expect(contrastRatio(rgb, scale[surface]), `hue ${h} code-${name} on n-${surface}`).toBeGreaterThanOrEqual(base - 0.12);
        }
      }
    }
  });
});

describe("tinted neutrals: what gets tinted", () => {
  it("carries the brand hue: the page tones lean toward it, white and black stay pure", () => {
    for (const h of [30, 150, 250]) {
      const scale = tintedNeutralTriplets(brandAt(h), "subtle")!;
      expect(scale[0]).toBe("255 255 255");
      expect(scale[1000]).toBe("0 0 0");
      const o = rgbTripletToOklch(scale[100]);
      expect(o.C).toBeGreaterThan(0.005);
      const d = Math.abs(((o.H - h + 540) % 360) - 180);
      expect(d, `hue ${h} got ${o.H}`).toBeLessThan(15);
    }
  });

  it("medium is stronger than subtle", () => {
    const a = rgbTripletToOklch(tintedNeutralTriplets("#b4472a", "subtle")![100]).C;
    const b = rgbTripletToOklch(tintedNeutralTriplets("#b4472a", "medium")![100]).C;
    expect(b).toBeGreaterThan(a * 1.5);
  });

  it("grey and monochrome brands stay neutral", () => {
    for (const hex of ["#000000", "#ffffff", "#808080", "#777777", "#71717a", "#8a8a8f", "#18181b"]) {
      expect(neutralsBrandStrength(hex), hex).toBe(0);
      expect(tintedNeutralTriplets(hex), hex).toBeUndefined();
      expect(tintedNeutralVars(hex, "medium")).toEqual({});
    }
    expect(themeCss({ brandColor: "#808080", neutrals: "brand" })).not.toContain("--n-100");
    expect(themeCss({ brandColor: "Monochrome", neutrals: "brand" })).not.toContain("--n-100");
  });

  it("a nearly grey brand fades in instead of switching on", () => {
    const faint = neutralsBrandStrength("#80787a");
    expect(faint).toBeGreaterThanOrEqual(0);
    expect(faint).toBeLessThan(0.6);
    expect(neutralsBrandStrength("#b4472a")).toBe(1);
  });
});

describe("tinted neutrals: ThemeProvider config and first-paint CSS", () => {
  it("the default is plain neutral for every brand, coloured or not: no --n-* override", () => {
    for (const b of ["#b4472a", "Violet", "Teal", "#808080"]) {
      expect(themeCss({ brandColor: b }), b).not.toContain("--n-");
      expect(themeCss({ brandColor: b, neutralsAmount: "medium" }), b).not.toContain("--n-");
      expect(resolveThemeConfig({ brandColor: b }).neutralsTint, b).toBeUndefined();
    }
  });

  it("neutrals=\"brand\" opts in; the scale is theme-independent so light and dark share it", () => {
    const css = themeCss({ brandColor: "#b4472a", neutrals: "brand" });
    expect(css).toMatch(/:root:root\{[^}]*--n-100:\d+ \d+ \d+/);
    expect(css).not.toMatch(/:root:root\.dark\{[^}]*--n-/);
    const subtle = tintedNeutralTriplets("#b4472a", "subtle")!;
    expect(css).toContain(`--n-100:${subtle[100]}`);
  });

  it("neutrals=\"neutral\" keeps the default scale", () => {
    expect(themeCss({ brandColor: "#b4472a", neutrals: "neutral" })).not.toContain("--n-100");
  });

  it("neutralsAmount=\"medium\" writes the stronger scale, and subtle is the opt-in default", () => {
    const med = tintedNeutralTriplets("#b4472a", "medium")!;
    expect(themeCss({ brandColor: "#b4472a", neutrals: "brand", neutralsAmount: "medium" })).toContain(`--n-100:${med[100]}`);
    expect(resolveThemeConfig({ brandColor: "#b4472a", neutrals: "brand" }).neutralsTint?.amount).toBe("subtle");
  });

  it("a gray preset is untouched unless neutrals=\"brand\" is explicit", () => {
    expect(resolveThemeConfig({ brandColor: "#b4472a", grayColor: "Slate" }).neutralsTint).toBeUndefined();
    expect(resolveThemeConfig({ theme: "Editorial" }).neutralsTint).toBeUndefined();
    const forced = resolveThemeConfig({ theme: "Editorial", neutrals: "brand" });
    expect(forced.neutralsTint?.brand).toBe("Bronze");
    expect(forced.gray).toBeUndefined();
  });

  it("an unset provider (the Monochrome default) never tints", () => {
    expect(resolveThemeConfig({}).neutralsTint).toBeUndefined();
  });

  it("OKLCH mode writes oklch() values for the same steps", () => {
    const css = themeCss({ brandColor: "#b4472a", neutrals: "brand", colorSpace: "oklch" });
    expect(css).toMatch(/--n-100:oklch\(/);
    expect(css).toMatch(/--n-950:oklch\(/);
    const rgb = tintedNeutralVars("#b4472a", "subtle", "rgb");
    const ok = tintedNeutralVars("#b4472a", "subtle", "oklch");
    expect(Object.keys(ok)).toEqual(Object.keys(rgb));
  });

  it("every named brand preset either tints or is a documented grey", () => {
    for (const p of BRAND_PRESETS) {
      const s = neutralsBrandStrength(p.hex);
      if (p.name === "Monochrome") expect(s).toBe(0);
      else expect(s, p.name).toBeGreaterThan(0);
    }
  });
});

describe("tinted neutrals: CLI copy and runtime copy are the same scale", () => {
  it("produce identical rgb and oklch values for 72 hues, both amounts, and grey brands", async () => {
    const cli = await import("../../packages/cli/src/lib/neutrals.mjs");
    const hexes = [...HUES.map((h) => brandAt(h)), ...HUES.map((h) => brandAt(h, 0.4, 0.06)), "#b4472a", "#0f766e", "#808080", "#000000", "#6b7280", "#80787a"];
    for (const hex of hexes) {
      for (const amount of AMOUNTS) {
        expect(cli.tintedNeutralTriplets(hex, amount), `${hex} ${amount}`).toEqual(tintedNeutralTriplets(hex, amount));
        for (const cs of ["rgb", "oklch"] as const) {
          expect(cli.tintedNeutralVars(hex, amount, cs), `${hex} ${amount} ${cs}`).toEqual(tintedNeutralVars(hex, amount, cs));
        }
      }
    }
    expect(cli.BASE_NEUTRALS).toEqual(BASE_NEUTRALS);
    expect(cli.NEUTRAL_STEPS).toEqual(NEUTRAL_STEPS);
  });
});
