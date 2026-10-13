#!/usr/bin/env node
/**
 * Generates the agent instruction files from one set of sources, so the rules,
 * counts and repo layout never drift between copies.
 *
 * Sources
 *   packages/skills/agents/*        shared rules, activation guide, public layout/pipeline (open)
 *   docs/agents/*                   maintainer-only layout and pipeline (private; absent in the public repo)
 *   packages/cli/src/templates/CLAUDE.md   the MCP-first workflow consumer projects get
 *   counts come from components.json, packages/ui/src/lib/meta.ts and the skills folder
 *
 * Outputs
 *   AGENTS.md, CLAUDE.md                     this repo (maintainer variant here, public variant in the mirror)
 *   packages/skills/AGENTS.md                consumer variant (shipped; MCP install_skills / get_guidelines)
 *   packages/cli/src/templates/AGENTS.md     consumer variant (written by `shavin init`)
 *   packages/cli/src/templates/SHAVIN.md     project design brief (written by `shavin init`),
 *                                            a copy of skills/shavin-core/SHAVIN.template.md
 *   SHAVIN.md                                this repo's own brief, the same template with repo values
 *
 * --check also fails on count claims that no longer match the source (factProblems()):
 * "N compositions", "AP-01–AP-N", "N MCP tools" in agent-facing files.
 *
 * Usage: node scripts/gen-agents.mjs [--check]
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { c, g, fmt, printBanner, printCard, startTaskSpinner } from "./lib/term-ui.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "packages/skills/agents");
const PRIVATE_SRC = path.join(ROOT, "docs/agents");
const read = (p) => fs.readFileSync(p, "utf8");
const readIf = (p) => (fs.existsSync(p) ? read(p) : null);
const stripComments = (s) => s.replace(/^<!--[\s\S]*?-->\n*/, "");

export const hasMaintainerSources = () => fs.existsSync(path.join(PRIVATE_SRC, "pipeline.md"));

