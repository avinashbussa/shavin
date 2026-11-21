import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";

import {
  BRAND_PRESETS,
  GRAY_PRESETS,
  brandForegroundFor,
  brandTextFor,
  contrastRatio,
  resolveBrandTriplet,
  scopedThemeVars,
} from "../../packages/ui/src/lib/theme-presets";
import {
  hexToOklch,
  oklchBrandForMode,
  oklchForegroundFor,
  oklchTextFor,
  oklchToRgbTriplet,
} from "../../packages/ui/src/lib/color-space";

// WCAG 2.2 AA: 4.5:1 for text (1.4.3), 3:1 for control boundaries and focus
// rings (1.4.11). Every semantic pair is checked in every surface scope that
// global.css defines, so a new scope or a token tweak cannot regress silently.

const CSS = readFileSync(join(__dirname, "../../packages/ui/src/styles/global.css"), "utf8");

function foundation(): Record<string, string> {
  const n: Record<string, string> = {};
  for (const m of CSS.matchAll(/--(n-\d+):\s*(\d+ \d+ \d+);/g)) n[m[1]] ??= m[2];
  return n;
}

/** Every rule block that defines a full set of surface tokens, with var(--n-*) resolved. */
function scopes(): { selector: string; tokens: Record<string, string> }[] {
  const n = foundation();
  const out: { selector: string; tokens: Record<string, string> }[] = [];
  for (const m of CSS.matchAll(/\n([^\n{}]+)\{\n([^}]*)\}/g)) {
    const body = m[2];
    if (!/--bg-canvas:/.test(body) || !/--fg-subtle:/.test(body)) continue;
    const tokens: Record<string, string> = {};
    for (const d of body.matchAll(/--([a-z-]+):\s*([^;]+);/g)) {
      const v = d[2].trim();
      const ref = v.match(/^var\(--(n-\d+)\)$/);
      if (ref) tokens[d[1]] = n[ref[1]];
      else if (/^\d+ \d+ \d+$/.test(v)) tokens[d[1]] = v;
    }
    out.push({ selector: m[1].trim(), tokens });
  }
  return out;
}

function tint(color: string, alpha: number, over: string): string {
  const c = color.split(" ").map(Number);
  const b = over.split(" ").map(Number);
  return c.map((v, i) => Math.round(v * alpha + b[i] * (1 - alpha))).join(" ");
}

const SCOPES = scopes();

describe("contrast: semantic tokens in every surface scope", () => {
  it("finds the light, dark and surface-scope blocks", () => {
    expect(SCOPES.length).toBeGreaterThanOrEqual(8);
  });

  for (const { selector, tokens: t } of SCOPES) {
    describe(selector, () => {
      const fills = ["bg-canvas", "bg-surface", "bg-surface-hover", "bg-elevated"];

      it("text tokens clear 4.5:1 on every fill", () => {
        for (const fg of ["fg", "fg-muted", "fg-subtle"]) {
          for (const bg of fills) {
            expect(contrastRatio(t[fg], t[bg]), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
          }
        }
      });

      it("status colours read as text, under their -fg, and on a 15% tint", () => {
        for (const s of ["success", "warning", "danger"]) {
          expect(contrastRatio(t[s], t["bg-surface"]), `${s} on surface`).toBeGreaterThanOrEqual(4.5);
          expect(contrastRatio(t[`${s}-fg`], t[s]), `${s}-fg on ${s}`).toBeGreaterThanOrEqual(4.5);
          expect(contrastRatio(t[s], tint(t[s], 0.15, t["bg-surface"])), `${s} on 15% tint`).toBeGreaterThanOrEqual(4.5);
        }
      });

      it("soft fields: the chevron/icon colour (fg-muted) clears 3:1 on the soft fills", () => {
        // variant="soft" drops the border, so the chevron and value must identify the control.
        for (const fill of ["bg-surface-hover", "hairline"]) {
          expect(contrastRatio(t["fg-muted"], t[fill]), `fg-muted on ${fill}`).toBeGreaterThanOrEqual(3);
        }
      });

      it("control boundaries clear 3:1 on surface and canvas", () => {
        for (const bg of ["bg-surface", "bg-canvas"]) {
          expect(contrastRatio(t["border-control"], t[bg]), `border-control vs ${bg}`).toBeGreaterThanOrEqual(3);
        }
      });
    });
  }
});

describe("contrast: gray presets", () => {
  for (const { name, scale } of GRAY_PRESETS) {
    it(`${name}: fg-subtle and control borders pass in both modes`, () => {
      const mid = (a: string, b: string) =>
        a.split(" ").map((v, i) => Math.round((Number(v) + Number(b.split(" ")[i])) / 2)).join(" ");
      const n450 = mid(scale[400], scale[500]);
      const n850 = mid(scale[800], scale[900]);
      expect(contrastRatio(scale[500], scale[100]), "light fg-subtle on canvas").toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(n450, scale[900]), "dark fg-subtle on surface").toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(n450, n850), "dark fg-subtle on elevated").toBeGreaterThanOrEqual(4.5);
      expect(contrastRatio(n450, scale[100]), "light border-control on canvas").toBeGreaterThanOrEqual(3);
      expect(contrastRatio(scale[500], n850), "dark border-control on elevated").toBeGreaterThanOrEqual(3);
    });
  }
});

