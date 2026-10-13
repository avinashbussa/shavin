import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

/**
 * Skill files in a project's .agents/skills that are missing or differ from the packaged
 * skills (the project's @shavin/skills, else the copy bundled with this server). Files that
 * exist only in the project are left alone: they may be the project's own additions.
 */
function staleSkillFiles(targetDir, skillsPath) {
  const source = [
    resolve(targetDir, "node_modules", "@shavin", "skills", "skills"),
    fileURLToPath(new URL("../../assets/skills", import.meta.url)),
  ].find(existsSync);
  if (!source || resolve(source) === resolve(skillsPath)) return [];
  const stale = [];
  const walk = (dir, rel = "") => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const r = rel ? `${rel}/${e.name}` : e.name;
      if (e.isDirectory()) walk(resolve(dir, e.name), r);
      else if (e.name.endsWith(".md")) {
        const copy = resolve(skillsPath, r);
        if (!existsSync(copy) || readFileSync(copy, "utf8") !== readFileSync(resolve(dir, e.name), "utf8")) stale.push(r);
      }
    }
  };
  walk(source);
  return stale;
}

export function registerEnvironmentTools(server, ROOT) {
  return [
    {
      schema: {
        name: "get_setup_instructions",
        description: "Return step-by-step wiring instructions for integrating @shavin/ui into Next.js or standard React applications. Supports both Tailwind v3 (JS config) and v4 (CSS-first).",
        inputSchema: {
          type: "object",
          properties: {
            framework: {
              type: "string",
              enum: ["nextjs", "react-vite", "generic"],
              description: "Target application framework (default: 'nextjs').",
            },
            tailwindVersion: {
              type: "string",
              enum: ["v3", "v4", "auto"],
              description: "Tailwind CSS version (default: 'auto' — auto-detect from project).",
            },
          },
        },
      },
      handler: async (args) => {
        // Normalize framework enum values to internal names
        const rawFramework = args?.framework || "nextjs";
        const framework = rawFramework === "react-vite" ? "vite" : rawFramework;
        // Auto-detect version if not specified
        let twVersion = args?.tailwindVersion || "auto";
        if (twVersion === "auto") {
          try {
            // Inline detection: check if the consuming project has tailwind v4
            const targetPkg = resolve(process.cwd(), "package.json");
            if (existsSync(targetPkg)) {
              const pkg = JSON.parse(readFileSync(targetPkg, "utf8"));
              const allDeps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
              twVersion = /^[~^>=\s]*4/.test(allDeps["tailwindcss"] || "") ? "v4" : "v3";
            } else {
              twVersion = "v3";
            }
          } catch {
            twVersion = "v3";
          }
        }
        const isV4 = twVersion === "v4";

        const tailwindSteps = isV4
          ? [
              "### 2. Configure Tailwind CSS (v4 — CSS-first)",
              "",
              "Tailwind v4 uses CSS-first config. No `tailwind.config.ts` needed.",
              "",
              "**In your `globals.css` or `global.css`:**",
              "```css",
              '@import "tailwindcss";',
              '@import "@shavin/ui/styles.css";',
              '@import "@shavin/ui/theme-v4.css";',
              '/* v4 skips node_modules — scan @shavin/ui so its component classes are generated */',
              '@source "../../node_modules/@shavin/ui";',
              '/* Exclude AI agent skill docs from v4 content scanner */',
              '@source not "../.agents";',
              "```",
              "",
              "> ⚠️ The `@import \"@shavin/ui/theme-v4.css\"` line maps Shavin's semantic tokens",
              "> to Tailwind v4's `@theme inline` namespace, generating `bg-canvas`, `text-fg`,",
              "> `border-hairline`, etc. Without it, Shavin utilities silently don't exist.",
              ">",
              "> The `@source \"…/node_modules/@shavin/ui\"` line is required: v4's auto-scanner skips",
              "> node_modules, so without it the components' own classes are never generated.",
              "> Adjust the relative path to where your CSS file lives (`npx @shavin/cli init` does this).",
              ">",
              "> The `@source not \"../.agents\"` line prevents v4's auto-scanner from reading",
              "> skill markdown files (which can contain class-like strings that break the build).",
              "",
              "> 💡 **OKLCH color space (optional):** For wider gamut support on v4, use",
              "> `@shavin/ui/global-oklch.css` + `@shavin/ui/theme-v4-oklch.css` instead,",
              "> and add `colorSpace=\"oklch\"` to your `<ThemeProvider>`. Or simply run",
              "> `npx @shavin/cli init --oklch` to wire it automatically.",
            ]
          : [
              "### 2. Configure Tailwind CSS (v3 — JS config)",
              "",
              "Add `@shavin/ui/tailwind-preset` to your `tailwind.config.ts`:",
              "```ts",
              "presets: [require('@shavin/ui/tailwind-preset')],",
              "```",
            ];

        const themeProviderSteps = framework === "vite"
          ? [
              "### 4. Wrap App in ThemeProvider (Mandatory)",
              "Add `ThemeProvider` to your entry point and wrap your entire app inside it.",
              "This activates theme configuration and auto-mounts ShavinDevInspector in dev mode.",
              "```tsx",
              "// src/main.tsx (Vite entry point)",
              'import { StrictMode } from "react"',
              'import { createRoot } from "react-dom/client"',
              'import App from "./App.tsx"',
              'import { ThemeProvider } from "@shavin/ui"',
              "",
              "createRoot(document.getElementById(\"root\")!).render(",
              "  <StrictMode>",
              "    <ThemeProvider>",
              "      <App />",
              "    </ThemeProvider>",
              "  </StrictMode>,",
              ")",
              "```",
              "Alternatively, you can wrap inside `src/App.tsx` — either location works.",
            ]
          : framework === "remix"
            ? [
                "### 4. Wrap App in ThemeProvider (Mandatory)",
                "Add `ThemeProvider` to your root layout and wrap your entire app inside it.",
                "This activates theme configuration and auto-mounts ShavinDevInspector in dev mode.",
                "```tsx",
                "// app/root.tsx (Remix)",
                'import { ThemeProvider } from "@shavin/ui";',
                "",
                "export default function App() {",
                "  return (",
                "    <html lang=\"en\">",
                "      <body>",
                "        <ThemeProvider>",
                "          {children}",
                "        </ThemeProvider>",
                "      </body>",
                "    </html>",
                "  );",
                "}",
                "```",
              ]
            : [
                "### 4. Wrap App in ThemeProvider (Mandatory)",
                "Add `ThemeProvider` to your root layout and wrap your entire app inside it.",
                "This activates theme configuration and auto-mounts ShavinDevInspector in dev mode.",
                "```tsx",
                "// app/layout.tsx (Next.js App Router)",
                'import { ThemeProvider } from "@shavin/ui";',
                "",
                "export default function RootLayout({ children }) {",
                "  return (",
                '    <html lang="en">',
                "      <body>",
                "        <ThemeProvider>",
                "          {children}",
                "        </ThemeProvider>",
                "      </body>",
                "    </html>",
                "  );",
                "}",
                "```",
                "For Pages Router use `pages/_app.tsx`, for Vite use `src/main.tsx` (wrapping `<App />`), for Remix use `app/root.tsx`.",
              ];

        const frameworkSpecificSteps = framework === "nextjs"
          ? [
              "",
              "### 5. Next.js transpilePackages",
              "In `next.config.mjs`:",
              "```js",
              'transpilePackages: ["@shavin/ui"],',
              "```",
            ]
          : framework === "vite"
            ? [
                "",
                "### 5. Vite + Tailwind v4 Plugin (if using Tailwind v4)",
                "If using `@tailwindcss/vite` (the recommended v4 integration for Vite),",
                "add it to your `vite.config.ts`:",
                "```ts",
                'import tailwindcss from "@tailwindcss/vite"',
                "",
                "export default defineConfig({",
                "  plugins: [react(), tailwindcss()],",
                "})",
                "```",
                "No `postcss.config.js` needed — the Vite plugin handles CSS processing directly.",
              ]
            : [];

        const guide = [
          `## @shavin/ui Setup Instructions (${framework}, Tailwind ${twVersion})`,
          "",
          "### 1. Install package",
          "`npm install @shavin/ui`",
          "",
          ...tailwindSteps,
          "",
          `### 3. Import Stylesheet${isV4 ? " (already done in step 2)" : ""}`,
          isV4
            ? "The `@import \"@shavin/ui/styles.css\"` is already included in the CSS block above."
            : "In `global.css` or `globals.css`:\n```css\n@import \"@shavin/ui/styles.css\";\n```",
          "",
          ...themeProviderSteps,
          ...frameworkSpecificSteps,
          "",
          "### 6. Automated 1-Command Scaffolding",
          "Run: `npx @shavin/cli init` (auto-detects framework, Tailwind version, root layout, and wires everything for you)",
        ].join("\n");

        return { content: [{ type: "text", text: guide }] };
      },
    },
    {
      schema: {
        name: "inspect_environment",
        description: "Call before building in a project, and after `shavin init`. Checks the @shavin/ui setup in a folder: package, Tailwind v3 preset or v4 theme + @source, CSS imports, ThemeProvider, SHAVIN.md, AGENTS.md, .agents/ skills and .shavin/config.json. Score must be 100%.",
        inputSchema: {
          type: "object",
          properties: {
            targetDir: {
              type: "string",
              description: "Target project directory path (defaults to process.cwd()).",
            },
          },
        },
      },
      handler: async (args) => {
        const targetDir = args?.targetDir ? resolve(args.targetDir) : process.cwd();
        const results = { checks: [], diffFixes: [], score: 0 };
        let passed = 0;

        // Detect Tailwind version + framework for version-aware checks
        let isTailwindV4 = false;
        let framework = "generic";
        const targetPkgPath = resolve(targetDir, "package.json");
        if (existsSync(targetPkgPath)) {
          try {
            const tpkg = JSON.parse(readFileSync(targetPkgPath, "utf8"));
            const tdeps = { ...(tpkg.dependencies || {}), ...(tpkg.devDependencies || {}) };
            isTailwindV4 = /^[~^>=\s]*4/.test(tdeps["tailwindcss"] || "");
            // Framework detection from package.json deps
            if (tdeps["next"]) framework = "nextjs";
            else if (tdeps["vite"] || tdeps["@vitejs/plugin-react"]) framework = "vite";
            else if (tdeps["@remix-run/node"] || tdeps["@remix-run/react"] || tdeps["remix"]) framework = "remix";
          } catch {}
        }
        // Framework detection from config files (fallback)
        if (framework === "generic") {
          if (["next.config.mjs", "next.config.js", "next.config.ts", "next.config.cjs"]
              .some((f) => existsSync(resolve(targetDir, f)))) {
            framework = "nextjs";
          } else if (["vite.config.ts", "vite.config.mjs", "vite.config.js", "vite.config.cjs"]
              .some((f) => existsSync(resolve(targetDir, f)))) {
            framework = "vite";
          }
        }

        // 1. package.json
        const pkgPath = resolve(targetDir, "package.json");
        if (existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
            const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
            if (deps["@shavin/ui"]) {
              results.checks.push({ name: "@shavin/ui package", status: "PASS", message: "Installed in package.json" });
              passed++;
            } else {
              results.checks.push({ name: "@shavin/ui package", status: "FAIL", message: "Missing @shavin/ui in package.json" });
              results.diffFixes.push({ file: "package.json", fix: "Run `npm install @shavin/ui`" });
            }
          } catch {
            results.checks.push({ name: "@shavin/ui package", status: "WARN", message: "Unable to parse package.json" });
          }
        } else {
          results.checks.push({ name: "package.json", status: "WARN", message: "No package.json found at targetDir" });
        }

        // 2. Tailwind (version-aware)
        if (isTailwindV4) {
          // v4: check for @import "@shavin/ui/theme-v4.css" or OKLCH variant in CSS files
          const cssCheckPath = [
            "src/app/globals.css", "app/globals.css",
            "src/styles/global.css", "src/index.css",
            "styles/globals.css", "styles/global.css",
          ].map((f) => resolve(targetDir, f)).find((p) => existsSync(p));
          if (cssCheckPath) {
            const cssCheckSrc = readFileSync(cssCheckPath, "utf8");
            const hasThemeV4 = cssCheckSrc.includes("@shavin/ui/theme-v4.css") || cssCheckSrc.includes("@shavin/ui/theme-v4-oklch.css");
            const hasOklch = cssCheckSrc.includes("@shavin/ui/global-oklch.css");
            const hasSourceNot = cssCheckSrc.includes("@source not");
            const hasUiSource = /@source\s+"[^"]*@shavin\/ui[^"]*"/.test(cssCheckSrc);
            if (hasUiSource) {
              results.checks.push({ name: "@shavin/ui class scanning (@source)", status: "PASS", message: "@shavin/ui registered as a v4 source" });
              passed++;
            } else {
              results.checks.push({ name: "@shavin/ui class scanning (@source)", status: "FAIL", message: "Missing @source for node_modules/@shavin/ui — v4 skips node_modules, so component classes are not generated" });
              results.diffFixes.push({ file: cssCheckPath.split("/").pop(), fix: 'Add `@source "<relative path>/node_modules/@shavin/ui";` after your imports' });
            }
            if (hasThemeV4) {
              const variant = hasOklch ? "OKLCH" : "RGB";
              results.checks.push({ name: "Tailwind v4 Theme (@theme inline)", status: "PASS", message: `theme-v4${hasOklch ? "-oklch" : ""}.css imported in ${cssCheckPath.split("/").pop()} (${variant} color space)` });
              passed++;
            } else {
              results.checks.push({ name: "Tailwind v4 Theme (@theme inline)", status: "FAIL", message: `Missing @import "@shavin/ui/theme-v4.css" in ${cssCheckPath.split("/").pop()}` });
              results.diffFixes.push({ file: cssCheckPath.split("/").pop(), fix: 'Add `@import "@shavin/ui/theme-v4.css";` after the styles.css import' });
            }
            if (hasSourceNot) {
              results.checks.push({ name: "Skill Doc Exclusion (@source not)", status: "PASS", message: "v4 scanner exclusion active" });
              passed++;
            } else {
              results.checks.push({ name: "Skill Doc Exclusion (@source not)", status: "WARN", message: "Missing @source not for .agents (may cause CSS build errors from skill markdown)" });
              results.diffFixes.push({ file: cssCheckPath.split("/").pop(), fix: 'Add `@source not "../.agents";` to exclude skill docs from v4 scanner' });
            }
          } else {
            results.checks.push({ name: "Tailwind v4 CSS", status: "WARN", message: "No global CSS file found to check for theme-v4.css import" });
          }
        } else {
          // v3: check for tailwind.config.* with preset (original logic)
          const twPath = ["tailwind.config.ts", "tailwind.config.js", "tailwind.config.mjs"]
            .map((f) => resolve(targetDir, f))
            .find((p) => existsSync(p));
          if (twPath) {
            const twSrc = readFileSync(twPath, "utf8");
            if (twSrc.includes("tailwind-preset") || twSrc.includes("@shavin/ui")) {
              results.checks.push({ name: "Tailwind Preset", status: "PASS", message: `Configured in ${twPath.split("/").pop()}` });
              passed++;
            } else {
              results.checks.push({ name: "Tailwind Preset", status: "FAIL", message: `Missing preset in ${twPath.split("/").pop()}` });
              results.diffFixes.push({ file: twPath.split("/").pop(), fix: "Add `presets: [require('@shavin/ui/tailwind-preset')]`" });
            }
          } else {
            results.checks.push({ name: "Tailwind Configuration", status: "WARN", message: "No tailwind.config file found" });
          }
        }

        // 3. CSS
        const cssPath = [
          "src/styles/global.css",
          "src/app/globals.css",
          "src/index.css",
          "styles/globals.css",
          "styles/global.css",
        ].map((f) => resolve(targetDir, f)).find((p) => existsSync(p));
        if (cssPath) {
          const cssSrc = readFileSync(cssPath, "utf8");
          if (cssSrc.includes("@shavin/ui/styles.css")) {
            results.checks.push({ name: "Global CSS Stylesheet", status: "PASS", message: `Imported in ${cssPath.split("/").pop()}` });
            passed++;
          } else {
            results.checks.push({ name: "Global CSS Stylesheet", status: "FAIL", message: `Missing @import in ${cssPath.split("/").pop()}` });
            results.diffFixes.push({ file: cssPath.split("/").pop(), fix: 'Prepend `@import "@shavin/ui/styles.css";`' });
          }
        } else {
          results.checks.push({ name: "Global CSS Stylesheet", status: "WARN", message: "No standard global CSS file located" });
        }

        // 4. AGENTS.md
        const agentsPath = resolve(targetDir, "AGENTS.md");
        if (existsSync(agentsPath)) {
          results.checks.push({ name: "Agent Constitution (AGENTS.md)", status: "PASS", message: "Present in project root" });
          passed++;
        } else {
          results.checks.push({ name: "Agent Constitution (AGENTS.md)", status: "WARN", message: "Missing AGENTS.md in project root" });
          results.diffFixes.push({ file: "AGENTS.md", fix: "Run `npx @shavin/cli init`" });
        }

        // 5. Skills
        const skillsPath = resolve(targetDir, ".agents", "skills");
        if (existsSync(skillsPath)) {
          const stale = staleSkillFiles(targetDir, skillsPath);
          if (stale.length) {
            results.checks.push({ name: "AI Agent Skills (.agents/skills)", status: "WARN", message: `${stale.length} skill file(s) differ from or are missing next to the installed @shavin/skills (e.g. ${stale.slice(0, 3).join(", ")})` });
            results.diffFixes.push({ file: ".agents/skills/", fix: "Run `npx @shavin/skills --force` (or the install_skills tool) to refresh them" });
          } else {
            results.checks.push({ name: "AI Agent Skills (.agents/skills)", status: "PASS", message: "Installed in project and up to date" });
            passed++;
          }
        } else {
          results.checks.push({ name: "AI Agent Skills (.agents/skills)", status: "WARN", message: "Missing .agents/skills/ directory" });
          results.diffFixes.push({ file: ".agents/skills/", fix: "Run `npx @shavin/cli init`" });
        }

        // 5b. Commands
        const commandsPath = resolve(targetDir, ".agents", "commands");
        if (existsSync(commandsPath)) {
          const cmdFiles = readdirSync(commandsPath).filter(f => f.endsWith(".md"));
          if (cmdFiles.length > 0) {
            results.checks.push({ name: "AI Slash Commands (.agents/commands)", status: "PASS", message: `${cmdFiles.length} command(s) installed` });
            passed++;
          } else {
            results.checks.push({ name: "AI Slash Commands (.agents/commands)", status: "WARN", message: ".agents/commands/ exists but is empty" });
          }
        } else {
          results.checks.push({ name: "AI Slash Commands (.agents/commands)", status: "WARN", message: "Missing .agents/commands/ directory" });
          results.diffFixes.push({ file: ".agents/commands/", fix: "Run `npx @shavin/skills --force` to deploy slash commands" });
        }

        // 6. SHAVIN.md
        const shavinMdPath = resolve(targetDir, "SHAVIN.md");
        if (existsSync(shavinMdPath)) {
          results.checks.push({ name: "Project Design Brain (SHAVIN.md)", status: "PASS", message: "Configured at project root" });
          passed++;
        } else {
          results.checks.push({ name: "Project Design Brain (SHAVIN.md)", status: "WARN", message: "Missing SHAVIN.md project brain" });
          results.diffFixes.push({ file: "SHAVIN.md", fix: "Run `npx @shavin/cli init`" });
        }

        // 7. .shavin/ config
        const shavinDir = resolve(targetDir, ".shavin");
        if (existsSync(resolve(shavinDir, "config.json"))) {
          results.checks.push({ name: "Shavin Metadata (.shavin/config.json)", status: "PASS", message: "Initialized" });
          passed++;
        } else {
          results.checks.push({ name: "Shavin Metadata (.shavin/config.json)", status: "WARN", message: "Missing .shavin/config.json" });
        }

        // 8. ThemeProvider in root layout
        const layoutCandidates = [
          "src/app/layout.tsx", "app/layout.tsx",
          "src/pages/_app.tsx", "pages/_app.tsx",
          "src/main.tsx", "src/main.jsx",
          "src/App.tsx", "src/App.jsx", "App.tsx", "App.jsx",
          "app/root.tsx",
        ].map((f) => resolve(targetDir, f));
        const layoutPath = layoutCandidates.find(existsSync);

        // 8b. Vite-specific: check @tailwindcss/vite plugin (v4) or postcss config
        if (framework === "vite" && isTailwindV4) {
          const viteConfigPath = ["vite.config.ts", "vite.config.mjs", "vite.config.js", "vite.config.cjs"]
            .map((f) => resolve(targetDir, f)).find((p) => existsSync(p));
          if (viteConfigPath) {
            const vcSrc = readFileSync(viteConfigPath, "utf8");
            if (vcSrc.includes("@tailwindcss/vite")) {
              results.checks.push({ name: "Vite Tailwind v4 Plugin", status: "PASS", message: "@tailwindcss/vite configured in vite.config" });
              passed++;
            } else {
              results.checks.push({ name: "Vite Tailwind v4 Plugin", status: "WARN", message: "Missing @tailwindcss/vite plugin in vite.config (or use @tailwindcss/postcss in postcss.config)" });
              results.diffFixes.push({ file: viteConfigPath.split("/").pop(), fix: "Add `@tailwindcss/vite` to Vite plugins array" });
            }
          }
        }
        if (layoutPath) {
          const layoutSrc = readFileSync(layoutPath, "utf8");
          if (layoutSrc.includes("ThemeProvider")) {
            results.checks.push({ name: "ThemeProvider in root layout", status: "PASS", message: `Wired in ${layoutPath.split("/").pop()} — ShavinDevInspector active in dev` });
            passed++;
          } else {
            results.checks.push({ name: "ThemeProvider in root layout", status: "FAIL", message: `Missing <ThemeProvider> in ${layoutPath.split("/").pop()}` });
            results.diffFixes.push({ file: layoutPath.split("/").pop(), fix: "Wrap root element with <ThemeProvider> from @shavin/ui (run `npx @shavin/cli init`)" });
          }
        } else {
          results.checks.push({ name: "ThemeProvider in root layout", status: "WARN", message: "No root layout file detected" });
        }

        const total = Math.max(results.checks.length, 1); // every check pushes exactly one entry
        results.score = Math.round((passed / total) * 100);

        return {
          content: [{
            type: "text",
            text: `# @shavin/ui Environment Audit Report\n\n` +
              `**Project Path:** \`${targetDir}\`\n` +
              `**Framework:** ${framework}\n` +
              `**Tailwind CSS:** ${isTailwindV4 ? "v4 (CSS-first)" : "v3 (JS config)"}\n` +
              `**Compliance Score:** **${results.score}%** (${passed}/${total} checks passed)\n\n` +
              `### Checks:\n` +
              results.checks.map((c) => `- [${c.status === "PASS" ? "x" : " "}] **${c.name}**: ${c.status} — ${c.message}`).join("\n") +
              `\n\n` +
              (results.diffFixes.length > 0
                ? `### Recommended Fixes:\n` +
                  results.diffFixes.map((f) => `- **${f.file}**: ${f.fix}`).join("\n") +
                  `\n\n💡 Run \`npx @shavin/cli init\` to automatically repair all missing configurations.`
                : `✅ Environment is fully wired and compliant with @shavin/ui specifications.`),
          }],
        };
      },
    },
    {
      schema: {
        name: "install_skills",
        description: "Install or update @shavin/ui AI agent skills into the local target project (.agents/skills/ and AGENTS.md).",
        inputSchema: {
          type: "object",
          properties: {
            targetDir: {
              type: "string",
              description: "Target project directory path (defaults to process.cwd()).",
            },
          },
        },
      },
      handler: async (args) => {
        const targetDir = args?.targetDir ? resolve(args.targetDir) : process.cwd();
        const candidateSkillsSrc = [
          resolve(process.cwd(), "node_modules", "@shavin", "skills", "skills"),
          fileURLToPath(new URL("../../assets/skills", import.meta.url)),
          resolve(ROOT, "packages", "skills", "skills"),
          resolve(ROOT, ".agents", "skills"),
        ];
        const srcSkillsDir = candidateSkillsSrc.find(existsSync);
        const targetSkillsDir = resolve(targetDir, ".agents", "skills");

        const candidateAgentsMd = [
          resolve(process.cwd(), "node_modules", "@shavin", "skills", "AGENTS.md"),
          // This package's own copy (the consumer rules), then the monorepo source.
          fileURLToPath(new URL("../../assets/AGENTS.md", import.meta.url)),
          fileURLToPath(new URL("../../../skills/AGENTS.md", import.meta.url)),
        ];
        const srcAgentsMd = candidateAgentsMd.find(existsSync);
        const targetAgentsMd = resolve(targetDir, "AGENTS.md");

        const candidateCommandsSrc = [
          resolve(process.cwd(), "node_modules", "@shavin", "skills", "commands"),
          fileURLToPath(new URL("../../assets/commands", import.meta.url)),
          resolve(ROOT, "packages", "skills", "commands"),
          resolve(ROOT, ".agents", "commands"),
        ];
        const srcCommandsDir = candidateCommandsSrc.find(existsSync);
        const targetCommandsDir = resolve(targetDir, ".agents", "commands");

        const installed = [];

        // Never overwrite a project's AGENTS.md: create it when missing, otherwise add or
        // refresh only the marked Shavin skills block.
        if (srcAgentsMd && existsSync(srcAgentsMd)) {
          const MARK = "<!-- @shavin/skills:reference -->";
          const MARK_END = "<!-- @shavin/skills:reference-end -->";
          const fresh = readFileSync(srcAgentsMd, "utf8");
          if (!existsSync(targetAgentsMd)) {
            writeFileSync(targetAgentsMd, fresh, "utf8");
            installed.push("AGENTS.md (Shavin rules + skills guide)");
          } else if (fresh.includes(MARK) && fresh.includes(MARK_END)) {
            const block = fresh.slice(fresh.indexOf(MARK), fresh.indexOf(MARK_END) + MARK_END.length);
            const current = readFileSync(targetAgentsMd, "utf8");
            const s0 = current.indexOf(MARK), e0 = current.indexOf(MARK_END);
            const next = s0 !== -1 && e0 !== -1
              ? current.slice(0, s0) + block + current.slice(e0 + MARK_END.length)
              : current.trimEnd() + "\n\n" + block + "\n";
            if (next !== current) {
              writeFileSync(targetAgentsMd, next, "utf8");
              installed.push("AGENTS.md (Shavin skills block refreshed; your content kept)");
            }
          }
        }

        const copyRec = (src, dest) => {
          const entries = readdirSync(src, { withFileTypes: true });
          for (const entry of entries) {
            const s = resolve(src, entry.name);
            const d = resolve(dest, entry.name);
            if (entry.isDirectory()) {
              if (!existsSync(d)) mkdirSync(d, { recursive: true });
              copyRec(s, d);
            } else {
              writeFileSync(d, readFileSync(s));
            }
          }
        };

        if (srcSkillsDir && existsSync(srcSkillsDir)) {
          if (!existsSync(targetSkillsDir)) mkdirSync(targetSkillsDir, { recursive: true });
          copyRec(srcSkillsDir, targetSkillsDir);
          const skillFolders = readdirSync(srcSkillsDir, { withFileTypes: true })
            .filter((e) => e.isDirectory())
            .map((e) => e.name);
          installed.push(`.agents/skills/ (${skillFolders.join(", ")})`);
        }

        if (srcCommandsDir && existsSync(srcCommandsDir)) {
          if (!existsSync(targetCommandsDir)) mkdirSync(targetCommandsDir, { recursive: true });
          copyRec(srcCommandsDir, targetCommandsDir);
          const cmdCount = readdirSync(srcCommandsDir).filter((f) => f.endsWith(".md")).length;
          const cmdNames = readdirSync(srcCommandsDir).filter((f) => f.endsWith(".md")).map((f) => "/" + f.slice(0, -3));
          installed.push(`.agents/commands/ (${cmdCount} AI slash commands: ${cmdNames.join(", ")})`);
        }

        return {
          content: [{
            type: "text",
            text: `## ✅ Successfully Installed @shavin/ui AI Agent Skills!\n\n` +
              `**Target Directory:** \`${targetDir}\`\n\n` +
              `**Installed Assets:**\n` +
              installed.map((i) => `- ${i}`).join("\n"),
          }],
        };
      },
    },
  ];
}
