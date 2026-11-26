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
import { findConcentricIssues } from "./concentric-lint.mjs";
import { checkEnforcement, checkStates, isLegacyFile, legacyPaths } from "./enforce.mjs";

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
  [/storefront|online (store|shop)|web ?shop|\bshop\b|e-?commerce|boutique|merch/, "storefront"],
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
    "case-study": "editorial", "storefront": "marketing",
  };
  const key = byRecipe[recipe.key] || "hybrid";
  return cat.styles.get(key) || cat.styles.get("marketing");
}

function capTier(tier, ceiling) {
  return TIER_RANK[tier] > CEILING_RANK[ceiling] ? Object.keys(TIER_RANK)[CEILING_RANK[ceiling]] : tier;
}


// ── App recipes (dashboard, settings, auth, onboarding) ──────────────────
// Product screens are not marketing pages: they get a shell, screens and a required-states list.

const STATE_MAP = {
  "first-time": 'EmptyState kind="first-time" + one primary Button (never a blank table or chart)',
  empty: 'EmptyState kind="empty"; a filter/search with no match is kind="no-results" with "Clear filters"',
  loading: "Skeleton / SkeletonMimic shaped like the final content (no spinner-only screens); Button loading for actions",
  error: 'Callout color="danger" with the cause and a retry Button; keep entered data; FormErrorSummary + field errors on submit',
  success: 'useToast().success (ToastProvider inside ThemeProvider); EmptyState kind="success" for a finished flow',
  disabled: "Button disabledReason (reason in a Tooltip); FormField disabled with the reason in its hint",
};

const APP_RECIPES = [
  {
    key: "app-dashboard", name: "Dashboard / data table", re: /dashboard|admin|console|back[- ]?office|data ?tables?|data grid|inbox|analytics (app|screen)|crm|\btable\b/,
    shell: "AppFrame + Sidebar (SidebarNavItem groups, SidebarTrigger on compact) + TopBar (search, ThemeSwitcher, account); high-density mode",
    screens: [
      { screen: "Overview", composition: "ST6", note: "stat row (Card + Text, 3-4 real KPIs), one chart or table; no metric clutter", states: ["first-time", "loading", "error"] },
      { screen: "Data table", composition: "none", note: "Table + TableColumnHeaderCell sort, toolbar (TextField search, filter), row actions in a menu, pagination", states: ["first-time", "empty", "loading", "error", "disabled"] },
      { screen: "Detail / edit", composition: "none", note: "Tabs or side panel; destructive actions behind AlertDialog", states: ["loading", "error", "success", "disabled"] },
    ],
  },
  {
    key: "app-settings", name: "Settings (forms + danger zone)", re: /settings?|preferences|account page|profile page|billing page|\bsecurity page|team members/,
    shell: "AppFrame + Sidebar + TopBar; settings nav as Tabs or a nested SidebarSection",
    screens: [
      { screen: "Settings sections", composition: "ST6", note: "one Card per concern (Profile, Notifications via Switch, Billing); labelled fields; one Save Button per card", states: ["loading", "error", "success", "disabled"] },
      { screen: "Danger zone", composition: "none", note: 'last card, border-danger; delete/transfer/leave only via AlertDialog naming what is lost', states: ["disabled", "error", "success"] },
    ],
  },
  {
    key: "app-auth", name: "Auth (sign-in, sign-up, reset)", re: /sign[- ]?in|sign[- ]?up|log[- ]?in|login|register|reset (my )?password|forgot password|auth(entication)? (page|screen|flow)|\bauth\b|verify (email|code)|\botp\b/,
    shell: 'no AppFrame: one centred Card (max ~400px) on the page ground, brand mark above; <Section data-composition="none">',
    screens: [
      { screen: "Sign in", composition: "none", note: "TextField email + password, primary Button, forgot link, SSO Buttons last", states: ["error", "loading", "disabled"] },
      { screen: "Sign up", composition: "none", note: "same card; password rules shown before typing; terms as plain Text + Link", states: ["error", "loading", "disabled", "success"] },
      { screen: "Reset / verify", composition: "none", note: "request then confirm; never reveal whether the email exists", states: ["error", "success", "disabled"] },
    ],
  },
  {
    key: "app-onboarding", name: "Onboarding (multi-step)", re: /onboard|setup wizard|set-?up flow|getting started flow|wizard|multi-?step|welcome flow/,
    shell: "focused shell: TopBar with logo + Skip/Exit, Stepper for progress, one Card per step, Back/Continue Buttons pinned below",
    screens: [
      { screen: "Step flow", composition: "none", note: "3-5 steps, one decision each; Stepper shows current/total; progress is saved so a refresh resumes", states: ["first-time", "error", "loading", "disabled"] },
      { screen: "Done", composition: "none", note: "what was set up + one next action into the app", states: ["success"] },
    ],
  },
];

