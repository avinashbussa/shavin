import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const CLI = path.resolve(__dirname, "../../packages/cli");
const walk = (d: string): string[] =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

/**
 * `npx @shavin/cli init` installs the cli ALONE (its cache has no @shavin/ui). Any import that climbs out of the package
 * (../../../ui/...) works in this repository and crashes with ERR_MODULE_NOT_FOUND for a user. Found by the fresh-consumer harness.
 */
describe("@shavin/cli is self-contained when installed alone", () => {
  const files = ["bin", "src"].flatMap((d) => walk(path.join(CLI, d))).filter((f) => /\.(mjs|js|ts)$/.test(f));

  it("no static or dynamic import resolves outside the package folder", () => {
    const escaping: string[] = [];
    for (const f of files) {
      const text = fs.readFileSync(f, "utf8");
      for (const m of text.matchAll(/(?:from\s+|import\s*\(\s*|import\s+)["'](\.[^"']+)["']/g)) {
        const target = path.resolve(path.dirname(f), m[1]);
        if (!target.startsWith(CLI + path.sep)) escaping.push(`${path.relative(CLI, f)} -> ${m[1]}`);
      }
    }
    expect(escaping).toEqual([]);
  });

  it("the vendored color-space.mjs is identical to the one in @shavin/ui (re-copy it when ui changes)", () => {
    const ui = fs.readFileSync(path.resolve(CLI, "../ui/src/lib/color-space.mjs"), "utf8");
    const cli = fs.readFileSync(path.join(CLI, "src/lib/color-space.mjs"), "utf8");
    expect(cli, "run: cp packages/ui/src/lib/color-space.mjs packages/cli/src/lib/color-space.mjs").toBe(ui);
  });
});
