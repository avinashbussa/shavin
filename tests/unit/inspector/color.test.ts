import { describe, it, expect } from "vitest";
import { LIGHT_THRESHOLD, contrastRatio, isLight, luminance, over, parseColor } from "../../../packages/ui/src/lib/inspector/color";

describe("parseColor", () => {
  it("reads rgb and rgba in comma and space syntax", () => {
    expect(parseColor("rgb(10, 20, 30)")).toEqual({ rgb: [10, 20, 30], a: 1 });
    expect(parseColor("rgba(10, 20, 30, 0.5)")).toEqual({ rgb: [10, 20, 30], a: 0.5 });
    expect(parseColor("rgb(10 20 30 / 50%)")).toEqual({ rgb: [10, 20, 30], a: 0.5 });
    expect(parseColor("rgb(100%, 0%, 0%)")).toEqual({ rgb: [255, 0, 0], a: 1 });
  });

  it("reads hex in 3, 4, 6 and 8 digits", () => {
    expect(parseColor("#fff")).toEqual({ rgb: [255, 255, 255], a: 1 });
    expect(parseColor("#f008")?.a).toBeCloseTo(0x88 / 255, 3);
    expect(parseColor("#102030")).toEqual({ rgb: [16, 32, 48], a: 1 });
    expect(parseColor("#10203080")?.a).toBeCloseTo(128 / 255, 3);
  });

  it("clamps channels and alpha", () => {
    expect(parseColor("rgb(300, -5, 0)")?.rgb).toEqual([255, 0, 0]);
    expect(parseColor("rgba(0,0,0,4)")?.a).toBe(1);
  });

  it("knows transparent and rejects what it cannot read", () => {
    expect(parseColor("transparent")?.a).toBe(0);
    expect(parseColor("oklch(0.5 0.1 200)")).toBeNull();
    expect(parseColor("")).toBeNull();
    expect(parseColor(null)).toBeNull();
    expect(parseColor("rgb(a, b, c)")).toBeNull();
    expect(parseColor("#12")).toBeNull();
  });
});

describe("contrast maths", () => {
  it("black on white is 21:1 and identical colours are 1:1", () => {
    expect(contrastRatio([0, 0, 0], [255, 255, 255])).toBeCloseTo(21, 5);
    expect(contrastRatio([120, 120, 120], [120, 120, 120])).toBeCloseTo(1, 5);
  });

  it("is symmetric", () => {
    expect(contrastRatio([10, 20, 30], [200, 210, 220])).toBeCloseTo(contrastRatio([200, 210, 220], [10, 20, 30]), 10);
  });

  it("matches a known pair (#767676 on white is 4.54:1)", () => {
    expect(contrastRatio([0x76, 0x76, 0x76], [255, 255, 255])).toBeCloseTo(4.54, 2);
  });

  it("composites alpha over a backdrop", () => {
    const half = over({ rgb: [0, 0, 0], a: 0.5 }, { rgb: [255, 255, 255], a: 1 });
    expect(half.a).toBe(1);
    expect(half.rgb).toEqual([128, 128, 128]);
    expect(over({ rgb: [9, 9, 9], a: 0 }, { rgb: [200, 100, 50], a: 1 }).rgb).toEqual([200, 100, 50]);
    expect(over({ rgb: [0, 0, 0], a: 0 }, { rgb: [0, 0, 0], a: 0 }).a).toBe(0);
  });

  it("the light threshold splits white-text and black-text backgrounds", () => {
    expect(LIGHT_THRESHOLD).toBe(0.179);
    expect(isLight([255, 255, 255])).toBe(true);
    expect(isLight([0, 0, 0])).toBe(false);
    expect(isLight([119, 119, 119])).toBe(true);
    expect(isLight([110, 110, 110])).toBe(false);
    expect(luminance([255, 255, 255])).toBeCloseTo(1, 5);
  });
});
