/**
 * compose — the design-planning half of the Shavin MCP.
 *
 *   plan_page   brief → recipe → section-by-section composition candidates,
 *               treatment and motion defaults, and a plan template the agent
 *               must fill BEFORE writing JSX.
 *   check_page  checks a filled plan (composition IDs, treatments, motion tier
 *               ceilings, rhythm, distinctiveness decisions) and, given a
 *               targetDir, checks the code against it: every <Section> carries
 *               data-composition="<ID>" and the IDs match the plan.
 *
 * Everything is derived from the layout-compositions skill files at runtime
 * (references/compositions/*.md, page-recipes.md, selection-guide.md), so the
 * catalogue and the checks can never drift apart.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, resolve } from "node:path";
import { findViewportShellPatterns } from "./responsive-lint.mjs";

const ID_RE = /\b(?:ST|[HFSTCPQGEDX])\d{1,2}\b/g;
const TREATMENTS = ["carded", "ruled", "flat", "full-bleed", "open"];
const STYLES = ["marketing", "editorial", "documentation", "structural", "hybrid", "expressive"];
// tier0 < tier1 < tier2. A composition's `motion` metadata is its ceiling.
const TIER_RANK = { tier0: 0, tier1: 1, tier2: 2 };
const CEILING_RANK = { tier0: 0, tier1: 1, "choreography-ok": 2 };
const KNOBS = [
  "alignment", "scale-contrast", "grid-strictness", "container-language", "density", "media-mode",
  "rhythm", "sequence", "voice-of-type", "overline-form", "interactive-control", "colour-application",
];

// ── Catalogue (parsed once per skill set) ────────────────────────────────

const cache = new WeakMap();

function parseYamlish(block) {
  const out = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([a-z][\w-]*):\s*(.*)$/i);
    if (!m) continue;
    const [, key, raw] = m;
    const v = raw.trim();
    out[key] = v.startsWith("[") ? v.replace(/^\[|\]$/g, "").split(",").map((s) => s.trim()).filter(Boolean) : v;
  }
  return out;
}

function labelled(text, label) {
  const m = text.match(new RegExp(`\\*\\*${label}:\\*\\*\\s*([^\\n]+)`));
  return m ? m[1].trim() : "";
}

function slug(s) {
  return s.toLowerCase().replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function loadCatalogue(SKILLS) {
  const skill = SKILLS?.["layout-compositions"];
  if (!skill) return null;
  if (cache.has(skill)) return cache.get(skill);

  const files = skill.subFiles || {};
  const compositions = new Map();
  for (const [key, body] of Object.entries(files)) {
    if (!key.startsWith("references/compositions/")) continue;
    for (const chunk of body.split(/\n(?=### )/)) {
      const head = chunk.match(/^### ([A-Z]{1,2}\d{1,2}) · (.+)$/m);
      const yaml = chunk.match(/```yaml\n([\s\S]*?)```/);
      if (!head || !yaml) continue;
      const meta = parseYamlish(yaml[1]);
      compositions.set(head[1], {
        id: head[1],
        name: meta.name || head[2].trim(),
        family: meta.family,
        job: meta.job,
        density: meta.density,
        styles: meta.styles || [],
        treatments: meta.treatments || [],
        media: meta.media || [],
        items: meta.items,
        slots: meta.slots || [],
        motion: meta.motion || "tier0",
        bestFor: labelled(chunk, "Best for"),
        avoidWhen: labelled(chunk, "Avoid when"),
        contract: labelled(chunk, "Contract"),
      });
    }
  }

  // Page recipes: "## <Name>" + a "| # | Section | Composition | Notes |" table.
  const recipes = new Map();
  const recipeText = files["page-recipes"] || files["references/page-recipes"] || "";
  for (const chunk of recipeText.split(/\n(?=## )/)) {
    const head = chunk.match(/^## (.+)$/m);
    if (!head) continue;
    const rows = [];
    for (const line of chunk.split("\n")) {
      const cells = line.split("|").slice(1, -1).map((c) => c.trim());
      if (cells.length < 4 || !/^\d+$/.test(cells[0])) continue;
      const ids = cells[2].match(ID_RE) || [];
      if (!ids.length) continue;
      const alternatives = / or /i.test(cells[2]);
      rows.push({ section: cells[1], compositionText: cells[2], ids, alternatives, notes: cells[3] });
    }
    if (rows.length) {
      recipes.set(slug(head[1]), {
        key: slug(head[1]),
        name: head[1].trim(),
        arc: labelled(chunk, "Arc"),
        rhythm: labelled(chunk, "Rhythm"),
        rows,
      });
    }
  }

  // Style routing: | Style | Default families | Default treatment | Default motion tier |
  const styles = new Map();
  const guide = files["selection-guide"] || files["references/selection-guide"] || "";
  const routing = guide.split(/\n(?=## )/).find((c) => /^## \d+\. Style routing/m.test(c)) || "";
  for (const line of routing.split("\n")) {
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 4 || cells[0] === "Style" || /^-+$/.test(cells[0])) continue;
    const key = cells[0].split(/\s|\(/)[0].toLowerCase();
    if (!STYLES.includes(key)) continue;
    // The first treatment the row mentions is the default ("open or ruled" → open).
    const lower = cells[2].toLowerCase();
    const treatment = TREATMENTS.filter((t) => lower.includes(t)).sort((a, b) => lower.indexOf(a) - lower.indexOf(b))[0] || "carded";
    const tier = /tier 2|choreography/i.test(cells[3]) && !/then choreography/i.test(cells[3]) ? "tier2" : /tier 1/i.test(cells[3]) ? "tier1" : "tier0";
    styles.set(key, { style: key, families: cells[1], treatment, treatmentText: cells[2], motion: tier, motionText: cells[3] });
  }

  const cat = { compositions, recipes, styles };
  cache.set(skill, cat);
  return cat;
}

/** Load the catalogue straight from a layout-compositions folder (scripts, tests). */
export function loadCatalogueFromDir(skillDir) {
  const subFiles = {};
  const walk = (d) => {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) walk(p);
      else if (f.endsWith(".md")) {
        const body = readFileSync(p, "utf8");
        subFiles[relative(skillDir, p).split("\\").join("/").replace(/\.md$/, "").toLowerCase()] = body;
        subFiles[f.replace(/\.md$/, "").toLowerCase()] = body;
      }
    }
  };
  walk(skillDir);
  return loadCatalogue({ "layout-compositions": { subFiles } });
}

