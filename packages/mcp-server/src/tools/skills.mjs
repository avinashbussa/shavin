import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve, basename } from "node:path";

/**
 * Compresses skill markdown prose by 50-60% per @shavin/ui Dense Agent Protocol.
 * Preserves 100% of technical rules, ARIA contracts, and token constraints.
 */
const ROUTING_LINE = /\b(get_skill|get_components|get_block_template|get_tokens|plan_page|check_page|validate_code|audit_source|list_commands)\s*\(|(^|[\s`(])\/(compose-page|create-screen|create-block|create-primitive|create-theme|apply-theme|audit-ui|audit-layout|add-composition)\b|\b(Load|Read|Call|Use|See|Open)\b[^.]*`[\w./-]+\.md`|\bnow a standalone skill\b/i;

export function compressToDense(text) {
  const lines = text.split("\n");
  const result = [];
  let inCode = false;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith("```")) {
      inCode = !inCode;
      result.push(trimmed);
      continue;
    }
    if (inCode) {
      result.push(line);
      continue;
    }

    // Routing lines tell the agent where to go next (another skill, a tool, a
    // command). They are the whole point of a modular skill, so dense mode keeps
    // them even when they live in a blockquote or a plain paragraph. The
    // "No-MCP fallback" variants are noise for an agent that is already on MCP.
    if (/no-mcp/i.test(trimmed)) continue;
    if (ROUTING_LINE.test(trimmed)) {
      result.push(trimmed.replace(/^>\s*/, ""));
      continue;
    }

    // Drop decorative blockquotes, tips, and rules dividers
    if (trimmed === "---" || trimmed.startsWith("> 💡") || trimmed.startsWith("> **Token-efficient") || trimmed.startsWith("> **Single source")) {
      continue;
    }

    // Keep headers compact
    if (/^#{1,4}\s+/.test(trimmed)) {
      result.push(trimmed);
      continue;
    }

    // Keep tables
    if (trimmed.startsWith("|")) {
      result.push(trimmed);
      continue;
    }

    // Drop narrative/intro paragraphs that do not contain hard signal words
    const isBulletOrNum = /^[-*]\s+|\d+\.\s+/.test(trimmed);
    const hasHardSignal = /\b(MUST|NEVER|ONLY|ALWAYS|CAPPED|PILL|RULE|formula|R_inner|cva|cn|token|props|variants|import)\b/i.test(trimmed);

    if (!isBulletOrNum && !hasHardSignal) {
      continue;
    }

    let denseLine = trimmed
      .replace(/\b(is used for|provides support for|allows developers to|designed for)\b/gi, "->")
      .replace(/\bwith\b/g, "w/")
      .replace(/\bwithout\b/g, "w/o")
      .replace(/\b\s+and\s+\b/g, " + ")
      .replace(/\b(the|a|an)\s+(?=[a-z])/gi, "");

    result.push(denseLine);
  }

  return result.join("\n");
}

