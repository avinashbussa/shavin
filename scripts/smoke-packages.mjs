#!/usr/bin/env node
/**
 * smoke-packages — prove the open packages work the way a user installs them.
 *
 * Packs @shavin/ui, block-schema, cli, mcp and skills with `npm pack`, installs
 * the tarballs into a throwaway consumer project, and exercises each one:
 *
 *   ui            SSR-renders ThemeProvider + Card/Flex/Heading/Text/Button;
 *                 every CSS / preset / manifest export resolves to a real file
 *   block-schema  catalogue loads and every block validates
 *   mcp           starts over stdio, lists its tools, answers get_components
 *                 and flags a hex colour in validate_code
 *   cli           `shavin init` on a Next.js + Tailwind v4 layout, then
 *                 `shavin add pricing-three-tier`, then a real Tailwind v4 build
 *                 that must contain Shavin utilities
 *   skills        installs .agents/skills + commands; the token linter flags hex
 *
 * Run after `npm run build` (dist/ must exist). Needs network for npm install.
 *   node scripts/smoke-packages.mjs [--keep]
 */
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runSync, spawnCross, killTree, removeDir } from "./lib/spawn-cross.mjs";
import { fileURLToPath } from "node:url";
import { c, g, fmt, printBanner, printCard, printStage, formatDuration } from "./lib/term-ui.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const KEEP = process.argv.includes("--keep");
const PKGS = [
  ["block-schema", "@shavin/block-schema"],
  ["ui", "@shavin/ui"],
  ["cli", "@shavin/cli"],
  ["mcp-server", "@shavin/mcp"],
  ["skills", "@shavin/skills"],
];

