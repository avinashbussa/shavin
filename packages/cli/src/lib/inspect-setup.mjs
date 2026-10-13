import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { detectTailwindVersion, detectFramework } from "./detect-tailwind.mjs";

/**
 * Inspect a consumer project's Shavin wiring — the setup that makes installed
 * blocks render correctly (Tailwind theme import, the v4 `@source` that stops
 * node_modules components rendering unstyled, and `<ThemeProvider>`).
 *
 * Single source of truth for setup detection: `check` renders every entry in
 * `checks`; `add` reads `ok` / `issues` to warn before writing a block. Pure
 * detection — no writes, no prompts, no ANSI (callers format).
 *
 * @param {string} [cwd]
 * @returns {{
 *   ok: boolean,
 *   framework: string, frameworkSource: string,
 *   tailwind: number, tailwindSource: string,
 *   checks: { label: string, ok: boolean, title?: string, note?: string, message?: string }[],
 *   issues: { label: string, fix: string }[],
 * }}
 */
export function inspectSetup(cwd = process.cwd()) {
  const tw = detectTailwindVersion(cwd);
  const fw = detectFramework(cwd);
  const rel = (p) => (p.startsWith(cwd) ? p.slice(cwd.length + 1) : p);
  const checks = [];
  const pass = (label, title, note) => checks.push({ label, ok: true, title, note });
  const warn = (label, message) => checks.push({ label, ok: false, message });

  // 1. Tailwind / CSS-first setup (version-aware)
  if (tw.version === 4) {
    const cssPath = [
      "src/app/globals.css", "app/globals.css", "src/index.css",
      "src/styles/global.css", "styles/globals.css", "styles/global.css",
    ].map((f) => resolve(cwd, f)).find(existsSync);

    if (!cssPath) {
      warn("Tailwind v4 CSS", "No global CSS file found for the theme import");
    } else {
      const css = readFileSync(cssPath, "utf8");
      const oklch = /@import\s+["']@shavin\/ui\/theme-v4-oklch\.css["']/.test(css);
      const hasTheme = oklch || /@import\s+["']@shavin\/ui\/theme-v4\.css["']/.test(css);
      if (hasTheme) pass("Tailwind v4 Theme", "Configured", `theme-v4${oklch ? "-oklch" : ""}.css @theme inline · ${oklch ? "OKLCH" : "RGB"}`);
      else warn("Tailwind v4 Theme", `Missing @import "@shavin/ui/theme-v4.css" in ${rel(cssPath)}`);

      if (/@source\s+["'][^"']*@shavin\/ui[^"']*["']/.test(css)) pass("@shavin/ui Source", "Registered", "component classes get generated");
      else warn("@shavin/ui Source", `Missing @source for node_modules/@shavin/ui in ${rel(cssPath)} — v4 skips node_modules, so components render unstyled`);

      if (css.includes("@source not")) pass("Skill Doc Exclusion", "Active", "@source not for .agents");
      else warn("Skill Doc Exclusion", "Missing @source not for .agents (may cause CSS errors)");
    }

    if (fw.framework === "vite") {
      const vc = ["vite.config.ts", "vite.config.mjs", "vite.config.js", "vite.config.cjs"]
        .map((f) => resolve(cwd, f)).find(existsSync);
      if (vc) {
        if (readFileSync(vc, "utf8").includes("@tailwindcss/vite")) pass("Vite TW Plugin", "Configured", "@tailwindcss/vite");
        else warn("Vite TW Plugin", "Missing @tailwindcss/vite in vite.config");
      }
    }
  } else {
    const twCfg = ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs"]
      .map((f) => join(cwd, f)).find(existsSync);
    if (twCfg) pass("Tailwind Preset", "Configured", "tailwind-preset.ts");
    else warn("Tailwind CSS", "No tailwind.config.* with the @shavin/ui preset");
  }

  // 2. @shavin/ui dependency
  const pkgPath = join(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      const dep = { ...pkg.dependencies, ...pkg.devDependencies }["@shavin/ui"];
      if (dep) pass("@shavin/ui Package", "Installed", dep);
      else warn("@shavin/ui Package", "Missing from package.json dependencies");
    } catch {
      warn("@shavin/ui Package", "Could not parse package.json");
    }
  }

  // 3. ThemeProvider in the root layout
  const layout = [
    "src/app/layout.tsx", "app/layout.tsx", "src/pages/_app.tsx", "pages/_app.tsx",
    "src/main.tsx", "src/main.jsx", "src/App.tsx", "src/App.jsx", "App.tsx", "App.jsx", "app/root.tsx",
  ].map((f) => resolve(cwd, f)).find(existsSync);

  if (!layout) warn("Root Layout", "No root layout file found to host <ThemeProvider>");
  else if (readFileSync(layout, "utf8").includes("ThemeProvider")) pass("ThemeProvider", "Wired", "DevInspector active");
  else warn("ThemeProvider", `Missing <ThemeProvider> wrapper in ${rel(layout)}`);

  const issues = checks.filter((c) => !c.ok).map((c) => ({ label: c.label, fix: c.message }));
  return {
    ok: issues.length === 0,
    framework: fw.framework, frameworkSource: fw.source,
    tailwind: tw.version, tailwindSource: tw.source,
    checks, issues,
  };
}
