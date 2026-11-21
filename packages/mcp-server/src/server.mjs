#!/usr/bin/env node
/**
 * @shavin/mcp — Modular Model Context Protocol Server for @shavin/ui
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { registerTokensTool } from "./tools/tokens.mjs";
import { registerComponentsTool } from "./tools/components.mjs";
import { registerBuilderTools } from "./tools/builder.mjs";
import { registerValidationTools } from "./tools/validation.mjs";
import { registerGuidelinesTool } from "./tools/guidelines.mjs";
import { registerEnvironmentTools } from "./tools/environment.mjs";
import { registerRenderTools } from "./tools/render.mjs";
import { registerSkillsTools } from "./tools/skills.mjs";
import { registerSynthesizeTool } from "./tools/synthesize.mjs";
import { registerContextTool } from "./tools/context.mjs";
import { registerSteerTool } from "./tools/steer.mjs";
import { registerBridgeTools } from "./tools/bridge.mjs";
import { registerComposeTools } from "./tools/compose.mjs";
import { withNextStep } from "./next-steps.mjs";
import { themeReminderOnce } from "./context.mjs";
import { registerArchLintTool } from "./tools/archlint.mjs";
import { registerStudioRelayTools } from "./tools/studio-relay.mjs";
import { globalBridge } from "./bridge/server.mjs";
import { getActiveRelay } from "./bridge/studio-relay.mjs";
import { isToolVisible } from "./tool-visibility.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const CWD = process.cwd();
const PKG_ASSETS = resolve(__dirname, "..", "assets");
const REPO_ROOT = resolve(__dirname, "..", "..", "..");

function resolveKnowledgePath(relPath) {
  const candidates = [
    resolve(CWD, relPath),
    resolve(CWD, "node_modules", "@shavin", "ui", relPath),
    resolve(CWD, "node_modules", "@shavin", "skills", relPath),
    resolve(PKG_ASSETS, relPath),
    resolve(REPO_ROOT, relPath),
    resolve(REPO_ROOT, "packages", "ui", relPath),
    resolve(REPO_ROOT, "packages", "skills", relPath),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

function loadJSON(file) {
  const p = resolveKnowledgePath(file);
  if (!p) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function loadText(file) {
  const p = resolveKnowledgePath(file);
  if (!p) return null;
  return readFileSync(p, "utf-8");
}

function parseFrontmatter(text) {
  if (!text.startsWith("---")) return { attributes: {}, body: text };
  const endIdx = text.indexOf("\n---", 3);
  if (endIdx === -1) return { attributes: {}, body: text };
  const yamlBlock = text.slice(3, endIdx).trim();
  const body = text.slice(endIdx + 4).trim();
  const attributes = {};

  for (const line of yamlBlock.split("\n")) {
    const match = line.match(/^([a-zA-Z0-9_-]+):\s*(.*)/);
    if (match) attributes[match[1]] = match[2].trim();
  }
  return { attributes, body };
}

function findSkillsDir() {
  // Packaged skills first: the project's @shavin/skills, then the copy bundled with this
  // server, then this repository's source. The project's .agents/skills is a copy made for agents
  // without the MCP and can be older (inspect_environment reports that), so it comes last.
  const candidates = [
    resolve(CWD, "node_modules", "@shavin", "skills", "skills"),
    resolve(PKG_ASSETS, "skills"),
    resolve(REPO_ROOT, "packages", "skills", "skills"),
    resolve(CWD, ".agents", "skills"),
    resolve(REPO_ROOT, ".agents", "skills"),
  ];
  for (const c of candidates) {
    if (existsSync(c)) return c;
  }
  return null;
}

function walkDirFiles(dir, baseDir = dir) {
  const results = [];
  if (!existsSync(dir)) return results;
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDirFiles(fullPath, baseDir));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      const relPath = fullPath.slice(baseDir.length + 1);
      results.push({ fullPath, relPath, name: entry.name });
    }
  }
  return results;
}

function loadSkills() {
  const skillsDir = findSkillsDir();
  if (!skillsDir) return {};

  const result = {};
  const entries = readdirSync(skillsDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillFile = resolve(skillsDir, entry.name, "SKILL.md");
      const dirPath = resolve(skillsDir, entry.name);
      const allSkillFiles = walkDirFiles(dirPath);

      let attributes = {};
      let body = "";
      const headings = [];

      if (existsSync(skillFile)) {
        const text = readFileSync(skillFile, "utf-8");
        const parsed = parseFrontmatter(text);
        attributes = parsed.attributes;
        body = parsed.body;
      }

      const subFiles = {};

      for (const file of allSkillFiles) {
        const text = readFileSync(file.fullPath, "utf-8");
        const parsed = parseFrontmatter(text);

        for (const line of parsed.body.split("\n")) {
          if (/^#{1,3}\s+/.test(line)) {
            const h = line.replace(/^#{1,3}\s+/, "").trim();
            headings.push(h);
          }
        }

        if (file.name === "SKILL.md") {
          subFiles["skill"] = parsed.body;
          subFiles["skill.md"] = parsed.body;
          continue;
        }

        const baseKey = file.name.replace(/\.md$/, "").toLowerCase();
        const fullKey = file.name.toLowerCase();
        const relKey = file.relPath.replace(/\.md$/, "").toLowerCase();
        const spaceKey = baseKey.replace(/[-_]+/g, " ");

        subFiles[baseKey] = parsed.body;
        subFiles[fullKey] = parsed.body;
        subFiles[relKey] = parsed.body;
        subFiles[spaceKey] = parsed.body;

        const firstHeading = parsed.body.match(/^#+\s+(.+)$/m);
        if (firstHeading) {
          const hTitle = firstHeading[1].trim().toLowerCase();
          subFiles[hTitle] = parsed.body;
          subFiles[hTitle.replace(/[\s_]+/g, "-")] = parsed.body;
        }
      }

      result[entry.name.toLowerCase()] = {
        dirName: entry.name,
        name: attributes.name || entry.name,
        description: attributes.description || "",
        headings: Array.from(new Set(headings)),
        body: body || (allSkillFiles.length > 0 ? readFileSync(allSkillFiles[0].fullPath, "utf-8") : ""),
        subFiles,
      };
    }
  }
  return result;
}

const TOKENS = loadJSON("tokens.json");
const COMPONENTS = loadJSON("components.json");
// The packaged consumer rules (generated by scripts/gen-agents.mjs) come before the project's
// own AGENTS.md, which may be an older copy or a kit's hand-written guide.
const AGENTS_MD = [
  resolve(CWD, "node_modules", "@shavin", "skills", "AGENTS.md"),
  resolve(PKG_ASSETS, "AGENTS.md"),
  resolve(REPO_ROOT, "packages", "skills", "AGENTS.md"),
].filter(existsSync).map((p) => readFileSync(p, "utf-8"))[0] ?? loadText("AGENTS.md");
const SKILLS = loadSkills();
const ROOT = resolveKnowledgePath(".") || CWD;

/** Renamed tools: old name -> current name. Not listed in tools/list; calls are routed to the new tool. */
export const TOOL_ALIASES = { get_builder_schema: "get_studio_schema" };