const results = [];
const check = (name, ok, detail = "") => {
  results.push({ name, ok, detail });
  if (ok) {
    const detailStr = detail ? ` ${c.fgMuted}[${detail}]${c.reset}` : "";
    console.log(`  ${c.success}${g.stepDone}${c.reset} ${c.fg}${name}${c.reset}${detailStr}`);
  } else {
    const detailStr = detail ? ` ${c.error}[${detail}]${c.reset}` : "";
    console.log(`  ${c.error}${g.stepFail}${c.reset} ${c.fg}${name}${c.reset}${detailStr}`);
  }
};
// Brand colour utilities a project writes after `shavin init`: they must compile, read --brand*, and the
// tokens must declare --brand (and never --accent, which belongs to shadcn/ui).
const BRAND_PROBE = `export const P = () => <div className="bg-brand bg-brand-hover text-brand-contrast text-brand-fg border-brand bg-brand-subtle" />;\n`;
const BRAND_UTILS = [".bg-brand", ".text-brand-contrast", ".text-brand-fg", ".border-brand", ".bg-brand-subtle"];
const checkBrand = (label, built) => {
  const rule = (cls) => built.match(new RegExp(`\\${cls.replace(/-/g, "\\-")}\\s*\\{[^}]*\\}`))?.[0] ?? "";
  const missing = BRAND_UTILS.filter((cls) => !/var\(--(color-)?brand/.test(rule(cls)));
  check(`${label}: brand utilities compile and read --brand*`, missing.length === 0, missing.length ? `missing ${missing.join(", ")}` : "");
  check(`${label}: tokens declare --brand, not --accent`, /--brand\s*:/.test(built) && !/(^|[\s;{])--accent\s*:/.test(built));
};
const sh = (cmd, args, cwd, input) => runSync(cmd, args, { cwd, encoding: "utf8", input, stdio: ["pipe", "pipe", "pipe"], env: { ...process.env, NO_COLOR: "1", FORCE_COLOR: "0" } });

for (const dir of ["ui", "block-schema"]) {
  if (!fs.existsSync(path.join(ROOT, "packages", dir, "dist", "index.js"))) {
    console.error(`  ${c.error}${g.stepFail}${c.reset} packages/${dir}/dist is missing — run \`npm run build\` first`);
    process.exit(1);
  }
}

process.stdout.write("\n");
printBanner("@shavin/ui", "Package Smoke Testing & Integration Sandbox");

const startTime = Date.now();
const work = fs.mkdtempSync(path.join(os.tmpdir(), "shavin-smoke-"));
const tarDir = path.join(work, "tarballs");
const app = path.join(work, "app");
fs.mkdirSync(tarDir); fs.mkdirSync(path.join(app, "src", "app"), { recursive: true });

try {
  // ── Stage 1: Pack ─────────────────────────────────────────────────────
  printStage(1, "Package Tarballs", "Pack @shavin/* with npm pack and inspect archive contents");
  const tarballs = [];
  for (const [dir, name] of PKGS) {
    const out = sh("npm", ["pack", "--silent", "--pack-destination", tarDir], path.join(ROOT, "packages", dir)).trim().split("\n").pop();
    const tgz = path.join(tarDir, out);
    const listing = sh("tar", ["-tzf", tgz]);
    check(`pack ${name}`, fs.existsSync(tgz) && listing.includes("package/LICENSE") && listing.includes("package/README.md"), `${(fs.statSync(tgz).size / 1024).toFixed(0)} KB`);
    tarballs.push(tgz);
  }

  // ── Stage 2: Consumer project: Next.js-style layout on Tailwind v4 ────
  printStage(2, "Consumer Sandbox Setup", "Scaffold Next.js 15 on Tailwind v4 and install packed tarballs");
  fs.writeFileSync(path.join(app, "package.json"), JSON.stringify({
    name: "shavin-smoke-app", private: true, type: "module",
    dependencies: { next: "^15.5.0" }, devDependencies: { tailwindcss: "^4.1.0" },
  }, null, 2));
  fs.writeFileSync(path.join(app, "src/app/globals.css"), '@import "tailwindcss";\n');
  fs.writeFileSync(path.join(app, "src/app/layout.tsx"), `export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
`);
  sh("npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts", "react@19", "react-dom@19", "tailwindcss@4", "@tailwindcss/cli@4", ...tarballs], app);
  check("install tarballs into a fresh project", fs.existsSync(path.join(app, "node_modules/@shavin/ui/package.json")));

  // ── Stage 3: ui + block-schema ───────────────────────────────────────
  printStage(3, "UI & Block Schema Verification", "SSR render primitives, verify CSS exports & validate blocks");
  fs.writeFileSync(path.join(app, "smoke-ui.mjs"), `
import fs from "node:fs";
import React from "react";
import { renderToString } from "react-dom/server";
import * as UI from "@shavin/ui";
import { SYSTEM_BLOCKS, BLOCK_TEMPLATES, validateBlockTemplate } from "@shavin/block-schema";
const h = React.createElement;
const html = renderToString(h(UI.ThemeProvider, null, h(UI.Card, { padding: "md" }, h(UI.Flex, { direction: "column", gap: "3" },
  h(UI.Heading, { size: "md" }, "Smoke"), h(UI.Text, { color: "subtle" }, "test"), h(UI.Button, { variant: "solid" }, "Go")))));
let invalid = 0;
for (const b of SYSTEM_BLOCKS) { try { validateBlockTemplate(b); } catch { invalid++; } }
const exportsOk = ["styles.css", "global-oklch.css", "theme-v4.css", "theme-v4-oklch.css", "tokens.css", "base.css", "tokens-oklch.css", "base-oklch.css", "tailwind-preset", "tokens.json", "components.json"]
  .every((e) => { try { return fs.existsSync(new URL(import.meta.resolve("@shavin/ui/" + e))); } catch { return false; } });
console.log(JSON.stringify({ exports: Object.keys(UI).length, rendered: html.includes("Smoke") && html.includes("<button"),
  brandClasses: /\\bbg-brand\\b/.test(html),
  blocks: SYSTEM_BLOCKS.length, templates: Object.keys(BLOCK_TEMPLATES).length, invalid, exportsOk }));
`);
  const ui = JSON.parse(sh("node", ["smoke-ui.mjs"], app).trim().split("\n").pop());
  check("@shavin/ui renders on the server", ui.rendered, `${ui.exports} exports`);
  check("@shavin/ui CSS, preset and manifest exports resolve to files", ui.exportsOk);
  check("@shavin/ui solid Button renders brand classes", ui.brandClasses);
  check("@shavin/block-schema catalogue validates", ui.blocks > 0 && ui.invalid === 0 && ui.templates === ui.blocks, `${ui.blocks} blocks`);

  // ── Stage 4: mcp over stdio ───────────────────────────────────────────
  printStage(4, "MCP Server (stdio)", "Connect to @shavin/mcp, test tools/list and validation");
  const mcp = await new Promise((resolve) => {
    const p = spawnCross(path.join(app, "node_modules/.bin/shavin-mcp"), [], { cwd: app, stdio: ["pipe", "pipe", "pipe"] });
    const out = {}; let buf = "";
    const send = (m) => p.stdin.write(JSON.stringify(m) + "\n");
    const done = (v) => { clearTimeout(t); killTree(p); resolve(v); };
    const t = setTimeout(() => done({ ...out, timeout: true }), 45000);
    p.stdout.on("data", (d) => {
      buf += d; const lines = buf.split("\n"); buf = lines.pop();
      for (const line of lines) {
        let m; try { m = JSON.parse(line); } catch { continue; }
        if (m.id === 1) { send({ jsonrpc: "2.0", method: "notifications/initialized" }); send({ jsonrpc: "2.0", id: 2, method: "tools/list" }); }
        if (m.id === 2) { out.tools = m.result?.tools?.length ?? 0; send({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "get_components", arguments: { name: "Button" } } }); }
        if (m.id === 3) { out.components = !m.result?.isError && JSON.stringify(m.result).includes("Button"); send({ jsonrpc: "2.0", id: 4, method: "tools/call", params: { name: "validate_code", arguments: { code: '<div className="bg-[#ff0000]">x</div>' } } }); }
        if (m.id === 4) { out.validate = /#ff0000|hex/i.test(JSON.stringify(m.result)); done(out); }
      }
    });
    send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "smoke", version: "0" } } });
  });
  check("@shavin/mcp starts and lists tools", mcp.tools > 0, `${mcp.tools ?? 0} tools${mcp.timeout ? " (timed out)" : ""}`);
  check("@shavin/mcp get_components answers", !!mcp.components);
  check("@shavin/mcp validate_code flags a hex colour", !!mcp.validate);

  // ── Stage 5: cli & skills ─────────────────────────────────────────────
  printStage(5, "CLI & Skills Integration", "Execute shavin init, add block, Tailwind v4 build & skills linter");
  const bin = (n) => path.join(app, "node_modules/.bin", n);
  sh(bin("shavin"), ["init"], app, "n\nn\nn\nn\n");
  const css = fs.readFileSync(path.join(app, "src/app/globals.css"), "utf8");
  const layout = fs.readFileSync(path.join(app, "src/app/layout.tsx"), "utf8");
  check("cli init wires Tailwind v4 (tokens, layered base, theme bridge, @source)", css.includes("@shavin/ui/theme-v4.css") && css.includes('@import "@shavin/ui/base.css" layer(base);') && /@source "[^"]*node_modules\/@shavin\/ui"/.test(css));
  check("cli init puts ThemeProvider inside <body>", /<body[^>]*>\s*<ThemeProvider/.test(layout) && !/<ThemeProvider>\s*<html/.test(layout));
  for (const f of ["SHAVIN.md", "AGENTS.md", "CLAUDE.md", ".mcp.json", "src/app/brand-tokens.css"]) check(`cli init wrote ${f}`, fs.existsSync(path.join(app, f)));
  sh(bin("shavin"), ["add", "pricing-three-tier"], app);
  const block = path.join(app, "src/components/blocks/PricingThreeTier.tsx");
  check("cli add installs a block under src/components/blocks", fs.existsSync(block));
  fs.writeFileSync(path.join(app, "src/app/brand-probe.tsx"), BRAND_PROBE);
  sh(bin("tailwindcss"), ["-i", "src/app/globals.css", "-o", "out.css"], app);
  const built = fs.readFileSync(path.join(app, "out.css"), "utf8");
  const wanted = [".bg-surface", ".text-fg-subtle", ".rounded-panel-p5", ".border-hairline"];
  check("Tailwind v4 build contains Shavin utilities", wanted.every((c) => built.includes(c + " {") || built.includes(c + "{")), `${(built.length / 1024).toFixed(0)} KB CSS`);
  checkBrand("Tailwind v4 (Next.js)", built);

  const skillsTarget = path.join(work, "skills-target");
  fs.mkdirSync(skillsTarget);
  sh(bin("shavin-skills"), ["--target", skillsTarget], app);
  const sk = path.join(skillsTarget, ".agents");
  check("@shavin/skills installs skills and commands", fs.existsSync(path.join(sk, "skills/core-rules.md")) && fs.readdirSync(path.join(sk, "commands")).length > 0);
  fs.writeFileSync(path.join(app, "bad.tsx"), '<div className="bg-surface text-[#123456]">x</div>\n');
  let lintOut = "";
  try { lintOut = sh(bin("shavin-lint-tokens"), ["bad.tsx"], app); } catch (e) { lintOut = String(e.stdout ?? "") + String(e.stderr ?? ""); }
  check("@shavin/skills token linter flags a hex colour", /#123456/.test(lintOut));

  // ── Stage 6: other consumers — Next.js on Tailwind v3, Vite on Tailwind v4 ──
  printStage(6, "Other Consumers", "shavin init + brand utilities on Tailwind v3 (Next.js) and Vite + Tailwind v4");
  const consumer = (name, pkg, files, deps) => {
    const dir = path.join(work, name);
    for (const [rel, body] of Object.entries({ "package.json": JSON.stringify({ name, private: true, ...pkg }, null, 2), ...files })) {
      fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
      fs.writeFileSync(path.join(dir, rel), body);
    }
    sh("npm", ["install", "--no-audit", "--no-fund", "--ignore-scripts", ...deps, ...tarballs], dir);
    sh(path.join(dir, "node_modules/.bin/shavin"), ["init"], dir, "n\nn\nn\nn\n");
    return dir;
  };

  const v3Src = {
    "src/app/globals.css": "@tailwind base;\n@tailwind components;\n@tailwind utilities;\n",
    "tailwind.config.js": 'module.exports = {\n  content: ["./src/**/*.{js,ts,jsx,tsx}"],\n  plugins: [],\n};\n',
    "src/app/layout.tsx": `export default function RootLayout({ children }: { children: React.ReactNode }) {\n  return (\n    <html lang="en">\n      <body>{children}</body>\n    </html>\n  );\n}\n`,
    "src/app/brand-probe.tsx": BRAND_PROBE,
  };
  const v3 = consumer("app-tw3", { dependencies: { next: "^15.5.0" } }, v3Src, ["react@19", "react-dom@19", "tailwindcss@3"]);
  const v3css = fs.readFileSync(path.join(v3, "src/app/globals.css"), "utf8");
  const v3cfg = fs.readFileSync(path.join(v3, "tailwind.config.js"), "utf8");
  check("Tailwind v3: init imports styles.css and adds the preset", v3css.includes("@shavin/ui/styles.css") && v3cfg.includes("@shavin/ui/tailwind-preset"));
  sh(path.join(v3, "node_modules/.bin/tailwindcss"), ["-i", "src/app/globals.css", "-o", "out.css"], v3);
  checkBrand("Tailwind v3 (Next.js)", fs.readFileSync(path.join(v3, "out.css"), "utf8"));

  // Same project as an ES module config (tailwind.config.mjs), sharing the installed node_modules.
  const v3esm = path.join(work, "app-tw3-esm");
  fs.mkdirSync(path.join(v3esm, "src/app"), { recursive: true });
  fs.symlinkSync(path.join(v3, "node_modules"), path.join(v3esm, "node_modules"), "dir");
  fs.writeFileSync(path.join(v3esm, "package.json"), JSON.stringify({ ...JSON.parse(fs.readFileSync(path.join(v3, "package.json"), "utf8")), name: "app-tw3-esm", type: "module" }, null, 2));
  fs.writeFileSync(path.join(v3esm, "tailwind.config.mjs"), 'export default {\n  content: ["./src/**/*.{js,ts,jsx,tsx}"],\n  plugins: [],\n};\n');
  for (const f of ["globals.css", "layout.tsx", "brand-probe.tsx"]) fs.writeFileSync(path.join(v3esm, "src/app", f), v3Src[`src/app/${f}`]);
  sh(path.join(v3esm, "node_modules/.bin/shavin"), ["init"], v3esm, "n\nn\nn\nn\n");
  const esmCfg = fs.readFileSync(path.join(v3esm, "tailwind.config.mjs"), "utf8");
  check("Tailwind v3 ESM config: init imports both presets, no require()", !esmCfg.includes("require(") && /presets:\s*\[shavinPreset,\s*brandPreset\]/.test(esmCfg));
  sh(path.join(v3esm, "node_modules/.bin/tailwindcss"), ["-i", "src/app/globals.css", "-o", "out.css"], v3esm);
  checkBrand("Tailwind v3 (tailwind.config.mjs)", fs.readFileSync(path.join(v3esm, "out.css"), "utf8"));

  const vite = consumer("app-vite", { type: "module", dependencies: { vite: "^6.0.0" } }, {
    "index.html": '<!doctype html><html><body><div id="root"></div><script type="module" src="/src/main.tsx"></script></body></html>\n',
    "src/index.css": '@import "tailwindcss";\n',
    "src/main.tsx": 'import { createRoot } from "react-dom/client";\nimport "./index.css";\nimport { P } from "./brand-probe";\n\ncreateRoot(document.getElementById("root")!).render(<P />);\n',
    "src/brand-probe.tsx": BRAND_PROBE,
  }, ["react@19", "react-dom@19", "tailwindcss@4", "@tailwindcss/cli@4"]);
  const vcss = fs.readFileSync(path.join(vite, "src/index.css"), "utf8");
  const vmain = fs.readFileSync(path.join(vite, "src/main.tsx"), "utf8");
  check("Vite: init layers base.css after Tailwind and wraps the entry in ThemeProvider",
    vcss.indexOf('@import "@shavin/ui/base.css" layer(base);') > vcss.indexOf('@import "tailwindcss"') && /render\(\s*<ThemeProvider/.test(vmain));
  sh(path.join(vite, "node_modules/.bin/tailwindcss"), ["-i", "src/index.css", "-o", "out.css"], vite);
  checkBrand("Tailwind v4 (Vite)", fs.readFileSync(path.join(vite, "out.css"), "utf8"));
} catch (e) {
  check("smoke run", false, (e.stderr || e.message || String(e)).toString().split("\n").slice(-6).join(" | "));
} finally {
  if (!KEEP) removeDir(work);
}

const failed = results.filter((r) => !r.ok);
const totalDuration = Date.now() - startTime;

printCard({
  title: failed.length === 0
    ? `${c.brand}${g.brand} All Smoke Tests Passed${c.reset}`
    : `${c.error}${g.stepFail} Smoke Tests Failed (${failed.length} failures)${c.reset}`,
  items: [
    { label: "Duration:", value: `${c.fg}${formatDuration(totalDuration)}${c.reset}` },
    { label: "Checks Passed:", value: `${c.bold}${failed.length === 0 ? c.success : c.error}${results.length - failed.length}/${results.length} checks${c.reset}` },
    { label: "Sandbox:", value: `${c.fgSubtle}${KEEP ? work : "clean (ephemeral)"}${c.reset}` },
  ],
  footer: `${c.fgSubtle}Verified consumer install flow on Next.js 15 (Tailwind CSS v4 and v3) and Vite + Tailwind CSS v4${c.reset}`,
});

process.exit(failed.length ? 1 : 0);
