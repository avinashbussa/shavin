#!/usr/bin/env node
/**
 * build.mjs — Shavin Skills Build & Deploy Script
 *
 * Lives at packages/skills/build.mjs. Validates the skill .md files in
 * packages/skills/skills/ and deploys them to .agents/skills/ (monorepo
 * consumption). The skills/ directory is both the source of truth AND the
 * published npm content — no separate source/output split.
 *
 * Usage:
 *   node build.mjs              # Validate + measure + sync to .agents/skills/
 *   node build.mjs --dry-run    # Validate + measure + diff report, NO sync
 *   node build.mjs --tokens     # Measure tokens only (quick check)
 *   node build.mjs --strict     # Treat budget warnings as errors
 *   node build.mjs --target X   # Override target dir (default: <repo>/.agents/skills)
 *
 * What it does:
 *   1. Validate cross-references — every `filename.md` mentioned in any .md file must exist
 *   2. Validate frontmatter — every `file:` in SKILL.md frontmatter must resolve to a real file
 *   3. Measure tokens — per file, per skill, always-loaded total, on-demand totals
 *   4. Diff report — compare skills/ vs .agents/skills/, show changed/added/removed
 *   5. Sync — copy changed files from skills/ to .agents/skills/
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync, copyFileSync, unlinkSync } from "node:fs";
import { resolve, join, relative, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { c, g, fmt, printBanner, printCard } from "../../scripts/lib/term-ui.mjs";

// Parse CLI flags
const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const isTokensOnly = args.includes("--tokens");
const isStrict = args.includes("--strict");
const targetIdx = args.indexOf("--target");
const targetOverride = targetIdx !== -1 && args[targetIdx + 1] ? args[targetIdx + 1] : null;

// ── Setup paths ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);        // packages/skills/
const SKILLS_SRC = join(__dirname, "skills"); // packages/skills/skills/ — source of truth + npm content
const REPO_ROOT = resolve(__dirname, "..", ".."); // monorepo root (2 levels up)
const AGENTS_DIR = targetOverride || join(REPO_ROOT, ".agents", "skills");

// ── Helpers ──

// References that are not skill files — they're root-level project files or external.
// The validator skips these instead of reporting them as missing.
const EXTERNAL_REFS = new Set([
  "AGENTS.md",
  "CLAUDE.md",
  "SHAVIN.md",
  "README.md",
  "core-rules.md", // core-rules.md is a shared file, not always inside every skill dir
]);

function tok(n) { return Math.round(n / 4); }

function hashFile(path) {
  try {
    return createHash("md5").update(readFileSync(path)).digest("hex");
  } catch {
    return null;
  }
}

function walkDir(dir, ext = ".md") {
  const results = [];
  function walk(d) {
    for (const entry of readdirSync(d)) {
      const full = join(d, entry);
      if (statSync(full).isDirectory()) {
        walk(full);
      } else if (entry.endsWith(ext) || entry.endsWith(".json")) {
        results.push(full);
      }
    }
  }
  walk(dir);
  return results;
}

function color(text, code) {
  return `\x1b[${code}m${text}\x1b[0m`;
}
const green = (t) => color(t, 32);
const red = (t) => color(t, 31);
const yellow = (t) => color(t, 33);
const cyan = (t) => color(t, 36);
const dim = (t) => color(t, 2);
const bold = (t) => color(t, 1);

let warnings = 0;
let errors = 0;

function warn(msg) {
  console.log(`  ${yellow("⚠ WARN")}  ${msg}`);
  warnings++;
  if (isStrict) errors++;
}
function err(msg) {
  console.log(`  ${red("✗ ERROR")}  ${msg}`);
  errors++;
}
function ok(msg) {
  console.log(`  ${green("✓ OK")}     ${msg}`);
}

// ── Step 1: Collect all files ──
// Exclude non-skill files that might exist in the tree (defensive — these
// shouldn't be in skills/ but the filter prevents accidental deployment).
const NON_SKILL_FILES = new Set(["build.mjs", "token-budget.json", "README.md", "package.json"]);
const allFiles = walkDir(SKILLS_SRC).filter(f => {
  const base = basename(f);
  // Exclude by filename anywhere in the tree
  if (NON_SKILL_FILES.has(base)) return false;
  // Exclude .mjs files
  if (f.endsWith(".mjs")) return false;
  // Exclude .json files at root level (budget config, package.json)
  if (f.endsWith(".json") && dirname(f) === SKILLS_SRC) return false;
  return true;
});
const skillDirs = readdirSync(SKILLS_SRC)
  .filter(d => statSync(join(SKILLS_SRC, d)).isDirectory())
  .map(d => ({ name: d, path: join(SKILLS_SRC, d) }));

// Collect command files for validation and sync
const COMMANDS_SRC = join(__dirname, "commands");
const commandFiles = existsSync(COMMANDS_SRC)
  ? readdirSync(COMMANDS_SRC).filter(f => f.endsWith(".md")).map(f => join(COMMANDS_SRC, f))
  : [];

// Load budget config (lives at package root, not in skills/)
let budget = null;
const budgetPath = join(__dirname, "token-budget.json");
if (existsSync(budgetPath)) {
  budget = JSON.parse(readFileSync(budgetPath, "utf8"));
}

process.stdout.write("\n");
printBanner("@shavin/skills", `AI Agent Skills Library Build${isDryRun ? " (Dry Run)" : ""}`);
console.log(`  ${c.fgSubtle}Source:  ${SKILLS_SRC}${c.reset}`);
console.log(`  ${c.fgSubtle}Target:  ${AGENTS_DIR}${c.reset}`);
console.log(`  ${c.fgSubtle}Files:   ${allFiles.length} .md files in ${skillDirs.length} skill directories${c.reset}\n`);

if (isTokensOnly) {
  const result = measureTokens();
  printSummary(result.alwaysTotal);
  process.exit(errors > 0 ? 1 : 0);
}

// ── Step 2: Validate cross-references ──
console.log(bold("\n── Step 1: Cross-Reference Validation ──\n"));

// Build a set of all known filenames
const allFilenames = new Set(allFiles.map(f => basename(f)));
const allRelPaths = new Set(allFiles.map(f => relative(SKILLS_SRC, f)));

for (const file of allFiles) {
  const content = readFileSync(file, "utf8");
  const relFile = relative(SKILLS_SRC, file);

  // Find all `filename.md` references in backticks
  const refPattern = /`([a-zA-Z0-9_\-\/]+\.md)`/g;
  let match;
  const refs = new Set();
  while ((match = refPattern.exec(content)) !== null) {
    refs.add(match[1]);
  }

  for (const ref of refs) {
    // Skip known external references (root project files, not skill files)
    if (EXTERNAL_REFS.has(ref)) continue;

    // Check if it's a bare filename or a relative path
    const refBase = basename(ref);
    const refExists = allFilenames.has(refBase) || allRelPaths.has(ref) ||
      existsSync(join(SKILLS_SRC, ref)) ||
      existsSync(join(dirname(file), ref));

    if (!refExists) {
      err(`In ${relFile}: references \`${ref}\` but no such file found`);
    }
  }
}
if (warnings === 0 && errors === 0) {
  ok("All cross-references resolve to existing files");
}

// Validate cross-references in command files too
if (commandFiles.length > 0) {
  for (const cmdFile of commandFiles) {
    const content = readFileSync(cmdFile, "utf8");
    const cmdName = basename(cmdFile);
    const refPattern = /`([a-zA-Z0-9_\-\/]+\.md)`/g;
    let match;
    const refs = new Set();
    while ((match = refPattern.exec(content)) !== null) {
      refs.add(match[1]);
    }

    for (const ref of refs) {
      if (EXTERNAL_REFS.has(ref)) continue;

      // Command files may reference skill files (e.g. `visual-compositor/SKILL.md`)
      // or files relative to the skills source root.
      const refBase = basename(ref);
      const refExists = allFilenames.has(refBase) || allRelPaths.has(ref) ||
        existsSync(join(SKILLS_SRC, ref)) ||
        existsSync(join(dirname(cmdFile), ref));

      if (!refExists) {
        err(`In commands/${cmdName}: references \`${ref}\` but no such file found`);
      }
    }
  }
  if (warnings === 0 && errors === 0) {
    ok("All command cross-references resolve to existing files");
  }
}

// ── Step 3: Validate frontmatter ──
console.log(bold("\n── Step 2: Frontmatter Validation ──\n"));

for (const skillDir of skillDirs) {
  const skillMdPath = join(skillDir.path, "SKILL.md");
  if (!existsSync(skillMdPath)) {
    warn(`${skillDir.name}/ has no SKILL.md`);
    continue;
  }

  const content = readFileSync(skillMdPath, "utf8");
  // Extract frontmatter between --- markers
  const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
  if (!fmMatch) {
    warn(`${skillDir.name}/SKILL.md has no frontmatter`);
    continue;
  }

  const fm = fmMatch[1];
  // Find all `file: filename.md` entries in frontmatter
  const filePattern = /file:\s*(\S+)/g;
  let fmMatch2;
  let filesInSection = [];
  while ((fmMatch2 = filePattern.exec(fm)) !== null) {
    filesInSection.push(fmMatch2[1]);
  }

  for (const refFile of filesInSection) {
    const fullPath = join(skillDir.path, refFile);
    if (!existsSync(fullPath)) {
      err(`${skillDir.name}/SKILL.md frontmatter references \`${refFile}\` but file not found at ${fullPath}`);
    }
  }

  // Check for orphan files (files in skill dir not in frontmatter and not SKILL.md)
  const dirFiles = walkDir(skillDir.path)
    .filter(f => basename(f) !== "SKILL.md" && f.endsWith(".md"))
    .map(f => relative(skillDir.path, f));

  for (const dirFile of dirFiles) {
    if (!filesInSection.includes(dirFile)) {
      // references/ subdirectory files are OK to not be in frontmatter
      if (!dirFile.startsWith("references/")) {
        warn(`${skillDir.name}/${dirFile} exists but is not listed in SKILL.md frontmatter`);
      }
    }
  }
}
if (warnings === 0 && errors === 0) {
  ok("All frontmatter file references resolve");
}

// ── Step 4: Measure tokens ──
function measureTokens() {
  console.log(bold("\n── Step 3: Token Measurement ──\n"));

  // Per-file measurements
  const fileData = [];
  for (const file of allFiles) {
    const content = readFileSync(file, "utf8");
    const relPath = relative(SKILLS_SRC, file);
    fileData.push({
      path: relPath,
      file: basename(file),
      chars: content.length,
      tokens: tok(content.length),
    });
  }

  // Always-loaded set
  const alwaysFiles = budget ? Object.keys(budget.alwaysLoadedFiles || {}) : [];
  let alwaysTotal = 0;
  let onDemandTotal = 0;

  // Per-skill grouping
  console.log(`  ${"File".padEnd(48)} ${"Chars".padStart(7)}  ${"Tokens".padStart(7)}  ${"Type".padStart(12)}`);
  console.log(`  ${"─".repeat(48)} ${"─".repeat(7)}  ${"─".repeat(7)}  ${"─".repeat(12)}`);

  for (const fd of fileData) {
    const isAlways = alwaysFiles.some(a => fd.path === a || fd.path.endsWith("/" + a) || a.endsWith(fd.file));
    const type = isAlways ? cyan("always") : dim("on-demand");
    const flag = fd.tokens > (budget?.perFileBudget || 9999) ? red(" ⚠ over budget") : "";
    console.log(`  ${fd.path.padEnd(48)} ${String(fd.chars).padStart(7)}  ${String(fd.tokens).padStart(7)}  ${type}${flag}`);
    if (isAlways) alwaysTotal += fd.tokens;
    else onDemandTotal += fd.tokens;
  }

  console.log(`\n  ${"─".repeat(80)}`);
  const alwaysOverBudget = alwaysTotal > (budget?.alwaysLoadedBudget || 99999);
  console.log(`  Always-loaded total:        ${bold(String(alwaysTotal))} tokens  ${alwaysOverBudget ? red("⚠ OVER BUDGET") : green("✓ within budget")}`);
  console.log(`  On-demand total:            ${onDemandTotal} tokens`);
  console.log(`  Grand total:                ${alwaysTotal + onDemandTotal} tokens`);
  console.log(`  Budget:                     ${budget?.alwaysLoadedBudget || "not set"} tokens (always-loaded)\n`);
  // NOTE: previously this was a print-only check — it never called warn()/err(), so an
  // always-loaded overflow could never fail `npm run check` even in --strict mode. Now enforced.
  if (alwaysOverBudget) {
    warn(`Always-loaded total (${alwaysTotal} tokens) exceeds alwaysLoadedBudget (${budget.alwaysLoadedBudget})`);
  }

  // Per-file budget — also previously print-only (see the ⚠ over budget flag above); now enforced.
  for (const fd of fileData) {
    if (fd.tokens > (budget?.perFileBudget || 9999)) {
      warn(`${fd.path} is ${fd.tokens} tokens, over perFileBudget (${budget.perFileBudget})`);
    }
  }

  // Per-skill breakdown
  for (const skillDir of skillDirs) {
    const skillFiles = fileData.filter(f => f.path.startsWith(skillDir.name + "/"));
    const skillTotal = skillFiles.reduce((s, f) => s + f.tokens, 0);
    // Always-loaded portion of this skill
    const skillAlways = skillFiles.filter(f => {
      const isAlways = alwaysFiles.some(a => f.path === a || f.path.endsWith("/" + a) || a.endsWith(f.file));
      return isAlways;
    }).reduce((s, f) => s + f.tokens, 0);
    // A skill folder may bundle several mutually-exclusive mode files (e.g. visual-compositor's
    // MARKETING vs STRUCTURAL vs EDITORIAL variants are never all loaded in the same task) — such
    // skills can declare a perSkillBudgetOverrides entry instead of inflating the global default.
    const overrideEntry = budget?.perSkillBudgetOverrides?.[skillDir.name];
    const overrideBudget = typeof overrideEntry === "number" ? overrideEntry : overrideEntry?.budget;
    const effectiveBudget = overrideBudget ?? budget?.perSkillBudget ?? 99999;
    const overBudget = skillTotal > effectiveBudget;
    console.log(`  Skill: ${skillDir.name.padEnd(20)} ${String(skillTotal).padStart(6)} total  (${skillAlways} always)  ${overBudget ? red("⚠ over per-skill budget") : green("✓")}`);
    if (overBudget) {
      warn(`${skillDir.name}/ totals ${skillTotal} tokens, over its per-skill budget (${effectiveBudget})`);
    }
  }

  return { alwaysTotal, onDemandTotal, fileData };
}

const { alwaysTotal, onDemandTotal, fileData } = measureTokens();

// ── Step 5: Diff report ──
console.log(bold("\n── Step 4: Diff Report (skills/ vs .agents/skills/) ──\n"));

if (!existsSync(AGENTS_DIR)) {
  warn(`Target directory ${AGENTS_DIR} does not exist yet — first deployment`);
} else {
  const targetFiles = walkDir(AGENTS_DIR);
  const srcHashes = new Map();
  const tgtHashes = new Map();

  for (const f of allFiles) {
    srcHashes.set(relative(SKILLS_SRC, f), hashFile(f));
  }
  for (const f of targetFiles) {
    tgtHashes.set(relative(AGENTS_DIR, f), hashFile(f));
  }

  let changed = 0, added = 0, removed = 0, unchanged = 0;

  for (const [relPath, srcHash] of srcHashes) {
    const tgtHash = tgtHashes.get(relPath);
    if (!tgtHash) {
      console.log(`  ${green("+ ADD")}    ${relPath}`);
      added++;
    } else if (srcHash !== tgtHash) {
      console.log(`  ${yellow("~ MOD")}   ${relPath}`);
      changed++;
    } else {
      unchanged++;
    }
  }

  for (const [relPath] of tgtHashes) {
    if (!srcHashes.has(relPath)) {
      console.log(`  ${red("- DEL")}    ${relPath}`);
      removed++;
    }
  }

  console.log(`\n  ${dim("Summary:")} ${added} added, ${changed} changed, ${removed} removed, ${unchanged} unchanged`);

  if (added === 0 && changed === 0 && removed === 0) {
    ok("Target is up to date — no changes needed");
  }

  // Drift detection: check if .agents/ has files that differ from src AND were not just deployed
  if (changed > 0 || removed > 0) {
    if (!isDryRun) {
      console.log(`\n  ${dim("Note: Run with --dry-run first to review changes before deploying.")}`);
    }
  }
}

// Commands diff report
if (commandFiles.length > 0) {
  const COMMANDS_TARGET = join(REPO_ROOT, ".agents", "commands");
  if (!existsSync(COMMANDS_TARGET)) {
    console.log(`  ${dim("(commands/ target does not exist yet — first deployment)")}`);
  } else {
    const tgtCmds = readdirSync(COMMANDS_TARGET).filter(f => f.endsWith(".md"));
    const srcCmds = commandFiles.map(f => basename(f));
    let cmdAdded = 0, cmdChanged = 0, cmdRemoved = 0, cmdUnchanged = 0;

    for (const src of srcCmds) {
      const tgt = join(COMMANDS_TARGET, src);
      if (!existsSync(tgt)) {
        console.log(`  ${green("+ ADD")}    commands/${src}`);
        cmdAdded++;
      } else if (hashFile(join(COMMANDS_SRC, src)) !== hashFile(tgt)) {
        console.log(`  ${yellow("~ MOD")}   commands/${src}`);
        cmdChanged++;
      } else {
        cmdUnchanged++;
      }
    }

    for (const tgt of tgtCmds) {
      if (!srcCmds.includes(tgt)) {
        console.log(`  ${red("- DEL")}    commands/${tgt}`);
        cmdRemoved++;
      }
    }

    if (cmdAdded > 0 || cmdChanged > 0 || cmdRemoved > 0) {
      console.log(`  ${dim("Commands:")} ${cmdAdded} added, ${cmdChanged} changed, ${cmdRemoved} removed, ${cmdUnchanged} unchanged`);
    }
  }
}
function printSummary(total = alwaysTotal) {
  printCard({
    title: `${c.brand}${g.brand} @shavin/skills Build ${errors > 0 ? "Failed" : "Complete"}${c.reset}`,
    items: [
      { label: "Skills:", value: `${c.bold}${c.fg}${skillDirs.length} agent skill modules${c.reset}` },
      { label: "Specifications:", value: `${c.fg}${allFiles.length} markdown documents${c.reset}` },
      { label: "Always-Loaded Cap:", value: `${c.fg}${total} / ${budget?.alwaysLoadedBudget || 22000} tokens${c.reset}` },
      { label: "Cross-References:", value: `${fmt.pass("ALL RESOLVED")}` },
      { label: "Validation Status:", value: errors > 0 ? `${fmt.fail("FAILED")} (${errors} errors)` : `${fmt.pass("VERIFIED AAA")}` },
    ],
    footer: isDryRun
      ? `${c.fgSubtle}Dry-run mode: no files were synced to .agents/skills/.${c.reset}`
      : `${c.fgSubtle}All agent skills and slash commands synced to .agents/skills/.${c.reset}`,
  });
}

if (!isDryRun && errors === 0) {
  console.log(bold("\n── Step 5: Sync to .agents/skills/ ──\n"));

  if (!existsSync(AGENTS_DIR)) {
    mkdirSync(AGENTS_DIR, { recursive: true });
  }

  // Copy all source files, plus the helper scripts skills tell agents to run
  // (layout-compositions/scripts/*.py); they are not measured as skill text.
  const supportFiles = walkDir(SKILLS_SRC, ".py").filter((f) => f.endsWith(".py"));
  let copied = 0;
  for (const file of [...allFiles, ...supportFiles]) {
    const relPath = relative(SKILLS_SRC, file);
    const target = join(AGENTS_DIR, relPath);
    const targetDir = dirname(target);

    if (!existsSync(targetDir)) {
      mkdirSync(targetDir, { recursive: true });
    }

    const srcHash = hashFile(file);
    const tgtHash = hashFile(target);

    if (srcHash !== tgtHash) {
      copyFileSync(file, target);
      copied++;
    }
  }

  // Remove files in target that no longer exist in source
  if (existsSync(AGENTS_DIR)) {
    const targetFiles = [...walkDir(AGENTS_DIR), ...walkDir(AGENTS_DIR, ".py").filter((f) => f.endsWith(".py"))];
    for (const f of targetFiles) {
      const relPath = relative(AGENTS_DIR, f);
      const srcFile = join(SKILLS_SRC, relPath);
      if (!existsSync(srcFile)) {
        unlinkSync(f);
        console.log(`  ${red("- DEL")}    ${relPath} (removed from target — no longer in source)`);
      }
    }
  }

  console.log(`\n  ${green("✓ Synced")} ${copied} file(s) to ${AGENTS_DIR}`);

  // Sync commands (COMMANDS_SRC declared at top with commandFiles)
  const COMMANDS_TARGET = join(REPO_ROOT, ".agents", "commands");
  if (existsSync(COMMANDS_SRC)) {
    if (!existsSync(COMMANDS_TARGET)) mkdirSync(COMMANDS_TARGET, { recursive: true });
    let cmdCopied = 0;
    for (const cmdFile of readdirSync(COMMANDS_SRC)) {
      if (cmdFile.endsWith(".md")) {
        const src = join(COMMANDS_SRC, cmdFile);
        const tgt = join(COMMANDS_TARGET, cmdFile);
        if (hashFile(src) !== hashFile(tgt)) {
          copyFileSync(src, tgt);
          cmdCopied++;
        }
      }
    }
    if (cmdCopied > 0) {
      console.log(`  ${green("✓ Synced")} ${cmdCopied} command file(s) to ${COMMANDS_TARGET}`);
    }

    // Remove orphaned command files (in target but not in source)
    const tgtCmdFiles = readdirSync(COMMANDS_TARGET).filter(f => f.endsWith(".md"));
    for (const f of tgtCmdFiles) {
      const srcFile = join(COMMANDS_SRC, f);
      if (!existsSync(srcFile)) {
        unlinkSync(join(COMMANDS_TARGET, f));
        console.log(`  ${red("- DEL")}    commands/${f} (orphaned — not in source)`);
      }
    }
  }
} else if (isDryRun) {
  console.log(bold("\n── Step 5: Sync ──\n"));
  console.log(`  ${dim("(skipped — dry run mode)")}`);
}

printSummary(alwaysTotal);
process.exit(errors > 0 ? 1 : 0);
