import { describe, it, expect } from "vitest";
import { renderToString } from "react-dom/server";
import { ThemeProvider } from "@shavin/ui";
import { themeCss, resolveThemeConfig, brandTextFor, hexToTriplet } from "../../packages/ui/src/lib/theme-presets";

describe("themeCss (first-paint theme)", () => {
  it("emits the brand colour for light and dark so the first paint is not monochrome", () => {
    const css = themeCss({ brandColor: "Violet", grayColor: "Zinc", radius: "medium" });
    expect(css).toMatch(/:root:root\{[^}]*--brand:110 86 207/);
    expect(css).toMatch(/:root:root\.dark\{[^}]*--brand:110 86 207/);
    expect(css).toContain("--n-500:");
    expect(css).toContain("--radius-lg:");
  });

  it("writes the contrast-corrected link and focus colours, matching the runtime", () => {
    // Amber is too light to read as text on white; the raw brand must not reach --link.
    const css = themeCss({ brandColor: "#F59E0B" });
    const corrected = brandTextFor(hexToTriplet("#F59E0B"), false);
    expect(corrected).not.toBe(hexToTriplet("#F59E0B"));
    expect(css).toContain(`--link:${corrected}`);
    expect(css).toContain(`--focus:${corrected}`);
  });

  it("uses oklch values when asked", () => {
    expect(themeCss({ brandColor: "Violet", colorSpace: "oklch" })).toMatch(/--brand:oklch\(/);
  });

  it("resolves a named preset, then lets explicit props override it", () => {
    const base = resolveThemeConfig({ theme: "Neo Tokyo" });
    expect(base.translucentPanels).toBe(true);
    expect(resolveThemeConfig({ theme: "Neo Tokyo", brandColor: "Violet" }).brand).toBe("Violet");
  });

  it("falls back to the Monochrome preset when nothing is set, like the runtime effect", () => {
    expect(resolveThemeConfig({}).brand).toBe("Monochrome");
  });

  it("applies non-default scaling and never lets a value close the style tag", () => {
    expect(themeCss({ brandColor: "Violet", scaling: "95%" })).toContain("font-size:95%");
    expect(themeCss({ displayFont: "x</style><script>" })).not.toMatch(/[<>]/);
  });
});

describe("ThemeProvider server HTML", () => {
  it("renders the theme CSS into the HTML, before any effect runs", () => {
    const html = renderToString(<ThemeProvider brandColor="Violet" grayColor="Zinc" devTools={false}><p>x</p></ThemeProvider>);
    expect(html).toContain('id="shavin-theme-vars"');
    expect(html).toContain("--brand:110 86 207");
  });

  it("adds translucent panels before first paint when the theme asks for it", () => {
    const html = renderToString(<ThemeProvider theme="Neo Tokyo" devTools={false}><p>x</p></ThemeProvider>);
    expect(html).toContain("translucent-panels");
  });
});

describe("gray presets", () => {
  it("define --n-850 so dark hover and elevated fills follow the chosen gray", async () => {
    const { GRAY_PRESETS } = await import("../../packages/ui/src/lib/theme-presets");
    for (const g of GRAY_PRESETS) {
      const [a, m, b] = [800, 850, 900].map((k) => g.scale[k].split(" ").map(Number));
      expect(m, g.name).toBeDefined();
      m.forEach((v, i) => {
        expect(v).toBeGreaterThanOrEqual(Math.min(a[i], b[i]));
        expect(v).toBeLessThanOrEqual(Math.max(a[i], b[i]));
      });
    }
    expect(themeCss({ grayColor: "Slate" })).toContain("--n-850:");
  });
});

describe("subheading font", () => {
  it("emits --font-subheading only when set to something other than body", () => {
    expect(themeCss({ brandColor: "Indigo" })).not.toContain("--font-subheading");
    expect(themeCss({ brandColor: "Indigo", subheadingFont: "body" })).not.toContain("--font-subheading");
    expect(themeCss({ brandColor: "Indigo", subheadingFont: "display" })).toContain("--font-subheading:var(--font-display)");
    expect(themeCss({ brandColor: "Indigo", subheadingFont: "Playfair Display" })).toContain("Playfair Display");
  });
});
