import path from "node:path";
import { describe, expect, it } from "vitest";
import { relPosix, toPosix } from "../../packages/skills/posix-path.mjs";

describe("posix path helpers (skills build must compare paths with '/' on Windows too)", () => {
  it("toPosix turns backslashes into forward slashes and leaves posix paths alone", () => {
    expect(toPosix("references\\compositions\\hero.md")).toBe("references/compositions/hero.md");
    expect(toPosix("references/compositions/hero.md")).toBe("references/compositions/hero.md");
  });

  it("relPosix gives the same result for Windows and POSIX path rules", () => {
    const win = relPosix(
      "C:\\repo\\packages\\skills\\skills",
      "C:\\repo\\packages\\skills\\skills\\layout-compositions\\references\\compositions\\hero.md",
      path.win32,
    );
    const posix = relPosix(
      "/repo/packages/skills/skills",
      "/repo/packages/skills/skills/layout-compositions/references/compositions/hero.md",
      path.posix,
    );
    expect(win).toBe("layout-compositions/references/compositions/hero.md");
    expect(posix).toBe(win);
  });

  it("a Windows relative path passes the frontmatter orphan checks that failed in CI", () => {
    const skillRoot = "C:\\repo\\packages\\skills\\skills\\layout-compositions";
    const dirFile = relPosix(skillRoot, `${skillRoot}\\references\\compositions\\hero.md`, path.win32);
    // build.mjs skips files under references/ and matches frontmatter entries written with "/".
    expect(dirFile.startsWith("references/")).toBe(true);
    expect(["references/compositions/hero.md"].includes(dirFile)).toBe(true);
  });
});
