import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, describe, expect, it } from "vitest";
// @ts-expect-error — plain ESM module without types
import { checkPage, checkPlan, loadCatalogueFromDir, planPage } from "../../packages/mcp-server/src/tools/compose.mjs";
// @ts-expect-error — plain ESM module without types
import { compressToDense } from "../../packages/mcp-server/src/tools/skills.mjs";
// @ts-expect-error — plain ESM module without types
import { withNextStep } from "../../packages/mcp-server/src/next-steps.mjs";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const cat = loadCatalogueFromDir(resolve(ROOT, "packages/skills/skills/layout-compositions"));

const goodPlan = () => ({
  page: "home",
  sections: [
    { section: "Navigation", composition: "ST1", treatment: "carded", motion: "tier0", reason: "multi-page site" },
    { section: "Hero", composition: "H2", treatment: "carded", motion: "tier1", reason: "copy runs past two lines, product UI exists" },
    { section: "Proof", composition: "S1", treatment: "open", motion: "tier1", reason: "three real KPIs" },
    { section: "How it works", composition: "F3", treatment: "carded", motion: "tier1", reason: "three steps with big visuals" },
    { section: "Close", composition: "C1", treatment: "carded", motion: "tier1", reason: "one closing action" },
    { section: "Footer", composition: "ST3", treatment: "ruled", motion: "tier0", reason: "three link groups" },
  ],
  knobs: [
    { knob: "alignment", change: "left-aligned hero instead of centred" },
    { knob: "media-mode", change: "product UI built from components, no photos" },
  ],
  overlineForm: "plain label",
  interactiveControl: "segmented control for billing",
  typeVoice: "two contrasting families",
  colourApplication: "single accent",
  boldMoment: "the digest preview in the hero",
  samenessTest: "the digest preview only fits this product",
});

describe("layout-compositions catalogue", () => {
  it("parses every composition, recipe and style from the skill files", () => {
    expect(cat.compositions.size).toBeGreaterThanOrEqual(50);
    expect(cat.compositions.get("H2")).toMatchObject({ family: "hero", motion: "tier1" });
    expect(cat.recipes.has("saas-product-launch")).toBe(true);
    expect(cat.styles.get("documentation")).toMatchObject({ treatment: "ruled", motion: "tier0" });
  });

  it("every recipe references only real compositions", () => {
    for (const r of cat.recipes.values()) for (const row of r.rows) for (const id of row.ids) expect(cat.compositions.has(id), `${r.key}: ${id}`).toBe(true);
  });
});

describe("plan_page", () => {
  it("picks a recipe from the brief and returns a fillable template", () => {
    const { text, template } = planPage(cat, { brief: "pricing page for our plans", page: "pricing" });
    expect(text).toContain("Pricing and conversion");
    expect(text).toContain("check_page");
    expect(template.sections.map((s: { composition: string }) => s.composition)).toContain("P1");
    expect(template.boldMoment).toMatch(/TODO/);
  });

  it("caps motion at each composition's ceiling", () => {
    const { template } = planPage(cat, { brief: "SaaS launch" });
    for (const s of template.sections) {
      const ceiling = cat.compositions.get(s.composition).motion;
      if (ceiling === "tier0") expect(s.motion).toBe("tier0");
    }
  });
});

describe("check_page", () => {
  it("passes a complete plan", () => {
    expect(checkPlan(cat, goodPlan()).errors).toEqual([]);
  });

  it("blocks unknown IDs, motion above the ceiling and missing decisions", () => {
    const p = goodPlan();
    p.sections[1].motion = "tier2";
    p.sections.push({ section: "x", composition: "Z9", treatment: "carded", motion: "tier1", reason: "x" });
    p.knobs = [];
    p.boldMoment = "TODO";
    const { errors } = checkPlan(cat, p);
    expect(errors.join("\n")).toMatch(/exceeds H2's motion ceiling/);
    expect(errors.join("\n")).toMatch(/"Z9" is not a composition/);
    expect(errors.join("\n")).toMatch(/two variation knobs/);
    expect(errors.join("\n")).toMatch(/bold moment/);
  });

  it("warns about rhythm and templated-page tells", () => {
    const p = goodPlan();
    p.sections.splice(2, 1, { section: "Logos", composition: "T3", treatment: "carded", motion: "tier0", reason: "logos" });
    p.sections.splice(3, 0, { section: "More", composition: "F3", treatment: "carded", motion: "tier1", reason: "y" });
    const { warnings } = checkPlan(cat, p);
    expect(warnings.join("\n")).toMatch(/logo strip directly under the hero/);
    expect(warnings.join("\n")).toMatch(/same composition \(F3\) twice/);
  });

  const dir = mkdtempSync(join(tmpdir(), "check-page-"));
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  it("requires data-composition on every <Section> and matches code to the plan", () => {
    mkdirSync(join(dir, ".shavin/plans"), { recursive: true });
    mkdirSync(join(dir, "src"), { recursive: true });
    writeFileSync(join(dir, ".shavin/plans/home.json"), JSON.stringify(goodPlan()));
    writeFileSync(join(dir, "src/hero.tsx"), '<Section data-composition="H2" size="hero">x</Section>');
    writeFileSync(join(dir, "src/bare.tsx"), '<Section size="body">x</Section>');
    writeFileSync(join(dir, "src/auth.tsx"), '<Section data-composition="none">x</Section>');
    writeFileSync(join(dir, "src/features.tsx"), '<Section data-composition="none">x</Section>');
    const r = checkPage(cat, { targetDir: dir });
    expect(r.errors.join("\n")).toMatch(/bare\.tsx:1: <Section> has no data-composition/);
    expect(r.warnings.join("\n")).toMatch(/S1 is planned but no <Section data-composition="S1">/);
    expect(r.warnings.join("\n")).toMatch(/1 section\(s\) marked data-composition="none".*features\.tsx/);
    expect(r.warnings.join("\n")).not.toMatch(/auth\.tsx:1.*marked|marked.*auth\.tsx/);
  });
});

describe("agent routing", () => {
  it("dense skill output keeps lines that point to the next skill or tool", () => {
    const md = [
      "# Skill",
      "> **Layout compositions:** Now a standalone skill — use `get_skill({ name: \"layout-compositions\" })`.",
      "> 💡 **MCP:** Call `get_skill({ name: \"layout-motion\" })` for motion.",
      "> 💡 **No-MCP:** Read files from `references/` directly.",
      "Each composition has metadata. Use `/compose-page` to plan and build.",
      "Plain narrative paragraph with nothing in it.",
    ].join("\n");
    const dense = compressToDense(md);
    expect(dense).toContain('get_skill({ name: "layout-compositions" })');
    expect(dense).toContain("layout-motion");
    expect(dense).toContain("/compose-page");
    expect(dense).not.toContain("No-MCP");
    expect(dense).not.toContain("Plain narrative");
  });

  it("tool results carry a Next: pointer", () => {
    const r = withNextStep("get_project_context", {}, { content: [{ type: "text", text: "profile" }] });
    expect(r.content.at(-1).text).toMatch(/Next: .*plan_page/);
    const v = withNextStep("validate_code", {}, { content: [{ type: "text", text: "## ✅ Code is 100% Token Pure and Clean!" }] });
    expect(v.content.at(-1).text).toMatch(/check_page/);
    const none = withNextStep("get_live_audit", {}, { content: [{ type: "text", text: "x" }] });
    expect(none.content).toHaveLength(1);
  });
});
