import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ROOT = resolve(__dirname, "../..");

/**
 * `npx @scope/name` runs the package's only bin, or else the bin named like the unscoped package (`name`). A package with
 * several bins and none of that name fails with "could not determine executable to run": this broke `npx @shavin/mcp`
 * when the edit hook was added as a second bin.
 */
describe("npx can run every published package that has a bin", () => {
  for (const dir of ["cli", "mcp-server", "skills"]) {
    it(`@shavin/${dir === "mcp-server" ? "mcp" : dir}`, () => {
      const pkg = JSON.parse(readFileSync(join(ROOT, "packages", dir, "package.json"), "utf8"));
      const bins = Object.keys(pkg.bin ?? {});
      const unscoped = String(pkg.name).split("/").pop() as string;
      expect(bins.length === 1 || bins.includes(unscoped), `${pkg.name} has bins ${bins.join(", ")}`).toBe(true);
    });
  }
});
