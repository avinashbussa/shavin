import { mkdtempSync, mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { checkCode, loadCatalogueFromDir } from "../../packages/mcp-server/src/tools/compose.mjs";

const cat = loadCatalogueFromDir(join(__dirname, "../../packages/skills/skills/layout-compositions"));

function project(src: string) {
  const dir = mkdtempSync(join(tmpdir(), "shavin-check-"));
  mkdirSync(join(dir, "app"));
  writeFileSync(join(dir, "app/page.tsx"), src);
  return dir;
}

describe("check_page: section wrappers", () => {
  it("counts a literal composition passed to a wrapper component", () => {
    const dir = project(`export default () => (<>
  <PageHero composition="H1" title="x" />
  <PageSection data-composition="F7" variant="canvas">x</PageSection>
  <CtaSection
    composition="C1"
    title="y"
  />
</>);`);
    const plan = { page: "x", sections: [{ composition: "H1" }, { composition: "F7" }, { composition: "C1" }] };
    const r = checkCode(cat, dir, [{ file: "x.json", plan }]);
    expect(r.errors).toEqual([]);
    expect([...r.used.keys()].sort()).toEqual(["C1", "F7", "H1"]);
    expect(r.warnings.filter((w: string) => /planned but/.test(w))).toEqual([]);
  });

  it("rejects an unknown id on a wrapper", () => {
    const r = checkCode(cat, project(`export default () => <PageSection composition="Z9">x</PageSection>;`), []);
    expect(r.errors.join("\n")).toMatch(/"Z9" on <PageSection> is not a composition/);
  });
});
