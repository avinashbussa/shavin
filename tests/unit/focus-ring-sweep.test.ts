import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import { describe, expect, it } from "vitest";

import { BRAND_PRESETS, GRAY_PRESETS, brandTextFor, resolveBrandTriplet } from "../../packages/ui/src/lib/theme-presets";
import { oklchToHex, hexToOklch, oklchBrandForMode, oklchTextFor, oklchToRgbTriplet } from "../../packages/ui/src/lib/color-space";
// @ts-expect-error: plain .mjs module without types
import { hexToTriplet } from "../../packages/cli/src/lib/brand-tokens.mjs";

/**
 * Focus ring: colour contrast for every brand x gray x mode, in each of the three ring modes, plus
 * the CSS contract (tokens, one ring definition, nothing in the library hard-codes its own).
 *
 * The ring colour is `--focus` (brandTextFor output) in all three modes (subtle / default / strong
 * only change width), so the question is the same one WCAG 1.4.11 asks: >= 3:1 against what the
 * ring is drawn next to.
 *   - ring with offset (buttons, links, tabs ...): the page fill it floats on. All page fills of every
 *     gray preset, light and dark.
 *   - text fields (offset -1px): the ring sits ON the control border (a 1px border is fully covered by
 *     any ring >= 1px at -1px), so its neighbours are the control fill inside and the page outside, plus
 *     the control border it replaces (--border-control, reported, not required: it is hidden by the ring).
 * WCAG 2.4.13 Focus Appearance (AAA) is not claimed; 2.4.7 and 1.4.11 are.
 */
const RING_MIN = 3;
type Rgb = [number, number, number];
const parse = (t: string): Rgb => t.trim().split(/\s+/).map(Number) as Rgb;
const lin = (c: number) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (c: Rgb) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
const ratio = (a: Rgb, b: Rgb) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };

const read = (p: string) => readFileSync(resolve(process.cwd(), p), "utf8");
const globalCss = read("packages/ui/src/styles/global.css");
const baseCss = read("packages/ui/src/styles/base.css");

