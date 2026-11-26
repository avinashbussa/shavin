import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, it, expect } from "vitest";

import {
  BRAND_PRESETS,
  GRAY_PRESETS,
  brandTextFor,
  contrastRatio,
  resolveBrandTriplet,
} from "../../packages/ui/src/lib/theme-presets";

/**
 * Badge variant="soft" text contrast, computed from the real tokens and the real class names.
 *
 * axe-core cannot read a translucent background (bg-success/10), so it skips this pairing.
 * This test blends the tint over each page fill the Badge can sit on and checks the text
 * colour against the blended result, for every brand preset x gray preset x light/dark x tone.
 * It reads tokens.css and Badge.tsx, so changing either one is checked.
 */

const MIN = 4.5;
const tokensCss = readFileSync(resolve(process.cwd(), "packages/ui/src/styles/tokens.css"), "utf8");
const badgeSrc = readFileSync(resolve(process.cwd(), "packages/ui/src/primitives/Badge/Badge.tsx"), "utf8");

type Rgb = [number, number, number];
const parse = (t: string): Rgb => t.trim().split(/\s+/).map(Number) as Rgb;
const str = (c: Rgb) => c.map((v) => Math.round(v)).join(" ");

// Light tokens are the first block (:root, .light); dark tokens are the first `.dark {` block.
const darkAt = tokensCss.indexOf("\n.dark {");
const blocks = { light: tokensCss.slice(0, darkAt), dark: tokensCss.slice(darkAt) };
function token(mode: "light" | "dark", name: string): Rgb {
  const m = blocks[mode].match(new RegExp(`--${name}:\\s*(\\d+ \\d+ \\d+)\\s*;`));
  if (!m) throw new Error(`token --${name} not found in ${mode} block of tokens.css`);
  return parse(m[1]);
}

// Soft compound variants, straight from Badge.tsx: tone -> { bg token, alpha, text token }.
const soft = [...badgeSrc.matchAll(/variant: "soft", tone: "(\w+)", class: "([^"]+)"/g)].map(([, tone, cls]) => {
  const bg = cls.match(/bg-([a-z-]+)\/(?:\[([\d.]+)\]|(\d+))/);
  const text = cls.match(/text-([a-z-]+)/);
  if (!bg || !text) throw new Error(`cannot parse soft/${tone} classes: ${cls}`);
  return { tone, bgToken: bg[1], alpha: bg[2] ? Number(bg[2]) : Number(bg[3]) / 100, textToken: text[1] };
});

// Chromium quantises the tint alpha to 8 bits before compositing (0.1 -> 26/255); matched against screenshot pixels.
const blend = (fg: Rgb, bg: Rgb, a: number): Rgb => {
  const q = Math.round(a * 255) / 255;
  return fg.map((v, i) => v * q + bg[i] * (1 - q)) as Rgb;
};

interface Row { mode: "light" | "dark"; brand: string; gray: string; tone: string; surface: string; ratio: number; fg: string; bg: string }

function compute(): Row[] {
  const rows: Row[] = [];
  for (const mode of ["light", "dark"] as const) {
    const dark = mode === "dark";
    for (const gray of GRAY_PRESETS) {
      const s = gray.scale;
      // Fills a Badge sits on: page canvas, card surface, elevated surface.
      const surfaces: [string, Rgb][] = dark
        ? [["canvas", parse(s[950])], ["surface", parse(s[900])], ["elevated", parse(s[850])]]
        : [["canvas", parse(s[100])], ["surface", [255, 255, 255]], ["elevated", [255, 255, 255]]];
      const fgInk = parse(dark ? s[200] : s[950]); // --fg
      for (const brand of BRAND_PRESETS) {
        const brandFill = parse(resolveBrandTriplet(brand.name, dark));
        const brandText = parse(brandTextFor(str(brandFill), dark));
        for (const v of soft) {
          const tokenOf = (n: string): Rgb =>
            n === "brand" ? brandFill : n === "brand-contrast" ? brandText : n === "fg" ? fgInk : token(mode, n);
          const fg = tokenOf(v.textToken);
          const tint = tokenOf(v.bgToken);
          for (const [sname, base] of surfaces) {
            const bg = blend(tint, base, v.alpha);
            rows.push({ mode, brand: brand.name, gray: gray.name, tone: v.tone, surface: sname, ratio: contrastRatio(str(fg), str(bg)), fg: str(fg), bg: str(bg) });
          }
        }
      }
    }
  }
  return rows;
}

describe("Badge variant=soft text contrast (blended tint, all presets)", () => {
  it("finds the soft variants in Badge.tsx", () => {
    expect(soft.map((v) => v.tone).sort()).toEqual(["brand", "danger", "neutral", "success", "warning"]);
  });

  const rows = compute();

  it("has a row for every brand x gray x mode x tone x surface", () => {
    expect(rows.length).toBe(BRAND_PRESETS.length * GRAY_PRESETS.length * 2 * soft.length * 3);
  });

  for (const tone of ["success", "warning", "danger", "brand", "neutral"]) {
    for (const mode of ["light", "dark"] as const) {
      it(`${tone} soft badge text is >= ${MIN}:1 in ${mode} mode at every preset`, () => {
        const bad = rows.filter((r) => r.tone === tone && r.mode === mode && r.ratio < MIN);
        const worst = bad.sort((a, b) => a.ratio - b.ratio).slice(0, 5)
          .map((r) => `${r.brand}/${r.gray}/${r.surface} ${r.ratio.toFixed(2)} (fg ${r.fg} on ${r.bg})`);
        expect(bad.length, `below ${MIN}:1: ${worst.join("; ")}`).toBe(0);
      });
    }
  }

  if (process.env.BADGE_TABLE) {
    it("prints the table", () => {
      const out: string[] = [];
      for (const mode of ["light", "dark"]) for (const tone of ["success", "warning", "danger", "brand", "neutral"]) {
        const r = rows.filter((x) => x.mode === mode && x.tone === tone);
        const min = r.reduce((a, b) => (b.ratio < a.ratio ? b : a));
        const def = r.find((x) => x.brand === "Monochrome" && x.gray === "Zinc" && x.surface === "canvas")!;
        const fails = r.filter((x) => x.ratio < MIN).length;
        out.push(`${mode}\t${tone}\tdefault(canvas) ${def.ratio.toFixed(2)} fg ${def.fg} bg ${def.bg}\tmin ${min.ratio.toFixed(2)} @ ${min.brand}/${min.gray}/${min.surface}\tfails ${fails}/${r.length}`);
      }
      console.log("\n" + out.join("\n"));
    });
  }
});
