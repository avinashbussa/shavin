import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { contrastRatio, foregroundFor, hexToTriplet, textFor } from "../../packages/cli/src/lib/brand-tokens.mjs";

const LIGHT_SURFACES = ["255 255 255", "244 244 245"];
const DARK_SURFACES = ["24 24 27", "10 10 12", "30 30 33"];

// Bright, mid-tone and dark brand colours; several failed AA with the old luminance rule.
const BRANDS = ["#FF6B6B", "#F59E0B", "#14B8A6", "#10B981", "#6366F1", "#8B5E3C", "#84CC16", "#0EA5E9"];

describe("brand token contrast (cli brand)", () => {
  for (const hex of BRANDS) {
    const t = hexToTriplet(hex);

    it(`${hex}: -contrast text clears 4.5:1 on every light surface`, () => {
      const text = textFor(t, false);
      for (const s of LIGHT_SURFACES) expect(contrastRatio(text, s)).toBeGreaterThanOrEqual(4.5);
    });

    it(`${hex}: -contrast text clears 4.5:1 on every dark surface`, () => {
      const text = textFor(t, true);
      for (const s of DARK_SURFACES) expect(contrastRatio(text, s)).toBeGreaterThanOrEqual(4.5);
    });

    it(`${hex}: -fg is white when white clears 4.5:1, otherwise the better ink`, () => {
      const fg = foregroundFor(t);
      const white = contrastRatio("255 255 255", t);
      const ink = contrastRatio("10 10 12", t);
      if (white >= 4.5) expect(fg).toBe("255 255 255");
      else expect(contrastRatio(fg, t)).toBe(Math.max(white, ink));
    });
  }

  it("keeps a colour that already passes unchanged", () => {
    const deep = hexToTriplet("#1E3A8A");
    expect(textFor(deep, false)).toBe(deep);
  });
});
