/**
 * @shavin/cli — Tailwind CSS version + framework detection utility
 *
 * Shared by init.mjs, check.mjs, and brand.mjs to determine whether the
 * consumer project uses Tailwind v3 (JS config + presets) or v4
 * (CSS-first @theme inline, no JS config needed), and whether the project
 * is Next.js, Vite, or generic React.
 *
 * Zero-dependency ESM.
 */
import { existsSync, readFileSync } from "node:fs";
import { join, resolve, relative, dirname } from "node:path";

/**
 * Check whether a tailwind.config.* file exists in the project.
 */
export function hasTailwindConfig(cwd) {
  return ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs"]
    .some((f) => existsSync(join(cwd, f)));
}

/**
 * Detect the installed Tailwind CSS major version in a project.
 *
 * Detection order (first match wins):
 * 1. package.json devDependencies/dependencies → "tailwindcss": "^4" | "^3"
 * 1b. vite.config → @tailwindcss/vite plugin (always v4)
 * 2. postcss.config → "@tailwindcss/postcss" (v4) vs "tailwindcss" (v3)
 * 3. CSS file → @import "tailwindcss" (v4) vs @tailwind base (v3)
 * 4. Fallback: assume v3 (the version Shavin was originally built for)
 *
 * @param {string} cwd — project root directory
 * @returns {{ version: 3|4, source: string, hasConfigFile: boolean }}
 */
export function detectTailwindVersion(cwd) {
  // 1. Check package.json
  const pkgPath = join(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      const twDep = allDeps["tailwindcss"] || "";
      if (/^[~^]?4/.test(twDep)) {
        return { version: 4, source: "package.json", hasConfigFile: hasTailwindConfig(cwd) };
      }
      if (/^[~^]?3/.test(twDep)) {
        return { version: 3, source: "package.json", hasConfigFile: hasTailwindConfig(cwd) };
      }
    } catch {}
  }

  // 1b. Check vite.config for @tailwindcss/vite plugin (always v4)
  const viteConfigCandidates = [
    "vite.config.ts", "vite.config.mjs",
    "vite.config.js", "vite.config.cjs",
  ].map((f) => join(cwd, f));

  for (const vcPath of viteConfigCandidates) {
    if (existsSync(vcPath)) {
      const vcSrc = readFileSync(vcPath, "utf8");
      if (vcSrc.includes("@tailwindcss/vite")) {
        return { version: 4, source: "vite.config", hasConfigFile: hasTailwindConfig(cwd) };
      }
    }
  }

  // 2. Check postcss.config for @tailwindcss/postcss (v4) vs tailwindcss (v3)
  const postcssCandidates = [
    "postcss.config.mjs", "postcss.config.js",
    "postcss.config.cjs", "postcss.config.ts",
  ].map((f) => join(cwd, f));

  for (const pcPath of postcssCandidates) {
    if (existsSync(pcPath)) {
      const pcSrc = readFileSync(pcPath, "utf8");
      if (pcSrc.includes("@tailwindcss/postcss")) {
        return { version: /@tailwindcss\/postcss.*4|"4"|'4'/.test(pcSrc) ? 4 : 4, source: "postcss.config", hasConfigFile: hasTailwindConfig(cwd) };
      }
      if (pcSrc.includes("tailwindcss")) {
        return { version: 3, source: "postcss.config", hasConfigFile: hasTailwindConfig(cwd) };
      }
    }
  }

  // 3. Check CSS files for @import "tailwindcss" (v4) vs @tailwind (v3)
  const cssCandidates = [
    "src/app/globals.css", "app/globals.css",
    "src/index.css", "src/styles/global.css",
    "styles/globals.css", "styles/global.css",
  ].map((f) => join(cwd, f));

  for (const cssPath of cssCandidates) {
    if (existsSync(cssPath)) {
      const cssSrc = readFileSync(cssPath, "utf8");
      if (cssSrc.includes('@import "tailwindcss"') || cssSrc.includes("@import 'tailwindcss'")) {
        return { version: 4, source: "css-import", hasConfigFile: hasTailwindConfig(cwd) };
      }
      if (cssSrc.includes("@tailwind base") || cssSrc.includes("@tailwind")) {
        return { version: 3, source: "css-import", hasConfigFile: hasTailwindConfig(cwd) };
      }
    }
  }

  // 4. Fallback: assume v3 (Shavin was originally built for v3)
  return { version: 3, source: "fallback", hasConfigFile: hasTailwindConfig(cwd) };
}

