#!/usr/bin/env node
/**
 * verdaccio-e2e — end-to-end test of `shavin init`'s real install path.
 *
 * `smoke` pre-installs tarballs and declines the AI prompt, so it never exercises
 * init's own registry installs (`npm install @shavin/ui`, `-D @shavin/mcp
 * @shavin/skills @shavin/cli`, the skills deploy, and the `npx @shavin/mcp` it
 * writes into .mcp.json). Those only resolve from a registry — so we stand up a
 * local one (Verdaccio), publish the five open packages to it, point a fresh app's
 * `@shavin` scope at it, and run `shavin init` for real.
 *
 *   node scripts/verdaccio-e2e.mjs [--keep]
 *
 * Heavy (spawns Verdaccio, publishes, installs, scaffolds an app). Run sparingly.
 * Needs network (npmjs uplink for react/next/tailwind) and `npx verdaccio`.
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { removeDir } from "./lib/spawn-cross.mjs";
import { c, g, fmt, printBanner, printCard, printStage, formatDuration } from "./lib/term-ui.mjs";
import { spawnCross } from "./lib/spawn-cross.mjs";
import { ROOT, stopTree, buildPackages, startRegistry, publishAll, scaffoldApp, installFramework, runInit, sh } from "./lib/shavin-fixture.mjs";

// --keep            keep the sandbox in a fresh tmp dir
// --keep <dir>      keep it in <dir> (created; must be empty or absent)
// (default)         a real Next 15 + Tailwind 4 app (React, Tailwind, PostCSS config, root layout importing
//                   globals.css), so the doctor can pass on it and `next dev` / `next build` work
// --bare            skip installing Next/React/Tailwind (faster; the doctor stage is skipped because a
//                   bare app legitimately has no React or Tailwind to check)
// --runnable        accepted for compatibility (now the default)
const argv = process.argv.slice(2);
const keepIdx = argv.indexOf("--keep");
const KEEP = keepIdx !== -1;
const keepDir = KEEP && argv[keepIdx + 1] && !argv[keepIdx + 1].startsWith("--") ? path.resolve(argv[keepIdx + 1]) : null;
const RUNNABLE = !argv.includes("--bare");

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  const tag = ok ? `${c.success}${g.stepDone}` : `${c.error}${g.stepFail}`;
  const d = detail ? ` ${ok ? c.fgMuted : c.error}[${detail}]${c.reset}` : "";
  console.log(`  ${tag}${c.reset} ${c.fg}${name}${c.reset}${d}`);
};

process.stdout.write("\n");
printBanner("@shavin/ui", "init End-to-End via a Local Registry");

const start = Date.now();
const work = keepDir ?? fs.mkdtempSync(path.join(os.tmpdir(), "shavin-e2e-"));
fs.mkdirSync(work, { recursive: true });
const app = path.join(work, "app");
let verdaccio;

const run = async () => {
  // ── Stage 0: build (ui + block-schema need dist/; mcp bundles via prepack) ──
  printStage(1, "Build", "Compile ui, block-schema and mcp before publishing");
  check("packages built", buildPackages());

  printStage(2, "Local Registry", "Start Verdaccio (anonymous publish, npmjs uplink)");
  const registry = await startRegistry(work);
  verdaccio = registry.proc;
  check("Verdaccio started", true, registry.reg);

  printStage(3, "Publish", "npm publish the open packages to the local registry");
  publishAll(registry, work, check);

  printStage(4, "Consumer App", `Scaffold ${RUNNABLE ? "Next 15 + Tailwind v4" : "a bare app"} and scope @shavin to the registry`);
  scaffoldApp(app, registry, { runnable: RUNNABLE });
  if (RUNNABLE) { installFramework(app, registry); check("Next + Tailwind installed", fs.existsSync(path.join(app, "node_modules/next/package.json"))); }

  printStage(5, "shavin init", "Run init against the local registry, installing @shavin/* by name");
  const initOut = runInit(app, registry);
  if (initOut.startsWith("INIT FAILED")) console.log(`  ${c.fgMuted}${initOut.split("\n").slice(-6).join("\n  ")}${c.reset}`);

  // ── Stage 5: assert init's install path landed ──────────────────────────
  printStage(6, "Verify", "Assert the registry-installed packages and generated files");
  const has = (p) => fs.existsSync(path.join(app, p));
  check("@shavin/ui installed from registry", has("node_modules/@shavin/ui/package.json"));
  check("@shavin/mcp installed (AI ecosystem)", has("node_modules/@shavin/mcp/package.json"));
  check("@shavin/skills installed (AI ecosystem)", has("node_modules/@shavin/skills/package.json"));
  check(".agents/skills deployed", has(".agents/skills"));
  check("ThemeProvider wired in layout", has("src/app/layout.tsx") && fs.readFileSync(path.join(app, "src/app/layout.tsx"), "utf8").includes("ThemeProvider"));
  check(".mcp.json written", has(".mcp.json"));
  check("SHAVIN.md written", has("SHAVIN.md"));
  check("AGENTS.md + CLAUDE.md written", has("AGENTS.md") && has("CLAUDE.md"));
  const read = (p) => (has(p) ? fs.readFileSync(path.join(app, p), "utf8") : "");
  check("CLAUDE.md imports SHAVIN.md and AGENTS.md", /^@SHAVIN\.md$/m.test(read("CLAUDE.md")) && /^@AGENTS\.md$/m.test(read("CLAUDE.md")));
  check(".claude/skills deployed (Claude Code reads this, not .agents/)", has(".claude/skills/shavin-app/SKILL.md") && has(".claude/skills/shavin-studio/SKILL.md") && has(".claude/commands"));
  check("maintainer-only skills are not installed (shavin-core, shavin-ui-qa-linter)", !has(".agents/skills/shavin-core") && !has(".claude/skills/shavin-core") && !has(".agents/skills/shavin-ui-qa-linter") && !has(".claude/skills/shavin-ui-qa-linter") && !has(".agents/skills/dense-compression-protocol.md"));
  check(".cursor/rules/shavin.mdc written", has(".cursor/rules/shavin.mdc"));
  check("edit hook registered in .claude/settings.json", /shavin-mcp --hook/.test(read(".claude/settings.json")));

  // ── @shavin/fx (only where its source is present: published to npm, not in the public repo) ──
  if (fs.existsSync(path.join(ROOT, "packages", "fx", "package.json"))) {
    let fxOut = "";
    try { fxOut = sh("npm", ["install", "@shavin/fx", "--no-audit", "--no-fund"], app, { extra: { npm_config_cache: registry.cache } }); } catch (e) { fxOut = `INSTALL FAILED ${String(e.stderr || e.message).slice(0, 200)}`; }
    const fxPkg = has("node_modules/@shavin/fx/package.json") ? JSON.parse(read("node_modules/@shavin/fx/package.json")) : null;
    check("@shavin/fx installs from the registry next to @shavin/ui (peer range satisfied)", !!fxPkg && !fxOut.startsWith("INSTALL FAILED"), fxPkg ? `${fxPkg.version}, peer @shavin/ui ${fxPkg.peerDependencies?.["@shavin/ui"]}` : fxOut.slice(0, 80));
    check("@shavin/fx tarball ships LICENSE and dist, and no source or source maps", has("node_modules/@shavin/fx/LICENSE") && has("node_modules/@shavin/fx/dist/index.js") && !has("node_modules/@shavin/fx/src") && !fs.readdirSync(path.join(app, "node_modules/@shavin/fx/dist")).some((f) => f.endsWith(".map")));
    check("@shavin/ui does not depend on @shavin/fx", !JSON.stringify(JSON.parse(read("node_modules/@shavin/ui/package.json")).dependencies ?? {}).includes("@shavin/fx"));
  }

  // ── The MCP server starts the way .mcp.json starts it (`npx -y @shavin/mcp`) and answers initialize ──
  const mcpStarts = await new Promise((resolveStart) => {
    const child = spawnCross("npx", ["-y", "@shavin/mcp"], { cwd: app, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, NO_COLOR: "1" } });
    let out = "", err = "";
    const finish = (ok, why) => { clearTimeout(timer); try { child.kill(); } catch {} resolveStart({ ok, why }); };
    const timer = setTimeout(() => finish(false, `no initialize response in 60s. ${err.trim().split("\n").slice(-2).join(" ")}`), 60000);
    child.stdout.on("data", (d) => { out += d; if (/"serverInfo"/.test(out)) finish(true, "serverInfo received"); });
    child.stderr.on("data", (d) => { err += d; });
    child.on("exit", (code) => { if (!/"serverInfo"/.test(out)) finish(false, `exited ${code}. ${err.trim().split("\n").slice(-2).join(" ")}`); });
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "e2e", version: "1" } } }) + "\n");
  });
  check("npx -y @shavin/mcp starts and answers initialize (what .mcp.json runs)", mcpStarts.ok, mcpStarts.why);

  // ── Doctor: passes on the fresh fixture, and fails with the right fix when a requirement is removed ──
  printStage(7, "Doctor", "shavin check passes on the fixture and names the fix for each removed requirement");
  const shavinBin = path.join(ROOT, "packages", "cli", "bin", "shavin.mjs");
  const doctor = () => {
    let out;
    try { out = sh("node", [shavinBin, "check", "--json"], app); } catch (e) { out = String(e.stdout || ""); }
    try { return JSON.parse(out).data; } catch { return { score: 0, checks: [], summary: {} }; }
  };
  if (!RUNNABLE) { console.log(`  ${c.fgMuted}skipped (--bare): a bare app has no React or Tailwind for the doctor to check${c.reset}`); return; }
  const baseline = doctor();
  const notPassing = baseline.checks.filter((x) => x.status === "fail" || x.status === "warn");
  check("doctor passes on the fresh fixture (no failures)", (baseline.summary.fail ?? 1) === 0, `${baseline.score}%`);
  const byIdOf = (r, id) => r.checks.find((x) => x.id === id);
  check("doctor: installed @shavin tools and @shavin/ui are within each other's declared compat ranges", byIdOf(baseline, "package-compat")?.status !== "warn", byIdOf(baseline, "package-compat")?.message ?? "no compat ranges to compare");
  // Always show what is not green, so a CI log names the failing check and its fix.
  for (const x of notPassing) console.log(`    ${x.status === "fail" ? c.error : c.fgMuted}${x.status.toUpperCase()} ${x.id}: ${x.message}${x.fix ? `\n      fix: ${x.fix}` : ""}${c.reset}`);
  const byId = (r, id) => r.checks.find((x) => x.id === id);
  const mutate = (name, file, change, id, want) => {
    const f = path.join(app, file);
    const before = fs.existsSync(f) ? fs.readFileSync(f, "utf8") : null;
    if (before === null) { check(name, false, `${file} missing`); return; }
    fs.writeFileSync(f, change(before));
    const r = byId(doctor(), id);
    fs.writeFileSync(f, before);
    check(name, !!r && r.status === want && !!r.fix, r ? `${r.status}: ${r.fix || "no fix"}` : `no ${id} check`);
  };
  mutate("doctor fails when the layout stops importing globals.css", "src/app/layout.tsx", (t) => t.replace(/import ["'][^"']*globals\.css["'];?\n?/, ""), "css-imported", "fail");
  mutate("doctor fails when ThemeProvider is removed", "src/app/layout.tsx", (t) => t.replace(/<\/?ThemeProvider[^>]*>/g, ""), "theme-provider", "fail");
  mutate("doctor warns when the edit hook is removed", ".claude/settings.json", () => "{}\n", "edit-hook", "warn");
  mutate("doctor warns when CLAUDE.md stops importing SHAVIN.md", "CLAUDE.md", (t) => t.replace(/^@SHAVIN\.md$/m, "").replace(/^@AGENTS\.md$/m, "").replace(/## The rule[\s\S]*/, ""), "claude-md", "warn");
  mutate("doctor warns when the Tailwind source for @shavin/ui is removed", "src/app/globals.css", (t) => t.replace(/@source "[^"]*@shavin\/ui[^"]*";\n?/, ""), "source", "fail");
};