// ── plan_page ────────────────────────────────────────────────────────────

const RECIPE_HINTS = [
  [/pricing|plans? page|checkout/, "pricing-and-conversion"],
  [/case stud/, "case-study"],
  [/docs?|documentation|api reference|handbook|guide/, "documentation-site"],
  [/developer|open[- ]source|cli\b|sdk|library|npm/, "developer-tool-open-source"],
  [/magazine|editorial|blog|publication|essay|newsletter/, "editorial-magazine"],
  [/portfolio|studio|agency|awwwards|creative/, "portfolio-studio"],
  [/hybrid|product \+ docs/, "hybrid"],
  [/saas|launch|landing|marketing|home ?page|startup|product/, "saas-product-launch"],
];

function pickRecipe(cat, pageType, brief) {
  if (pageType) {
    const k = slug(pageType);
    const hit = [...cat.recipes.values()].find((r) => r.key === k || r.key.startsWith(k) || r.key.includes(k));
    if (hit) return { recipe: hit, why: `pageType "${pageType}"` };
  }
  const b = (brief || "").toLowerCase();
  for (const [re, key] of RECIPE_HINTS) {
    const hit = cat.recipes.get(key);
    if (hit && re.test(b)) return { recipe: hit, why: `brief mentions "${b.match(re)[0]}"` };
  }
  const fallback = cat.recipes.get("saas-product-launch") || [...cat.recipes.values()][0];
  return { recipe: fallback, why: "default (no page type recognised in the brief)" };
}

function pickStyle(cat, style, recipe) {
  if (style && cat.styles.has(style)) return cat.styles.get(style);
  const byRecipe = {
    "saas-product-launch": "marketing", "developer-tool-open-source": "marketing", "pricing-and-conversion": "marketing",
    "documentation-site": "documentation", "editorial-magazine": "editorial", "portfolio-studio": "expressive",
    "case-study": "editorial",
  };
  const key = byRecipe[recipe.key] || "hybrid";
  return cat.styles.get(key) || cat.styles.get("marketing");
}

