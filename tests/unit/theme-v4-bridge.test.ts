import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

// An @theme entry named after its own source variable
// (`--shadow-panel: var(--shadow-panel)`) is emitted on :root as a cyclic var
// and wipes the real value, so the utility silently resolves to nothing.
describe.each(["theme-v4.css", "theme-v4-oklch.css"])("%s", (file) => {
  const css = readFileSync(join(__dirname, "../../packages/ui/src/styles", file), "utf8");
  it("has no self-referencing @theme entries", () => {
    const cyclic = [...css.matchAll(/^\s*(--[\w-]+):\s*var\(\1\)\s*;/gm)].map((m) => m[1]);
    expect(cyclic).toEqual([]);
  });
  it("defines rounded-panel as a utility", () => {
    expect(css).toMatch(/@utility rounded-panel\b/);
    expect(css).toMatch(/@utility rounded-panel-inner/);
  });
  it("defines shadow-panel as a utility", () => {
    expect(css).toMatch(/@utility shadow-panel/);
  });
});
