import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { reservedBrandNames } from "../../packages/cli/src/lib/brand-tokens.mjs";

// Shavin and shadcn/ui in one Tailwind v4 project: no shared variable names, element defaults in a
// layer that utilities beat, and brand colour names that can't clash with the core brand tokens.

const styles = (f: string) => readFileSync(join(__dirname, "../../packages/ui/src/styles", f), "utf8");
const declared = (css: string) => new Set([...css.matchAll(/^\s*(--[a-z0-9-]+)\s*:/gm)].map((m) => m[1]));

// The variables shadcn/ui's globals.css defines (new-york, Tailwind v4).
const SHADCN_VARS = [
  "--background", "--foreground", "--card", "--card-foreground", "--popover", "--popover-foreground",
  "--primary", "--primary-foreground", "--secondary", "--secondary-foreground", "--muted",
  "--muted-foreground", "--accent", "--accent-foreground", "--destructive", "--border", "--input",
  "--ring", "--chart-1", "--chart-2", "--chart-3", "--chart-4", "--chart-5", "--radius",
  "--sidebar", "--sidebar-foreground", "--sidebar-primary", "--sidebar-primary-foreground",
  "--sidebar-accent", "--sidebar-accent-foreground", "--sidebar-border", "--sidebar-ring",
];

describe("shadcn/ui coexistence", () => {
  it("Shavin's tokens don't redefine any shadcn/ui variable", () => {
    const ours = new Set([...declared(styles("global.css")), ...declared(styles("brand-tokens.css"))]);
    expect(SHADCN_VARS.filter((v) => ours.has(v))).toEqual([]);
  });

  it("the brand colour is --brand; shadcn/ui's --accent* is not declared", () => {
    for (const f of ["global.css", "global-oklch.css", "brand-tokens.css", "theme-v4.css"]) {
      expect([...declared(styles(f))].filter((v) => /^--(color-)?accent/.test(v))).toEqual([]);
    }
    expect(declared(styles("global.css")).has("--brand")).toBe(true);
  });

  it("tokens.css is global.css without the element defaults", () => {
    for (const [tokens, base] of [["tokens.css", "base.css"], ["tokens-oklch.css", "base-oklch.css"]]) {
      const css = styles(tokens);
      expect(css).not.toContain(`@import "./${base}"`);
      expect(css).not.toMatch(/^\*:focus-visible/m);
      expect(css).toContain("--brand:");
      expect(styles(base)).toMatch(/^\*:focus-visible/m);
    }
    expect(styles("global.css")).toContain('@import "./base.css"');
    expect(styles("global-oklch.css")).toContain('@import "./base-oklch.css"');
  });
});

describe("brand:gen reserved names", () => {
  const decl = (...names: string[]) => names.map((name) => ({ name, value: "#FF6B6B" }));

  it("flags names that belong to the core brand colour", () => {
    expect(reservedBrandNames(decl("fg", "hover", "subtle-hover", "on-dark", "on-light-hover"))).toEqual([
      "fg", "hover", "subtle-hover", "on-dark", "on-light-hover",
    ]);
  });

  it("allows ordinary colour names", () => {
    expect(reservedBrandNames(decl("primary", "coral", "ocean", "text-muted", "foreground"))).toEqual([]);
  });
});
