/**
 * Shavin doctor: one read-only health check of a project's Shavin setup, shared by
 * `shavin check` (alias `shavin doctor`), `shavin add` (setup warnings before writing a block)
 * and the MCP `inspect_environment` tool, so all three give the same answer.
 *
 * Pure detection: no writes, no prompts, no ANSI. Callers format.
 *
 * Every check: { id, group, status, label, message, fix? }
 *   group  "environment" (runtime and packages) | "wiring" (CSS, Tailwind, ThemeProvider) | "agents" (agent files)
 *   status "pass" | "warn" | "fail" | "info"  (info never counts for or against the score)
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { posix, relPosix, relSpec } from "./paths.mjs";
import { fileURLToPath } from "node:url";
import { detectFramework, detectTailwindVersion } from "./detect-tailwind.mjs";
import { checkFrameworkSupport, findGlobalCss, hasShavinThemeProvider, hasToastProvider, isShadcnProject, usesNextThemes } from "./init-detect.mjs";
import { SHADCN_BRIDGE_FILE } from "./shadcn-bridge.mjs";
import { detectPackageManager, installCommand, readDeclaredDeps } from "./package-manager.mjs";
import { checkCompat, lowerBound, FX } from "./compat.mjs";

/** Same floor npm enforces through the packages' `engines` (cli, mcp, skills: node >=22). */
/** The edit hook command in .claude/settings.json (`shavin-mcp --hook`; the older `shavin-hook` bin is still recognised). */
const HOOK_RE = /shavin-hook|shavin-mcp\s+--hook/;
const MIN_NODE = [22, 0];
const MIN_REACT = 19;
/** Text that marks the Shavin section init writes into AGENTS.md (current and older wordings). */
const AGENTS_MARKERS = ["UI workflow: look up, build to the rules, validate", "Mandatory 3-Step UI Execution Protocol", "Anti-Slop Law"];
/** Where apps commonly mount client providers next to the root layout. */
const PROVIDER_FILES = [
  "src/app/providers.tsx", "app/providers.tsx", "src/components/providers.tsx", "components/providers.tsx", "src/providers.tsx",
];
const LAYOUTS = [
  "src/app/layout.tsx", "app/layout.tsx", "src/app/layout.jsx", "app/layout.jsx", "src/pages/_app.tsx", "pages/_app.tsx",
  "src/main.tsx", "src/main.jsx", "src/App.tsx", "src/App.jsx", "App.tsx", "App.jsx", "app/root.tsx",
];
const LOCKFILES = { "package-lock.json": "npm", "pnpm-lock.yaml": "pnpm", "yarn.lock": "yarn", "bun.lockb": "bun", "bun.lock": "bun" };

/** The import path from `from`'s folder to `to`, as written in source ("./globals.css", "../styles/globals.css"). */
const spec = (from, to) => relSpec(dirname(from), to);
const readJson = (p) => { try { return JSON.parse(readFileSync(p, "utf8")); } catch { return null; } };
const read = (p) => { try { return readFileSync(p, "utf8"); } catch { return ""; } };
const majorMinor = (v) => (String(v || "").match(/(\d+)\.(\d+)/) || []).slice(1, 3).map(Number);
/** The installed version of `name`, found the way Node resolves it: in this folder's node_modules or a parent's (workspaces hoist). */
function installedVersion(cwd, name) {
  for (let dir = cwd; ; dir = dirname(dir)) {
    const v = readJson(join(dir, "node_modules", name, "package.json"))?.version;
    if (v) return v;
    if (dirname(dir) === dir) return null;
  }
}
/** This CLI's version (null when the module is loaded from somewhere without a file URL, e.g. a test bundler). */
function cliVersion() {
  try { return readJson(fileURLToPath(new URL("../../package.json", import.meta.url)))?.version ?? null; } catch { return null; }
}

/** Skill files missing from, or different in, the project's .agents/skills compared with the packaged skills. */
function staleSkills(cwd, skillsDir, extraSources) {
  const source = [join(cwd, "node_modules", "@shavin", "skills", "skills"), ...extraSources].find((p) => p && existsSync(p));
  if (!source || resolve(source) === resolve(skillsDir)) return [];
  const stale = [];
  const walk = (dir, rel = "") => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(join(dir, e.name), r);
      else if (e.name.endsWith(".md") && read(join(skillsDir, r)) !== read(join(dir, e.name))) stale.push(r);
    }
  };
  walk(source);
  return stale;
}

