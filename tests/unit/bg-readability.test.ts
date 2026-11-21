import { describe, it, expect } from "vitest";
import { resolveBgReadability } from "../../packages/ui/src/lib/media-overlays";

describe("resolveBgReadability", () => {
  it("leaves a layout with no background media alone", () => {
    expect(resolveBgReadability({})).toEqual({ surface: undefined, bgOverlays: undefined });
  });

  it("never overrides an explicit surface or its overlays", () => {
    expect(resolveBgReadability({ surface: "light-always", bgImage: "a.jpg", bgOverlays: "dark-20" })).toEqual({ surface: "light-always", bgOverlays: "dark-20" });
    expect(resolveBgReadability({ surface: "dark", bgOverlays: "fx:liquid-chrome" })).toEqual({ surface: "dark", bgOverlays: "fx:liquid-chrome" });
  });

  it("makes a photo or video readable: dark-always plus a dark-30 scrim", () => {
    expect(resolveBgReadability({ bgImage: "a.jpg" })).toEqual({ surface: "dark-always", bgOverlays: "dark-30" });
    expect(resolveBgReadability({ bgVideo: "a.mp4", bgOverlays: "gradient-bottom" })).toEqual({ surface: "dark-always", bgOverlays: "gradient-bottom, dark-30" });
  });

  it("gives fx a heavier scrim: dark-50", () => {
    expect(resolveBgReadability({ bgOverlays: "fx:liquid-chrome" })).toEqual({ surface: "dark-always", bgOverlays: "fx:liquid-chrome, dark-50" });
    // dark-20 is the scrim that failed in the eval; it does not count
    expect(resolveBgReadability({ bgOverlays: "fx:liquid-chrome, dark-20, gradient-bottom" }).bgOverlays).toBe("fx:liquid-chrome, dark-20, gradient-bottom, dark-50");
  });

  it("does not stack a scrim that is already dark enough", () => {
    expect(resolveBgReadability({ bgImage: "a.jpg", bgOverlays: "scrim-left" })).toEqual({ surface: "dark-always", bgOverlays: "scrim-left" });
    expect(resolveBgReadability({ bgImage: "a.jpg", bgOverlays: "dark-50" }).bgOverlays).toBe("dark-50");
    expect(resolveBgReadability({ bgOverlays: "fx:prism, dark-75" }).bgOverlays).toBe("fx:prism, dark-75");
    expect(resolveBgReadability({ bgOverlays: "fx:prism, dark-30" }).bgOverlays).toBe("fx:prism, dark-30, dark-50");
  });

  it("treats a light tint as the author choosing dark text", () => {
    expect(resolveBgReadability({ bgImage: "a.jpg", bgOverlays: "light-30" })).toEqual({ surface: undefined, bgOverlays: "light-30" });
  });

  it("leaves meshes and custom gradients to the author (tone depends on the page theme)", () => {
    expect(resolveBgReadability({ bgOverlays: "mesh-night" })).toEqual({ surface: undefined, bgOverlays: "mesh-night" });
    expect(resolveBgReadability({ bgOverlays: "mesh-brand, fade-canvas" })).toEqual({ surface: undefined, bgOverlays: "mesh-brand, fade-canvas" });
    expect(resolveBgReadability({ bgOverlays: "radial(brand/0%, brand/100%)/60" }).surface).toBeUndefined();
  });
  it("appends the scrim to the JSON layer format too", () => {
    const json = JSON.stringify([{ id: "a", type: "fx", fxKey: "mesh", visible: true, opacity: 100 }]);
    const out = resolveBgReadability({ bgOverlays: json });
    expect(out.surface).toBe("dark-always");
    const layers = JSON.parse(out.bgOverlays as string);
    expect(layers).toHaveLength(2);
    expect(layers[1]).toMatchObject({ type: "preset", presetKey: "dark-50", visible: true });
  });
});