/**
 * Compute the relative path from a CSS file's directory to the .agents directory.
 * Used for `@source not "..."` in Tailwind v4 projects to exclude skill docs
 * from the v4 content scanner.
 *
 * @param {string} cssFilePath — absolute path to the project's global CSS file
 * @param {string} cwd — project root directory
 * @returns {string} — relative path like "../.agents" or "./.agents"
 */
export function relativeAgentsPath(cssFilePath, cwd) {
  const cssDir = dirname(resolve(cssFilePath));
  const agentsDir = resolve(cwd, ".agents");
  let rel = relative(cssDir, agentsDir);
  // Ensure it starts with ./ or ../
  if (!rel.startsWith(".")) {
    rel = "./" + rel;
  }
  return rel;
}

/**
 * Relative path from the global CSS file to the installed @shavin/ui package,
 * for Tailwind v4's `@source` directive. v4's automatic content detection
 * skips node_modules, so without this the classes used inside @shavin/ui
 * components are never generated and components render unstyled.
 */
export function relativeShavinUiPath(cssFilePath, cwd) {
  const cssDir = dirname(resolve(cssFilePath));
  let rel = relative(cssDir, resolve(cwd, "node_modules", "@shavin", "ui"));
  if (!rel.startsWith(".")) rel = "./" + rel;
  return rel;
}

/**
 * Detect the frontend framework of a consumer project.
 *
 * Detection order (first match wins):
 * 1. package.json dependencies → "next", "vite", "remix", "@remix-run/*"
 * 2. Config files → next.config.*, vite.config.*, remix.config.*
 * 3. Directory structure → app/layout.tsx (Next.js), src/main.tsx (Vite)
 * 4. Fallback: "generic"
 *
 * @param {string} cwd — project root directory
 * @returns {{ framework: "nextjs"|"vite"|"remix"|"generic", source: string }}
 */
export function detectFramework(cwd) {
  // 1. Check package.json dependencies
  const pkgPath = join(cwd, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
      if (allDeps["next"]) {
        return { framework: "nextjs", source: "package.json" };
      }
      if (allDeps["vite"] || allDeps["@vitejs/plugin-react"]) {
        return { framework: "vite", source: "package.json" };
      }
      if (allDeps["@remix-run/node"] || allDeps["@remix-run/react"] || allDeps["remix"]) {
        return { framework: "remix", source: "package.json" };
      }
    } catch {}
  }

  // 2. Check for framework config files
  if (["next.config.mjs", "next.config.js", "next.config.ts", "next.config.cjs"]
      .some((f) => existsSync(join(cwd, f)))) {
    return { framework: "nextjs", source: "config-file" };
  }
  if (["vite.config.ts", "vite.config.mjs", "vite.config.js", "vite.config.cjs"]
      .some((f) => existsSync(join(cwd, f)))) {
    return { framework: "vite", source: "config-file" };
  }
  if (["remix.config.js", "remix.config.ts"].some((f) => existsSync(join(cwd, f)))) {
    return { framework: "remix", source: "config-file" };
  }

  // 3. Directory structure hints
  if (existsSync(join(cwd, "app", "layout.tsx")) || existsSync(join(cwd, "src", "app", "layout.tsx"))) {
    return { framework: "nextjs", source: "directory-structure" };
  }
  if (existsSync(join(cwd, "src", "main.tsx")) || existsSync(join(cwd, "src", "main.jsx"))) {
    return { framework: "vite", source: "directory-structure" };
  }

  // 4. Fallback
  return { framework: "generic", source: "fallback" };
}
