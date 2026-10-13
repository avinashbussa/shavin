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
import net from "node:net";
import http from "node:http";
import path from "node:path";
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { c, g, fmt, printBanner, printCard, printStage, formatDuration } from "./lib/term-ui.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KEEP = process.argv.includes("--keep");
const PKGS = [
  ["block-schema", "@shavin/block-schema"],
  ["ui", "@shavin/ui"],
  ["skills", "@shavin/skills"],
  ["mcp-server", "@shavin/mcp"],
  ["cli", "@shavin/cli"],
];

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  const tag = ok ? `${c.success}${g.stepDone}` : `${c.error}${g.stepFail}`;
  const d = detail ? ` ${ok ? c.fgMuted : c.error}[${detail}]${c.reset}` : "";
  console.log(`  ${tag}${c.reset} ${c.fg}${name}${c.reset}${d}`);
};
const sh = (cmd, args, cwd, env) =>
  execFileSync(cmd, args, { cwd: cwd || ROOT, encoding: "utf8", input: env?.input, maxBuffer: 64 * 1024 * 1024, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0", ...(env?.extra || {}) } });

const freePort = () => new Promise((res, rej) => {
  const srv = net.createServer();
  srv.unref();
  srv.on("error", rej);
  srv.listen(0, "127.0.0.1", () => { const { port } = srv.address(); srv.close(() => res(port)); });
});
const waitForPing = (port, logFile, ms = 150000) => new Promise((res, rej) => {
  const deadline = Date.now() + ms;
  const fail = () => {
    let log = "";
    try { log = fs.readFileSync(logFile, "utf8").split("\n").filter(Boolean).slice(-6).join("\n    "); } catch {}
    rej(new Error(`Verdaccio did not start within ${Math.round(ms / 1000)}s${log ? `\n    ${log}` : ""}`));
  };
  const tick = () => {
    const req = http.get({ host: "127.0.0.1", port, path: "/-/ping" }, (r) => { r.resume(); res(true); });
    req.on("error", () => (Date.now() > deadline ? fail() : setTimeout(tick, 500)));
  };
  tick();
});

process.stdout.write("\n");
printBanner("@shavin/ui", "init End-to-End via a Local Registry");

const start = Date.now();
const work = fs.mkdtempSync(path.join(os.tmpdir(), "shavin-e2e-"));
const storage = path.join(work, "storage");
const cache = path.join(work, "npm-cache");
const app = path.join(work, "app");
const configPath = path.join(work, "verdaccio.yaml");
const publishNpmrc = path.join(work, "publish.npmrc");
fs.mkdirSync(path.join(app, "src", "app"), { recursive: true });
fs.mkdirSync(cache, { recursive: true });
let verdaccio;

const run = async () => {
  // ── Stage 0: build (ui + block-schema need dist/; mcp bundles via prepack) ──
  printStage(1, "Build", "Compile ui, block-schema and mcp before publishing");
  sh("npm", ["run", "build"]);
  check("packages built", fs.existsSync(path.join(ROOT, "packages/ui/dist/index.js")) && fs.existsSync(path.join(ROOT, "packages/block-schema/dist/index.js")));

  const PORT = await freePort();
  const HOST = "127.0.0.1";
  const REG = `http://${HOST}:${PORT}`;

  // ── Stage 2: start Verdaccio (anonymous publish, npmjs uplink) ──────────
  printStage(2, "Local Registry", `Start Verdaccio on ${REG}`);
  fs.writeFileSync(configPath, `storage: ${storage}
auth:
  htpasswd:
    file: ${path.join(work, "htpasswd")}
    max_users: -1
uplinks:
  npmjs:
    url: https://registry.npmjs.org/
packages:
  '@shavin/*':
    access: $all
    publish: $anonymous
    unpublish: $anonymous
  '**':
    access: $all
    publish: $anonymous
    proxy: npmjs
log: { type: stdout, format: pretty, level: warn }
`);
  const vLog = path.join(work, "verdaccio.log");
  const vLogFd = fs.openSync(vLog, "a");
  verdaccio = spawn("npx", ["--yes", "verdaccio@6", "--config", configPath, "--listen", `${HOST}:${PORT}`], {
    cwd: work, stdio: ["ignore", vLogFd, vLogFd], env: { ...process.env, NO_COLOR: "1" },
  });
  verdaccio.on("error", (e) => { throw e; });
  await waitForPing(PORT, vLog);
  check("Verdaccio started", true, REG);

  // ── Stage 2: publish the five open packages ────────────────────────────
  printStage(3, "Publish", "npm publish the open packages to the local registry");
  fs.writeFileSync(publishNpmrc, `registry=${REG}\n//${HOST}:${PORT}/:_authToken=e2e-fake-token\n`);
  const pubEnv = { npm_config_userconfig: publishNpmrc, npm_config_cache: cache };
  for (const [dir, name] of PKGS) {
    try {
      sh("npm", ["publish", "--registry", REG], path.join(ROOT, "packages", dir), { extra: pubEnv });
      check(`publish ${name}`, true);
    } catch (e) {
      const msg = String(e.stderr || e.message).split("\n").find((l) => /error|E\d{3}/i.test(l)) || "publish failed";
      check(`publish ${name}`, false, msg.slice(0, 80));
      throw e;
    }
  }

  // ── Stage 3: fresh app, @shavin scope pointed at Verdaccio ──────────────
  printStage(4, "Consumer App", "Scaffold Next.js 15 + Tailwind v4 and scope @shavin to the registry");
  fs.writeFileSync(path.join(app, "package.json"), JSON.stringify({
    name: "shavin-e2e-app", private: true, type: "module",
  }, null, 2));
  // Scoped registry — a per-command --registry can't reach the `npx -y @shavin/mcp` init writes to .mcp.json.
  fs.writeFileSync(path.join(app, ".npmrc"), `@shavin:registry=${REG}\n//${HOST}:${PORT}/:_authToken=e2e-fake-token\n`);
  fs.writeFileSync(path.join(app, "src/app/globals.css"), '@import "tailwindcss";\n');
  fs.writeFileSync(path.join(app, "src/app/layout.tsx"), `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body className="antialiased">{children}</body></html>);
}
`);

  // ── Stage 4: run `shavin init` for real (accept the AI ecosystem) ───────
  printStage(5, "shavin init", "Run init against the local registry, installing @shavin/* by name");
  const shavinBin = path.join(ROOT, "packages", "cli", "bin", "shavin.mjs");
  try {
    sh("node", [shavinBin, "init"], app, { input: "y\n", extra: { npm_config_cache: cache } });
  } catch (e) {
    console.log(`  ${c.fgMuted}${String(e.stdout || "").split("\n").slice(-6).join("\n  ")}${c.reset}`);
  }

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
};

let failed = false;
try {
  await run();
} catch (e) {
  failed = true;
  console.error(`\n  ${c.error}${g.stepFail} ${String(e.message || e).slice(0, 200)}${c.reset}`);
} finally {
  if (verdaccio && !verdaccio.killed) verdaccio.kill("SIGTERM");
  if (!KEEP) fs.rmSync(work, { recursive: true, force: true });
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
