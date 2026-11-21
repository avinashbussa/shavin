import { existsSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { runSync } from "../../scripts/lib/spawn-cross.mjs";

const ROOT = resolve(__dirname, "../..");
const pkgDir = join(ROOT, "packages/skills");
const internal: { maintainerOnly: { path: string; reason: string }[] } = JSON.parse(readFileSync(join(pkgDir, "internal.json"), "utf8"));
const names = internal.maintainerOnly.map((e) => e.path);

describe("maintainer-only skills never reach end users", () => {
  it("lists shavin-core, shavin-ui-qa-linter and the dense protocol, each with a reason", () => {
    expect(names).toEqual(expect.arrayContaining(["shavin-core", "shavin-ui-qa-linter", "dense-compression-protocol.md"]));
    expect(internal.maintainerOnly.every((e) => e.reason.length > 20)).toBe(true);
    for (const n of names) expect(existsSync(join(pkgDir, "skills", n))).toBe(true);
  });

  it("is excluded from the npm package (files negations match internal.json)", () => {
    const files: string[] = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8")).files;
    for (const n of names) expect(files).toContain(`!skills/${n}`);
    const packed = JSON.parse(runSync("npm", ["pack", "--dry-run", "--json"], { cwd: pkgDir, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }))[0].files.map((f: { path: string }) => f.path);
    for (const n of names) expect(packed.filter((p: string) => p.startsWith(`skills/${n}`))).toEqual([]);
    expect(packed).toContain("skills/shavin-app/SKILL.md");
    expect(packed).toContain("skills/shavin-studio/SKILL.md");
    expect(packed).toContain("cursor/shavin.mdc");
  });

  it("is not installed by `npx @shavin/skills` (.agents/ and .claude/)", () => {
    const target = mkdtempSync(join(tmpdir(), "shavin-skills-install-"));
    runSync("node", [join(pkgDir, "bin/install.mjs"), "--target", target], { stdio: "ignore" });
    for (const dir of [".agents/skills", ".claude/skills"]) {
      for (const n of names) expect(existsSync(join(target, dir, n))).toBe(false);
      expect(existsSync(join(target, dir, "shavin-app/SKILL.md"))).toBe(true);
      expect(existsSync(join(target, dir, "shavin-studio/SKILL.md"))).toBe(true);
    }
  });

  it("consumer files never point at a maintainer-only skill", () => {
    const consumer = ["packages/cli/src/templates/CLAUDE.md", "packages/cli/src/templates/AGENTS.md", "packages/cli/src/templates/SHAVIN.md", "packages/skills/AGENTS.md"];
    for (const f of consumer) for (const n of ["shavin-core", "shavin-ui-qa-linter", "dense-compression-protocol"]) expect(readFileSync(join(ROOT, f), "utf8"), `${f} mentions ${n}`).not.toContain(n);
    const skillsDir = join(pkgDir, "skills");
    const { readdirSync, statSync } = require("node:fs");
    const walk = (d: string, out: string[] = []): string[] => { for (const e of readdirSync(d)) { const p = join(d, e); statSync(p).isDirectory() ? walk(p, out) : out.push(p); } return out; };
    for (const f of [...walk(skillsDir), ...walk(join(pkgDir, "commands"))]) {
      if (names.some((n) => f.startsWith(join(skillsDir, n)))) continue;
      const text = readFileSync(f, "utf8");
      expect(text, `${f} mentions shavin-core`).not.toMatch(/shavin-core/);
      expect(text, `${f} mentions shavin-ui-qa-linter`).not.toMatch(/shavin-ui-qa-linter/);
    }
  });
});