// --- widths from the CSS (not from the implementation), per mode --------------------------------------
function modeVars(selector: string): Record<string, string> {
  const m = globalCss.match(new RegExp(`${selector.replace(/[[\]"=]/g, "\\$&")}\\s*\\{([^}]*)\\}`));
  if (!m) throw new Error(`${selector} not found in global.css`);
  return Object.fromEntries([...m[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((x) => [x[1], x[2].trim().replace(/\s*\/\*.*$/, "")]));
}
const MODES = {
  subtle: modeVars('[data-focus-ring="subtle"]'),
  default: modeVars('[data-focus-ring="default"]'),
  strong: modeVars('[data-focus-ring="strong"]'),
} as const;
const px = (v: string) => Number(v.replace("px", ""));

/** Surfaces per mode and gray: page fills, control fill (= bg-surface) and control border. */
function surfaces(isDark: boolean) {
  const pages: Rgb[] = [], borders: Rgb[] = [];
  for (const g of GRAY_PRESETS) {
    const s = g.scale;
    // Same page fills as brand-text-guarantee: light white + n-100; dark n-950 (canvas), n-900 (surface), n-850, n-800.
    for (const st of isDark ? [950, 900, 850, 800] : [0, 100]) pages.push(st === 0 ? [255, 255, 255] : parse(s[st]));
    // --border-control: n-450 (foundation zinc, not overridden by gray presets) in light, n-500 in dark.
    borders.push(isDark ? parse(s[500]) : [137, 137, 146]);
  }
  return { pages, borders };
}
const SURF = { light: surfaces(false), dark: surfaces(true) };

type Pipeline = (hex: string, isDark: boolean) => Rgb;
const pipelines: Record<string, Pipeline> = {
  "runtime rgb": (hex, d) => parse(brandTextFor(resolveBrandTriplet(hex, d), d)),
  "runtime oklch": (hex, d) => parse(oklchToRgbTriplet(oklchTextFor(oklchBrandForMode(hexToOklch(hex), d), d))),
  // Old behaviour for comparison: the raw brand fill used as the ring (`ring-brand`, `outline-brand`).
  "raw brand fill (ring-brand)": (hex, d) => parse(resolveBrandTriplet(hex, d)),
};

interface Res { fails: number; total: number; worst: number; worstAt: string; worstBorder: number }
function sweep(hexes: string[], run: Pipeline): Res {
  const r: Res = { fails: 0, total: 0, worst: Infinity, worstAt: "", worstBorder: Infinity };
  for (const hex of hexes) for (const d of [false, true]) {
    const ring = run(hex, d);
    const { pages, borders } = SURF[d ? "dark" : "light"];
    const worst = Math.min(...pages.map((p) => ratio(ring, p)));
    r.worstBorder = Math.min(r.worstBorder, ...borders.map((b) => ratio(ring, b)));
    r.total++;
    if (worst < RING_MIN) r.fails++;
    if (worst < r.worst) { r.worst = worst; r.worstAt = `${hex} ${d ? "dark" : "light"} ring ${ring.join(" ")}`; }
  }
  return r;
}

const presetHexes = BRAND_PRESETS.map((p) => p.hex);
const grid: string[] = [];
{
  const Ls = [0, 0.02, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 0.97, 1];
  const Cs = [0, 0.01, 0.03, 0.06, 0.1, 0.15, 0.2, 0.3, 0.4];
  for (let h = 0; h < 360; h += 15) for (const C of Cs) for (const L of Ls) { if (C === 0 && h > 0) continue; grid.push(oklchToHex({ L, C, H: h })); }
  grid.push("#FFFFFF", "#000000", "#FFFF00", "#CCFF00", "#00FFFF", "#FFD700", "#84CC16", "#FDE047", "#808080", "#767676", "#777777", "#959595");
}
const uniqueGrid = [...new Set(grid)];

describe("focus ring colour: >= 3:1 against adjacent colours (WCAG 1.4.11)", () => {
  it("has the three modes with a visible width", () => {
    for (const m of ["subtle", "default", "strong"] as const) {
      expect(px(MODES[m]["--focus-width"]), m).toBeGreaterThanOrEqual(1);
      expect(px(MODES[m]["--focus-offset"]), m).toBeGreaterThanOrEqual(0);
    }
    expect(px(MODES.subtle["--focus-width"])).toBeLessThan(px(MODES.default["--focus-width"]));
    expect(px(MODES.default["--focus-width"])).toBeLessThan(px(MODES.strong["--focus-width"]));
    // "default" is the pre-subtle ring, so opting out restores the old look exactly.
    expect(MODES.default["--focus-width"]).toBe("2px");
    expect(MODES.default["--focus-offset"]).toBe("2px");
    expect(MODES.default["--focus-offset-inset"]).toBe("-1px");
  });
  it("a 1px ring at -1px offset covers a 1px control border exactly (inputs read as a focus border)", () => {
    // outline inner edge = border edge + offset; outer edge = inner + width. Border spans [edge-1, edge].
    for (const m of ["subtle", "default", "strong"] as const) {
      const inner = px(MODES[m]["--focus-offset-inset"]);
      const outer = inner + px(MODES[m]["--focus-width"]);
      expect(inner, m).toBeLessThanOrEqual(-1);
      expect(outer, m).toBeGreaterThanOrEqual(0);
    }
  });

  for (const [label, hexes] of [["shipped presets (24 brands x 5 grays)", presetHexes], [`arbitrary brands (${uniqueGrid.length} generated)`, uniqueGrid]] as const) {
    describe(label, () => {
      for (const name of ["runtime rgb", "runtime oklch"] as const) {
        for (const mode of ["subtle", "default", "strong"] as const) {
          it(`${name}, ${mode} ring (${MODES[mode]["--focus-width"]}): every brand x gray x light/dark >= ${RING_MIN}:1 on page fills and control fill`, () => {
            const r = sweep(hexes, pipelines[name]);
            expect(r.fails, `${r.fails}/${r.total} fail, worst ${r.worst.toFixed(2)} @ ${r.worstAt}`).toBe(0);
          });
        }
      }
      it("the raw brand fill (what ring-brand paints) would NOT hold: why the rings use --focus / brand-text", () => {
        const r = sweep(hexes, pipelines["raw brand fill (ring-brand)"]);
        expect(r.fails, `raw fill: ${r.fails}/${r.total} brand x mode below 3:1 (worst ${r.worst.toFixed(2)})`).toBeGreaterThan(0);
      });
    });
  }

  if (process.env.FOCUS_TABLE) {
    it("prints numbers", () => {
      for (const [label, hexes] of [["presets", presetHexes], ["grid", uniqueGrid]] as const)
        for (const [n, run] of Object.entries(pipelines)) {
          const r = sweep(hexes, run);
          console.log(`${label}\t${n}\t${r.fails}/${r.total} fail\tworst vs page ${r.worst.toFixed(2)} (${r.worstAt})\tworst vs control border ${r.worstBorder.toFixed(2)}`);
        }
    });
  }
});

describe("focus ring CSS contract", () => {
  it("base.css draws the ring from the tokens, in --focus", () => {
    expect(baseCss).toMatch(/\*:focus-visible\s*\{[^}]*outline:\s*var\(--focus-width[^)]*\)\s+solid\s+rgb\(var\(--focus\)\)/);
    expect(baseCss).toMatch(/outline-offset:\s*var\(--focus-offset,/);
    expect(baseCss).toMatch(/outline-offset:\s*var\(--focus-offset-inset,/);
    expect(baseCss).not.toMatch(/outline:\s*\d+(\.\d+)?px/);
  });
  it("global.css ring-within and tokens agree", () => {
    expect(globalCss).toMatch(/\.focus-ring-within:has\([^)]*\)[^)]*\)\s*\{[^}]*var\(--focus-width/);
    expect(globalCss).toMatch(/:root\s*\{\s*--focus-width:\s*1px;/);
  });
  it("ThemeProvider and ScopedThemeProvider expose focusRing and set data-focus-ring", () => {
    const tp = read("packages/ui/src/primitives/ThemeProvider/ThemeProvider.tsx");
    const sp = read("packages/ui/src/primitives/ThemeProvider/ScopedThemeProvider.tsx");
    expect(tp).toContain('focusRing?: "subtle" | "default" | "strong"');
    expect(tp).toContain("data-focus-ring");
    expect(sp).toContain("data-focus-ring={focusRing}");
  });
});

/** Library source must not hard-code a ring of its own: width/offset/colour come from the tokens. */
describe("no primitive hard-codes its own focus ring", () => {
  const SCAN = ["packages/ui/src", "packages/fx/src", "packages/blocks-pro/blocks", "apps/docs/src", "apps/studio/src", "kits"];
  const BAD = [
    /focus(-visible)?:ring-[1-9]/, // ring-2 on focus
    /focus(-visible)?:ring-brand(?![-\w])/, // brand fill as a ring
    /focus(-visible)?:(after:|before:)?outline-[1-9]/, // fixed outline width
    /focus(-visible)?:(after:|before:)?outline-brand(?![-\w])/, // brand fill as an outline
    /focus(-visible)?:(after:|before:)?-outline-offset-/, // fixed negative offset
    /focus(-visible)?:outline-offset-2/,
  ];
  function walk(dir: string, out: string[] = []): string[] {
    if (!existsSync(dir)) return out; // roots that exist only in the maintainers' checkout
    for (const name of readdirSync(dir)) {
      if (["node_modules", "dist", ".next", "out", "generated"].includes(name)) continue;
      const p = join(dir, name);
      if (statSync(p).isDirectory()) walk(p, out);
      else if (/\.(tsx?|mjs|jsx?)$/.test(name)) out.push(p);
    }
    return out;
  }
  /** file -> reason. */
  const ALLOW: Record<string, string> = {
  };
  const hits: string[] = [];
  for (const base of SCAN) for (const file of walk(resolve(process.cwd(), base))) {
    const rel = relative(process.cwd(), file).split(sep).join("/");
    if (rel in ALLOW) continue;
    read(rel).split("\n").forEach((line, i) => {
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      for (const re of BAD) if (re.test(line)) hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 100)}`);
    });
  }
  it("scans a real amount of source", () => { expect(walk(resolve(process.cwd(), "packages/ui/src")).length).toBeGreaterThan(100); });
  it("uses the focus tokens (var(--focus-width) etc.), not fixed ring classes", () => {
    expect(hits.length, `own focus rings:\n${hits.join("\n")}`).toBe(0);
  });
});