let failed = false;
try {
  await run();
} catch (e) {
  failed = true;
  console.error(`\n  ${c.error}${g.stepFail} ${String(e.message || e).slice(0, 200)}${c.reset}`);
} finally {
  await stopTree(verdaccio);
  if (!KEEP) removeDir(work);
  else console.log(`\n  ${c.fgMuted}kept: ${work}${c.reset}`);
}

const passed = results.filter((r) => r.ok).length;
const allOk = !failed && results.length > 0 && passed === results.length;
printCard({
  title: allOk ? `${c.success}${g.brand} init E2E Passed${c.reset}` : `${c.error}${g.brand} init E2E Failed${c.reset}`,
  items: [
    { label: "Checks:", value: `${allOk ? fmt.pass(`${passed}/${results.length}`) : fmt.warn(`${passed}/${results.length}`)}` },
    { label: "Duration:", value: formatDuration(Date.now() - start) },
    { label: "Sandbox:", value: `${c.fgMuted}${KEEP ? work : "clean (ephemeral)"}${c.reset}` },
  ],
  footer: allOk ? fmt.pass("init installs @shavin/* from a registry and wires the project.") : fmt.warn("init E2E failed — see checks above."),
  border: allOk ? c.brandMuted : c.error,
});
process.exit(allOk ? 0 : 1);