function capTier(tier, ceiling) {
  return TIER_RANK[tier] > CEILING_RANK[ceiling] ? Object.keys(TIER_RANK)[CEILING_RANK[ceiling]] : tier;
}

export function planPage(cat, { brief = "", pageType, style, page = "home" } = {}) {
  const { recipe, why } = pickRecipe(cat, pageType, brief);
  const styleRow = pickStyle(cat, style, recipe);

  const rows = recipe.rows.map((row, i) => {
    const candidates = row.ids.map((id) => cat.compositions.get(id)).filter(Boolean);
    const first = candidates[0];
    const treatment = first && first.treatments.includes(styleRow.treatment) ? styleRow.treatment : first?.treatments[0] || styleRow.treatment;
    return {
      n: i + 1,
      section: row.section,
      pick: row.alternatives ? "one of" : "all of",
      candidates,
      notes: row.notes,
      template: {
        section: row.section,
        composition: first?.id ?? "TODO",
        treatment,
        motion: first ? capTier(styleRow.motion, first.motion) : "tier0",
        reason: "TODO: which content signal from the selection guide picked this composition",
      },
    };
  });

  const template = {
    page,
    recipe: recipe.key,
    style: styleRow.style,
    sections: rows.flatMap((r) => (r.pick === "all of" && r.candidates.length > 1
      ? r.candidates.map((c) => ({ ...r.template, composition: c.id, motion: capTier(styleRow.motion, c.motion) }))
      : [r.template])),
    knobs: [
      { knob: "TODO (one of: " + KNOBS.join(", ") + ")", change: "TODO: what changes from the recipe default and why" },
      { knob: "TODO", change: "TODO" },
    ],
    overlineForm: "TODO: chip | plain label | rule+label | numeral | icon+label | none",
    interactiveControl: "TODO: button | tabs | segmented control | plain link — per content shape",
    typeVoice: "TODO: one family | two contrasting families | mono accent",
    colourApplication: "TODO: single accent | duotone | per-section rotation | monochrome+break | gradient ground",
    boldMoment: "TODO: the one memorable moment (hero, oversized statement, broken grid or one orchestrated reveal)",
    samenessTest: "TODO: swap the brand for a competitor's; what still makes this page specific to this product?",
  };

  const lines = [];
  lines.push(`# Page plan: ${page} — ${recipe.name}`);
  lines.push(`Recipe chosen by ${why}. Style: **${styleRow.style}** → default treatment **${styleRow.treatment}** (${styleRow.treatmentText}), default motion **${styleRow.motion}** (${styleRow.motionText}).`);
  if (recipe.arc) lines.push(`**Arc:** ${recipe.arc}`);
  if (recipe.rhythm) lines.push(`**Rhythm:** ${recipe.rhythm}`);
  lines.push("", "## Sections (pick by content signal, then check each Avoid when)", "");
  for (const r of rows) {
    lines.push(`### ${r.n}. ${r.section} — ${r.pick} ${r.candidates.map((c) => c.id).join(" / ")}${r.notes ? ` · ${r.notes}` : ""}`);
    for (const c of r.candidates) {
      lines.push(`- **${c.id} ${c.name}** · job ${c.job} · density ${c.density} · media ${c.media.join("/")} · treatments ${c.treatments.join("/")} · motion ceiling ${c.motion}`);
      if (c.bestFor) lines.push(`  - Best for: ${c.bestFor}`);
      if (c.avoidWhen) lines.push(`  - Avoid when: ${c.avoidWhen}`);
      if (c.contract) lines.push(`  - Contract: ${c.contract}`);
    }
  }
  lines.push(
    "",
    "## Decisions the plan must name (layout-compositions distinctiveness §5)",
    "- At least two variation knobs, each with what changed and why.",
    "- Overline form, interactive control, type voice and colour application (component-language §5).",
    "- One bold moment. Everything around it stays quiet.",
    "- The sameness test: swap the brand; if the page still fits, revise the plan, not the code.",
    "",
    "## Plan template — fill every TODO, then call check_page({ plan })",
    "```json",
    JSON.stringify(template, null, 2),
    "```",
    "",
    "## Next",
    `1. Fill the template from the real content. Save it as \`.shavin/plans/${page}.json\` in the project.`,
    "2. `check_page({ plan })` — fix every error before writing code.",
    "3. Per section: `get_skill({ name: \"layout-compositions\", section: \"<family>\" })` (hero, features, proof, conversion, …) for the grid and watch-outs, and `get_components({ name })` for each primitive.",
    "4. Build each section as `<Section data-composition=\"<ID>\">`. For tier1 motion: `get_skill({ name: \"layout-motion\" })`; tier2 only after the static page is done: `get_skill({ name: \"layout-choreography\" })`.",
    "5. `validate_code` on each file, then `check_page({ targetDir })` to confirm the code matches the plan.",
  );
  return { text: lines.join("\n"), template };
}