function pickAppRecipe(pageType, brief) {
  if (pageType) {
    const k = slug(pageType);
    const hit = APP_RECIPES.find((r) => r.key === k || r.key === `app-${k}`);
    if (hit) return { recipe: hit, why: `pageType "${pageType}"` };
  }
  const b = (brief || "").toLowerCase();
  if (/landing|marketing|home ?page|pricing|launch page|portfolio|case stud|blog|docs? (site|page)/.test(b)) return null; // a marketing page that mentions "sign up" is still a marketing page, with or without a pageType
  for (const r of APP_RECIPES) {
    const m = b.match(r.re);
    if (m) return { recipe: r, why: `brief mentions "${m[0]}"` };
  }
  return null;
}

function planAppPage(cat, { recipe, why }, page) {
  const known = (id) => (id === "none" || cat.compositions.has(id) ? id : "none");
  const sections = recipe.screens.map((s) => ({
    section: s.screen,
    composition: known(s.composition),
    treatment: "carded",
    motion: "tier0",
    reason: "TODO: the screen's one job",
    states: Object.fromEntries(s.states.map((st) => [st, "TODO: copy + component, see state map"])),
  }));
  const template = {
    page, recipe: recipe.key, kind: "app", style: "structural", shell: recipe.shell, sections,
    densityAndRadius: "TODO: from get_project_context (density, radius)",
  };
  const lines = [
    `# App plan: ${page} — ${recipe.name}`,
    `Recipe chosen by ${why}. This is a product screen, not a marketing page: shell first, then screens, then every state. Motion tier0 (static).`,
    `**Shell:** ${recipe.shell}`,
    "", "## Screens (REQUIRED STATES per screen)",
  ];
  recipe.screens.forEach((s, i) => lines.push(`${i + 1}. **${s.screen}** · ${s.composition === "none" ? 'data-composition="none"' : `${s.composition} ${cat.compositions.get(s.composition)?.name ?? ""}`} · ${s.note}`, `   states: ${s.states.join(", ")}`));
  lines.push("", "## State map (every required state must be designed, not just the happy path)");
  for (const [k, v] of Object.entries(STATE_MAP)) lines.push(`- ${k}: ${v}`);
  lines.push("- field error: TextField invalid + errorMessage (inline, next to the field); destructive: AlertDialog");
  lines.push("", "## Plan template: fill every TODO, then check_page({ plan })", "```json", JSON.stringify(template), "```", "",
    "Next: `get_skill({ name: \"shavin-app\" })`, `get_components` for AppFrame, Sidebar, TopBar and each primitive above; mark each screen `<Section data-composition=\"…\">`; `validate_code`; `check_page({ targetDir })`.");
  return { text: lines.join("\n"), template };
}