export function createMcpServer() {
  const server = new Server(
    { name: "shavin", title: "Shavin", version: "0.1.0" },
    {
      capabilities: { tools: { listChanged: true } },
      instructions: `You are connected to the @shavin/ui design system MCP server.
Mandatory UI Execution Protocol:
0. Plan: before writing any page or section, call plan_page({ brief }), fill the plan, and run check_page({ plan }). Every section is built as <Section data-composition="<ID>"> from that plan.
1. Pre-Flight Lookup: NEVER invent JSX props, tokens, or Tailwind classes from memory. Query get_components({ name }) or get_tokens() first. For each planned section, query get_skill({ name: "layout-compositions", section: "<family>" }); motion via layout-motion / layout-choreography.
2. Concentric & Token Invariants: ZERO raw hex, ZERO rgb(), ZERO --n-* foundation vars. Containers use rounded-[var(--radius-panel)]; controls use rounded-[var(--radius-lg)]. Inner radius R_inner = max(floor, R_outer - P), floor = min(radius-lg, radius-panel/2). Never stack Card children flush; wrap in <Flex direction="column" gap="3">.
3. Post-Flight Validation: Always run validate_code({ code }) on generated JSX, then check_page({ targetDir }) on the project, before returning to the user.`,
    }
  );

  const toolRegistry = new Map();

  function register(tool) {
    if (Array.isArray(tool)) {
      tool.forEach((t) => toolRegistry.set(t.schema.name, t));
    } else if (tool && tool.schema) {
      toolRegistry.set(tool.schema.name, tool);
    }
  }

  // Register all modular tools
  register(registerTokensTool(server, TOKENS));
  register(registerComponentsTool(server, COMPONENTS));
  register(registerBuilderTools(server));
  register(registerValidationTools(server, COMPONENTS));
  register(registerGuidelinesTool(server, AGENTS_MD));
  register(registerEnvironmentTools(server, ROOT));
  register(registerRenderTools());
  register(registerSkillsTools(server, SKILLS, ROOT));
  register(registerComposeTools(server, SKILLS));
  register(registerSynthesizeTool(server));
  register(registerContextTool(server, ROOT));
  register(registerSteerTool(server));
  register(registerBridgeTools(server, globalBridge));
  register(registerArchLintTool(server));
  register(registerStudioRelayTools(server, COMPONENTS));
  createMcpServer.toolCount = toolRegistry.size;

  // Spin up local browser bridge daemon
  try {
    globalBridge.start().catch(() => {});
  } catch {
    // Ignore if running in constrained sandbox
  }

  const visibilityState = () => {
    let bridgeTabs = 0;
    try { bridgeTabs = globalBridge.getConnectedTabs?.().length ?? 0; } catch { /* bridge not running */ }
    return { studioConnected: !!getActiveRelay(), bridgeTabs };
  };
  const visibleTools = () => {
    const state = visibilityState();
    return Array.from(toolRegistry.values()).filter((t) => isToolVisible(t.schema.name, state));
  };

  // Tell the client when the visible set changes (Studio paired, a bridge tab appeared).
  let lastSig = visibleTools().map((t) => t.schema.name).join();
  const notifyIfChanged = () => {
    const sig = visibleTools().map((t) => t.schema.name).join();
    if (sig === lastSig) return;
    lastSig = sig;
    try { Promise.resolve(server.sendToolListChanged?.()).catch(() => {}); } catch { /* not connected yet */ }
  };
  const poll = setInterval(notifyIfChanged, 5000);
  poll.unref?.();

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    lastSig = visibleTools().map((t) => t.schema.name).join();
    return { tools: visibleTools().map((t) => t.schema) };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { arguments: args } = request.params;
    // Old tool names keep working so existing agent configs do not break (see TOOL_ALIASES).
    const name = TOOL_ALIASES[request.params.name] ?? request.params.name;
    const tool = toolRegistry.get(name);

    if (!tool) {
      return {
        content: [{
          type: "text",
          text: `Unknown tool: ${name}. Available: ${visibleTools().map((t) => t.schema.name).join(", ")}`,
        }],
        isError: true,
      };
    }

    try {
      const result = withNextStep(name, args, await tool.handler(args));
      // Advisory only, once per project per session, while the theme is still the unconfirmed default.
      if ((name === "validate_code" || name === "check_page") && !result?.isError && Array.isArray(result?.content)) {
        const reminder = themeReminderOnce(args?.targetDir || process.cwd());
        if (reminder) result.content.push({ type: "text", text: reminder });
      }
      notifyIfChanged();
      return result;
    } catch (err) {
      return {
        content: [{ type: "text", text: `Tool error (${name}): ${err.message}` }],
        isError: true,
      };
    }
  });

  return server;
}

export async function startMcpServer() {
  const server = createMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[shavin-mcp] Standalone MCP server running on stdio with ${createMcpServer.toolCount ?? "all"} tools.`);
}