// ── check_page ───────────────────────────────────────────────────────────

const isTodo = (v) => v == null || (typeof v === "string" && (v.trim() === "" || /\bTODO\b/.test(v)));

export function checkPlan(cat, plan) {
  const errors = [];
  const warnings = [];
  if (!plan || !Array.isArray(plan.sections) || plan.sections.length === 0) {
    return { errors: ["plan.sections is missing or empty"], warnings };
  }
  const secs = plan.sections.map((s, i) => ({ ...s, i: i + 1, comp: cat.compositions.get(String(s.composition || "").toUpperCase()) }));

  for (const s of secs) {
    const where = `section ${s.i} (${s.section || s.composition})`;
    if (!s.comp) { errors.push(`${where}: "${s.composition}" is not a composition in the catalogue`); continue; }
    if (s.treatment && !TREATMENTS.includes(s.treatment)) errors.push(`${where}: treatment "${s.treatment}" is not one of ${TREATMENTS.join(", ")}`);
    else if (s.treatment && !s.comp.treatments.includes(s.treatment)) warnings.push(`${where}: ${s.comp.id} is not designed for the "${s.treatment}" treatment (supports ${s.comp.treatments.join(", ")})`);
    if (!s.motion || !(s.motion in TIER_RANK)) errors.push(`${where}: motion tier must be tier0, tier1 or tier2 (got "${s.motion ?? ""}")`);
    else if (TIER_RANK[s.motion] > CEILING_RANK[s.comp.motion]) errors.push(`${where}: ${s.motion} exceeds ${s.comp.id}'s motion ceiling (${s.comp.motion})`);
    if (isTodo(s.reason)) warnings.push(`${where}: no reason given — name the content signal from the selection guide`);
  }

  const body = secs.filter((s) => s.comp && s.comp.family !== "structural");
  for (let i = 1; i < body.length; i++) {
    if (body[i].comp.id === body[i - 1].comp.id) warnings.push(`sections ${body[i - 1].i} and ${body[i].i}: the same composition (${body[i].comp.id}) twice in a row`);
    if (i >= 2 && body[i].comp.family === body[i - 1].comp.family && body[i].comp.family === body[i - 2].comp.family && body[i].comp.family !== "conversion") {
      warnings.push(`sections ${body[i - 2].i}–${body[i].i}: three ${body[i].comp.family} sections in a row (rhythm: adjacent sections should differ)`);
    }
    const pair = [body[i - 1].comp.id, body[i].comp.id];
    if (/^C\d/.test(pair[0]) && /^C\d/.test(pair[1])) warnings.push(`sections ${body[i - 1].i} and ${body[i].i}: two CTA banners in a row compete for the same action`);
    if (/^H\d/.test(pair[0]) && /^T[34]$/.test(pair[1])) warnings.push(`section ${body[i].i}: a logo strip directly under the hero is a templated-page tell (distinctiveness §4) — move it or swap for S1`);
    const t = [body[i - 1].treatment, body[i].treatment].sort().join("+");
    if (t === "carded+flat") warnings.push(`sections ${body[i - 1].i} and ${body[i].i}: carded next to flat reads as inconsistency (treatments §3)`);
  }
  // Treatments are a content-section decision; the page shell (nav, footer) doesn't count.
  const treatments = new Set(body.map((s) => s.treatment).filter(Boolean));
  if (treatments.size > 2) warnings.push(`${treatments.size} treatments across the content sections (${[...treatments].join(", ")}) — keep one dominant and at most one accent`);
  if (body.length >= 3 && body[0].comp.family !== "hero" && body[0].comp.family !== "expressive" && body[0].comp.family !== "documentation" && body[0].comp.family !== "editorial") {
    warnings.push(`the first body section is ${body[0].comp.id}, not a hero — every page should open strong`);
  }

  const knobs = Array.isArray(plan.knobs) ? plan.knobs.filter((k) => !isTodo(k?.knob) && !isTodo(k?.change)) : [];
  if (knobs.length < 2) errors.push(`name at least two variation knobs with what changed (found ${knobs.length})`);
  for (const k of knobs) if (!KNOBS.includes(slug(k.knob))) warnings.push(`knob "${k.knob}" is not one of ${KNOBS.join(", ")}`);
  if (isTodo(plan.boldMoment)) errors.push("name the single bold moment (boldMoment)");
  for (const f of ["overlineForm", "interactiveControl", "typeVoice", "colourApplication"]) {
    if (isTodo(plan[f])) warnings.push(`decide ${f} (component-language §5) — it gets defaulted if not named`);
  }
  if (isTodo(plan.samenessTest)) warnings.push("answer the sameness test (samenessTest)");
  return { errors, warnings };
}