// Hero media default by audience. Software has no photo to show, so its default is a mesh or gradient backdrop (no external asset);
// product UI rebuilt from components is not a hero default. Shops, venues and causes open on a real photo.
const SOFTWARE_BRIEF = /\b(saas|software|app|platform|api|dashboard|developer|cli|sdk|tool)\b/;
const MOTION_BRIEF = /\b(film|trailer|cinema|music video|album|game|showreel)\b/;
const CONSUMER_BRIEF = /\b(shop|store|storefront|e-?commerce|boutique|merch|restaurant|caf[eé]|bakery|food|hotel|retreat|yoga|travel|wedding|venue|festival|fashion|jewel\w*|ceramics?|furniture|fitness|gym|salon|spa|nonprofit|charity|community|temple|school|clinic)\b/;
function heroMediaDefault(recipeKey, brief, pageType) {
  const b = (brief || "").toLowerCase();
  if (recipeKey === "storefront") return { media: "photo", why: "a shop opens on its goods" };
  if (SOFTWARE_BRIEF.test(b)) return { media: "mesh", why: "software has no photo to show: a mesh or gradient backdrop with the text on top needs no external asset" };
  if (MOTION_BRIEF.test(b)) return { media: "video", why: "the subject is moving image or sound" };
  if (CONSUMER_BRIEF.test(b)) return { media: "photo", why: "a consumer or place-based page opens better on a real photo than on a product panel" };
  // An explicit software page type is the signal when the brief names no software word ("a note-taking product").
  if (/^(saas|developer-tool)/.test(slug(String(pageType || "")))) return { media: "mesh", why: "software has no photo to show: a mesh or gradient backdrop with the text on top needs no external asset" };
  return null;
}

