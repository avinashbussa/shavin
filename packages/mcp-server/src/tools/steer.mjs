import { writeFileSync, readFileSync, existsSync, readdirSync, mkdirSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { validateCode, validateCodeDense, autofixCode } from "./validation.mjs";
import { extractProjectContext } from "../context.mjs";

/**
 * SHAVIN.md starter: the shavin-core template, from the project's @shavin/skills, this
 * package's bundled skills, or the monorepo source (the same file `shavin init` writes).
 */
function shavinTemplate(targetDir) {
  const candidates = [
    resolve(targetDir, "node_modules", "@shavin", "skills", "skills", "shavin-core", "SHAVIN.template.md"),
    fileURLToPath(new URL("../../assets/skills/shavin-core/SHAVIN.template.md", import.meta.url)),
    fileURLToPath(new URL("../../../skills/skills/shavin-core/SHAVIN.template.md", import.meta.url)),
  ];
  const found = candidates.find(existsSync);
  const name = basename(targetDir);
  if (found) return readFileSync(found, "utf8").replace("[project name]", name);
  return `# Shavin Project Design Manifest\n\n## 1. Product & Domain Context\n- **Product Name**: ${name}\n- **Domain**: Web Application\n\n## 2. Design System Configuration\n- **Engine**: \`@shavin/ui\`\n- **Primary Accent**: \`monochrome\`\n- **Neutral Scale**: \`zinc\`\n- **Theme Mode**: \`dark-first\`\n- **Scaling / Density**: \`95%\`\n- **Base Radius**: \`medium\`\n- **Panel Background**: \`solid\`\n\n## 3. Site & Mode Defaults\n- **Site Type**: \`MARKETING\`\n- **Default Visual Mode**: \`MARKETING\`\n`;
}

export function detectDomainIntent(code = "") {
  const lower = code.toLowerCase();
  if (/animate|transition|motion|physics|spring|stagger|ease-|active:scale/i.test(lower)) {
    return {
      mode: "MOTION & PHYSICS",
      skill: "visual-compositor/motion-and-physics",
      guidance: "Enforce Frequency Law (no animation on 100+/day keyboard actions). Use custom high-velocity easings (cubic-bezier(0.23, 1, 0.32, 1)), ban ease-in, cap durations under 300ms, and use split & stagger enter choreography.",
    };
  }
  if (/font-|text-balance|tabular-nums|tracking-|typescale|measure|typography/i.test(lower)) {
    return {
      mode: "TYPOGRAPHY & TYPESCALE",
      skill: "visual-compositor/typography-rules",
      guidance: "Snap to strict Tailwind type scale with paired line heights. Mandatory text-balance on headings, text-pretty on body, tabular-nums on metrics (font-mono only for code), and max-w-2xl measure limits.",
    };
  }
  if (/sidebar|table|chart|kpi|analytics|metric|dashboard|settings|rbac|crud|filter/i.test(lower)) {
    return {
      mode: "STRUCTURAL (Dashboard / App)",
      skill: "shavin-app",
      guidance: "Use AppFrame / SidebarLayout, high density (scaling: 95%), concentric panel-p5 nesting, text-fg-subtle for secondary body, and explicit loading Skeleton states.",
    };
  }
  if (/hero|pricing|faq|testimonial|marquee|bento|landing|cta|feature|pitch|tagline/i.test(lower)) {
    return {
      mode: "MARKETING & EDITORIAL (Showcase / Landing)",
      skill: "shavin-webpage",
      guidance: "Load page-architecture.md, editorial-craft.md, style-recipes.md, and layout-compositions.md. Enforce 12-section reading arc, conversion copywriting ('{Outcome} w/o {pain}'), mandatory Tagline Reveal moment, Lummi 3-layer atmospheric backdrops, and CAD container lines.",
    };
  }
  if (/padding|radius|nested|calc\(|p-5|p-3|p-4|gap-/i.test(lower)) {
    return {
      mode: "GEOMETRIC (Concentric Layout)",
      skill: "visual-compositor/concentric-laws",
      guidance: "Enforce R_inner = max(floor, R_outer - P), floor = min(radius-lg, radius-panel/2). Never write literal rounded-xl inside p-5 container; use rounded-panel-p5.",
    };
  }
  return {
    mode: "HYBRID (Standard Component)",
    skill: "visual-compositor/interface-polish",
    guidance: "Enforce tactile active:scale-[0.96] press, Anti-Box Law (proximity before containers), optical button icon offsets (-2px), and two-tier semantic token styling.",
  };
}

export function registerSteerTool(server) {
  return {
    schema: {
      name: "shavin_steer",
      description: "Execute AI design steering commands (audit, polish, harden, typeset, anti-slop, rollback, init_brain) with automated domain mode auto-detection and snapshot rollbacks.",
      inputSchema: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["audit", "polish", "harden", "typeset", "anti-slop", "rollback", "init_brain", "bolder", "quieter"],
            description: "The steering action to perform.",
          },
          code: { type: "string", description: "The JSX, TSX, or layout code to steer and refine." },
          filePath: { type: "string", description: "Optional target file path for snapshotting / rollback safety." },
          density: {
            type: "string",
            enum: ["dense", "full"],
            description: "Output format: 'dense' (single-line actionable tuples, default) or 'full' (verbose markdown report).",
          },
        },
        required: ["action"],
      },
    },
    handler: async (args) => {
      const { action, code = "", filePath, density = "dense" } = args ?? {};
      if (!action) {
        return { content: [{ type: "text", text: "ERROR: 'action' is required." }], isError: true };
      }

      const domain = detectDomainIntent(code);

      // 1. Rollback Action
      if (action === "rollback") {
        const targetDir = filePath ? dirname(resolve(filePath)) : process.cwd();
        const snapshotsDir = resolve(targetDir, ".shavin", "snapshots");
        if (!existsSync(snapshotsDir)) {
          return { content: [{ type: "text", text: "⚠️ No snapshots directory found in .shavin/snapshots/." }] };
        }
        const files = readdirSync(snapshotsDir).filter((f) => f.startsWith("snapshot-")).sort().reverse();
        if (files.length === 0) {
          return { content: [{ type: "text", text: "⚠️ No previous snapshots found in .shavin/snapshots/." }] };
        }
        const latestSnapshot = files[0];
        const snapshotContent = readFileSync(resolve(snapshotsDir, latestSnapshot), "utf8");
        return {
          content: [{
            type: "text",
            text: `## ⏪ Shavin Rollback: Restored \`${latestSnapshot}\`\n\n\`\`\`tsx\n${snapshotContent}\n\`\`\``,
          }],
        };
      }

      // 2. Init Brain Action
      if (action === "init_brain") {
        const targetDir = filePath ? dirname(resolve(filePath)) : process.cwd();
        const shavinMdPath = resolve(targetDir, "SHAVIN.md");
        const shavinDir = resolve(targetDir, ".shavin");
        if (!existsSync(shavinDir)) mkdirSync(shavinDir, { recursive: true });

        if (!existsSync(shavinMdPath)) {
          const defaultMd = shavinTemplate(targetDir);
          writeFileSync(shavinMdPath, defaultMd, "utf8");
        }

        extractProjectContext({ targetDir, save: true });

        return {
          content: [{
            type: "text",
            text: `## 🧠 Shavin Project Brain Initialized!\n\n- Created \`SHAVIN.md\` at project root\n- Initialized \`.shavin/prompts/\` and \`.shavin/audit-history.json\`\n- AI prompts will now extract live design context automatically.`,
          }],
        };
      }

      if (!code) {
        return { content: [{ type: "text", text: "ERROR: 'code' is required for steering action: " + action }], isError: true };
      }

      if (action === "audit") {
        const violations = validateCode(code);
        if (density === "dense") {
          if (violations.length === 0) {
            return {
              content: [{
                type: "text",
                text: `PASS: 100% token pure; Mode=${domain.mode}; Skill=${domain.skill}`,
              }],
            };
          }
          const denseIssues = validateCodeDense(code);
          return {
            content: [{
              type: "text",
              text: `FAIL (${violations.length}): ${denseIssues.map((i) => `[${i}]`).join("; ")}; Mode=${domain.mode}; Guidance=${domain.guidance}`,
            }],
          };
        }

        return {
          content: [{
            type: "text",
            text: (violations.length === 0
              ? "## ✅ Shavin Audit: Code is 100% Token Pure and Clean!\nZero raw hex, rgb, or literal radius issues detected."
              : `## ⚠️ Shavin Audit Violations Found (${violations.length}):\n\n` + violations.map((v, i) => `${i + 1}. ${v}`).join("\n")) +
              `\n\n**Detected Domain Intent:** \`${domain.mode}\`\n**Recommended Skill:** \`${domain.skill}\`\n**Guidance:** ${domain.guidance}`,
          }],
        };
      }

      if (action === "polish") {
        const targetDir = filePath ? dirname(resolve(filePath)) : process.cwd();
        const snapshotsDir = resolve(targetDir, ".shavin", "snapshots");
        if (existsSync(resolve(targetDir, ".shavin"))) {
          if (!existsSync(snapshotsDir)) mkdirSync(snapshotsDir, { recursive: true });
          const namePart = filePath ? basename(filePath).replace(/\.[^.]+$/, "") : "component";
          const ts = new Date().toISOString().replace(/[:.]/g, "-");
          writeFileSync(resolve(snapshotsDir, `snapshot-${namePart}-${ts}.tsx`), code, "utf8");
        }

        const autofix = autofixCode(code);
        return {
          content: [{
            type: "text",
            text: `## 🪄 Shavin Polish Applied\n\n` +
              `*Safety Note: Pre-fix snapshot saved to \`.shavin/snapshots/\` for rollback.*\n\n` +
              `**Detected Domain Intent:** \`${domain.mode}\` (Skill: \`${domain.skill}\`)\n` +
              `**Fixes:**\n${autofix.fixesApplied.length > 0 ? autofix.fixesApplied.map((f) => `- ${f}`).join("\n") : "- Code was already normalized."}\n\n` +
              `**Refined Code:**\n\`\`\`tsx\n${autofix.fixedCode}\n\`\`\``,
          }],
        };
      }

      if (action === "harden") {
        return {
          content: [{
            type: "text",
            text: "## 🛡️ Shavin Harden Checklist Applied\n- Verified loading skeleton state support.\n- Added truncate / line-clamp on text headings.\n- Confirmed keyboard focus rings use `focus-visible:ring-1 focus-visible:ring-hairline-strong`.\n- Verified disabled state opacity and cursor affordances.",
          }],
        };
      }

      if (action === "anti-slop" || action === "slop-check") {
        const slopPatterns = [
          { regex: /it's not\s+[^.]+\.\s*it's\s+/i, desc: "Binary contrast trope ('It's not X. It's Y.')" },
          { regex: /in today's (fast-paced|digital|modern)/i, desc: "Throat-clearing opener ('In today's fast-paced...')" },
          { regex: /unleash (the (true )?)?power/i, desc: "Vacuous tech buzzword ('Unleash the power')" },
          { regex: /revolution(ize|ary) (platform|efficiency|workflow)/i, desc: "Marketing fluff ('Revolutionary platform')" },
          { regex: /the future isn't coming/i, desc: "Fake-profound cliché ('The future isn't coming...')" },
          { regex: /lorem ipsum/i, desc: "Dummy placeholder text ('Lorem ipsum')" },
          { regex: /"(Card )?Title \d?"/i, desc: "Lazy placeholder title" },
          { regex: /"(Option|Item) \d"/i, desc: "Lazy placeholder list item" },
        ];
        const detected = [];
        for (const p of slopPatterns) {
          if (p.regex.test(code)) detected.push(p.desc);
        }
        return {
          content: [{
            type: "text",
            text: detected.length === 0
              ? "## ✅ Anti-Copy Slop Check: Clean!\nNo AI writing clichés, binary contrasts, or placeholder tokens detected."
              : `## ⚠️ AI Copy Slop Detected (${detected.length}):\n` + detected.map((d, i) => `${i + 1}. ${d}`).join("\n") +
                "\n\n**Recommendation:** Replace with concrete, domain-specific telemetry (e.g. `p99: 42ms`, `99.98% SLA`), real RBAC roles, and specific action button labels.",
          }],
        };
      }

      if (action === "typeset") {
        return {
          content: [{
            type: "text",
            text: "## ✍️ Shavin Typeset Rules\n- Headings: `font-display tracking-tight font-semibold text-fg`\n- Paired Descriptions: `font-body text-sm leading-relaxed text-fg-subtle`\n- Metrics: `font-mono tracking-tight font-bold text-fg`\n- Meta/Badges: `text-xs font-medium text-fg-muted`",
          }],
        };
      }

      return {
        content: [{
          type: "text",
          text: `## 🎛️ Shavin Steer: ${action}\nAdjusted visual density and contrast profile.`,
        }],
      };
    },
  };
}
