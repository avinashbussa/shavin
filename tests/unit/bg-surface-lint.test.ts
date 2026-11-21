import { describe, it, expect } from "vitest";
// @ts-expect-error plain .mjs module without types
import { findBgSurfaceWarnings } from "../../packages/mcp-server/src/tools/bg-surface-lint.mjs";

const rules = (code: string) => findBgSurfaceWarnings(code).map((w: { rule: string }) => w.rule);

describe("bg-needs-surface warning", () => {
  it("flags a fixed-tone mesh with no surface", () => {
    expect(rules('<Section size="hero" bgOverlays="mesh-night">x</Section>')).toEqual(["bg-needs-surface"]);
    expect(rules('<Box bgOverlays="mesh-mint-animated, dark-20" />')).toEqual(["bg-needs-surface"]);
  });

  it("flags a custom gradient or solid colour with no surface", () => {
    expect(rules('<Section bgOverlays="radial(brand/0%, brand/100%)/60" />')).toEqual(["bg-needs-surface"]);
    expect(rules('<Section bgOverlays="linear(#0a0a0a, #1a1a2e)" />')).toEqual(["bg-needs-surface"]);
  });

  it("is quiet when a surface is set, or the backdrop follows the theme", () => {
    expect(rules('<Section surface="dark-always" bgOverlays="mesh-night" />')).toEqual([]);
    expect(rules('<Section bgOverlays="mesh-brand, fade-canvas" />')).toEqual([]);
    expect(rules('<Section bgOverlays="gradient-bottom" />')).toEqual([]);
    expect(rules('<Section bgOverlays="dark-50" />')).toEqual([]);
  });

  it("is quiet for photos, video and fx (the layouts default them)", () => {
    expect(rules('<Section bgImage="a.jpg" bgOverlays="mesh-night" />')).toEqual([]);
    expect(rules('<Section bgOverlays="fx:liquid-chrome, mesh-night" />')).toEqual([]);
  });

  it("skips dynamic values and spreads, and non-layout components", () => {
    expect(rules("<Section bgOverlays={overlays} />")).toEqual([]);
    expect(rules('<Section {...rest} bgOverlays="mesh-night" />')).toEqual([]);
    expect(rules('<Button bgOverlays="mesh-night" />')).toEqual([]);
  });
});
