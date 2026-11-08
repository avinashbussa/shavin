#!/usr/bin/env node
/**
 * regen — run every generator in dependency order, so generated files are never
 * rebuilt from a stale input. One script for both repos: a step runs only when
 * its npm script exists in this repo's package.json (the public repo has fewer).
 *
 *   npm run regen              # all generators
 *   npm run regen -- --list    # print the steps this repo will run
 *   npm run regen -- --figma   # also regenerate the Figma plugin bundle
 *   npm run regen -- --check   # regenerate, then fail if any generated file was stale (CI drift guard)
 *
 * Order and why:
 *   brand:gen         brand-tokens.css → brand preset/theme files
 *   tokens:gen        global.css → tokens.json (+ OKLCH files in the public repo)
 *   tokens:oklch      OKLCH style files (monorepo)
 *   manifest:gen      primitives + .doc.ts → components.json, meta.ts, docs-routes.ts
 *   vscode:gen        components.json → VS Code custom data and snippets
 *   llms:gen          components.json + tokens.json → llms.txt / llms-full.txt
 *   registry:build    open + pro blocks → generated trees, then the website /r registry JSON
 *   skills:build      packages/skills → .agents/
 *   agents:gen        rules + counts (manifest, skills) → AGENTS.md, CLAUDE.md, consumer copies
 *   mcp:assets        packages/skills + tokens/components/AGENTS → @shavin/mcp assets (distribution copy)
 *   figma:gen         (--figma) tokens + manifest → Figma bundle
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { c, g, fmt, printBanner, printCard, printStage, formatDuration, runTask } from "./lib/term-ui.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const args = process.argv.slice(2);
const LIST = args.includes("--list");
const VERBOSE = args.includes("--verbose");
const CHECK = args.includes("--check");

const STEPS = [
  { script: "brand:gen", desc: "Brand tokens and preset" },
  { script: "tokens:gen", desc: "tokens.json" },
  { script: "tokens:oklch", desc: "OKLCH style files" },
  { script: "manifest:gen", desc: "components.json, SHAVIN_META, docs routes" },
  { script: "vscode:gen", desc: "VS Code custom data and snippets" },
  { script: "llms:gen", desc: "llms.txt and llms-full.txt" },
  { script: "registry:build", desc: "Open + pro block trees, website /r registry" },
  { script: "skills:build", desc: "Skills and commands → .agents/" },
  { script: "agents:gen", desc: "AGENTS.md, CLAUDE.md and consumer copies" },
  { script: "mcp:assets", desc: "tokens, components.json, AGENTS.md, skills, commands → @shavin/mcp assets" },
  { script: "figma:gen", desc: "Figma plugin bundle", optIn: "--figma" },
];

const available = new Set(Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).scripts ?? {}));
const steps = STEPS.filter((s) => available.has(s.script) && (!s.optIn || args.includes(s.optIn)));

if (LIST) {
  steps.forEach((s, i) => console.log(`${String(i + 1).padStart(2)}. npm run ${s.script.padEnd(18)} ${s.desc}`));
  process.exit(0);
}

const changed = () => {
  try { return execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" }).split("\n").filter(Boolean); } catch { return null; }
};

process.stdout.write("\n");
printBanner("@shavin/ui", "Regenerate generated files");
printStage(1, "Generators", "Dependency order: tokens and manifest first, agent files last");
const before = new Set(changed() ?? []);
const start = Date.now();
for (let i = 0; i < steps.length; i++) {
  const s = steps[i];
  try {
    await runTask({ prefix: `[${i + 1}/${steps.length}]`, name: s.script, desc: s.desc, cmd: `npm run ${s.script}`, cwd: ROOT, verbose: VERBOSE });
  } catch (err) {
    console.log("");
    printCard({
      title: `${c.error}${g.stepFail} Regen failed at ${s.script}${c.reset}`,
      items: [
        { label: "Command:", value: `${c.brand}npm run ${s.script}${c.reset}` },
        { label: "Error:", value: `${c.error}${err.message?.split("\n")[0] || "exited with error"}${c.reset}` },
      ],
      footer: err.stdout || err.stderr ? `${c.fgSubtle}${(err.stdout || err.stderr).trim().split("\n").slice(-15).join("\n")}${c.reset}` : null,
    });
    process.exit(1);
  }
}
const after = changed();
const fresh = after ? after.filter((l) => !before.has(l)) : [];
printCard({
  title: `${c.brand}${g.brand} Regen complete${c.reset}`,
  items: [
    { label: "Steps:", value: `${c.fg}${steps.length}${c.reset}` },
    { label: "Duration:", value: `${c.fg}${formatDuration(Date.now() - start)}${c.reset}` },
    { label: "Newly changed:", value: after ? `${c.fg}${fresh.length} file(s)${c.reset}` : `${c.fgMuted}not a git repo${c.reset}` },
  ],
  footer: fresh.length
    ? `${c.fgSubtle}A generated file was stale. ${CHECK ? "Run `npm run regen` and commit these" : "Commit these with your change"}:\n${fresh.slice(0, 20).join("\n")}${fresh.length > 20 ? `\n… and ${fresh.length - 20} more` : ""}${c.reset}`
    : `${c.fgSubtle}${fmt.pass("Everything generated was already up to date.")}${c.reset}`,
});

// --check (CI drift guard): fail if regenerating produced any change, so a stale generated
// file in the tree can't slip through. Only meaningful in a git repo.
if (CHECK && after && fresh.length > 0) process.exit(1);
