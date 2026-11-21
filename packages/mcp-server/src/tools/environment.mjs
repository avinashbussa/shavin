import { fileURLToPath } from "node:url";
import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";
import { runDoctor } from "@shavin/cli/doctor";
import { runRenderCheck } from "@shavin/cli/render-check";

export function registerEnvironmentTools(server, ROOT) {
  return [
    {
      schema: {
        name: "get_setup_instructions",
        description: "Return step-by-step wiring instructions for integrating @shavin/ui into Next.js or Vite (with React 19) apps; other frameworks are not supported yet. Supports both Tailwind v3 (JS config) and v4 (CSS-first).",
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
              '@import "@shavin/ui/tokens.css";',
              '/* Element defaults in the base layer, so utilities (yours or shadcn/ui\'s) win over them */',
              '@import "@shavin/ui/base.css" layer(base);',
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
              "> `@shavin/ui/tokens-oklch.css`, `@shavin/ui/base-oklch.css` and `@shavin/ui/theme-v4-oklch.css` instead,",
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
                "For Pages Router use `pages/_app.tsx`, for Vite use `src/main.tsx` (wrapping `<App />`).",
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
          "> Supported today: Next.js and Vite (with React 19). Other frameworks (Remix, Astro, SvelteKit, Nuxt, Angular and so on) are planned for later, not available yet.",
          ...(framework === "generic" ? ["> `generic` is not a supported target: the steps below follow the Next.js layout. Use a Next.js or Vite app, or tell the user their framework is not supported yet.", ""] : []),
          "",
          "### 1. Install package",
          "`npm install @shavin/ui`",
          "",
          ...tailwindSteps,
          "",
          `### 3. Import Stylesheet${isV4 ? " (already done in step 2)" : ""}`,
          isV4
            ? "The `tokens.css` and `base.css` imports are already included in the CSS block above."
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
        description: "Call before building in a project, and after `shavin init`. Checks the @shavin/ui setup in a folder: package, Tailwind v3 preset or v4 theme + @source, PostCSS, CSS imports (including that the root layout imports the stylesheet), ThemeProvider, agent files and skills. Each gap comes with the exact fix; apply it with the user's OK. Pass renderUrl (running dev server) to also load a page headless and confirm Shavin renders styled. Score must be 100%.",
        inputSchema: {
          type: "object",
          properties: {
            targetDir: {
              type: "string",
              description: "Target project directory path (defaults to process.cwd()).",
            },
            renderUrl: {
              type: "string",
              description: "URL of a page on the running dev server (for example http://localhost:3000/). Loads it in a headless browser and confirms Shavin renders styled, not just that the files exist.",
            },
          },
        },
      },
      handler: async (args) => {
        const targetDir = args?.targetDir ? resolve(args.targetDir) : process.cwd();
        // One checker for the CLI (`shavin check` / `doctor`) and this tool, so both give the same answer.
        const report = runDoctor(targetDir, { skillsSources: [fileURLToPath(new URL("../../assets/skills", import.meta.url))] });
        if (args?.renderUrl) {
          const render = await runRenderCheck(args.renderUrl);
          report.checks.push(...render.checks);
          for (const c of render.checks) report.summary[c.status]++;
          const scored = report.summary.pass + report.summary.fail;
          report.score = scored ? Math.round((report.summary.pass / scored) * 100) : 100;
        }
        const mark = { pass: "x", warn: " ", fail: " ", info: "-" };
        const groups = [["environment", "Environment"], ["wiring", "Setup"], ["agents", "Agent files"], ["render", "Render check"]];
        const fixes = report.checks.filter((c) => c.fix && (c.status === "fail" || c.status === "warn"));
        return {
          content: [{
            type: "text",
            text: `# @shavin/ui Environment Audit Report\n\n` +
              `**Project Path:** \`${targetDir}\`\n` +
              `**Framework:** ${report.framework}\n` +
              `**Tailwind CSS:** v${report.tailwind}\n` +
              `**Compliance Score:** **${report.score}%** (${report.summary.pass} passed, ${report.summary.fail} failing, ${report.summary.warn} warnings)\n\n` +
              groups.map(([g, title]) => {
                const items = report.checks.filter((c) => c.group === g);
                return items.length ? `### ${title}\n` + items.map((c) => `- [${mark[c.status]}] **${c.label}**: ${c.status.toUpperCase()} — ${c.message}`).join("\n") + "\n" : "";
              }).join("\n") +
              `\n` +
              (fixes.length
                ? `### Recommended Fixes:\n` + fixes.map((c) => `- **${c.label}**: ${c.fix}`).join("\n") +
                  `\n\n💡 Run \`npx @shavin/cli init\` to repair most of these. The same report: \`npx @shavin/cli check\` (\`--json\` for machines).`
                : `✅ Environment is fully wired and compliant with @shavin/ui specifications.`),
          }],
        };
      },
    },
    {
      schema: {
        name: "install_skills",
        description: "Install or update @shavin/ui AI agent skills into the local target project (.agents/skills/, .claude/skills/ and AGENTS.md).",
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
          // This package's own copy (the consumer rules), then this repository's source.
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

        // Maintainer-only skills (shavin-core, ...) are never installed into a project.
        const MAINTAINER_ONLY = new Set(["shavin-core", "shavin-ui-qa-linter", "dense-compression-protocol.md"]);
        const copyRec = (src, dest, top = false) => {
          const entries = readdirSync(src, { withFileTypes: true });
          for (const entry of entries) {
            if (top && MAINTAINER_ONLY.has(entry.name)) continue;
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
          copyRec(srcSkillsDir, targetSkillsDir, true);
          const skillFolders = readdirSync(srcSkillsDir, { withFileTypes: true })
            .filter((e) => e.isDirectory())
            .map((e) => e.name);
          installed.push(`.agents/skills/ (${skillFolders.join(", ")})`);
          // Claude Code reads .claude/skills, not .agents/skills.
          const claudeSkills = resolve(targetDir, ".claude", "skills");
          mkdirSync(claudeSkills, { recursive: true });
          copyRec(srcSkillsDir, claudeSkills, true);
          installed.push(`.claude/skills/ (same skills, for Claude Code)`);
        }

        if (srcCommandsDir && existsSync(srcCommandsDir)) {
          if (!existsSync(targetCommandsDir)) mkdirSync(targetCommandsDir, { recursive: true });
          copyRec(srcCommandsDir, targetCommandsDir);
          const cmdCount = readdirSync(srcCommandsDir).filter((f) => f.endsWith(".md")).length;
          const cmdNames = readdirSync(srcCommandsDir).filter((f) => f.endsWith(".md")).map((f) => "/" + f.slice(0, -3));
          installed.push(`.agents/commands/ (${cmdCount} AI slash commands: ${cmdNames.join(", ")})`);
          const claudeCommands = resolve(targetDir, ".claude", "commands");
          mkdirSync(claudeCommands, { recursive: true });
          copyRec(srcCommandsDir, claudeCommands);
          installed.push(`.claude/commands/ (same commands, for Claude Code)`);
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
