import { existsSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { parseChangelog, collectReleases, notesFor, resolvePackage } from "../../scripts/release-notes.mjs";

const ROOT = join(__dirname, "..", "..");

const CHANGESETS = `# @shavin/ui

## 0.2.0

### Minor Changes

- 1a2b3c4: Add \`Foo\` primitive.

  A second paragraph of the same change.

- Rename \`bar\` to \`baz\`.

### Patch Changes

- 5d6e7f8: Fix focus ring on \`Select\`
- Updated dependencies [9a8b7c6]
  - @shavin/block-schema@0.1.1

## 0.1.1 — 2026-12-01

### Patch Changes

- Fix a typo

## 0.1.0 — first npm release

The first release.

### What's in it

- \`ThemeProvider\`
- 94 primitives

### Also in this release

- **Breaking**: brand names
`;

function repo(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "shavin-relnotes-"));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}

describe("parseChangelog", () => {
  const entries = parseChangelog(CHANGESETS, "@shavin/ui");

  it("finds every version, newest first, as written", () => {
    expect(entries.map((e: { version: string }) => e.version)).toEqual(["0.2.0", "0.1.1", "0.1.0"]);
    expect(entries.every((e: { package: string }) => e.package === "@shavin/ui")).toBe(true);
  });

  it("reads Changesets sections into major/minor/patch bullets and drops the commit-hash prefix", () => {
    const e = entries[0];
    expect(e.sections.major).toEqual([]);
    expect(e.sections.minor).toEqual(["Add `Foo` primitive.\n\nA second paragraph of the same change.", "Rename `bar` to `baz`."]);
    expect(e.sections.patch[0]).toBe("Fix focus ring on `Select`");
    expect(e.sections.patch[1]).toContain("Updated dependencies [9a8b7c6]");
    expect(e.sections.patch[1]).toContain("@shavin/block-schema@0.1.1");
    expect(e.date).toBeNull();
    expect(e.title).toBeNull();
  });

  it("takes a date or a title from the heading, never inventing either", () => {
    expect(entries[1].date).toBe("2026-12-01");
    expect(entries[1].title).toBeNull();
    expect(entries[2].date).toBeNull();
    expect(entries[2].title).toBe("first npm release");
  });

  it("keeps hand-written sections (the 0.1.0 shape) as `other`, with the intro paragraph", () => {
    const e = entries[2];
    expect(e.other.map((o: { heading: string }) => o.heading)).toEqual(["", "What's in it", "Also in this release"]);
    expect(e.other[0].markdown).toBe("The first release.");
    expect(e.other[1].markdown).toContain("94 primitives");
    expect(e.sections).toEqual({ major: [], minor: [], patch: [] });
  });

  it("keeps the whole section body as `notes`, without the version heading", () => {
    expect(entries[1].notes).toBe("### Patch Changes\n\n- Fix a typo");
  });

  it("returns [] for a file with no version headings", () => {
    expect(parseChangelog("# Changelog\n\nNothing yet.\n", "@shavin/cli")).toEqual([]);
  });
});

describe("collectReleases and notesFor", () => {
  const root = repo({
    "packages/ui/package.json": JSON.stringify({ name: "@shavin/ui", version: "0.1.1" }),
    "packages/ui/CHANGELOG.md": "# c\n\n## 0.1.1 — 2026-12-01\n\n### Patch Changes\n\n- A\n\n## 0.1.0\n\nFirst.\n",
    "packages/mcp-server/package.json": JSON.stringify({ name: "@shavin/mcp", version: "0.1.0" }),
    "packages/mcp-server/CHANGELOG.md": "# c\n\n## 0.1.0\n\nFirst.\n",
    "packages/cli/package.json": JSON.stringify({ name: "@shavin/cli", version: "0.1.0" }),
  });

  it("lists the packages found and sorts dated entries before undated ones", () => {
    const r = collectReleases(root);
    expect(r.packages.map((p: { name: string }) => p.name)).toEqual(["@shavin/ui", "@shavin/cli", "@shavin/mcp"]);
    expect(r.packages.find((p: { name: string }) => p.name === "@shavin/cli").latest).toBeNull();
    expect(r.releases.map((e: { package: string; version: string }) => `${e.package}@${e.version}`)).toEqual(["@shavin/ui@0.1.1", "@shavin/ui@0.1.0", "@shavin/mcp@0.1.0"]);
  });

  it("finds one entry by package and version, and null when absent", () => {
    expect(notesFor("@shavin/ui", "0.1.1", root).notes).toContain("- A");
    expect(notesFor("@shavin/ui", "9.9.9", root)).toBeNull();
  });

  it("accepts short package names, including mcp-server for @shavin/mcp", () => {
    expect(resolvePackage("ui", root)).toBe("@shavin/ui");
    expect(resolvePackage("mcp-server", root)).toBe("@shavin/mcp");
    expect(resolvePackage("@shavin/mcp", root)).toBe("@shavin/mcp");
    expect(resolvePackage("nope", root)).toBeNull();
  });

  it("CLI: prints a version's notes, and exits 1 with the recovery step when it is missing", () => {
    const run = (...a: string[]) => {
      try { return { code: 0, out: execFileSync("node", [join(ROOT, "scripts/release-notes.mjs"), ...a], { env: { ...process.env, RELEASE_NOTES_ROOT: root }, encoding: "utf8", stdio: "pipe" }) }; }
      catch (e) { const x = e as { status: number; stderr: string }; return { code: x.status, out: x.stderr }; }
    };
    expect(run("--package", "ui", "--version", "0.1.1")).toEqual({ code: 0, out: "### Patch Changes\n\n- A\n" });
    const miss = run("--package", "ui", "--version", "0.9.0");
    expect(miss.code).toBe(1);
    expect(miss.out).toMatch(/npm run version-packages/);
  });
});

describe("this repo's CHANGELOGs", () => {
  const { packages, releases } = collectReleases(ROOT);

  it("parse for every published package, with the latest entry equal to package.json's version", () => {
    // Five open packages; a checkout that also holds @shavin/fx (published to npm, source kept separately).
    expect(packages.length).toBe(existsSync(join(ROOT, "packages", "fx", "package.json")) ? 6 : 5);
    for (const p of packages) {
      expect(p.latest, `${p.name}: CHANGELOG.md has no entry for ${p.version}. Run npm run version-packages, or add the entry`).toBe(p.version);
    }
  });

  it("every entry has notes", () => {
    for (const r of releases) expect(r.notes.length, `${r.package}@${r.version}`).toBeGreaterThan(0);
  });
});
