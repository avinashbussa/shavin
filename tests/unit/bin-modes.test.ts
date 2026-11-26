/**
 * Every package bin entry is executable in git (mode 100755). `npm install` chmods bin targets in a worktree,
 * so a 100644 entry shows up as a mode change in every checkout that has installed and a stale 644 elsewhere.
 */
import { describe, it, expect } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(__dirname, "../..");

describe("package bin files", () => {
  it("are committed as executable", () => {
    const bad: string[] = [];
    let checked = 0;
    for (const dir of fs.readdirSync(path.join(ROOT, "packages"))) {
      const pj = path.join(ROOT, "packages", dir, "package.json");
      if (!fs.existsSync(pj)) continue;
      const bin = JSON.parse(fs.readFileSync(pj, "utf8")).bin;
      for (const b of new Set(typeof bin === "string" ? [bin] : Object.values<string>(bin ?? {}))) {
        const rel = path.posix.join("packages", dir, b.replace(/^\.\//, ""));
        const line = execFileSync("git", ["ls-files", "-s", "--", rel], { cwd: ROOT }).toString().trim();
        if (!line) continue; // untracked or not a git checkout
        checked++;
        if (!line.startsWith("100755")) bad.push(rel);
      }
    }
    expect(checked).toBeGreaterThan(0);
    expect(bad, `run: git update-index --chmod=+x ${bad.join(" ")}`).toEqual([]);
  });
});
