import { afterEach, describe, expect, it } from "vitest";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error plain .mjs module without types
import { findBrandCSS } from "../../packages/cli/src/commands/brand.mjs";
// @ts-expect-error plain .mjs module without types
import { detectBrandTokensPath } from "../../packages/cli/src/lib/brand-tokens.mjs";

// `init` writes brand-tokens.css next to the project's global stylesheet, so `shavin brand` (which the predev and
// prebuild hooks run) has to find it in every layout `init` supports. create-next-app's default layout has no src
// folder: the stylesheet and brand-tokens.css are in app/.

const dirs: string[] = [];
function project(files: string[]): string {
  const dir = mkdtempSync(join(tmpdir(), "shavin-brand-path-"));
  dirs.push(dir);
  for (const f of files) {
    const full = join(dir, f);
    mkdirSync(join(full, ".."), { recursive: true });
    writeFileSync(full, "/* test */\n");
  }
  return dir;
}
afterEach(() => {
  while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true });
});

const finders: [string, (cwd: string) => { cssPath: string; presetPath: string } | null][] = [
  ["findBrandCSS (shavin brand)", findBrandCSS],
  ["detectBrandTokensPath", detectBrandTokensPath],
];

describe.each(finders)("%s", (_name, find) => {
  it("finds app/brand-tokens.css in a Next.js project without a src folder, with the preset beside it", () => {
    const cwd = project(["app/globals.css", "app/brand-tokens.css"]);
    const found = find(cwd);
    expect(found?.cssPath).toBe(join(cwd, "app", "brand-tokens.css"));
    expect(found?.presetPath).toBe(join(cwd, "app", "brand-preset.mjs"));
  });

  it("still finds src/app/brand-tokens.css, and prefers it when app/ also has one", () => {
    const only = project(["src/app/brand-tokens.css"]);
    expect(find(only)?.cssPath).toBe(join(only, "src", "app", "brand-tokens.css"));
    const both = project(["src/app/brand-tokens.css", "app/brand-tokens.css"]);
    expect(find(both)?.cssPath).toBe(join(both, "src", "app", "brand-tokens.css"));
  });

  it.each(["src/styles/brand-tokens.css", "styles/brand-tokens.css", "src/brand-tokens.css", "brand-tokens.css"])(
    "still finds %s",
    (rel) => {
      const cwd = project([rel]);
      expect(find(cwd)?.cssPath).toBe(join(cwd, rel));
    },
  );

  it("returns null when the project has no brand-tokens.css", () => {
    expect(find(project(["app/globals.css"]))).toBeNull();
  });
});
