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
    { section: "Hero", composition: "H2", treatment: "carded", motion: "tier1", media: "product-ui", reason: "copy runs past two lines, product UI exists" },
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
  colourApplication: "single brand",
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

  it("routes a shop brief to the storefront recipe, not SaaS", () => {
    const { template, text } = planPage(cat, { brief: "online shop for handmade ceramics" });
    expect(text).toContain("Storefront");
    expect(template.sections.map((s: { composition: string }) => s.composition)).toContain("G6");
  });

  describe("hero media default", () => {
    const heroMedia = (brief: string) => planPage(cat, { brief }).template.sections.find((s: { composition: string }) => s.composition.startsWith("H"))?.media;
    it("defaults a consumer or place-based brief to a photo and says so in the plan", () => {
      expect(heroMedia("landing page for a yoga retreat in Rishikesh")).toBe("photo");
      expect(planPage(cat, { brief: "landing page for a yoga retreat in Rishikesh" }).text).toContain("Default for this brief: **photo**");
    });
    it("defaults a software brief to a mesh backdrop, not a rebuilt product UI", () => {
      expect(heroMedia("landing page for a developer CLI")).toBe("mesh");
      expect(planPage(cat, { brief: "landing page for a note-taking app" }).text).toContain("Default for this brief: **mesh**");
    });
    it("defaults the SaaS and developer-tool recipes to mesh even when the brief names no software word", () => {
      const { text } = planPage(cat, { brief: "Marketing landing page for Mosaic, a note-taking product for small design teams", pageType: "saas-product-launch", style: "marketing" });
      expect(text).toContain("Default for this brief: **mesh**");
    });
    it("a marketing brief that mentions sign up is planned as a page, not as the auth screens", () => {
      const { text } = planPage(cat, { brief: "Landing page for Mosaic, a note-taking app. One job: get visitors to sign up.", pageType: "saas-product-launch" });
      expect(text).toMatch(/Page plan/);
      expect(text).not.toMatch(/App plan/);
    });
    it("keeps the TODO and the options table when no signal matches", () => {
      const { template, text } = planPage(cat, { brief: "landing page for our new thing" });
      expect(template.sections.find((s: { composition: string }) => s.composition.startsWith("H"))?.media).toMatch(/TODO/);
      expect(text).toContain("No default matched");
      expect(text).toContain("| photo |");
    });
  });

  it("the storefront recipe offers G6 for the products row", () => {
    const { template } = planPage(cat, { brief: "online shop for handmade ceramics" });
    const ids = template.sections.map((s: { composition: string }) => s.composition);
    expect(ids).toContain("G6");
    expect(cat.compositions.get("G6")).toMatchObject({ family: "gallery", job: "desire" });
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

  it("warns when a hero has no media, and reminds about real photos", () => {
    const p = goodPlan();
    delete (p.sections[1] as { media?: string }).media;
    expect(checkPlan(cat, p).warnings.join("\n")).toMatch(/H2 has no hero media/);
    (p.sections[1] as { media?: string }).media = "none";
    expect(checkPlan(cat, p).warnings.join("\n")).toMatch(/H2 has no hero media/);
    (p.sections[1] as { media?: string }).media = "photo";
    const w = checkPlan(cat, p).warnings.join("\n");
    expect(w).toMatch(/find a real one yourself/);
    expect(w).toMatch(/no caption or note/);
    (p.sections[1] as { media?: string }).media = "product-ui";
    expect(checkPlan(cat, p).warnings.join("\n")).not.toMatch(/hero media|find a real one/);
  });

  it("does not ask a type-led hero (H5) for media", () => {
    const p = goodPlan();
    p.sections[1] = { section: "Hero", composition: "H5", treatment: "open", motion: "tier1", reason: "only words" } as typeof p.sections[1];
    expect(checkPlan(cat, p).warnings.join("\n")).not.toMatch(/hero media/);
  });

  it("plan_page puts a media field on the hero row when no default matches", () => {
    const out = JSON.stringify(planPage(cat, { brief: "landing page for our new thing" }));
    expect(out).toMatch(/photo \| video \| mesh \| product-ui \| none/);
  });

  it("warns about rhythm and templated-page tells", () => {
    const p = goodPlan();
    p.sections.splice(2, 1, { section: "Logos", composition: "T3", treatment: "carded", motion: "tier0", reason: "logos" });
    p.sections.splice(3, 0, { section: "More", composition: "F3", treatment: "carded", motion: "tier1", reason: "y" });
    const { warnings } = checkPlan(cat, p);
    expect(warnings.join("\n")).toMatch(/logo strip is the only proof/);
    expect(warnings.join("\n")).toMatch(/same composition \(F3\) twice/);
  });

  it("does not flag a logo strip under the hero when the page has other proof", () => {
    const p = goodPlan();
    p.sections.splice(2, 0, { section: "Logos", composition: "T3", treatment: "carded", motion: "tier0", reason: "logos" });
    // goodPlan already has S1 (metrics): the logo strip is not the only proof
    expect(checkPlan(cat, p).warnings.join("\n")).not.toMatch(/logo strip is the only proof/);
    p.sections.splice(3, 1); // drop S1
    p.sections.push({ section: "Voice", composition: "T1", treatment: "open", motion: "tier1", reason: "one quote" });
    expect(checkPlan(cat, p).warnings.join("\n")).not.toMatch(/logo strip is the only proof/);
  });

  describe("page-level shape checks", () => {
    const saas = () => ({ ...goodPlan(), recipe: "saas-product-launch" });
    const w = (p: object) => checkPlan(cat, p as never).warnings.join("\n");

    it("passes a SaaS plan that shows the product, has a quote and ends with a footer", () => {
      const p = saas();
      p.sections.splice(4, 0, { section: "Voice", composition: "T1", treatment: "open", motion: "tier1", reason: "one quote" });
      const out = w(p);
      expect(out).not.toMatch(/no product is visible/);
      expect(out).not.toMatch(/no quote section/);
      expect(out).not.toMatch(/does not end with a footer/);
    });
    it("warns when no product is visible in the first three sections (S2)", () => {
      const p = saas();
      (p.sections[1] as { media?: string }).media = "photo";
      p.sections[2] = { section: "Logos", composition: "T3", treatment: "carded", motion: "tier0", reason: "logos" } as typeof p.sections[2];
      p.sections[3] = { section: "Plans", composition: "P1", treatment: "carded", motion: "tier0", reason: "plans" } as typeof p.sections[3];
      expect(w(p)).toMatch(/no product is visible in the first three sections/);
    });
    it("does not ask a non-SaaS recipe for a product (S2)", () => {
      const p = { ...saas(), recipe: "portfolio-studio-expressive" };
      (p.sections[1] as { media?: string }).media = "photo";
      expect(w(p)).not.toMatch(/no product is visible/);
    });
    it("notes a missing quote section as info and allows placeholders (S4)", () => {
      const out = w(saas());
      expect(out).toMatch(/note: no quote section is planned/);
      expect(out).toMatch(/placeholder quotes/);
    });
    it("warns when the last section is not a footer (S14)", () => {
      const p = saas();
      p.sections.pop();
      expect(w(p)).toMatch(/does not end with a footer/);
    });
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

describe("check_page repeated layouts", () => {
  const sec = (id: string, extra = "") => `<Section data-composition="${id}"><Heading>t</Heading><Grid columns="auto">${extra}</Grid></Section>`;
  const run = (src: string) => {
    const d = mkdtempSync(join(tmpdir(), "repeat-"));
    mkdirSync(join(d, "src"), { recursive: true });
    writeFileSync(join(d, "src/page.tsx"), src);
    const w = checkPage(cat, { targetDir: d }).warnings.join("\n");
    rmSync(d, { recursive: true, force: true });
    return w;
  };
  it("flags three grid sections in a row that share one layout", () => {
    expect(run([sec("F1"), sec("F7"), sec("P1")].join("\n"))).toMatch(/F1, F7, P1 share one layout in a row \(left heading, no eyebrow, auto grid\)/);
  });
  it("does not flag two, or three where one differs", () => {
    expect(run([sec("F1"), sec("F7")].join("\n"))).not.toMatch(/share one layout/);
    const centred = sec("F7").replace("<Heading>", '<Heading align="center">');
    expect(run([sec("F1"), centred, sec("P1")].join("\n"))).not.toMatch(/share one layout/);
  });
  it("a section without a grid breaks the run, and structural and documentation sections are not counted", () => {
    const flat = '<Section data-composition="Q2"><Heading>t</Heading></Section>';
    expect(run([sec("F1"), sec("F7"), flat, sec("P1")].join("\n"))).not.toMatch(/share one layout/);
    expect(run([sec("ST3"), sec("ST3"), sec("ST3")].join("\n"))).not.toMatch(/share one layout/);
    expect(run([sec("D1"), sec("D1"), sec("D1")].join("\n"))).not.toMatch(/share one layout/);
  });
});

describe("check_page hero backdrop", () => {
  const run = (src: string) => {
    const d = mkdtempSync(join(tmpdir(), "herobg-"));
    mkdirSync(join(d, "src"), { recursive: true });
    writeFileSync(join(d, "src/page.tsx"), src);
    const w = checkPage(cat, { targetDir: d }).warnings.join("\n");
    rmSync(d, { recursive: true, force: true });
    return w;
  };
  it("warns when a hero has no bgImage, bgVideo or bgOverlays", () => {
    expect(run('<Section data-composition="H2" size="hero"><Heading>t</Heading></Section>')).toMatch(/hero H2 has no bgImage, bgVideo or bgOverlays/);
  });
  it("accepts a hero with a backdrop, and the type-led H5", () => {
    expect(run('<Section data-composition="H1" bgOverlays="mesh-aurora" surface="dark-always"><Heading>t</Heading></Section>')).not.toMatch(/has no bgImage/);
    expect(run('<Section data-composition="H3" bgImage="/a.jpg"><Heading>t</Heading></Section>')).not.toMatch(/has no bgImage/);
    expect(run('<Section data-composition="H5"><Heading>t</Heading></Section>')).not.toMatch(/has no bgImage/);
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

describe("plan_page app recipes", () => {
  const cases: Array<[string, string]> = [
    ["a dashboard with a data table of orders", "app-dashboard"],
    ["workspace settings page with a danger zone", "app-settings"],
    ["sign in, sign up and reset password screens", "app-auth"],
    ["onboarding flow for new users", "app-onboarding"],
  ];
  it.each(cases)("detects %s", (brief, key) => {
    const { text, template } = planPage(cat, { brief });
    expect(template.recipe).toBe(key);
    expect(template.kind).toBe("app");
    expect(text).toContain("REQUIRED STATES");
    expect(text).toContain("Skeleton");
    expect(Buffer.byteLength(text)).toBeLessThan(4096);
  });
  it("leaves marketing briefs alone", () => {
    expect(planPage(cat, { brief: "SaaS landing page for a dashboard product" }).template.recipe).toBe("saas-product-launch");
    expect(planPage(cat, { brief: "pricing page" }).template.recipe).toBe("pricing-and-conversion");
  });
  it("check_page accepts app plans and warns, not errors, on missing states", () => {
    const { template } = planPage(cat, { brief: "dashboard" });
    const ok = checkPage(cat, { plan: template });
    expect(ok.errors).toEqual([]);
    template.sections[0].states = {};
    const r = checkPage(cat, { plan: template });
    expect(r.errors).toEqual([]);
    expect(r.warnings.join("\n")).toMatch(/no states listed/);
  });
});

describe("check_page wide containers (advisory)", () => {
  const sec = (id: string, attrs: string) => `<Section data-composition="${id}"><Container ${attrs}><Heading>t</Heading></Container></Section>`;
  const run = (src: string) => {
    const d = mkdtempSync(join(tmpdir(), "wide-"));
    mkdirSync(join(d, "src"), { recursive: true });
    writeFileSync(join(d, "src/page.tsx"), src);
    const r = checkPage(cat, { targetDir: d });
    rmSync(d, { recursive: true, force: true });
    return r;
  };
  const ids = ["H2", "F1", "F3", "S1", "T2", "P1"];
  it("warns, never errors, when most body sections use xl", () => {
    const r = run(ids.map((id) => sec(id, 'size="xl"')).join("\n"));
    expect(r.warnings.join("\n")).toMatch(/6 of 6 body sections across the project use Container size xl or full/);
    expect(r.errors.join("\n")).not.toMatch(/Container/);
  });
  it("accepts lg pages, a few wide sections and the limit itself", () => {
    expect(run(ids.map((id) => sec(id, 'size="lg"')).join("\n")).warnings.join("\n")).not.toMatch(/size xl or full/);
    expect(run(ids.map((id, i) => sec(id, i < 3 ? 'size="xl"' : 'size="lg"')).join("\n")).warnings.join("\n")).not.toMatch(/size xl or full/); // 3 of 6: limit is max(2, ceil(35%)) = 3
    expect(run(ids.map((id, i) => sec(id, i < 4 ? 'size="xl"' : 'size="lg"')).join("\n")).warnings.join("\n")).toMatch(/4 of 6/);
  });
  it("exempts media backdrops, structural sections and containers with no size", () => {
    expect(run(ids.map((id) => sec(id, 'size="full" bgImage="/a.jpg"')).join("\n")).warnings.join("\n")).not.toMatch(/size xl or full/);
    const nav = '<Section data-composition="ST1"><Container size="xl"><Heading>t</Heading></Container></Section>';
    expect(run([nav, nav, nav, nav, sec("H2", 'size="lg"')].join("\n")).warnings.join("\n")).not.toMatch(/size xl or full/);
    expect(run(ids.map((id) => sec(id, "")).join("\n")).warnings.join("\n")).not.toMatch(/size xl or full/);
  });
});

describe("check_page label overuse (advisory)", () => {
  const sec = (id: string, labelled: boolean, extra = "") =>
    `<Section data-composition="${id}">${labelled ? '<Text size="overline">Label</Text>' : ""}<Heading>t</Heading>${extra}</Section>`;
  const run = (src: string) => {
    const d = mkdtempSync(join(tmpdir(), "label-"));
    mkdirSync(join(d, "src"), { recursive: true });
    writeFileSync(join(d, "src/page.tsx"), src);
    const r = checkPage(cat, { targetDir: d });
    rmSync(d, { recursive: true, force: true });
    return r;
  };
  const ids = ["H2", "F1", "F3", "S1", "T2", "P1"];
  it("warns, never errors, when most sections open with a label", () => {
    const r = run(ids.map((id, i) => sec(id, i < 5)).join("\n"));
    expect(r.warnings.join("\n")).toMatch(/5 of 6 sections across the project open with a label above the heading/);
    expect(r.errors.join("\n")).not.toMatch(/label/);
  });
  it("accepts a few labels, none, and the limit itself", () => {
    expect(run(ids.map((id, i) => sec(id, i < 2)).join("\n")).warnings.join("\n")).not.toMatch(/open with a label/);
    expect(run(ids.map((id) => sec(id, false)).join("\n")).warnings.join("\n")).not.toMatch(/open with a label/);
    expect(run(ids.map((id, i) => sec(id, i < 3)).join("\n")).warnings.join("\n")).not.toMatch(/open with a label/); // 3 of 6: limit is max(2, ceil(35%)) = 3
  });
  it("small pages: two of three is fine, all three is flagged", () => {
    expect(run([sec("H2", true), sec("F1", true), sec("P1", false)].join("\n")).warnings.join("\n")).not.toMatch(/open with a label/);
    expect(run([sec("H2", true), sec("F1", true), sec("P1", true)].join("\n")).warnings.join("\n")).toMatch(/3 of 3 sections/);
  });
  it("a label after the heading does not count, and structural sections are not counted", () => {
    const after = (id: string) => `<Section data-composition="${id}"><Heading>t</Heading><Text size="overline">x</Text></Section>`;
    expect(run(ids.map(after).join("\n")).warnings.join("\n")).not.toMatch(/open with a label/);
    const nav = `<Section data-composition="ST1"><Text size="overline">Product</Text><Heading>t</Heading></Section>`;
    expect(run([nav, nav, nav, nav, sec("H2", false)].join("\n")).warnings.join("\n")).not.toMatch(/open with a label/);
  });
  it("sees a label passed as an overline prop and an uppercase tracked class", () => {
    const prop = (id: string) => `<Section data-composition="${id}"><SectionHeading overline="x" title="t" /><Heading>t</Heading></Section>`;
    const cls = (id: string) => `<Section data-composition="${id}"><span className="text-xs uppercase tracking-wider">x</span><Heading>t</Heading></Section>`;
    expect(run(ids.map(prop).join("\n")).warnings.join("\n")).toMatch(/6 of 6 sections/);
    expect(run(ids.map(cls).join("\n")).warnings.join("\n")).toMatch(/6 of 6 sections/);
  });
});

describe("plan_page overline form is optional", () => {
  it("offers none first and says it is the usual choice", () => {
    const { template } = planPage(cat, { brief: "A landing page for a note-taking app" });
    expect(template.overlineForm).toMatch(/^TODO: none \| plain label.*none is the usual choice/);
  });
  it("an unnamed overlineForm warns that none is a valid answer, and a named one does not warn", () => {
    const p = goodPlan();
    p.overlineForm = "TODO";
    expect(checkPlan(cat, p).warnings.join("\n")).toMatch(/overlineForm \(component-language §1\): "none" is a valid answer/);
    p.overlineForm = "none";
    expect(checkPlan(cat, p).warnings.join("\n")).not.toMatch(/overlineForm/);
  });
});
