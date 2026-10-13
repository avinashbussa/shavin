#!/usr/bin/env node

/**
 * @shavin/skills — Skill & Command Installer
 *
 * Copies bundled skill and command .md files from this package into the user's
 * project at .agents/skills/ and .agents/commands/. Also optionally appends a Shavin
 * reference to an existing AGENTS.md (without overwriting it).
 *
 * Usage:
 *   npx @shavin/skills                  # install skills & commands
 *   npx @shavin/skills --force          # overwrite existing files
 *   npx @shavin/skills --target ./apps/myapp  # install to a specific project
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { resolve, join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const PKG_ROOT = resolve(__dirname, "..");
const SKILLS_SRC = resolve(PKG_ROOT, "skills");
const COMMANDS_SRC = resolve(PKG_ROOT, "commands");

// --- Parse args ---
const args = process.argv.slice(2);
const force = args.includes("--force") || args.includes("-f");
const targetIdx = args.indexOf("--target");
const nonFlagArgs = args.filter((a) => !a.startsWith("-"));
const targetDir = targetIdx !== -1 && args[targetIdx + 1]
  ? resolve(args[targetIdx + 1])
  : nonFlagArgs.length > 0
    ? resolve(nonFlagArgs[0])
    : process.cwd();

// --- Skills that are never installed into a project (none today) ---
const INTERNAL_ONLY_SKILLS = new Set([]);

// --- Helpers ---
function copyDir(src, dst) {
  let count = 0;
  if (!existsSync(src)) return 0;

  for (const entry of readdirSync(src)) {
    if (INTERNAL_ONLY_SKILLS.has(entry)) continue;
    const srcPath = join(src, entry);
    const dstPath = join(dst, entry);

    if (statSync(srcPath).isDirectory()) {
      if (!existsSync(dstPath)) mkdirSync(dstPath, { recursive: true });
      count += copyDir(srcPath, dstPath);
    } else if (entry.endsWith(".md") || entry.endsWith(".py")) { // .py: catalogue helper scripts
      if (existsSync(dstPath) && !force) {
        // Skip existing unless --force
        continue;
      }
      writeFileSync(dstPath, readFileSync(srcPath, "utf8"), "utf8");
      count++;
    }
  }
  return count;
}

// --- Banner ---
console.log("\x1b[36m%s\x1b[0m", "\n🎨 @shavin/skills — AI Agent Skill & Command Installer\n");

// --- Validate source ---
if (!existsSync(SKILLS_SRC)) {
  console.error("\x1b[31m%s\x1b[0m", "✗ No skills/ directory found in package. This should not happen — please report this issue.");
  process.exit(1);
}

// --- Count source files ---
function countMd(dir) {
  let n = 0;
  if (!existsSync(dir)) return 0;
  for (const entry of readdirSync(dir)) {
    if (INTERNAL_ONLY_SKILLS.has(entry)) continue;
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) n += countMd(p);
    else if (entry.endsWith(".md")) n++;
  }
  return n;
}

const sourceSkillsCount = countMd(SKILLS_SRC);
const sourceCommandsCount = countMd(COMMANDS_SRC);
console.log(`  Source: ${sourceSkillsCount} skill files + ${sourceCommandsCount} commands from @shavin/skills`);
console.log(`  Target: ${targetDir}/.agents/`);

// --- Copy skills ---
const targetSkillsDir = resolve(targetDir, ".agents", "skills");
if (!existsSync(targetSkillsDir)) mkdirSync(targetSkillsDir, { recursive: true });

const copiedSkills = copyDir(SKILLS_SRC, targetSkillsDir);

if (copiedSkills === 0 && !force) {
  console.log("\x1b[33m%s\x1b[0m", "\n  ⚠ All skill files already exist. Use --force to overwrite.");
} else {
  console.log("\x1b[32m%s\x1b[0m", `\n  ✓ Deployed ${copiedSkills} skill file(s) to .agents/skills/`);
}

// --- Copy commands ---
let copiedCommands = 0;
if (existsSync(COMMANDS_SRC)) {
  const targetCommandsDir = resolve(targetDir, ".agents", "commands");
  if (!existsSync(targetCommandsDir)) mkdirSync(targetCommandsDir, { recursive: true });
  copiedCommands = copyDir(COMMANDS_SRC, targetCommandsDir);

  if (copiedCommands > 0) {
    console.log("\x1b[32m%s\x1b[0m", `  ✓ Deployed ${copiedCommands} AI slash command(s) to .agents/commands/`);
  } else if (!force) {
    console.log("\x1b[33m%s\x1b[0m", "  ⚠ All command files already exist. Use --force to overwrite.");
  }
}

// --- List deployed files ---
function listFiles(dir, prefix = "") {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir).sort()) {
    const p = join(dir, entry);
    if (statSync(p).isDirectory()) {
      listFiles(p, `${prefix}${entry}/`);
    } else if (entry.endsWith(".md")) {
      console.log(`\x1b[2m%s\x1b[0m`, `    ${prefix}${entry}`);
    }
  }
}
console.log("\x1b[2m%s\x1b[0m", "\n  Deployed files:");
listFiles(targetSkillsDir, "skills/");
if (existsSync(resolve(targetDir, ".agents", "commands"))) {
  listFiles(resolve(targetDir, ".agents", "commands"), "commands/");
}

// --- AGENTS.md: the generated rules ship in this package (AGENTS.md). A missing file is
// created; an existing one gets (or refreshes) only the marked skills block, so a project's
// own content is never overwritten.
const MARK = "<!-- @shavin/skills:reference -->";
const MARK_END = "<!-- @shavin/skills:reference-end -->";
const pkgAgentsPath = resolve(PKG_ROOT, "AGENTS.md");
const agentsMdPath = resolve(targetDir, "AGENTS.md");
if (existsSync(pkgAgentsPath)) {
  const fresh = readFileSync(pkgAgentsPath, "utf8");
  const block = fresh.slice(fresh.indexOf(MARK), fresh.indexOf(MARK_END) + MARK_END.length);
  if (!existsSync(agentsMdPath)) {
    writeFileSync(agentsMdPath, fresh, "utf8");
    console.log("\x1b[32m%s\x1b[0m", "\n  ✓ Created AGENTS.md (Shavin rules + skills guide)");
  } else {
    const current = readFileSync(agentsMdPath, "utf8");
    const s0 = current.indexOf(MARK), e0 = current.indexOf(MARK_END);
    const next = s0 !== -1 && e0 !== -1
      ? current.slice(0, s0) + block + current.slice(e0 + MARK_END.length)
      : current.trimEnd() + "\n\n" + block + "\n";
    if (next !== current) {
      writeFileSync(agentsMdPath, next, "utf8");
      console.log("\x1b[32m%s\x1b[0m", s0 !== -1 ? "\n  ✓ Refreshed the Shavin skills block in AGENTS.md" : "\n  ✓ Appended the Shavin skills block to AGENTS.md");
    } else {
      console.log("\x1b[2m%s\x1b[0m", "\n  • AGENTS.md skills block is up to date");
    }
  }
}

console.log("\x1b[32m%s\x1b[0m", "\n✨ @shavin/skills installation complete!\n");
console.log("\x1b[36m%s\x1b[0m", "  • Skills ready: .agents/skills/");
console.log("\x1b[36m%s\x1b[0m", `  • Slash commands ready: .agents/commands/ (${readdirSync(COMMANDS_SRC).filter((f) => f.endsWith(".md")).map((f) => "/" + f.slice(0, -3)).join(", ")})`);
console.log("\x1b[36m%s\x1b[0m", "  • Primary brain: SHAVIN.md");
console.log("\x1b[36m%s\x1b[0m", "  • Update anytime: npx @shavin/skills --force\n");
