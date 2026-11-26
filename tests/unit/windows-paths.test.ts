import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs module without types
import { relPosix, toPosix } from "../../packages/mcp-server/src/posix-path.mjs";
// @ts-expect-error plain .mjs module without types
import { walkDirFiles } from "../../packages/mcp-server/src/skill-files.mjs";
// @ts-expect-error plain .mjs module without types
import { loadCatalogue } from "../../packages/mcp-server/src/tools/compose.mjs";
// @ts-expect-error plain .mjs module without types
import { scanCodebaseAlignment } from "../../packages/mcp-server/src/context.mjs";

// Windows `path` returns backslashes. Skill files are keyed with "/" ("references/compositions/hero"), and
// loadCatalogue only reads keys that start with "references/compositions/": a backslash key made plan_page and
// check_page report "layout-compositions skill not found" on Windows.

const COMPOSITIONS = path.resolve(__dirname, "../../packages/skills/skills/layout-compositions");

describe("posix helpers", () => {
  it("relPosix gives forward slashes for Windows paths", () => {
    const base = "C:\\Users\\dev\\app\\node_modules\\@shavin\\skills\\skills\\layout-compositions";
    expect(relPosix(base, `${base}\\references\\compositions\\hero.md`, path.win32)).toBe("references/compositions/hero.md");
    expect(relPosix(base, `${base}\\SKILL.md`, path.win32)).toBe("SKILL.md");
  });
  it("relPosix is unchanged on POSIX paths", () => {
    expect(relPosix("/a/b", "/a/b/references/compositions/hero.md", path.posix)).toBe("references/compositions/hero.md");
  });
  it("toPosix converts backslashes and leaves forward slashes alone", () => {
    expect(toPosix("a\\b\\c.md")).toBe("a/b/c.md");
    expect(toPosix("a/b/c.md")).toBe("a/b/c.md");
  });
});

describe("walkDirFiles keys", () => {
  it("lists skill files with forward-slash relPath, nested folders included", () => {
    const files = walkDirFiles(COMPOSITIONS) as { relPath: string; name: string }[];
    const hero = files.find((f) => f.name === "hero.md");
    expect(hero?.relPath).toBe("references/compositions/hero.md");
    expect(files.every((f) => !f.relPath.includes("\\"))).toBe(true);
  });
});

/** What loadSkills builds for a skill: the same key forms, from a Windows-style listing. */
function subFilesFor(listing: { win: string; real: string }[], base: string) {
  const subFiles: Record<string, string> = {};
  for (const { win, real } of listing) {
    const name = path.win32.basename(win);
    const relKey = relPosix(base, win, path.win32).replace(/\.md$/, "").toLowerCase();
    const body = readFileSync(real, "utf8");
    subFiles[name.replace(/\.md$/, "").toLowerCase()] = body;
    subFiles[relKey] = body;
  }
  return subFiles;
}

describe("loadCatalogue with Windows-style skill file paths", () => {
  it("finds the compositions when the files are listed as C:\\...\\references\\compositions\\*.md", () => {
    const base = "C:\\proj\\node_modules\\@shavin\\skills\\skills\\layout-compositions";
    const real = walkDirFiles(COMPOSITIONS) as { fullPath: string; relPath: string }[];
    const listing = real.map((f) => ({ real: f.fullPath, win: `${base}\\${f.relPath.split("/").join("\\")}` }));
    const catalogue = loadCatalogue({ "layout-compositions": { subFiles: subFilesFor(listing, base) } });
    expect(catalogue).not.toBeNull();
    expect(catalogue.compositions.size).toBeGreaterThanOrEqual(57);
    expect(catalogue.compositions.has("H1")).toBe(true);
  });

  it("the same call with backslash keys (the old behaviour) finds none, which is what this test guards against", () => {
    const real = walkDirFiles(COMPOSITIONS) as { fullPath: string; relPath: string }[];
    const subFiles: Record<string, string> = {};
    for (const f of real) subFiles[f.relPath.split("/").join("\\").replace(/\.md$/, "").toLowerCase()] = readFileSync(f.fullPath, "utf8");
    const catalogue = loadCatalogue({ "layout-compositions": { subFiles } });
    expect(catalogue?.compositions?.size ?? 0).toBe(0);
  });
});

describe("scanCodebaseAlignment skips docs on every platform", () => {
  const dirs: string[] = [];
  afterEach(() => { while (dirs.length) rmSync(dirs.pop()!, { recursive: true, force: true }); });
  it("does not count files under docs/", () => {
    const dir = mkdtempSync(path.join(tmpdir(), "shavin-align-"));
    dirs.push(dir);
    mkdirSync(path.join(dir, "docs"));
    mkdirSync(path.join(dir, "src"));
    writeFileSync(path.join(dir, "docs", "example.tsx"), 'export const A = () => <div style={{ color: "#ff0000" }} />;\n');
    writeFileSync(path.join(dir, "src", "page.tsx"), 'import { Button } from "@shavin/ui";\nexport const P = () => <Button>ok</Button>;\n');
    const result = scanCodebaseAlignment(dir);
    expect(result.totalFilesScanned).toBe(1);
  });
});
