import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { runDoctor } from "../../packages/cli/src/lib/doctor.mjs";
// @ts-expect-error — plain .mjs module without types
import { scoreRender } from "../../packages/cli/src/lib/render-check.mjs";
// @ts-expect-error — plain .mjs module without types
import { checkEnforcement, checkStates } from "../../packages/mcp-server/src/tools/enforce.mjs";
// @ts-expect-error — plain .mjs module without types
import { runHook } from "../../packages/mcp-server/src/hook.mjs";
// @ts-expect-error — plain .mjs module without types
import { checkPage, checkPlan, loadCatalogueFromDir } from "../../packages/mcp-server/src/tools/compose.mjs";

/** Every warning or failure Shavin shows must say how to fix it: a step or a command, not only the problem. */
const STEP = /\b(Run|Add|Install|Create|Upgrade|Keep|Wrap|Use|Start|Set|Check|Remove|Pick|Fix|Change|Name|Decide|Answer|Move|Switch|Replace|Import|Pass|Save|npx|npm|pnpm|yarn)\b/i;

function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "shavin-recovery-"));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}

describe("every warning and failure carries recovery steps", () => {
  it("doctor: each warn or fail check has a fix with a step or command (several broken projects)", () => {
    const broken = [
      project({}),
      project({ "package.json": JSON.stringify({ dependencies: { react: "^18.0.0" } }) }),
      project({
        "package.json": JSON.stringify({ dependencies: { react: "^19.0.0", "react-dom": "^19.0.0", next: "15.5.0", "@shavin/ui": "^0.1.0", tailwindcss: "^4.1.0" } }),
        "src/app/globals.css": '@import "tailwindcss";\n',
        "src/app/layout.tsx": "export default function L({ children }) { return <html><body>{children}</body></html>; }\n",
        "CLAUDE.md": "# x\n", ".cursor/mcp.json": "{}", "components.json": JSON.stringify({ $schema: "https://ui.shadcn.com/schema.json" }),
        ".claude/settings.json": JSON.stringify({ hooks: { PostToolUse: [{ matcher: "Write", hooks: [{ type: "command", command: "npx --no-install shavin-mcp --hook" }] }] } }),
      }),
      project({
        "package.json": JSON.stringify({ dependencies: { react: "^19.0.0", "react-dom": "^19.0.0", "@shavin/ui": "^0.1.0", tailwindcss: "^3.4.0" } }),
        "src/index.css": "body{}\n", "node_modules/@shavin/mcp/package.json": "{}",
      }),
    ];
    let seen = 0;
    for (const dir of broken) {
      for (const c of runDoctor(dir).checks) {
        if (c.status !== "warn" && c.status !== "fail") continue;
        seen++;
        expect(c.fix, `${c.id} (${c.status}) has no fix`).toBeTruthy();
        expect(c.fix, `${c.id}: "${c.fix}" has no step`).toMatch(STEP);
      }
    }
    expect(seen).toBeGreaterThan(15);
  });

  it("code rules: every enforcement finding has a fix", () => {
    const samples = [
      "<button />", '<input type="radio" />', "<select />", "<textarea />", "<table />", "<dialog />", "<div onClick={f} />", '<div role="dialog" />',
      '<div className="rounded-xl border bg-surface p-4" />', '<span className="rounded-full px-2 py-1 bg-brand text-xs" />', '<div className="animate-spin" />', '<div className="animate-pulse" />',
      'import x from "@radix-ui/react-dialog";', 'import { Card } from "@shavin/ui/primitives/Card";', '<p className="text-[40px]" />', '<Box style={{ color: "red" }} />', '<Box className="outline-none" />',
    ];
    for (const code of samples) {
      const found = checkEnforcement(code);
      expect(found.length, code).toBeGreaterThan(0);
      for (const f of found) { expect(f.fix, `${f.rule}`).toMatch(STEP); }
    }
  });

  it("required states: every missing-state error names what to create or add", () => {
    const r = checkStates([
      { file: "src/app/page.tsx", src: 'import { Table, TextField } from "@shavin/ui";\nexport default () => <><Table /><TextField /></>;' },
    ]);
    expect(r.errors.length).toBeGreaterThanOrEqual(5);
    for (const e of r.errors) expect(e, e).toMatch(/\b(Add|Create)\b/);
  });

  it("render check: every failure has a fix", () => {
    const r = scoreRender({ loaded: true, status: 200, tokens: false, utilities: false, component: false });
    for (const c of r.checks.filter((x: { status: string }) => x.status === "fail")) expect(c.fix).toMatch(STEP);
    expect(scoreRender({ loaded: false, error: "Could not load" }).checks.every((c: { fix?: string }) => !!c.fix)).toBe(true);
  });

  it("edit hook: the message tells the agent what to do next", () => {
    const dir = project({ "src/app/page.tsx": "export const A = () => <button>x</button>;\n" });
    const r = runHook({ cwd: dir, tool_input: { file_path: join(dir, "src/app/page.tsx") } });
    expect(r.message).toMatch(/Use Button/);
    expect(r.message).toMatch(/get_components/);
    expect(r.message).toMatch(/validate_code/);
  });

  it("check_page: plan and code errors say how to fix them", () => {
    const cat = loadCatalogueFromDir(resolve(fileURLToPath(import.meta.url), "../../../packages/skills/skills/layout-compositions"));
    const bad = { page: "home", sections: [{ section: "Hero", composition: "ZZ99", treatment: "carded", motion: "tier9", reason: "x" }], variationKnobs: [], boldMoment: "TODO" };
    const plan = checkPlan(cat, bad);
    expect(plan.errors.length).toBeGreaterThan(0);
    for (const e of plan.errors) expect(e, e).toMatch(STEP);
    const dir = project({ "src/app/page.tsx": 'import { Section } from "@shavin/ui";\nexport default () => <Section>x</Section>;\n', ".shavin/plans/home.json": "{ not json" });
    const code = checkPage(cat, { targetDir: dir });
    for (const e of code.errors) expect(e, e).toMatch(STEP);
  });
});
