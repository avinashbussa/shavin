import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * gsap is an optional peer. webpack (Next) and Vite fail the build with "Can't resolve 'gsap'" for a
 * dynamic import that is not inside a try block of the SAME function, even when the caller catches
 * the rejection. The fresh-consumer harness caught this once (HTTP 500 on a project without gsap), so
 * every gsap import in the default loader must sit lexically inside its own try.
 */
describe("optional gsap imports", () => {
  it("wraps every import of gsap in a try block", () => {
    const src = readFileSync(resolve(__dirname, "../../packages/ui/src/lib/motion-gsap.ts"), "utf8");
    const lines = src.split("\n");
    const imports = lines.map((l, i) => ({ l, i })).filter(({ l }) => /await import\(\s*["']gsap/.test(l));
    expect(imports.length).toBeGreaterThanOrEqual(3);
    for (const { l, i } of imports) {
      const sameLineTry = /\btry\s*\{/.test(l);
      const prev = lines.slice(Math.max(0, i - 2), i).join("\n");
      expect(sameLineTry || /\btry\s*\{\s*$/.test(prev.trimEnd()), `import not inside try: ${l.trim()}`).toBe(true);
    }
  });

  it("keeps gsap out of motion-runtime.ts (it lives behind ./motion-gsap)", () => {
    const src = readFileSync(resolve(__dirname, "../../packages/ui/src/lib/motion-runtime.ts"), "utf8");
    const code = src.split("\n").filter((l) => !/^\s*(\*|\/\/|\/\*)/.test(l)).join("\n");
    expect(code).not.toMatch(/await import\(\s*["']gsap/);
  });
});