/**
 * @param {string} [cwd]
 * @param {{ skillsSources?: string[] }} [opts] extra places to compare .agents/skills against (the MCP passes its bundled copy)
 */
export function runDoctor(cwd = process.cwd(), { skillsSources = [] } = {}) {
  cwd = resolve(cwd);
  const rel = (p) => (p.startsWith(cwd) ? posix(p.slice(cwd.length + 1)) : posix(p)); // messages and fixes always use forward slashes
  const checks = [];
  const add = (group, id, status, label, message, fix) => checks.push({ id, group, status, label, message, ...(fix ? { fix } : {}) });

  const tw = detectTailwindVersion(cwd);
  const fw = detectFramework(cwd);
  const pkg = readJson(join(cwd, "package.json"));
  const deps = readDeclaredDeps(cwd);
  const cssPath = findGlobalCss(cwd);
  const layout = LAYOUTS.map((f) => join(cwd, f)).find(existsSync);
  // A monorepo root with no app of its own: app checks belong inside each app (apps/…, packages/…).
  const workspaceRoot = !!pkg?.workspaces && !cssPath && !layout;

  // ── Environment ─────────────────────────────────────────────────────────
  const [nMaj, nMin] = majorMinor(process.versions.node);
  const nodeOk = nMaj > MIN_NODE[0] || (nMaj === MIN_NODE[0] && nMin >= MIN_NODE[1]);
  add("environment", "node", nodeOk ? "pass" : "fail", "Node.js", `${process.versions.node}${nodeOk ? "" : ` (needs ${MIN_NODE.join(".")} or newer)`}`,
    nodeOk ? undefined : `Install Node.js ${MIN_NODE.join(".")} or newer`);

  // Same rule `shavin init` enforces: Next.js and Vite (with React) are supported today, other frameworks later.
  if (workspaceRoot) { /* app checks run inside each app */ }
  else if (pkg) {
    const support = checkFrameworkSupport(cwd, fw);
    if (support.ok) add("environment", "framework", "pass", "Framework", `${fw.framework === "nextjs" ? "Next.js" : "Vite + React"} (${fw.source})`);
    else add("environment", "framework", "fail", "Framework", `${support.found}: not supported yet. Shavin supports Next.js and Vite (with React 19) today; other frameworks are planned for later`,
      "Use a Next.js or Vite + React app (npx create-next-app@latest, or npm create vite@latest -- --template react-ts), or run the check inside the app's folder in a monorepo");
  }

  if (!pkg) add("environment", "package-json", "fail", "package.json", "No readable package.json in this folder", "Run the check from your project root");

  const locks = Object.keys(LOCKFILES).filter((f) => existsSync(join(cwd, f)));
  const pm = detectPackageManager(cwd);
  const managers = [...new Set(locks.map((f) => LOCKFILES[f]))];
  if (managers.length > 1) add("environment", "package-manager", "warn", "Package manager", `Lockfiles for ${managers.join(" and ")} (${locks.join(", ")}); Shavin uses ${pm}`, "Keep one lockfile");
  else add("environment", "package-manager", "info", "Package manager", pm + (locks.length ? ` (${locks[0]})` : " (no lockfile yet)"));

  if (workspaceRoot) add("environment", "workspace-root", "info", "Workspace root", "This is a monorepo root without an app of its own; run the check inside an app for the setup checks");
  const reactDeclared = workspaceRoot ? null : deps["react"];
  const reactVersion = installedVersion(cwd, "react") ?? reactDeclared;
  if (workspaceRoot) { /* app checks run inside each app */ }
  else if (!reactDeclared) add("environment", "react", "fail", "React", "react is not in package.json", "Install react@19 and react-dom@19");
  else {
    const [rMaj] = majorMinor(reactVersion);
    const ok = rMaj >= MIN_REACT;
    add("environment", "react", ok ? "pass" : "fail", "React", `${reactVersion}${ok ? "" : ` (Shavin needs React ${MIN_REACT})`}`, ok ? undefined : `Upgrade react and react-dom to ${MIN_REACT}`);
  }
  if (reactDeclared && !deps["react-dom"]) add("environment", "react-dom", "fail", "react-dom", "react-dom is not in package.json", "Install react-dom");

  const uiDeclared = deps["@shavin/ui"];
  const uiInstalled = installedVersion(cwd, "@shavin/ui");
  if (workspaceRoot) { /* app checks run inside each app */ }
  else if (!uiDeclared) add("environment", "ui-package", "fail", "@shavin/ui", "Not in package.json", "Run npx @shavin/cli init");
  else if (!uiInstalled) add("environment", "ui-package", "warn", "@shavin/ui", `${uiDeclared} declared but not installed`, `Run ${pm} install`);
  else add("environment", "ui-package", "pass", "@shavin/ui", uiInstalled);

  const cli = cliVersion();
  if (uiInstalled && cli) {
    const [a, b] = majorMinor(uiInstalled);
    const [c, d] = majorMinor(cli);
    const aligned = a === c && b === d;
    add("environment", "version-alignment", aligned ? "pass" : "warn", "Version alignment", aligned ? `@shavin/ui ${uiInstalled} and @shavin/cli ${cli}` : `@shavin/ui ${uiInstalled} but @shavin/cli ${cli}`,
      aligned ? undefined : "Use matching @shavin/ui and @shavin/cli versions");
  }

  // cli, mcp and skills document a @shavin/ui range (package.json "shavin.compat"); warn when the installed @shavin/ui is outside it.
  // Silent when @shavin/ui, the tools or their ranges are absent.
  const compat = checkCompat(cwd, pm);
  if (compat.compared) {
    if (!compat.mismatches.length) add("environment", "package-compat", "pass", "Package compatibility", `@shavin/ui ${uiInstalled} is inside the range each installed Shavin tool documents`);
    else {
      // One fix per direction: ui older than a range → the highest lower bound among them; ui newer → upgrade each tool behind.
      const older = compat.mismatches.filter((m) => m.direction === "ui-older");
      const fixes = [];
      if (older.length) {
        const top = older.map((m) => lowerBound(m.range)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop();
        fixes.push(installCommand(pm, [`@shavin/ui@^${top}`]));
      }
      const newer = compat.mismatches.filter((m) => m.direction === "ui-newer");
      const behind = newer.filter((m) => m.tool !== FX).map((m) => `${m.tool}@latest`);
      if (behind.length) fixes.push(installCommand(pm, behind, { dev: true }));
      // @shavin/fx is a runtime dependency, so it is upgraded without -D.
      if (newer.some((m) => m.tool === FX)) fixes.push(installCommand(pm, [`${FX}@latest`]));
      add("environment", "package-compat", "warn", "Package compatibility", compat.mismatches.map((m) => m.message).join("; "), `Run ${fixes.join(" and ")}`);
    }
  }

  if (workspaceRoot) { /* app checks run inside each app */ }
  else if (!deps["tailwindcss"]) add("environment", "tailwind-package", "fail", "Tailwind CSS", "tailwindcss is not in package.json (Shavin needs Tailwind 3.4 or 4)", "Install Tailwind CSS, then run npx @shavin/cli init");
  else add("environment", "tailwind-package", "pass", "Tailwind CSS", `v${tw.version} (via ${tw.source})`);

  // ── Wiring ──────────────────────────────────────────────────────────────
  const css = cssPath ? read(cssPath) : "";
  const cssName = cssPath ? rel(cssPath) : "your global stylesheet";
  if (!cssPath && !workspaceRoot) add("wiring", "global-css", "fail", "Global stylesheet", "No global stylesheet found (app/globals.css, src/index.css …)", "Create one and run npx @shavin/cli init");

  if (cssPath && tw.version === 4) {
    const split = /@shavin\/ui\/tokens(-oklch)?\.css/.test(css);
    const whole = /@shavin\/ui\/(styles|global-oklch)\.css/.test(css);
    if (split || whole) add("wiring", "tokens-import", "pass", "Tokens import", `${split ? "tokens.css" : "styles.css"} in ${cssName}`);
    else add("wiring", "tokens-import", "fail", "Tokens import", `No @shavin/ui tokens import in ${cssName}`, 'Add @import "@shavin/ui/tokens.css"; after @import "tailwindcss"');
    if (split) {
      const layered = /@shavin\/ui\/base(-oklch)?\.css["']\s*layer\(base\)/.test(css);
      add("wiring", "base-layer", layered ? "pass" : "warn", "Element defaults", layered ? "base.css in Tailwind's base layer" : `base.css is not imported with layer(base) in ${cssName}`,
        layered ? undefined : 'Add @import "@shavin/ui/base.css" layer(base); after the tokens import');
    }
    const themeOk = /@shavin\/ui\/theme-v4(-oklch)?\.css/.test(css);
    add("wiring", "theme-v4", themeOk ? "pass" : "fail", "Tailwind 4 theme", themeOk ? `theme-v4 in ${cssName}` : `No @import "@shavin/ui/theme-v4.css" in ${cssName}`,
      themeOk ? undefined : 'Add @import "@shavin/ui/theme-v4.css";');
    // node_modules/@shavin/ui in a project; packages/ui by path inside the Shavin repository.
    const sourceOk = /@source\s+["'][^"']*(@shavin\/ui|packages\/ui)[^"']*["']/.test(css);
    add("wiring", "source", sourceOk ? "pass" : "fail", "@shavin/ui @source", sourceOk ? "Component classes get generated" : "Tailwind 4 skips node_modules, so Shavin components render unstyled",
      sourceOk ? undefined : `Add @source "<path>/node_modules/@shavin/ui"; to ${cssName}`);
    const notOk = /@source\s+not\s/.test(css);
    add("wiring", "source-not-agents", notOk ? "pass" : "warn", "Skill docs excluded", notOk ? "@source not for .agents" : "Tailwind may scan .agents skill docs and fail on their examples",
      notOk ? undefined : `Add @source not "<path>/.agents"; to ${cssName}`);
    const notClaude = /@source\s+not\s+["'][^"']*\.claude["']/.test(css);
    add("wiring", "source-not-claude", notClaude ? "pass" : "warn", "Claude skill docs excluded", notClaude ? "@source not for .claude" : "Tailwind may scan .claude skill docs and fail on their examples",
      notClaude ? undefined : `Add @source not "<path>/.claude"; to ${cssName}`);
    if (fw.framework === "vite") {
      const vc = ["vite.config.ts", "vite.config.mjs", "vite.config.js", "vite.config.cjs"].map((f) => join(cwd, f)).find(existsSync);
      if (vc) {
        const ok = read(vc).includes("@tailwindcss/vite");
        add("wiring", "vite-plugin", ok ? "pass" : "warn", "Vite Tailwind plugin", ok ? "@tailwindcss/vite" : `No @tailwindcss/vite in ${rel(vc)}`, ok ? undefined : "Add @tailwindcss/vite to the Vite plugins");
      }
    }
  } else if (cssPath) {
    const importOk = /@shavin\/ui\/(styles|global-oklch)\.css/.test(css);
    add("wiring", "tokens-import", importOk ? "pass" : "fail", "Stylesheet import", importOk ? `styles.css in ${cssName}` : `No @import "@shavin/ui/styles.css" in ${cssName}`,
      importOk ? undefined : 'Add @import "@shavin/ui/styles.css"; at the top');
  }

  if (tw.version !== 4 && !workspaceRoot) {
    const cfg = ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs", "tailwind.config.cjs"].map((f) => join(cwd, f)).find(existsSync);
    if (!cfg) add("wiring", "tailwind-config", "fail", "Tailwind 3 config", "No tailwind.config.*", "Run npx @shavin/cli init");
    else {
      const src = read(cfg);
      const presetOk = /tailwind-preset/.test(src);
      add("wiring", "tailwind-preset", presetOk ? "pass" : "fail", "Tailwind 3 preset", presetOk ? `In ${rel(cfg)}` : `${rel(cfg)} does not load @shavin/ui/tailwind-preset`,
        presetOk ? undefined : "Add the @shavin/ui preset to presets (npx @shavin/cli init does it)");
      const scans = /node_modules\/@shavin\/ui|packages\/ui/.test(src);
      if (presetOk) add("wiring", "tailwind-content", scans ? "pass" : "warn", "Tailwind 3 content", scans ? "Scans @shavin/ui" : "content does not include node_modules/@shavin/ui, so component classes may be missing",
        scans ? undefined : 'Add "./node_modules/@shavin/ui/**/*.{js,mjs,ts,tsx}" to content');
    }
  }

  if (cssPath && !workspaceRoot && isShadcnProject(cwd)) {
    if (tw.version !== 4) add("wiring", "shadcn-bridge", "info", "shadcn/ui theme bridge", "shadcn/ui on Tailwind 3 uses hsl() triplets; its colours are not mapped to Shavin's brand");
    else {
      const there = existsSync(join(dirname(cssPath), SHADCN_BRIDGE_FILE));
      const imported = new RegExp(`@import\\s+["']\\./${SHADCN_BRIDGE_FILE.replace(/\./g, "\\.")}["']`).test(css);
      const ok = there && imported;
      add("wiring", "shadcn-bridge", ok ? "pass" : "warn", "shadcn/ui theme bridge", ok ? "shadcn variables follow Shavin's brand" : there ? `${SHADCN_BRIDGE_FILE} exists but ${cssName} does not import it` : "shadcn/ui is installed but its colours are not mapped to Shavin, so a brand change restyles only Shavin",
        ok ? undefined : there ? `Add @import "./${SHADCN_BRIDGE_FILE}"; to ${cssName}` : "Run npx @shavin/cli init");
    }
  }

  if (cssPath) {
    // A consumer override of --brand-solid / --brand-fg bypasses the brandSolid guarantee: check it when both are literal colours in one rule.
    const bad = lowContrastSolidOverrides(css);
    if (bad.length) add("wiring", "brand-solid-override", "warn", "Brand solid override", `${cssName} sets --brand-solid and --brand-fg to a pair under 4.5:1 (${bad.map((b) => `${b.ratio.toFixed(2)}:1 in "${b.selector}"`).join(", ")}), so text on solid brand fills fails WCAG 2 AA`,
      "Pick a --brand-fg with 4.5:1 on --brand-solid (and on --brand-solid-hover), or remove the override and let ThemeProvider brandSolid derive it");
  }

  if (cssPath) {
    const brandFile = join(dirname(cssPath), "brand-tokens.css");
    if (existsSync(brandFile)) {
      const imported = /@import\s+["']\.\/brand-tokens(-oklch)?\.css["']/.test(css);
      add("wiring", "brand-tokens", imported ? "pass" : "warn", "Brand tokens", imported ? "brand-tokens.css imported" : `brand-tokens.css exists but ${cssName} does not import it`,
        imported ? undefined : 'Add @import "./brand-tokens.css";');
    }
  }

  if (workspaceRoot) { /* app checks run inside each app */ }
  else if (!layout) add("wiring", "theme-provider", "warn", "ThemeProvider", "No root layout found to host <ThemeProvider>", "Wrap your app in <ThemeProvider> from @shavin/ui");
  else {
    const src = read(layout);
    if (hasShavinThemeProvider(src) && !/<ThemeProvider\b/.test(src)) add("wiring", "theme-provider", "fail", "ThemeProvider", `${rel(layout)} imports ThemeProvider but never renders it`, "Wrap your app in <ThemeProvider> (run npx @shavin/cli init to do it)");
    else if (hasShavinThemeProvider(src)) {
      add("wiring", "theme-provider", "pass", "ThemeProvider", `In ${rel(layout)}; Dev Inspector active in development`);
      // brandSolid decides the fill under text on the brand (solid Button, Badge, selected states).
      const solidMode = /<ThemeProvider\b[^>]*\bbrandSolid\s*=\s*(?:"(\w+)"|\{\s*["'](\w+)["']\s*\})/.exec(src);
      const solid = solidMode ? (solidMode[1] ?? solidMode[2]) : "accessible";
      if (solid === "perceptual") add("wiring", "brand-solid", "warn", "Brand solid fill", `${rel(layout)} sets brandSolid="perceptual": text on solid brand fills is white wherever APCA prefers it, which does not meet WCAG 2 AA (4.5:1) on 14 of the 24 shipped brand colours`, 'Remove the brandSolid prop or set brandSolid="accessible" to restore the guarantee');
      else if (solid === "exact") add("wiring", "brand-solid", "info", "Brand solid fill", `brandSolid="exact": solid brand fills use the exact brand colour, so mid-tone brands get near-black text`, 'Remove the prop (default "accessible") for white text on a slightly deeper fill');
      else add("wiring", "brand-solid", "pass", "Brand solid fill", solidMode ? `brandSolid="${solid}"` : 'brandSolid="accessible" (default): white text >= 4.6:1 on solid brand fills, light brands keep their exact fill');
      // useToast() throws outside a ToastProvider, so success and error toasts need one mounted once.
      const host = [layout, ...PROVIDER_FILES.map((f) => join(cwd, f))].find((f) => existsSync(f) && hasToastProvider(read(f)));
      add("wiring", "toast-provider", host ? "pass" : "warn", "ToastProvider",
        host ? `In ${rel(host)}; useToast() works anywhere below it` : `No <ToastProvider> in ${rel(layout)}, so useToast() throws and success/error toasts cannot show`,
        host ? undefined : `Run npx @shavin/cli init, or add ToastProvider to the @shavin/ui import in ${rel(layout)} and render <ToastProvider>{children}</ToastProvider> directly inside <ThemeProvider>`);
    }
    else if (usesNextThemes(src) || /\bThemeProvider\b/.test(src))
      add("wiring", "theme-provider", "info", "ThemeProvider", `${rel(layout)} uses another theme provider; Shavin components follow its .dark class, without Shavin's theme settings or the Dev Inspector`);
    else add("wiring", "theme-provider", "fail", "ThemeProvider", `No <ThemeProvider> in ${rel(layout)}`, "Run npx @shavin/cli init, or wrap your app in <ThemeProvider> from @shavin/ui");
  }

  // ── Rendering chain: the gaps that leave Shavin unstyled while every file "exists" ──
  if (!workspaceRoot && cssPath && layout) {
    const entry = read(layout);
    const base = basename(cssPath).replace(/\./g, "\\.");
    const imported = new RegExp(`import\\s+(?:[\\w{}*\\s,]+\\s+from\\s+)?["'][^"']*${base}(?:\\?[^"']*)?["']`).test(entry);
    add("wiring", "css-imported", imported ? "pass" : "fail", "Stylesheet loaded", imported ? `${rel(layout)} imports ${rel(cssPath)}` : `${rel(layout)} does not import ${rel(cssPath)}, so no Shavin styles reach the page`,
      imported ? undefined : `Add import "${spec(layout, cssPath)}"; at the top of ${rel(layout)}`);
  }
  if (!workspaceRoot && tw.version === 4 && fw.framework === "nextjs") {
    const pc = ["postcss.config.mjs", "postcss.config.js", "postcss.config.cjs", "postcss.config.ts", ".postcssrc", ".postcssrc.json"].map((f) => join(cwd, f)).find(existsSync);
    const inPkg = !!pkg?.postcss && JSON.stringify(pkg.postcss).includes("@tailwindcss/postcss");
    const ok = inPkg || (pc && read(pc).includes("@tailwindcss/postcss"));
    add("wiring", "postcss-plugin", ok ? "pass" : "fail", "Tailwind 4 PostCSS plugin", ok ? "@tailwindcss/postcss" : pc ? `${rel(pc)} does not load @tailwindcss/postcss` : "No postcss.config with @tailwindcss/postcss, so Tailwind never runs",
      ok ? undefined : `Install @tailwindcss/postcss and add { plugins: { "@tailwindcss/postcss": {} } } to postcss.config.mjs`);
  }
  if (!workspaceRoot && layout && /\.(tsx|jsx)$/.test(layout) && /<html\b/.test(read(layout))) {
    // Shavin's ThemeProvider sets the dark/light class on <html> after hydration.
    const ok = /<html\b[^>]*suppressHydrationWarning/.test(read(layout));
    add("wiring", "html-hydration", ok ? "pass" : "warn", "Theme class on <html>", ok ? "suppressHydrationWarning set" : `${rel(layout)}: <html> lacks suppressHydrationWarning, so the theme class causes a hydration warning`,
      ok ? undefined : "Add suppressHydrationWarning to <html>");
  }

  // ── Agent files ─────────────────────────────────────────────────────────
  const agents = read(join(cwd, "AGENTS.md"));
  if (!agents) add("agents", "agents-md", "warn", "AGENTS.md", "Missing", "Run npx @shavin/cli init");
  else if (!AGENTS_MARKERS.some((m) => agents.includes(m))) add("agents", "agents-md", "warn", "AGENTS.md", "Present but has no Shavin section", "Run npx @shavin/cli init to add it");
  else add("agents", "agents-md", "pass", "AGENTS.md", "Has the Shavin section");

  const claudeMd = read(join(cwd, "CLAUDE.md"));
  if (!claudeMd) add("agents", "claude-md", "warn", "CLAUDE.md", "Missing (instructions for Claude Code)", "Run npx @shavin/cli init");
  else {
    // Claude Code reads CLAUDE.md only (not AGENTS.md) when both exist, so the Shavin rules must be imported or inlined.
    const imports = /^@SHAVIN\.md\s*$/m.test(claudeMd) && /^@AGENTS\.md\s*$/m.test(claudeMd);
    const inlined = claudeMd.includes("## The rule") && claudeMd.includes("## States");
    add("agents", "claude-md", imports || inlined ? "pass" : "warn", "CLAUDE.md", imports ? "Imports SHAVIN.md and AGENTS.md" : inlined ? "Has the Shavin rules inline" : "Present, but Claude Code will not load AGENTS.md or SHAVIN.md from it",
      imports || inlined ? undefined : "Run npx @shavin/cli init (adds the Shavin block), or add @SHAVIN.md and @AGENTS.md lines to CLAUDE.md");
  }
  for (const [id, file, why] of [
    ["shavin-md", "SHAVIN.md", "the design brief agents read"],
    ["shavin-config", ".shavin/config.json", "project settings"],
  ]) {
    const ok = existsSync(join(cwd, file));
    add("agents", id, ok ? "pass" : "warn", file, ok ? "Present" : `Missing (${why})`, ok ? undefined : "Run npx @shavin/cli init");
  }

  const mcpFiles = [".mcp.json", ".cursor/mcp.json", ".vscode/mcp.json"];
  const mcpFile = mcpFiles.find((f) => {
    const j = readJson(join(cwd, f));
    return !!j && Object.values(j.mcpServers || j.servers || {}).some((s) => /@shavin\/mcp|shavin-mcp/.test(JSON.stringify(s)));
  });
  add("agents", "mcp-config", mcpFile ? "pass" : "warn", "MCP server config", mcpFile ? `${mcpFile} registers the Shavin MCP server` : `No Shavin server in ${mcpFiles.join(", ")} (fine if your editor registers it elsewhere)`,
    mcpFile ? undefined : "Run npx @shavin/cli init");

  const skillsDir = join(cwd, ".agents", "skills");
  if (!existsSync(skillsDir)) add("agents", "skills", "warn", "Agent skills", "No .agents/skills", "Run npx @shavin/cli init");
  else {
    const stale = staleSkills(cwd, skillsDir, skillsSources);
    add("agents", "skills", stale.length ? "warn" : "pass", "Agent skills", stale.length ? `${stale.length} file(s) differ from the installed @shavin/skills (e.g. ${stale.slice(0, 3).join(", ")})` : "Installed and up to date",
      stale.length ? "Run npx @shavin/skills --force" : undefined);
  }
  const commandsDir = join(cwd, ".agents", "commands");
  const cmdCount = existsSync(commandsDir) ? readdirSync(commandsDir).filter((f) => f.endsWith(".md")).length : 0;
  add("agents", "commands", cmdCount ? "pass" : "warn", "Agent commands", cmdCount ? `${cmdCount} installed` : "No .agents/commands", cmdCount ? undefined : "Run npx @shavin/skills --force");

  // Claude Code reads .claude/skills and .claude/commands (not .agents/).
  const claudeSkillsDir = join(cwd, ".claude", "skills");
  if (!existsSync(join(claudeSkillsDir, "shavin-app", "SKILL.md"))) add("agents", "claude-skills", "warn", "Claude Code skills", "No .claude/skills/shavin-app (Claude Code does not read .agents/skills)", "Run npx @shavin/skills --force");
  else {
    const stale = staleSkills(cwd, claudeSkillsDir, skillsSources);
    add("agents", "claude-skills", stale.length ? "warn" : "pass", "Claude Code skills", stale.length ? `${stale.length} file(s) differ from the installed @shavin/skills (e.g. ${stale.slice(0, 3).join(", ")})` : "Installed and up to date",
      stale.length ? "Run npx @shavin/skills --force" : undefined);
  }
  const settingsText = read(join(cwd, ".claude", "settings.json"));
  const mcpThere = existsSync(join(cwd, "node_modules", "@shavin", "mcp"));
  if (!mcpThere && HOOK_RE.test(settingsText)) {
    add("agents", "edit-hook", "warn", "Edit hook", ".claude/settings.json runs the Shavin edit hook but @shavin/mcp is not installed, so Claude Code reports an error after every edit", `Run ${pm} install -D @shavin/mcp, or remove the shavin-hook entry from .claude/settings.json`);
  } else if (mcpThere) {
    const settings = settingsText;
    const ok = HOOK_RE.test(settings);
    add("agents", "edit-hook", ok ? "pass" : "warn", "Edit hook", ok ? "Claude Code checks every .tsx/.jsx it writes (.claude/settings.json)" : "No Shavin edit hook in .claude/settings.json, so nothing re-checks code after each edit",
      ok ? undefined : `Run npx @shavin/cli init, or add a PostToolUse hook for Write|Edit|MultiEdit running "npx --no-install shavin-mcp --hook"`);
  }
  if (existsSync(join(cwd, ".cursor"))) {
    const ok = existsSync(join(cwd, ".cursor", "rules", "shavin.mdc"));
    add("agents", "cursor-rule", ok ? "pass" : "warn", "Cursor rule", ok ? ".cursor/rules/shavin.mdc" : "No .cursor/rules/shavin.mdc", ok ? undefined : "Run npx @shavin/skills");
  }

  const summary = { pass: 0, warn: 0, fail: 0, info: 0 };
  for (const c of checks) summary[c.status]++;
  // 100% means nothing fails; warnings are listed but do not lower the score (or fail CI).
  const scored = summary.pass + summary.fail;
  return {
    ok: summary.fail === 0,
    score: scored ? Math.round((summary.pass / scored) * 100) : 100,
    summary,
    framework: fw.framework, frameworkSource: fw.source,
    tailwind: tw.version, tailwindSource: tw.source,
    checks,
  };
}


/** A CSS colour as an [r, g, b] triple: #rgb, #rrggbb, "r g b" or rgb(r g b) / rgb(r, g, b). Anything else (var(), oklch, names) is null. */
function literalRgb(value) {
  const v = value.trim().replace(/!important$/, "").trim();
  let m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(v);
  if (m) {
    const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  m = /^(?:rgb\(\s*)?(\d{1,3})[\s,]+(\d{1,3})[\s,]+(\d{1,3})\s*\)?$/i.exec(v);
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}

function wcagContrast(a, b) {
  const lum = ([r, g, bl]) => {
    const l = (c) => ((c /= 255) <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    return 0.2126 * l(r) + 0.7152 * l(g) + 0.0722 * l(bl);
  };
  const x = lum(a);
  const y = lum(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

/**
 * Rules in `css` that set --brand-solid and --brand-fg (and optionally --brand-solid-hover) to literal colours
 * whose text pair is under 4.5:1. A static check: values behind var(), oklch() or color-mix() are not evaluated.
 */
export function lowContrastSolidOverrides(css) {
  const out = [];
  const stripped = css.replace(/\/\*[\s\S]*?\*\//g, "");
  for (const rule of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const decl = (name) => new RegExp(`(?:^|[;\\s])--${name}\\s*:\\s*([^;]+)`).exec(rule[2])?.[1];
    const fg = decl("brand-fg") && literalRgb(decl("brand-fg"));
    if (!fg) continue;
    for (const name of ["brand-solid", "brand-solid-hover"]) {
      const fill = decl(name) && literalRgb(decl(name));
      if (!fill) continue;
      const ratio = wcagContrast(fg, fill);
      if (ratio < 4.5) out.push({ selector: rule[1].trim().split("\n").pop().trim(), token: name, ratio });
    }
  }
  return out;
}