function walkSources(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", ".next", "dist", "out", ".agents", ".git"].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) walkSources(p, out);
    else if (/\.(tsx|jsx)$/.test(e.name)) out.push(p);
  }
  return out;
}

// Utility screens (auth, 404, errors) legitimately have no catalogue composition.
const UTILITY_SCREEN = /(^|[\\/._-])(not-?found|404|500|error|auth|sign-?in|sign-?up|log-?in|register|forgot|reset|verify|onboarding|cart|checkout|order|confirmation|success)([\\/._-]|$)/i;

export function checkCode(cat, targetDir, plans = []) {
  const errors = [];
  const warnings = [];
  const used = new Map(); // id -> [file:line]
  const notFromCatalogue = [];
  for (const file of walkSources(targetDir)) {
    const src = readFileSync(file, "utf8");
    const rel = relative(targetDir, file);
    for (const w of findViewportShellPatterns(src)) warnings.push(`${rel}:${w.line}: ${w.message}`);
    const re = /<Section\b([^>]*)>/g;
    let m;
    while ((m = re.exec(src))) {
      const line = src.slice(0, m.index).split("\n").length;
      const attr = m[1].match(/data-composition=["']([^"']+)["']/);
      if (!attr && /data-composition=\{/.test(m[1])) { warnings.push(`${rel}:${line}: data-composition is an expression — use a literal ID so it can be checked`); continue; }
      if (!attr) { errors.push(`${rel}:${line}: <Section> has no data-composition="<ID>" — every section must name its composition (or "none" for a utility screen such as auth or 404)`); continue; }
      if (attr[1] === "none") { if (!UTILITY_SCREEN.test(rel)) notFromCatalogue.push(`${rel}:${line}`); continue; }
      const id = attr[1].toUpperCase();
      if (!cat.compositions.has(id)) { errors.push(`${rel}:${line}: data-composition="${attr[1]}" is not a composition in the catalogue`); continue; }
      if (!used.has(id)) used.set(id, []);
      used.get(id).push(`${rel}:${line}`);
    }
  }
  if (notFromCatalogue.length) warnings.push(`${notFromCatalogue.length} section(s) marked data-composition="none" (not from the catalogue): ${notFromCatalogue.join(", ")} — "none" is only accepted on utility screens (auth, 404, error); marketing sections need a catalogue composition`);
  if (plans.length) {
    const planned = new Set(plans.flatMap((p) => (p.plan.sections || []).map((s) => String(s.composition).toUpperCase())));
    for (const [id, at] of used) if (!planned.has(id)) warnings.push(`${id} is used in code (${at[0]}) but no plan in .shavin/plans/ includes it`);
    for (const id of planned) if (cat.compositions.has(id) && cat.compositions.get(id).family !== "structural" && !used.has(id)) warnings.push(`${id} is planned but no <Section data-composition="${id}"> exists`);
  }
  return { errors, warnings, used };
}

function loadPlans(targetDir) {
  const dir = join(targetDir, ".shavin", "plans");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => {
    try { return { file: `.shavin/plans/${f}`, plan: JSON.parse(readFileSync(join(dir, f), "utf8")) }; }
    catch (e) { return { file: `.shavin/plans/${f}`, plan: null, error: e.message }; }
  });
}