describe("contrast: brand presets", () => {
  const surfaces = { light: ["255 255 255", "244 244 245"], dark: ["24 24 27", "10 10 12", "30 30 33"] };

  for (const { name, hex } of BRAND_PRESETS) {
    for (const isDark of [false, true]) {
      const mode = isDark ? "dark" : "light";
      it(`${name} (${mode}, rgb): button text, brand text, links and focus`, () => {
        const brand = resolveBrandTriplet(name, isDark);
        expect(contrastRatio(brandForegroundFor(brand), brand), "brand-fg on brand").toBeGreaterThanOrEqual(4.5);
        const text = brandTextFor(brand, isDark); // also --link and --focus
        for (const s of surfaces[mode]) expect(contrastRatio(text, s), `brand-text on ${s}`).toBeGreaterThanOrEqual(4.5);
      });

      it(`${name} (${mode}, oklch): button text and brand text`, () => {
        const o = oklchBrandForMode(hexToOklch(hex), isDark);
        const fill = oklchToRgbTriplet(o);
        expect(contrastRatio(oklchToRgbTriplet(oklchForegroundFor(o)), fill), "brand-fg on brand").toBeGreaterThanOrEqual(4.5);
        const text = oklchToRgbTriplet(oklchTextFor(o, isDark));
        for (const s of surfaces[mode]) expect(contrastRatio(text, s), `brand-text on ${s}`).toBeGreaterThanOrEqual(4.5);
      });
    }
  }
});

describe("contrast: scoped themes (ScopedThemeProvider)", () => {
  const n = Object.fromEntries([...CSS.matchAll(/--(n-\d+):\s*(\d+ \d+ \d+);/g)].map((m) => [m[1], m[2]]));
  for (const gray of [undefined, ...GRAY_PRESETS.map((g) => g.name)]) {
    for (const isDark of [false, true]) {
      it(`${gray ?? "default"} ${isDark ? "dark" : "light"}: text and control borders pass`, () => {
        const vars = scopedThemeVars(undefined, gray, undefined, isDark);
        const resolve = (name: string): string => {
          const v = vars[`--${name}`] ?? n[name];
          const ref = typeof v === "string" ? v.match(/^var\(--([a-z0-9-]+)\)$/) : null;
          return ref ? resolve(ref[1]) : v;
        };
        for (const fg of ["fg", "fg-muted", "fg-subtle"]) {
          for (const bg of ["bg-canvas", "bg-surface", "bg-elevated"]) {
            expect(contrastRatio(resolve(fg), resolve(bg)), `${fg} on ${bg}`).toBeGreaterThanOrEqual(4.5);
          }
        }
        for (const bg of ["bg-canvas", "bg-surface"]) {
          expect(contrastRatio(resolve("border-control"), resolve(bg)), `border-control on ${bg}`).toBeGreaterThanOrEqual(3);
        }
      });
    }
  }
});
