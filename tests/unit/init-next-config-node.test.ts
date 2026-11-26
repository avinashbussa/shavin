import { describe, expect, it } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
// @ts-expect-error plain .mjs modules without types
import { nextTsConfigImportBreaksDev } from "../../packages/cli/src/lib/init-detect.mjs";
// @ts-expect-error plain .mjs modules without types
import { wireNextBridge } from "../../packages/cli/src/commands/init.mjs";

const STOCK_TS = `import type { NextConfig } from "next";\n\nconst nextConfig: NextConfig = {\n  /* config options here */\n};\n\nexport default nextConfig;\n`;
const project = (file: string, src: string) => {
  const dir = mkdtempSync(join(tmpdir(), "shavin-next-"));
  writeFileSync(join(dir, file), src);
  return dir;
};

/** Found by the fresh-consumer harness: with init's import added, `next dev` answered 500 on every request (Node 22.12, Next 15.5.29, create-next-app defaults). */
describe("init keeps imports out of next.config.ts on Node versions where Next dev breaks", () => {
  it("flags TypeScript configs on Node 22.12 and 22.13 only", () => {
    expect(nextTsConfigImportBreaksDev("next.config.ts", "22.12.0")).toBe(true);
    expect(nextTsConfigImportBreaksDev("next.config.ts", "22.13.1")).toBe(true);
    expect(nextTsConfigImportBreaksDev("next.config.ts", "22.14.0")).toBe(false);
    expect(nextTsConfigImportBreaksDev("next.config.ts", "22.18.0")).toBe(false);
    expect(nextTsConfigImportBreaksDev("next.config.ts", "24.1.0")).toBe(false);
    expect(nextTsConfigImportBreaksDev("next.config.mjs", "22.12.0")).toBe(false);
  });

  it("leaves a stock next.config.ts untouched on Node 22.12 and tells the user why", () => {
    const dir = project("next.config.ts", STOCK_TS);
    const r = wireNextBridge(dir, "22.12.0");
    expect(r.status).toBe("manual");
    expect(r.note).toMatch(/22\.14/);
    expect(readFileSync(join(dir, "next.config.ts"), "utf8")).toBe(STOCK_TS);
  });

  it("still wires next.config.ts on Node 22.14+, and next.config.mjs on any Node", () => {
    expect(wireNextBridge(project("next.config.ts", STOCK_TS), "22.14.0").status).toBe("wired");
    const mjs = project("next.config.mjs", `const nextConfig = {};\nexport default nextConfig;\n`);
    expect(wireNextBridge(mjs, "22.12.0").status).toBe("wired");
    expect(readFileSync(join(mjs, "next.config.mjs"), "utf8")).toContain("withShavinBridge(nextConfig)");
  });
});