function counts() {
  const manifest = JSON.parse(read(path.join(ROOT, "components.json")));
  const meta = read(path.join(ROOT, "packages/ui/src/lib/meta.ts"));
  const num = (k) => Number(meta.match(new RegExp(`${k}:\\s*(\\d+)`))?.[1]);
  const compDir = path.join(ROOT, "packages/skills/skills/layout-compositions/references/compositions");
  let compositions = 0;
  const families = new Set();
  for (const f of fs.readdirSync(compDir).filter((f) => f.endsWith(".md"))) {
    for (const chunk of read(path.join(compDir, f)).split(/\n(?=### )/)) {
      if (!/^### [A-Z]{1,2}\d{1,2} · /m.test(chunk) || !/```yaml\n/.test(chunk)) continue;
      compositions++;
      const fam = chunk.match(/^family:\s*(.+)$/m)?.[1]?.trim();
      if (fam) families.add(fam);
    }
  }
  const antiPatterns = [...read(path.join(ROOT, "packages/skills/skills/visual-compositor/anti-patterns.md")).matchAll(/^### (AP-\d+):/gm)].map((m) => m[1]).sort();
  return {
    antiPatterns: antiPatterns.length,
    apLast: antiPatterns.at(-1),
    primitives: manifest.primitiveCount ?? num("primitiveCount"),
    mcpTools: num("mcpToolCount"),
    skills: num("skillCount"),
    compositions,
    families: families.size,
    mcpToolNames: [...(meta.match(/mcpTools:\s*\[([\s\S]*?)\]/)?.[1] ?? "").matchAll(/"([a-z_]+)"/g)].map((m) => m[1]),
  };
}

const pad = (s) => s.padEnd(27);
function layoutTree(audience, n) {
  const rows = ["packages/"];
  const pkgDir = path.join(ROOT, "packages");
  for (const d of fs.readdirSync(pkgDir).sort()) {
    const pj = path.join(pkgDir, d, "package.json");
    if (!fs.existsSync(pj)) continue;
    const p = JSON.parse(read(pj));
    const open = p.license === "MIT";
    if (!open && audience !== "maintainer") continue;
    let desc = (p.description ?? "").replace(/\.$/, "");
    if (p.name === "@shavin/ui") desc += ` (${n.primitives} primitives)`;
    if (p.name === "@shavin/mcp") desc += ` (${n.mcpTools} tools, bridge :7428)`;
    rows.push(`  ${pad(d + "/").slice(0, 25)}${p.name}${open ? "" : " (private)"}: ${desc}`);
  }
  if (audience === "maintainer") {
    rows.push("apps/                      All private.");
    const appDir = path.join(ROOT, "apps");
    for (const d of fs.readdirSync(appDir).sort()) {
      const pj = path.join(appDir, d, "package.json");
      if (!fs.existsSync(pj)) continue;
      rows.push(`  ${pad(d + "/").slice(0, 25)}${JSON.parse(read(pj)).description ?? ""}`);
    }
  }
  rows.push(...read(path.join(SRC, "layout.extra.md")).trim().split("\n"));
  if (audience === "maintainer") rows.push(...read(path.join(PRIVATE_SRC, "layout.extra.md")).trim().split("\n"));
  return "```\n" + rows.join("\n") + "\n```";
}

function applyAudience(text, audience) {
  const on = (tag) => tag === audience || (tag === "repo" && audience !== "consumer");
  return text.replace(/<!-- if:(\w+) -->([\s\S]*?)<!-- endif -->/g, (_, tag, body) => (on(tag) ? body : ""));
}
const fill = (text, vars) => text.replace(/\{\{(\w+)\}\}/g, (m, k) => {
  if (!(k in vars)) throw new Error(`gen-agents: unknown placeholder ${m}`);
  return String(vars[k]);
});

/** audience: "maintainer" (monorepo), "public" (mirror), "consumer" (projects using @shavin/ui). */
export function renderAgents(audience) {
  const n = counts();
  const repo = audience !== "consumer";
  const vars = {
    ...n,
    layout: repo ? layoutTree(audience, n) : read(path.join(SRC, "layout.consumer.md")).trim(),
    pipeline: repo ? stripComments(read(audience === "maintainer" ? path.join(PRIVATE_SRC, "pipeline.md") : path.join(SRC, "pipeline.public.md"))).trim() : "",
  };
  let rules = fill(applyAudience(stripComments(read(path.join(SRC, "rules.md"))), audience), vars);
  let i = 0;
  rules = rules.replace(/\n---\n\s*(?=\n---\n)/g, "").replace(/^## (?!#)/gm, () => `## ${i++}. `).replace(/\n{3,}/g, "\n\n");
  const head = read(path.join(SRC, repo ? "head.repo.md" : "head.consumer.md")).trim();
  const activation = fill(applyAudience(read(path.join(SRC, "activation.md")), audience), vars).trim();
  return `${head}\n\n---\n\n${rules.trim()}\n\n---\n\n<!-- @shavin/skills:reference -->\n${activation}\n<!-- @shavin/skills:reference-end -->\n`;
}

export function renderClaude(audience) {
  const tpl = read(path.join(ROOT, "packages/cli/src/templates/CLAUDE.md"));
  const body = tpl.slice(tpl.indexOf("\n## ") + 1).replace(/^## /gm, "### ").trim();
  const quick = audience === "maintainer" ? read(path.join(PRIVATE_SRC, "claude-head.md")) : read(path.join(SRC, "claude-head.public.md"));
  return `# Shavin — Claude Code instructions

<!-- Generated by \`npm run agents:gen\`. Edit packages/skills/agents/ or packages/cli/src/templates/CLAUDE.md, not this file. -->

The rules for this repository live in [\`AGENTS.md\`](./AGENTS.md). Read it before adding, moving or editing components, tokens, skills or MCP tools.

${quick.trim()}

## UI work: build through the Shavin MCP

This repo dogfoods the workflow consumer projects get (source: \`packages/cli/src/templates/CLAUDE.md\`).

${body}
`;
}

/** Drift checks that a generator cannot fix: every skill, command and MCP tool must be documented. */
export function coverageProblems() {
  const problems = [];
  const n = counts();
  const activation = read(path.join(SRC, "activation.md"));
  const skillsDir = path.join(ROOT, "packages/skills/skills");
  for (const d of fs.readdirSync(skillsDir, { withFileTypes: true }).filter((e) => e.isDirectory())) {
    if (!activation.includes(`${d.name}/`)) problems.push(`activation.md does not mention the skill "${d.name}"`);
  }
  for (const f of fs.readdirSync(path.join(ROOT, "packages/skills/commands")).filter((f) => f.endsWith(".md"))) {
    if (!activation.includes(`/${f.slice(0, -3)}`)) problems.push(`activation.md does not list the command "/${f.slice(0, -3)}"`);
  }
  const core = read(path.join(skillsDir, "shavin-core/SKILL.md"));
  for (const t of n.mcpToolNames) if (!core.includes(`\`${t}(`)) problems.push(`shavin-core tool inventory is missing "${t}"`);
  return problems;
}

const SHAVIN_TEMPLATE = path.join(ROOT, "packages/skills/skills/shavin-core/SHAVIN.template.md");
/** This repo's values for its own SHAVIN.md (the template supplies everything else). */
const REPO_BRIEF = {
  "Product Name": "Shavin (@shavin/ui and its agent tooling)",
  "Domain": "Design system, docs, Studio and marketing site (shavin.cc)",
  "Site Type": "`MARKETING`",
  "Default Visual Mode": "`EDITORIAL`",
};

export function renderShavin(values = {}) {
  let text = read(SHAVIN_TEMPLATE);
  for (const [label, value] of Object.entries(values)) {
    const re = new RegExp(`(\\*\\*${label.replace(/[/]/g, "\\/")}\\*\\*: )[^\\n<]*`);
    if (!re.test(text)) throw new Error(`gen-agents: SHAVIN.template.md has no "${label}" line`);
    text = text.replace(re, `$1${value}${label === "Site Type" || label === "Default Visual Mode" ? " " : ""}`);
  }
  return text;
}

/** Agent-facing files whose counts are written by hand (or copied by hand) and so can drift. */
function factFiles() {
  const list = [];
  const walkMd = (d) => {
    if (!fs.existsSync(d) || path.basename(d) === "archive") return;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) walkMd(p);
      else if (e.name.endsWith(".md")) list.push(p);
    }
  };
  // Monorepo: the guides, architecture docs and the contributor docs the mirror publishes.
  // Public repo (no docs/agents): those contributor docs live in docs/.
  const docDirs = hasMaintainerSources() ? ["docs/agents", "docs/architecture", "docs/guides", "docs/public-repo-copy"] : ["docs"];
  for (const d of ["packages/skills/skills", "packages/skills/commands", "packages/skills/agents", ...docDirs]) walkMd(path.join(ROOT, d));
  for (const f of ["README.md", "CONTRIBUTING.md", "scripts/mirror-public/README.md", "scripts/gen-llms.mjs", "packages/cli/src/templates/CLAUDE.md", "packages/skills/README.md", "packages/mcp-server/README.md", "packages/cli/README.md", "packages/ui/README.md"]) list.push(path.join(ROOT, f));
  const kits = path.join(ROOT, "kits");
  if (fs.existsSync(kits)) {
    for (const k of fs.readdirSync(kits, { withFileTypes: true })) {
      if (!k.isDirectory() || k.name.startsWith(".")) continue;
      for (const f of ["AGENTS.md", "CLAUDE.md", "SHAVIN.md", "README.md"]) list.push(path.join(kits, k.name, f));
    }
  }
  return list.filter((p) => fs.existsSync(p));
}

/** Count claims that disagree with the source: compositions, anti-patterns, MCP tools. */
export function factProblems() {
  const n = counts();
  const problems = [];
  const apMax = Number(n.apLast.slice(3));
  for (const file of factFiles()) {
    const rel = path.relative(ROOT, file);
    read(file).split("\n").forEach((line, i) => {
      const at = `${rel}:${i + 1}`;
      for (const m of line.matchAll(/\b(\d{2,3})\+? (?:layout |section |page\/section )?compositions\b/g)) {
        if (Number(m[1]) !== n.compositions) problems.push(`${at} says ${m[1]} compositions (there are ${n.compositions})`);
      }
      for (const m of line.matchAll(/AP-01\s*(?:–|-|to|through)\s*AP-(\d+)/g)) {
        if (Number(m[1]) !== apMax) problems.push(`${at} says AP-01–AP-${m[1]} (the list ends at ${n.apLast})`);
      }
      for (const m of line.matchAll(/\b(\d{1,2}) (?:named )?(?:AI-slop )?anti-patterns\b/g)) {
        if (Number(m[1]) !== n.antiPatterns) problems.push(`${at} says ${m[1]} anti-patterns (there are ${n.antiPatterns})`);
      }
      for (const m of line.matchAll(/\b(\d{2}) (?:specialized |modular |MCP |MCP server )?(?:AI agent )?tools\b/g)) {
        if (Number(m[1]) !== n.mcpTools && Number(m[1]) !== n.mcpTools - 4) problems.push(`${at} says ${m[1]} tools (the MCP has ${n.mcpTools}, ${n.mcpTools - 4} in remote mode)`);
      }
    });
  }
  return problems;
}

export function outputs() {
  const audience = hasMaintainerSources() ? "maintainer" : "public";
  const consumer = renderAgents("consumer");
  return {
    "AGENTS.md": renderAgents(audience),
    "CLAUDE.md": renderClaude(audience),
    "packages/skills/AGENTS.md": consumer,
    "packages/cli/src/templates/AGENTS.md": consumer,
    "packages/cli/src/templates/SHAVIN.md": renderShavin(),
    "SHAVIN.md": renderShavin(REPO_BRIEF),
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const check = process.argv.includes("--check");

  if (!check) {
    process.stdout.write("\n");
    printBanner("@shavin/ui", "AI Agent Instructions Generator");
  }

  const spinner = !check
    ? startTaskSpinner({ name: "Agent Instructions", desc: "Compiling AGENTS.md, CLAUDE.md & consumer templates" })
    : null;

  const stale = [];
  const targetOutputs = outputs();

  for (const [rel, text] of Object.entries(targetOutputs)) {
    const p = path.join(ROOT, rel);
    if (readIf(p) === text) continue;
    if (check) stale.push(rel);
    else { fs.writeFileSync(p, text); }
  }

  const problems = [...coverageProblems(), ...factProblems()];

  if (check) {
    if (stale.length) console.error(`  ${c.error}${g.stepFail}${c.reset} out of date (run npm run agents:gen): ${stale.join(", ")}`);
    if (problems.length) console.error(`  ${c.error}${g.stepFail}${c.reset} ${problems.join("\n  ✗ ")}`);
    if (stale.length || problems.length) process.exit(1);
    console.log(`  ${c.success}${g.stepDone}${c.reset} agent files: up to date`);
    process.exit(0);
  }

  if (problems.length) {
    spinner?.fail("Agent coverage problems detected");
    console.error(`  ${c.error}${g.stepFail}${c.reset} ${problems.join("\n  ✗ ")}`);
    process.exit(1);
  }

  const fileCount = Object.keys(targetOutputs).length;
  spinner?.succeed(`Generated ${fileCount} agent specification files`);

  printCard({
    title: `${c.brand}${g.brand} Agent Instructions Synchronized${c.reset}`,
    items: [
      { label: "Maintainer Files:", value: `${c.fg}AGENTS.md & CLAUDE.md (monorepo root)${c.reset}` },
      { label: "Consumer Files:", value: `${c.fg}packages/skills/AGENTS.md & cli templates${c.reset}` },
      { label: "Coverage Audit:", value: `${c.fg}All skills, commands & MCP tools matched${c.reset}` },
    ],
    footer: `${c.fgSubtle}Strict zero-drift guarantee between sources and copies${c.reset}`,
  });
}
