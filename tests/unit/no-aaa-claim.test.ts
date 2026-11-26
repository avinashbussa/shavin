import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

// Shavin claims WCAG 2.2 AA only. Public, non-skills sources may mention AAA
// only to disclaim it ("not claimed", "never AAA", "not AAA").
const ROOT = join(__dirname, "..", "..");
const DIRS = ["packages/ui/src", "packages/mcp-server/src", "packages/cli/src", "scripts", "apps/docs/src", "apps/website/src", "kits"];
const SKIP = new Set(["node_modules", "dist", ".next", ".turbo", "out", "generated"]);
const EXT = /\.(ts|tsx|mjs|md|mdx|json)$/;
const SELF = "tests/unit/no-aaa-claim.test.ts";
// ShavinDevTools labels a measured ratio on a scale.
const ALLOWED_FILES = [/ShavinDevTools\/DevToolsPanel\.tsx$/];
const DISCLAIMER = /\b(not|never|no|isn't|without)\b[^.\n]{0,40}\bAAA\b|\bAAA\b[^.\n]{0,40}\b(not claimed|is not|not met)\b|\(AAA\)|is AAA|level AAA|\(it is AAA\)/i;
const CLAIM = /AAA|\b7(\.0)?\s?:\s?1\b|enhanced contrast/i;

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out; // roots that exist only in the maintainers' checkout
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (EXT.test(name)) out.push(p);
  }
  return out;
}

describe("no WCAG AAA claim in public non-skills sources", () => {
  it("scans a real amount of source", () => {
    expect(DIRS.flatMap((d) => walk(join(ROOT, d))).length).toBeGreaterThan(100);
  });

  it("does not claim AAA, 7:1 or enhanced contrast", () => {
    const hits: string[] = [];
    for (const d of DIRS) {
      for (const file of walk(join(ROOT, d))) {
        // Posix separators on every platform: the allowance and SELF below are written with "/".
        const rel = relative(ROOT, file).split(sep).join("/");
        if (rel === SELF || ALLOWED_FILES[0].test(rel)) continue;
        readFileSync(file, "utf8").split("\n").forEach((line, i) => {
          if (!CLAIM.test(line) || DISCLAIMER.test(line)) return;
          if (/\b(seed|getDay|0\.7)\b/.test(line)) return;
          hits.push(`${rel}:${i + 1}: ${line.trim().slice(0, 120)}`);
        });
      }
    }
    expect(hits, hits.join("\n")).toEqual([]);
  });
});
