/**
 * next-steps — a short "what to call next" footer appended to tool results.
 *
 * Server `instructions` and long tool descriptions don't reach every agent
 * (some hosts and bridges drop them, some load tool schemas lazily). Tool
 * results always arrive, so the workflow is carried there too:
 *
 *   inspect_environment → plan_page → check_page(plan) → get_skill(family) +
 *   get_components → write <Section data-composition> → validate_code →
 *   check_page(targetDir)
 */
const text = (result) => (result?.content || []).map((c) => c.text || "").join("\n");

const PLAN_FIRST = 'Before writing a page or section, call `plan_page({ brief })` and fill its plan; app screens: `get_skill({ name: "shavin-app" })`.';

export const NEXT_STEPS = {
  get_project_context: () => PLAN_FIRST,
  get_setup_instructions: () => "Then `inspect_environment({ targetDir })`. " + PLAN_FIRST,
  inspect_environment: (r) => (/Compliance Score:\*\* \*\*100%/.test(text(r))
    ? PLAN_FIRST
    : "Fix the failing checks (`npx @shavin/cli init` repairs most), re-run `inspect_environment`, then `plan_page({ brief })`."),
  list_skills: () => PLAN_FIRST + " Then fetch only the sections you need with `get_skill({ name, section })`.",
  get_skill: (r, a) => {
    const n = String(a?.name || "").toLowerCase();
    if (n === "layout-compositions") return 'Use `plan_page({ brief })` to pick compositions per section, then `get_skill({ name: "layout-compositions", section: "<family>" })` for each family you build (hero, features, proof, conversion, …).';
    if (n === "layout-motion" || n === "layout-choreography") return "Motion goes on after the static layout passes `check_page`. Keep each section's tier within its composition's motion ceiling.";
    if (["shavin-webpage", "visual-compositor", "shavin-ui-builder"].includes(n)) return PLAN_FIRST;
    return null;
  },
  get_components: () => "Building a page section? Its layout comes from `plan_page` / `get_skill({ name: \"layout-compositions\", section: \"<family>\" })`. Mark it `<Section data-composition=\"<ID>\">`, then run `validate_code`.",
  get_block_template: () => 'Wrap the block in `<Section data-composition="<ID>">` with the composition from your plan, then run `validate_code` and `check_page({ targetDir })`.',
  synthesize_layout: () => 'Give each section `data-composition="<ID>"`, then run `validate_code` and `check_page({ targetDir })`.',
  check_page: (r) => (r?.isError
    ? "Fix the errors (plan first, then code) and re-run `check_page`."
    : 'Build or adjust sections with `get_skill({ name: "layout-compositions", section: "<family>" })` + `get_components`, run `validate_code` per file, and for tier1 motion `get_skill({ name: "layout-motion" })`.'),
  validate_code: (r) => (/Token Pure and Clean|^PASS/m.test(text(r))
    ? "Then `audit_source({ targetDir })` and `check_page({ targetDir })` for the whole project."
    : "Run `autofix_code({ code })` or fix by hand, then `validate_code` again."),
  autofix_code: () => "Re-run `validate_code` on the result.",
  audit_source: () => "Then `check_page({ targetDir })` to confirm every section follows a planned composition.",
};

export function withNextStep(name, args, result) {
  const fn = NEXT_STEPS[name];
  if (!fn || !result || !Array.isArray(result.content)) return result;
  let hint = null;
  try { hint = fn(result, args); } catch { hint = null; }
  if (!hint) return result;
  return { ...result, content: [...result.content, { type: "text", text: `\n➡ Next: ${hint}` }] };
}