export function checkPage(cat, { plan, targetDir } = {}) {
  const report = { errors: [], warnings: [], summary: [] };
  const add = (prefix, r) => {
    report.errors.push(...r.errors.map((e) => `${prefix}${e}`));
    report.warnings.push(...r.warnings.map((w) => `${prefix}${w}`));
  };
  if (plan) {
    add("plan: ", checkPlan(cat, typeof plan === "string" ? JSON.parse(plan) : plan));
    report.summary.push("checked the plan you passed");
  }
  if (targetDir) {
    const dir = resolve(targetDir);
    const plans = loadPlans(dir);
    for (const p of plans) {
      if (!p.plan) { report.errors.push(`${p.file}: not valid JSON (${p.error})`); continue; }
      add(`${p.file}: `, checkPlan(cat, p.plan));
    }
    if (!plans.length) report.warnings.push(`no plans in ${join(targetDir, ".shavin/plans")} — run plan_page and save each page's plan there`);
    const code = checkCode(cat, dir, plans.filter((p) => p.plan));
    add("code: ", code);
    report.summary.push(`${plans.length} plan(s), ${[...code.used.values()].flat().length} annotated <Section>s using ${code.used.size} compositions`);
  }
  if (!plan && !targetDir) report.errors.push("pass plan (the filled plan_page template) and/or targetDir (a project folder)");
  return report;
}

// ── MCP registration ─────────────────────────────────────────────────────

export function registerComposeTools(server, SKILLS) {
  const cat = () => {
    const c = loadCatalogue(SKILLS);
    if (!c || !c.compositions.size) throw new Error("layout-compositions skill not found — install @shavin/skills or run inside the Shavin repo");
    return c;
  };
  return [
    {
      schema: {
        name: "plan_page",
        description:
          "CALL FIRST, before writing any page or section JSX. Turns a brief into a section-by-section plan from the Shavin layout-compositions catalogue: the page recipe, composition candidates per section (with Best for / Avoid when / Contract), the default treatment and motion tier for the style, and a JSON plan template to fill. Then call check_page.",
        inputSchema: {
          type: "object",
          properties: {
            brief: { type: "string", description: "What the page is for, who reads it and what real content exists (copy, counts, visuals)." },
            page: { type: "string", description: "Page slug for the plan file (e.g. 'home', 'pricing'). Default 'home'." },
            pageType: { type: "string", description: "Optional recipe: saas-product-launch, developer-tool, documentation-site, editorial-magazine, portfolio-studio, pricing-and-conversion, case-study, hybrid. Inferred from the brief if omitted." },
            style: { type: "string", enum: STYLES, description: "Optional style routing override. Inferred from the recipe if omitted." },
          },
          required: ["brief"],
        },
      },
      handler: async (args) => {
        const { text } = planPage(cat(), args || {});
        return { content: [{ type: "text", text }] };
      },
    },
    {
      schema: {
        name: "check_page",
        description:
          "CALL after filling the plan_page template and again after building. Checks the plan (composition IDs, treatment fit, motion-tier ceilings, rhythm, named knobs and bold moment) and, with targetDir, checks the code: every <Section> must carry data-composition=\"<ID>\" and match the plans in .shavin/plans/. Errors block; warnings are design judgement calls.",
        inputSchema: {
          type: "object",
          properties: {
            plan: { type: "object", description: "The filled plan_page template (JSON object)." },
            targetDir: { type: "string", description: "Project folder: checks .shavin/plans/*.json and every <Section> in its .tsx/.jsx files." },
          },
        },
      },
      handler: async (args) => {
        const r = checkPage(cat(), args || {});
        const status = r.errors.length ? `FAIL — ${r.errors.length} error(s), ${r.warnings.length} warning(s)` : `PASS — 0 errors, ${r.warnings.length} warning(s)`;
        const text = [
          `## check_page: ${status}`,
          ...r.summary.map((s) => `- ${s}`),
          ...(r.errors.length ? ["", "### Errors", ...r.errors.map((e) => `- ${e}`)] : []),
          ...(r.warnings.length ? ["", "### Warnings", ...r.warnings.map((w) => `- ${w}`)] : []),
        ].join("\n");
        return { content: [{ type: "text", text }], isError: r.errors.length > 0 };
      },
    },
  ];
}
