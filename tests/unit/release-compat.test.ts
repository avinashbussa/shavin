import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { releaseProblems } from "../../scripts/check-release-compat.mjs";

const NAMES: Record<string, string> = { ui: "@shavin/ui", cli: "@shavin/cli", "mcp-server": "@shavin/mcp", skills: "@shavin/skills", "block-schema": "@shavin/block-schema" };

function repo(versions: Record<string, string>, compat: Record<string, string> = {}, changelog = true) {
  const dir = mkdtempSync(join(tmpdir(), "shavin-relcompat-"));
  for (const [d, name] of Object.entries(NAMES)) {
    const version = versions[d] ?? "0.1.0";
    const pkg: Record<string, unknown> = { name, version };
    if (compat[d]) pkg.shavin = { compat: { "@shavin/ui": compat[d] } };
    mkdirSync(join(dir, "packages", d), { recursive: true });
    writeFileSync(join(dir, "packages", d, "package.json"), JSON.stringify(pkg));
    if (changelog) writeFileSync(join(dir, "packages", d, "CHANGELOG.md"), `# Changelog\n\n## ${version}\n\nNotes.\n`);
  }
  return dir;
}
const nothingPublished = () => null;

describe("release compatibility gate", () => {
  it("passes when every compat range includes the ui version being published", () => {
    const root = repo({}, { cli: ">=0.1.0 <0.2.0", "mcp-server": ">=0.1.0 <0.2.0", skills: ">=0.1.0 <0.2.0" });
    expect(releaseProblems({ root, selected: "all", onNpm: nothingPublished })).toEqual([]);
  });

  it("blocks a package whose range excludes the ui published in the same run, with the exact fix", () => {
    const root = repo({ ui: "0.2.0" }, { "mcp-server": ">=0.1.0 <0.2.0" });
    const [p, ...rest] = releaseProblems({ root, selected: "all", onNpm: nothingPublished });
    expect(rest).toEqual([]);
    expect(p).toContain("@shavin/mcp@0.1.0 documents @shavin/ui >=0.1.0 <0.2.0, but this release publishes @shavin/ui 0.2.0");
    expect(p).toContain('edit "shavin.compat" in packages/mcp-server/package.json');
  });

  it("uses the ui already on npm when ui is not in this run", () => {
    const root = repo({}, { cli: ">=0.1.0 <0.2.0" });
    const onNpm = (spec: string) => (spec === "@shavin/ui" ? "0.3.0" : null);
    const [p] = releaseProblems({ root, selected: "cli", onNpm });
    expect(p).toContain("relies on the published @shavin/ui 0.3.0");
  });

  it("blocks when ui is neither in the run nor on npm", () => {
    const root = repo({}, { cli: ">=0.1.0 <0.2.0" });
    const [p] = releaseProblems({ root, selected: "cli", onNpm: nothingPublished });
    expect(p).toMatch(/@shavin\/ui is not on npm yet/);
    expect(p).toMatch(/packages "all"/);
  });

  it("ignores packages already on npm (the workflow skips them)", () => {
    const root = repo({ ui: "0.2.0" }, { cli: ">=0.1.0 <0.2.0" });
    const onNpm = (spec: string) => (spec === "@shavin/cli@0.1.0" ? "0.1.0" : null);
    expect(releaseProblems({ root, selected: "all", onNpm })).toEqual([]);
  });

  it("blocks a package with no CHANGELOG entry for its version, with the recovery step", () => {
    const root = repo({}, {}, false);
    const problems = releaseProblems({ root, selected: "ui", onNpm: nothingPublished });
    expect(problems[0]).toMatch(/CHANGELOG\.md is missing/);
    expect(problems[0]).toMatch(/npm run version-packages/);
  });
});