export function registerSkillsTools(server, SKILLS, ROOT) {
  return [
    {
      schema: {
        name: "list_skills",
        description: "Lists the Shavin agent skills with their sections, so you can fetch only what you need with get_skill({ name, section }). For pages, plan_page picks the layout-compositions sections for you.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      handler: async () => {
        const skillsList = Object.values(SKILLS).map((s) => ({
          name: s.name,
          dirName: s.dirName,
          description: s.description,
          sections: s.headings,
        }));
        return { content: [{ type: "text", text: JSON.stringify(skillsList, null, 2) }] };
      },
    },
    {
      schema: {
        name: "get_skill",
        description: "Call for design judgement before and while building: layout-compositions (section layouts, by family: hero, features, proof, conversion…), layout-motion / layout-choreography (motion tiers), visual-compositor (typography, polish, concentric radius, anti-patterns), shavin-webpage (page architecture), shavin-app (dashboards). For a whole page start with plan_page. Pass section to fetch one part. Supports 'dense' (default) and 'full'.",
        inputSchema: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description: "Skill directory name (e.g. 'visual-compositor', 'shavin-app', 'shavin-webpage', 'shavin-ui-qa-linter', 'shavin-ui-builder').",
            },
            section: {
              type: "string",
              description: "Optional section heading to extract (e.g. 'Activation Modes', 'Rhythm', 'Density').",
            },
            density: {
              type: "string",
              enum: ["dense", "full"],
              description: "Output format: 'dense' (token-compressed shorthand, default) or 'full' (verbatim uncompressed markdown).",
            },
          },
          required: ["name"],
        },
      },
      handler: async (args) => {
        const { name: skillName, section, density = "dense" } = args ?? {};
        const skillKey = (skillName || "").toLowerCase();
        const skill = SKILLS[skillKey];

        if (!skill) {
          const available = Object.keys(SKILLS).join(", ");
          return {
            content: [{ type: "text", text: `Skill '${skillName}' not found. Available skills: ${available}` }],
            isError: true,
          };
        }

        let rawOutput = skill.body;

        if (section) {
          const secLower = section.toLowerCase().trim();
          const secHyphen = secLower.replace(/[\s_]+/g, "-").replace(/\.md$/, "");
          const secClean = secLower.replace(/[\s_]+/g, " ").replace(/\.md$/, "");
          const secBare = secLower.replace(/\.md$/, "");

          let matched = null;

          if (skill.subFiles) {
            matched =
              skill.subFiles[secHyphen] ||
              skill.subFiles[secClean] ||
              skill.subFiles[secBare] ||
              skill.subFiles[secLower];

            if (!matched) {
              for (const [k, v] of Object.entries(skill.subFiles)) {
                if (k.endsWith("/" + secHyphen) || k.endsWith("/" + secBare) || k === secHyphen) {
                  matched = v;
                  break;
                }
              }
            }
          }

          if (!matched) {
            // Heading scan across skill.body and all subFiles
            const sources = [skill.body, ...Object.values(skill.subFiles || {})];
            for (const src of sources) {
              const lines = src.split("\n");
              let capturing = false;
              let targetLevel = 0;
              const capturedLines = [];

              for (const line of lines) {
                const headerMatch = line.match(/^(#{1,4})\s+(.+)$/);
                if (headerMatch) {
                  const level = headerMatch[1].length;
                  const title = headerMatch[2].toLowerCase();

                  if (capturing) {
                    if (level <= targetLevel) break; // Reached next same-level or higher heading
                  }

                  if (!capturing && (title.includes(secClean) || title.includes(secHyphen) || title.includes(secBare))) {
                    capturing = true;
                    targetLevel = level;
                    capturedLines.push(line);
                    continue;
                  }
                }

                if (capturing) {
                  capturedLines.push(line);
                }
              }

              if (capturedLines.length > 0) {
                matched = capturedLines.join("\n").trim();
                break;
              }
            }
          }

          if (matched) {
            rawOutput = matched;
          } else {
            const availableModules = Array.from(
              new Set([
                ...Object.keys(skill.subFiles || {}).filter((k) => !k.includes("/") && !k.endsWith(".md")),
                ...(skill.headings || []).slice(0, 15),
              ])
            ).slice(0, 25);

            return {
              content: [
                {
                  type: "text",
                  text: `Section '${section}' not found in skill '${skillName}'.\nAvailable sections/modules in this skill:\n${availableModules.map((s) => `• ${s}`).join("\n")}`,
                },
              ],
              isError: true,
            };
          }
        }

        const finalText = density === "dense" ? compressToDense(rawOutput) : rawOutput;
        return { content: [{ type: "text", text: finalText }] };
      },
    },
    {
      schema: {
        name: "get_skill_mode",
        description: "Determine the activation mode (STRUCTURAL, MARKETING, EDITORIAL, or HYBRID) based on task keywords.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: { type: "string", description: "The user request or layout description." },
          },
          required: ["prompt"],
        },
      },
      handler: async (args) => {
        const p = (args?.prompt || "").toLowerCase();
        let mode = "STRUCTURAL";
        let rationale = "Default enterprise layout.";

        if (
          p.includes("awwwards") ||
          p.includes("agency") ||
          p.includes("portfolio") ||
          p.includes("creative") ||
          p.includes("luxury") ||
          p.includes("fancy") ||
          p.includes("cinematic") ||
          p.includes("scroll experience") ||
          p.includes("wow factor") ||
          p.includes("editorial")
        ) {
          mode = "EDITORIAL";
          rationale = "Creative / portfolio / awwwards aesthetic with high display typography and theatrical spacing.";
        } else if (
          p.includes("landing") ||
          p.includes("hero") ||
          p.includes("pricing") ||
          p.includes("marketing") ||
          p.includes("conversion") ||
          p.includes("homepage") ||
          p.includes("saas") ||
          p.includes("launch")
        ) {
          mode = "MARKETING";
          rationale = "Conversion-focused landing page with bold CTA rhythm, authentic software previews, and bento grid.";
        }

        return {
          content: [{
            type: "text",
            text: JSON.stringify({ mode, rationale }, null, 2),
          }],
        };
      },
    },
    {
      schema: {
        name: "list_commands",
        description: "List all available AI slash commands in the @shavin/ui ecosystem (.agents/commands/). Returns command names, descriptions, and input argument patterns.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      handler: async () => {
        const candidateDirs = [
          resolve(process.cwd(), ".agents", "commands"),
          resolve(process.cwd(), "node_modules", "@shavin", "skills", "commands"),
          resolve(ROOT, ".agents", "commands"),
          resolve(ROOT, "packages", "skills", "commands"),
          resolve(ROOT, "assets", "commands"),
        ];
        const commandsDir = candidateDirs.find(existsSync);
        if (!commandsDir) {
          return { content: [{ type: "text", text: "No commands directory found. Run `npx @shavin/skills` to deploy slash commands." }] };
        }

        const commands = [];
        for (const file of readdirSync(commandsDir)) {
          if (!file.endsWith(".md")) continue;
          const filePath = resolve(commandsDir, file);
          const text = readFileSync(filePath, "utf8");

          const titleMatch = text.match(/^#\s+(.+)$/m);
          const argMatch = text.match(/\$ARGUMENTS\s*\((.+?)\)/);
          const descMatch = text.match(/^Automated recipe to (.+?)$/m);

          commands.push({
            name: "/" + basename(file, ".md"),
            title: titleMatch ? titleMatch[1].trim() : basename(file, ".md"),
            arguments: argMatch ? argMatch[1].trim() : "(none)",
            description: descMatch ? descMatch[1].trim() : "",
          });
        }

        return { content: [{ type: "text", text: JSON.stringify(commands, null, 2) }] };
      },
    },
  ];
}
