import { describe, expect, it } from "vitest";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

// The published packages must not need the documentation website: its pages get redesigned and removed, and a
// link baked into an npm package then breaks for everyone who installed it. A message, warning or doc string
// says what it needs to say in place; it does not point at docs.shavin.cc. package.json "homepage" and the README
// "Docs" link are the normal npm convention: they may point at the docs ROOT (https://docs.shavin.cc) and nothing
// deeper, because deep pages move. The changelogs, which ship in the tarballs, may not link to the docs at all.
const ROOT = join(__dirname, "..", "..");
const DIRS = [
  "packages/ui/src",
  "packages/cli/src",
  "packages/mcp-server/src",
  "packages/block-schema/src",
  "packages/skills/skills",
  "packages/skills/commands",
  "packages/skills/agents",
];
const SKIP = new Set(["node_modules", "dist", ".next", ".turbo", "out", "generated"]);
const EXT = /\.(ts|tsx|mjs|js|md|json)$/;
const HOST = "docs.shavin.cc";

// Known remaining mentions. An entry whose file no longer mentions the host fails the second test, so this list
// can only shrink.
const ALLOWED: Record<string, string> = {
  "packages/skills/skills/visual-compositor/SKILL.md": "names docs.shavin.cc as an example of a documentation portal, not a link",
  "packages/skills/skills/visual-compositor/docs-mode.md": "names docs.shavin.cc as an example of a documentation portal, not a link",
};

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (SKIP.has(name)) continue;
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (EXT.test(name)) out.push(p);
  }
  return out;
}

const PACKAGES = ["ui", "cli", "mcp-server", "skills", "block-schema", "fx"];
const files = DIRS.flatMap((d) => walk(join(ROOT, d)));
const rel = (p: string) => relative(ROOT, p).split("\\").join("/");
const hits = files
  .map((f) => ({ file: rel(f), lines: readFileSync(f, "utf8").split("\n").flatMap((l, i) => (l.includes(HOST) ? [i + 1] : [])) }))
  .filter((h) => h.lines.length > 0);

describe("published packages do not depend on docs.shavin.cc", () => {
  it("scans a real amount of source", () => {
    expect(files.length).toBeGreaterThan(200);
  });

  it("has no docs.shavin.cc in messages, warnings or doc strings (outside the listed exceptions)", () => {
    const bad = hits.filter((h) => !(h.file in ALLOWED)).map((h) => `${h.file}:${h.lines.join(",")}`);
    expect(bad, `Say it in place instead of linking to ${HOST}. Found:\n${bad.join("\n")}`).toEqual([]);
  });

  it("lists no exception that has been fixed", () => {
    const stale = Object.keys(ALLOWED).filter((f) => existsSync(join(ROOT, f)) && !hits.some((h) => h.file === f));
    expect(stale, `Remove these from ALLOWED, they no longer mention ${HOST}: ${stale.join(", ")}`).toEqual([]);
  });

  it("keeps package.json homepage and README docs links on the docs root, and the changelogs link-free", () => {
    // A deep path is anything after the host other than a single trailing slash.
    const DEEP = /docs\.shavin\.cc\/[^\s"')\]]+/;
    const problems: string[] = [];
    for (const pkg of PACKAGES) {
      for (const name of ["package.json", "README.md"]) {
        const f = join(ROOT, "packages", pkg, name);
        if (!existsSync(f)) continue;
        readFileSync(f, "utf8").split("\n").forEach((line, i) => {
          if (DEEP.test(line)) problems.push(`packages/${pkg}/${name}:${i + 1} links to a deep docs page, use https://${HOST}`);
        });
      }
      const log = join(ROOT, "packages", pkg, "CHANGELOG.md");
      if (existsSync(log) && readFileSync(log, "utf8").includes(HOST)) problems.push(`packages/${pkg}/CHANGELOG.md mentions ${HOST}`);
    }
    expect(problems, problems.join("\n")).toEqual([]);
  });
});