export function planPage(cat, { brief = "", pageType, style, page = "home" } = {}) {
  const app = pickAppRecipe(pageType, brief);
  if (app) return planAppPage(cat, app, page);
  const { recipe, why } = pickRecipe(cat, pageType, brief);
  const styleRow = pickStyle(cat, style, recipe);
  const heroDefault = heroMediaDefault(recipe.key, brief, pageType);

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
        ...(first?.family === "hero" ? { media: heroDefault ? heroDefault.media : "TODO: photo | video | mesh | product-ui | none" } : {}),
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
    overlineForm: "TODO: none | plain label | rule+label | numeral | icon+label | chip (none is the usual choice; a label only where it adds information)",
    interactiveControl: "TODO: button | tabs | segmented control | plain link — per content shape",
    typeVoice: "TODO: one family | two contrasting families | mono brand",
    colourApplication: "TODO: single brand | duotone | per-section rotation | monochrome+break | gradient ground",
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
  if (rows.some((r) => r.candidates[0]?.family === "hero")) {
    lines.push(
      "",
      "## Hero media (decide before writing code)",
      heroDefault
        ? `Default for this brief: **${heroDefault.media}** (${heroDefault.why}). Change it in the plan if the content says otherwise, and say why in \`reason\`.`
        : "No default matched: choose from the table by what the first screen can show.",
      "",
      "| media | Use when | Build with |",
      "|---|---|---|",
      "| photo | a real subject, place or product exists | `bgImage` behind a scrim; find it yourself on Unsplash or Lummi; no caption on the page |",
      "| video | motion carries the subject | `bgVideo` + `bgPoster`; Pexels |",
      "| mesh | no photo fits | `bgOverlays` mesh or gradient, with `surface=\"dark-always\"` or `\"light-always\"` |",
      "| product-ui | only when you are highly confident in the result (a first showcase section, rarely the hero) | real components (`Card`, `Table`, `StatCard`, `Badge`, `Tabs`), never an image of a UI; prefer photo, mesh or video |",
      "| none | the voice is the point | H5, headline 3 to 12 words |",
    );
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

const isAppPlan = (plan) => plan?.kind === "app" || /^app-/.test(String(plan?.recipe || ""));

function checkAppPlan(cat, plan, errors, warnings) {
  plan.sections.forEach((s, i) => {
    const where = `screen ${i + 1} (${s.section || s.composition})`;
    const id = String(s.composition || "").toUpperCase();
    if (String(s.composition).toLowerCase() !== "none" && !cat.compositions.has(id)) errors.push(`${where}: "${s.composition}" is not a composition in the catalogue. Pick an ID from the plan_page candidates (get_skill({ name: "layout-compositions", section: "<family>" }) lists them), or use "none" for utility screens`);
    const states = s.states && typeof s.states === "object" ? (Array.isArray(s.states) ? s.states : Object.keys(s.states)) : [];
    if (!states.length) warnings.push(`${where}: no states listed — design first-time, empty, loading, error, success and disabled where they apply`);
    else if (!states.some((k) => /error/i.test(k))) warnings.push(`${where}: no error state — add Callout color="danger" + retry`);
  });
  return { errors, warnings };
}

export function checkPlan(cat, plan) {
  const errors = [];
  const warnings = [];
  if (!plan || !Array.isArray(plan.sections) || plan.sections.length === 0) {
    return { errors: ["plan.sections is missing or empty"], warnings };
  }
  if (isAppPlan(plan)) return checkAppPlan(cat, plan, errors, warnings);
  const secs = plan.sections.map((s, i) => ({ ...s, i: i + 1, comp: cat.compositions.get(String(s.composition || "").toUpperCase()) }));

  for (const s of secs) {
    const where = `section ${s.i} (${s.section || s.composition})`;
    if (!s.comp) { errors.push(`${where}: "${s.composition}" is not a composition in the catalogue. Pick an ID from the plan_page candidates (get_skill({ name: "layout-compositions", section: "<family>" }) lists them), or use "none" for utility screens`); continue; }
    if (s.treatment && !TREATMENTS.includes(s.treatment)) errors.push(`${where}: treatment "${s.treatment}" is not one of ${TREATMENTS.join(", ")}`);
    else if (s.treatment && !s.comp.treatments.includes(s.treatment)) warnings.push(`${where}: ${s.comp.id} is not designed for the "${s.treatment}" treatment (supports ${s.comp.treatments.join(", ")})`);
    if (!s.motion || !(s.motion in TIER_RANK)) errors.push(`${where}: motion tier must be tier0, tier1 or tier2 (got "${s.motion ?? ""}"). Set motion to one of them in the plan`);
    else if (TIER_RANK[s.motion] > CEILING_RANK[s.comp.motion]) errors.push(`${where}: ${s.motion} exceeds ${s.comp.id}'s motion ceiling (${s.comp.motion}). Set motion to ${s.comp.motion === "choreography-ok" ? "tier2" : s.comp.motion} or lower, or pick a composition that allows it`);
    if (isTodo(s.reason)) warnings.push(`${where}: no reason given — name the content signal from the selection guide`);
    if (s.comp.family === "hero") {
      const m = String(s.media ?? "").trim().toLowerCase();
      if (s.comp.id !== "H5" && (!m || isTodo(m) || m === "none")) {
        warnings.push(`${where}: ${s.comp.id} has no hero media (set media to photo, video, mesh or product-ui). Use a real image, video, mesh or a product UI built from components, or switch to H5 (type-led) if the page has only words`);
      } else if (m === "photo" || m === "video") {
        warnings.push(`${where}: media is ${m}: find a real one yourself (Unsplash or Lummi${m === "video" ? ", Pexels" : ""}) and use it behind a scrim with bgImage/bgVideo. Show no caption or note about it on the page; if you cannot get one, mark the slot in a code comment only`);
      }
    }
  }

  const body = secs.filter((s) => s.comp && s.comp.family !== "structural");
  for (let i = 1; i < body.length; i++) {
    if (body[i].comp.id === body[i - 1].comp.id) warnings.push(`sections ${body[i - 1].i} and ${body[i].i}: the same composition (${body[i].comp.id}) twice in a row`);
    if (i >= 2 && body[i].comp.family === body[i - 1].comp.family && body[i].comp.family === body[i - 2].comp.family && body[i].comp.family !== "conversion") {
      warnings.push(`sections ${body[i - 2].i}–${body[i].i}: three ${body[i].comp.family} sections in a row (rhythm: adjacent sections should differ)`);
    }
    const pair = [body[i - 1].comp.id, body[i].comp.id];
    if (/^C\d/.test(pair[0]) && /^C\d/.test(pair[1])) warnings.push(`sections ${body[i - 1].i} and ${body[i].i}: two CTA banners in a row compete for the same action`);
    if (/^H\d/.test(pair[0]) && /^T[34]$/.test(pair[1]) && !body.some((b) => /^(S1|S2|T1|T2)$/.test(b.comp.id))) warnings.push(`section ${body[i].i}: a logo strip is the only proof on this page (distinctiveness §4): add a metric (S1) or a quote (T1)`);
    const t = [body[i - 1].treatment, body[i].treatment].sort().join("+");
    if (t === "carded+flat") warnings.push(`sections ${body[i - 1].i} and ${body[i].i}: carded next to flat reads as inconsistency (treatments §3)`);
  }
  // Treatments are a content-section decision; the page shell (nav, footer) doesn't count.
  const treatments = new Set(body.map((s) => s.treatment).filter(Boolean));
  if (treatments.size > 2) warnings.push(`${treatments.size} treatments across the content sections (${[...treatments].join(", ")}) — keep one dominant and at most one brand`);
  if (body.length >= 3 && body[0].comp.family !== "hero" && body[0].comp.family !== "expressive" && body[0].comp.family !== "documentation" && body[0].comp.family !== "editorial") {
    warnings.push(`the first body section is ${body[0].comp.id}, not a hero — every page should open strong`);
  }

  // Page-level shape checks, from the reference study (warnings only).
  const recipeKey = slug(String(plan.recipe || ""));
  if (/^(saas|developer-tool)/.test(recipeKey) && body.length >= 3) {
    const showsProduct = (b) => (b.comp.family === "hero" && b.media ? String(b.media).trim().toLowerCase() === "product-ui" : b.comp.media.includes("product-ui"));
    if (!body.slice(0, 3).some(showsProduct)) warnings.push("no product is visible in the first three sections: show it in the first showcase section, built from real components (keep the hero on a photo, mesh or video backdrop)");
  }
  if (/^saas/.test(recipeKey) && body.length >= 3 && !body.some((b) => /^T[12]$/.test(b.comp.id))) {
    warnings.push("note: no quote section is planned. Strong SaaS pages usually carry one mid-page: add T1 or T2 with placeholder quotes the user will replace, clearly fictional and not copied from any real site");
  }
  if (secs.length >= 3 && !/^ST[34]$/.test(secs[secs.length - 1].comp?.id || "")) {
    warnings.push("the page does not end with a footer (ST3 or ST4): every page should close with one");
  }

  const knobs = Array.isArray(plan.knobs) ? plan.knobs.filter((k) => !isTodo(k?.knob) && !isTodo(k?.change)) : [];
  if (knobs.length < 2) errors.push(`name at least two variation knobs with what changed (found ${knobs.length})`);
  for (const k of knobs) if (!KNOBS.includes(slug(k.knob))) warnings.push(`knob "${k.knob}" is not one of ${KNOBS.join(", ")}`);
  if (isTodo(plan.boldMoment)) errors.push("name the single bold moment (boldMoment)");
  for (const f of ["overlineForm", "interactiveControl", "typeVoice", "colourApplication"]) {
    if (isTodo(plan[f])) warnings.push(f === "overlineForm" ? `decide overlineForm (component-language §1): "none" is a valid answer` : `decide ${f} (component-language §5) — it gets defaulted if not named`);
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

// Layout fingerprint of a section's source: eyebrow, heading alignment, grid columns. Three grid sections in a row
// that share one render as the same page three times (the paired eval's F1, F7, P1), even though their IDs differ.
function sectionFingerprint(body) {
  const grid = body.match(/<Grid\b[^>]*\bcolumns=\{?["']?(\w+)/) || body.match(/grid-cols-(\d+)/);
  if (!grid && !/<Grid\b|\bgrid\b/.test(body)) return null; // no grid: not part of a run
  const eyebrow = /uppercase|tracking-(wide|wider|widest)|overline/.test(body) ? "eyebrow" : "no eyebrow";
  const head = body.match(/<Heading\b([^>]*)>/);
  const align = head && /align=["']center["']|text-center/.test(head[1]) ? "centred heading" : "left heading";
  return `${align}, ${eyebrow}, ${grid ? (/^\d+$/.test(grid[1]) ? `${grid[1]}-column` : grid[1]) : "custom"} grid`;
}

// Advisory only: a label (overline, eyebrow) above the heading on most sections of one page reads as a template.
// The label is neither required nor banned; this only says when it has stopped carrying information.
const LABEL_SIGNAL = /size=["']overline["']|\b(?:overline|eyebrow|kicker)=|data-slot=["']overline["']|uppercase[^"'\n]*tracking-(?:wide|wider|widest|\[)|tracking-(?:wide|wider|widest|\[)[^"'\n]*uppercase/;
export const LABEL_OVERUSE_SHARE = 0.35;
export const LABEL_OVERUSE_MIN = 2;

export function labelOveruseLimit(sections) {
  return Math.max(LABEL_OVERUSE_MIN, Math.ceil(LABEL_OVERUSE_SHARE * sections));
}

/** Counts the catalogue sections in one file's source that open with a label before their first heading. */
export function countLabelledSections(cat, src) {
  const opens = [...src.matchAll(/<Section\b([^>]*)>/g)];
  let sections = 0;
  const labelled = [];
  opens.forEach((m, i) => {
    const id = (m[1].match(/data-composition=["']([^"']+)["']/) || [])[1]?.toUpperCase();
    const comp = id ? cat.compositions.get(id) : null;
    if (!comp || comp.family === "structural" || comp.family === "documentation") return;
    sections++;
    const body = src.slice(m.index, i + 1 < opens.length ? opens[i + 1].index : src.length);
    const head = body.search(/<Heading\b/);
    if (LABEL_SIGNAL.test(head < 0 ? body : body.slice(0, head))) labelled.push(src.slice(0, m.index).split("\n").length);
  });
  return { sections, labelled };
}

// Pages are usually split across component files, so the project-wide share is the useful number.
function findProjectLabelOveruse(totals) {
  if (totals.labelled.length <= labelOveruseLimit(totals.sections)) return [];
  const at = totals.labelled.slice(0, 6).join(", ") + (totals.labelled.length > 6 ? ", ..." : "");
  return [`${totals.labelled.length} of ${totals.sections} sections across the project open with a label above the heading (${at}). Advisory: use a label only where it adds information, at most one per page region; none is the usual choice.`];
}

// Advisory only: body sections wider than `lg` (xl never caps at a 1280px viewport, so content sits near the screen edges).
// The nav, footer and any container that carries its own background media are exempt.
export const WIDE_CONTAINER_SHARE = 0.35;
export const WIDE_CONTAINER_MIN = 2;

export function wideContainerLimit(containers) {
  return Math.max(WIDE_CONTAINER_MIN, Math.ceil(WIDE_CONTAINER_SHARE * containers));
}

/** In one file's source: the catalogue body sections that open a <Container>, and those whose size is xl or full. */
export function countWideContainers(cat, src) {
  const opens = [...src.matchAll(/<Section\b([^>]*)>/g)];
  let containers = 0;
  const wide = [];
  opens.forEach((m, i) => {
    const id = (m[1].match(/data-composition=["']([^"']+)["']/) || [])[1]?.toUpperCase();
    const comp = id ? cat.compositions.get(id) : null;
    if (!comp || comp.family === "structural" || comp.family === "documentation") return;
    const body = src.slice(m.index, i + 1 < opens.length ? opens[i + 1].index : src.length);
    const c = body.match(/<Container\b([^>]*)>/);
    if (!c) return;
    containers++;
    if (/\bbg(?:Image|Video|Overlays)\b/.test(c[1])) return; // media backdrop: allowed to bleed
    if (/size=["'](?:xl|full)["']/.test(c[1])) wide.push(src.slice(0, m.index).split("\n").length);
  });
  return { containers, wide };
}

function findProjectWideContainers(totals) {
  if (totals.wide.length <= wideContainerLimit(totals.containers)) return [];
  const at = totals.wide.slice(0, 6).join(", ") + (totals.wide.length > 6 ? ", ..." : "");
  return [`${totals.wide.length} of ${totals.containers} body sections across the project use Container size xl or full (${at}). Advisory: body sections use size="lg" (72rem) so all content shares one centred column with margins at 1280 and 1440; keep xl for the nav and footer and full for media.`];
}

function findRepeatedLayouts(cat, src, rel) {
  const opens = [...src.matchAll(/<Section\b([^>]*)>/g)];
  const rows = opens.map((m, i) => {
    const id = (m[1].match(/data-composition=["']([^"']+)["']/) || [])[1]?.toUpperCase();
    const comp = id ? cat.compositions.get(id) : null;
    const counted = comp && comp.family !== "structural" && comp.family !== "documentation";
    const body = src.slice(m.index, i + 1 < opens.length ? opens[i + 1].index : src.length);
    return { id, fp: counted ? sectionFingerprint(body) : null, line: src.slice(0, m.index).split("\n").length };
  });
  const out = [];
  for (let i = 0; i < rows.length;) {
    let j = i;
    while (rows[i].fp && j + 1 < rows.length && rows[j + 1].fp === rows[i].fp) j++;
    if (rows[i].fp && j - i >= 2) {
      out.push(`${rel}:${rows[i].line}–${rows[j].line}: ${rows.slice(i, j + 1).map((r) => r.id).join(", ")} share one layout in a row (${rows[i].fp}). Change one of heading alignment, eyebrow, column count or media in the middle section, or merge two of them. Repetition is what separates solid pages from top ones (distinctiveness §3)`);
    }
    i = j + 1;
  }
  return out;
}

export function checkCode(cat, targetDir, plans = []) {
  const errors = [];
  const warnings = [];
  const used = new Map(); // id -> [file:line]
  const notFromCatalogue = [];
  const labelTotals = { sections: 0, labelled: [] };
  const wideTotals = { containers: 0, wide: [] };
  for (const file of walkSources(targetDir)) {
    const src = readFileSync(file, "utf8");
    const rel = relative(targetDir, file).split("\\").join("/"); // forward slashes on every platform
    for (const w of findViewportShellPatterns(src)) warnings.push(`${rel}:${w.line}: ${w.message}`);
    for (const c of findConcentricIssues(src)) warnings.push(`${rel}:${c.line}: ${c.message}`);
    warnings.push(...findRepeatedLayouts(cat, src, rel));
    const lc = countLabelledSections(cat, src);
    labelTotals.sections += lc.sections;
    labelTotals.labelled.push(...lc.labelled.map((n) => `${rel}:${n}`));
    const wc = countWideContainers(cat, src);
    wideTotals.containers += wc.containers;
    wideTotals.wide.push(...wc.wide.map((n) => `${rel}:${n}`));
    const re = /<Section\b([^>]*)>/g;
    let m;
    while ((m = re.exec(src))) {
      const line = src.slice(0, m.index).split("\n").length;
      const attr = m[1].match(/data-composition=["']([^"']+)["']/);
      if (!attr && /data-composition=\{/.test(m[1])) { warnings.push(`${rel}:${line}: data-composition is an expression — use a literal ID so it can be checked`); continue; }
      if (!attr) { errors.push(`${rel}:${line}: <Section> has no data-composition="<ID>" — every section must name its composition (or "none" for a utility screen such as auth or 404)`); continue; }
      if (attr[1] === "none") { if (!UTILITY_SCREEN.test(rel) && !plans.some((p) => p.plan && isAppPlan(p.plan))) notFromCatalogue.push(`${rel}:${line}`); continue; }
      const id = attr[1].toUpperCase();
      if (!cat.compositions.has(id)) { errors.push(`${rel}:${line}: data-composition="${attr[1]}" is not a composition in the catalogue. Pick an ID from the plan_page candidates (get_skill({ name: "layout-compositions", section: "<family>" }) lists them), or use "none" for utility screens`); continue; }
      if (!used.has(id)) used.set(id, []);
      used.get(id).push(`${rel}:${line}`);
      // A hero that opens on the flat page colour has no first-screen media. H5 is type-led on purpose.
      if (cat.compositions.get(id)?.family === "hero" && id !== "H5" && !/\bbg(?:Image|Video|Overlays)\b/.test(m[1])) {
        warnings.push(`${rel}:${line}: hero ${id} has no bgImage, bgVideo or bgOverlays, so it opens on the flat page background. Give it a photo, video or mesh backdrop behind the text (surface="dark-always" or "light-always"), or use H5 if the page is type-led`);
      }
    }
    // Section wrappers (a site's own PageSection, PageHero, CtaSection …) that pass the id on:
    // a literal data-composition="ID" or composition="ID" on any other component counts too.
    const wrap = /<([A-Z][\w.]*)\b([^>]*?)\s(?:data-composition|composition)=["']([^"']+)["']/g;
    while ((m = wrap.exec(src))) {
      if (m[1] === "Section" || m[3] === "none") continue;
      const line = src.slice(0, m.index).split("\n").length;
      const id = m[3].toUpperCase();
      if (!cat.compositions.has(id)) { errors.push(`${rel}:${line}: composition "${m[3]}" on <${m[1]}> is not a composition in the catalogue. Pick an ID from the plan_page candidates (get_skill({ name: "layout-compositions", section: "<family>" }) lists them), or use "none" for utility screens`); continue; }
      if (!used.has(id)) used.set(id, []);
      used.get(id).push(`${rel}:${line}`);
    }
  }
  warnings.push(...findProjectLabelOveruse(labelTotals));
  warnings.push(...findProjectWideContainers(wideTotals));
  if (notFromCatalogue.length) warnings.push(`${notFromCatalogue.length} section(s) marked data-composition="none" (not from the catalogue): ${notFromCatalogue.join(", ")} — "none" is only accepted on utility screens (auth, 404, error); marketing sections need a catalogue composition`);
  if (plans.length) {
    const planned = new Set(plans.flatMap((p) => (p.plan.sections || []).map((s) => String(s.composition).toUpperCase())));
    for (const [id, at] of used) if (!planned.has(id)) warnings.push(`${id} is used in code (${at[0]}) but no plan in .shavin/plans/ includes it. Add the section to its plan, or change the composition`);
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
      if (!p.plan) { report.errors.push(`${p.file}: not valid JSON (${p.error}). Fix the JSON, or re-run plan_page and save the template again`); continue; }
      add(`${p.file}: `, checkPlan(cat, p.plan));
    }
    if (!plans.length) report.warnings.push(`no plans in ${join(targetDir, ".shavin/plans")} — run plan_page and save each page's plan there`);
    const code = checkCode(cat, dir, plans.filter((p) => p.plan));
    add("code: ", code);
    report.summary.push(`${plans.length} plan(s), ${[...code.used.values()].flat().length} annotated <Section>s using ${code.used.size} compositions`);
    // Hard rules and required states, on new and changed code (files under SHAVIN.md Legacy paths are skipped).
    const legacy = legacyPaths(dir);
    const files = walkSources(dir)
      .map((f) => ({ file: relative(dir, f).replace(/\\/g, "/"), src: readFileSync(f, "utf8") }))
      .filter((f) => !isLegacyFile(f.file, legacy));
    const hard = files.flatMap((f) => checkEnforcement(f.src).filter((x) => x.severity === "error").map((x) => `${f.file}:${x.line}: ${x.message} (${x.rule}). ${x.fix}`));
    for (const h of hard.slice(0, 20)) report.errors.push(`rules: ${h}`);
    if (hard.length > 20) report.errors.push(`rules: ... and ${hard.length - 20} more (run audit_source)`);
    const st = checkStates(files);
    report.errors.push(...st.errors.map((e) => `states: ${e}`));
    report.warnings.push(...st.warnings.map((w) => `states: ${w}`));
    report.summary.push(`${hard.length} hard-rule error(s), ${st.errors.length} missing state(s)`);
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
          "CALL FIRST, before writing any page or section JSX. Turns a brief into a plan template to fill: marketing/docs pages get composition candidates per section; apps (dashboard, settings, auth, onboarding) get a shell, screens and required states. Then call check_page.",
        inputSchema: {
          type: "object",
          properties: {
            brief: { type: "string", description: "What the page is for, who reads it and what real content exists (copy, counts, visuals)." },
            page: { type: "string", description: "Page slug for the plan file (e.g. 'home', 'pricing'). Default 'home'." },
            pageType: { type: "string", description: "Optional recipe: app-dashboard, app-settings, app-auth, app-onboarding (product screens), saas-product-launch, developer-tool, documentation-site, editorial-magazine, portfolio-studio, pricing-and-conversion, case-study, hybrid. Inferred from the brief if omitted." },
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
