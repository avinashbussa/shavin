/**
 * Remote MCP Server — Streamable HTTP transport for IDE-based AI agents.
 *
 * Endpoint: POST /mcp (or /api/mcp)
 * Auth:     Bearer token (Supabase JWT) in Authorization header
 * Discovery: GET /.well-known/oauth-authorization-server
 *
 * This runs alongside the existing stdio server. The CLI detects
 * `--remote` or `--http` flag and starts this instead of stdio.
 *
 * Architecture:
 *   AI Agent (Cursor/Claude Code) → HTTP POST /mcp → StreamableHTTPServerTransport
 *   → MCP Server (30 tools, transport-filtered) → Supabase Realtime → Studio Canvas
 *
 * Session management:
 *   Stateful mode — each MCP client gets a sessionId. The StudioRelay
 *   global singleton is keyed by session so multiple agents can connect
 *   to different Studio sessions simultaneously.
 */

import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import { randomBytes } from "node:crypto";

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  InitializeRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  registerTokensTool,
} from "../tools/tokens.mjs";
import { registerComponentsTool } from "../tools/components.mjs";
import { registerBuilderTools } from "../tools/builder.mjs";
import { registerValidationTools } from "../tools/validation.mjs";
import { registerGuidelinesTool } from "../tools/guidelines.mjs";
import { registerEnvironmentTools } from "../tools/environment.mjs";
import { registerSkillsTools } from "../tools/skills.mjs";
import { registerSynthesizeTool } from "../tools/synthesize.mjs";
import { registerContextTool } from "../tools/context.mjs";
import { registerSteerTool } from "../tools/steer.mjs";
import { registerBridgeTools } from "../tools/bridge.mjs";
import { registerArchLintTool } from "../tools/archlint.mjs";
import { registerStudioRelayTools } from "../tools/studio-relay.mjs";

import { filterToolRegistry } from "./transport.mjs";
import {
  validateSupabaseToken,
  extractBearerToken,
  isMcpEndpoint,
  isOAuthDiscovery,
  getOAuthMetadata,
} from "./auth.mjs";
import { globalBridge } from "../bridge/server.mjs";

/**
 * Create an MCP server instance with all tools registered.
 * Uses the same tool modules as the stdio server.
 *
 * @param {"stdio"|"remote"|"rest"} transport - Transport type for tool filtering
 * @returns {Server}
 */
function createServerWithTools(transport = "remote") {
  const server = new Server(
    {
      name: "shavin",
      title: "Shavin",
      version: "0.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
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

  // Register all tools — same as stdio server
  // Note: These modules need the same context as stdio. We load files
  // from the project root for tokens, components, etc.
  const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
  // Knowledge comes from this package's bundled assets (what consumers get: the consumer
  // AGENTS.md, packaged skills), falling back to the monorepo sources.
  const ASSETS = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "assets");
  const TOKENS = loadJSON(ASSETS, "tokens.json") ?? loadJSON(ROOT, "tokens.json");
  const COMPONENTS = loadJSON(ASSETS, "components.json") ?? loadJSON(ROOT, "components.json");
  const AGENTS_MD = loadText(ASSETS, "AGENTS.md") ?? loadText(resolve(ROOT, "packages", "skills"), "AGENTS.md") ?? loadText(ROOT, "AGENTS.md");
  const SKILLS = loadSkills([resolve(ASSETS, "skills"), resolve(ROOT, "packages", "skills", "skills"), resolve(ROOT, ".agents", "skills")]);

  register(registerTokensTool(server, TOKENS));
  register(registerComponentsTool(server, COMPONENTS));
  register(registerBuilderTools(server));
  register(registerValidationTools(server));
  register(registerGuidelinesTool(server, AGENTS_MD));
  register(registerEnvironmentTools(server, ROOT));
  register(registerSkillsTools(server, SKILLS, ROOT));
  register(registerSynthesizeTool(server));
  register(registerContextTool(server, ROOT));
  register(registerSteerTool(server));
  register(registerBridgeTools(server, globalBridge));
  register(registerArchLintTool(server));
  register(registerStudioRelayTools(server));

  // Filter tools by transport
  const filteredRegistry = filterToolRegistry(toolRegistry, transport);

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: Array.from(filteredRegistry.values()).map((t) => t.schema),
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const tool = filteredRegistry.get(name);

    if (!tool) {
      return {
        content: [
          {
            type: "text",
            text: `Unknown tool: ${name}. Available: ${Array.from(filteredRegistry.keys()).join(", ")}`,
          },
        ],
        isError: true,
      };
    }

    try {
      return await tool.handler(args);
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: `Tool error (${name}): ${err.message}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

// --- File loading helpers (duplicated from server.mjs to avoid circular import) ---
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

function loadJSON(root, file) {
  let p = resolve(root, file);
  if (!existsSync(p) && existsSync(resolve(root, "packages", "ui", file))) {
    p = resolve(root, "packages", "ui", file);
  }
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, "utf8"));
  } catch {
    return null;
  }
}

function loadText(root, file) {
  const p = resolve(root, file);
  if (!existsSync(p)) return null;
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

function loadSkills(candidates) {
  const skillsDir = candidates.find(existsSync);
  if (!skillsDir) return {};
  const result = {};
  const entries = readdirSync(skillsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const skillFile = resolve(skillsDir, entry.name, "SKILL.md");
      if (existsSync(skillFile)) {
        const text = readFileSync(skillFile, "utf-8");
        const { attributes, body } = parseFrontmatter(text);
        const headings = [];
        for (const line of body.split("\n")) {
          if (/^#{1,3}\s+/.test(line))
            headings.push(line.replace(/^#{1,3}\s+/, "").trim());
        }
        const subFiles = {};
        const dirPath = resolve(skillsDir, entry.name);
        const subEntries = readdirSync(dirPath, { withFileTypes: true });
        for (const sub of subEntries) {
          if (sub.isFile() && sub.name.endsWith(".md") && sub.name !== "SKILL.md") {
            const subText = readFileSync(resolve(dirPath, sub.name), "utf-8");
            const subParsed = parseFrontmatter(subText);
            const key = sub.name.replace(/\.md$/, "").toLowerCase();
            subFiles[key] = subParsed.body;
            subFiles[sub.name.toLowerCase()] = subParsed.body;
          }
        }
        result[entry.name.toLowerCase()] = {
          dirName: entry.name,
          name: attributes.name || entry.name,
          description: attributes.description || "",
          headings,
          body,
          subFiles,
        };
      }
    }
  }
  return result;
}

// --- Session management ---
// Each HTTP session maps to a unique MCP server + transport pair.
// This allows multiple AI agents to connect simultaneously.
const sessions = new Map(); // sessionId → { server, transport, createdAt }

/**
 * Start the remote MCP HTTP server.
 *
 * @param {Object} opts
 * @param {number} [opts.port=3001] - Port to listen on
 * @param {string} [opts.supabaseUrl] - Supabase project URL
 * @param {string} [opts.supabaseAnonKey] - Supabase anon key
 */
export async function startRemoteServer(opts = {}) {
  const port = opts.port || process.env.MCP_REMOTE_PORT || 3001;
  const supabaseUrl = opts.supabaseUrl || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    opts.supabaseAnonKey || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const httpServer = createServer(async (req, res) => {
    // CORS headers for browser-based MCP clients
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, mcp-session-id, mcp-protocol-version"
    );

    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }

    // --- OAuth discovery endpoint ---
    if (req.method === "GET" && isOAuthDiscovery(req.url)) {
      const origin = `http://localhost:${port}`;
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(getOAuthMetadata(origin)));
      return;
    }

    // --- Health check ---
    if (req.method === "GET" && (req.url === "/" || req.url === "/health")) {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          server: "shavin",
          transport: "streamable-http",
          version: "0.1.0",
          tools: "use POST /mcp with MCP protocol",
          auth: "Bearer token (Supabase JWT) required for /mcp",
        })
      );
      return;
    }

    // --- MCP endpoint ---
    if (req.method === "POST" && isMcpEndpoint(req.url)) {
      // Auth check (skip if no Supabase config — dev mode, or if explicitly disabled)
      const authDisabled = process.env.MCP_AUTH_DISABLED === "1" || process.env.MCP_AUTH_DISABLED === "true";
      if (supabaseUrl && supabaseAnonKey && !authDisabled) {
        const token = extractBearerToken(req.headers.authorization);
        if (!token) {
          res.writeHead(401, {
            "Content-Type": "application/json",
            "WWW-Authenticate": `Bearer resource_metadata="http://localhost:${port}/.well-known/oauth-protected-resource"`,
          });
          res.end(
            JSON.stringify({
              error: "invalid_request",
              error_description: "Authorization header required. Use Bearer token from Supabase auth.",
            })
          );
          return;
        }

        const authResult = await validateSupabaseToken(
          token,
          supabaseUrl,
          supabaseAnonKey
        );
        if (!authResult.valid) {
          res.writeHead(401, { "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: "invalid_token",
              error_description: authResult.error,
            })
          );
          return;
        }
      }

      // Read request body
      let body;
      try {
        const chunks = [];
        for await (const chunk of req) chunks.push(chunk);
        body = JSON.parse(Buffer.concat(chunks).toString());
      } catch {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Invalid JSON body" }));
        return;
      }

      // Get or create session
      const sessionId = req.headers["mcp-session-id"];

      // Check if this is an initialize request
      const isInitialize = body.method === "initialize";

      let session;

      if (isInitialize) {
        // Create new session
        const newSessionId = randomUUID();
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => newSessionId,
        });

        const mcpServer = createServerWithTools("remote");

        await mcpServer.connect(transport);

        session = {
          server: mcpServer,
          transport,
          createdAt: Date.now(),
          id: newSessionId,
        };
        sessions.set(newSessionId, session);

        // Handle the initialize request through the transport
        await transport.handleRequest(req, res, body);
        return;
      } else if (sessionId && sessions.has(sessionId)) {
        // Existing session
        session = sessions.get(sessionId);
        await session.transport.handleRequest(req, res, body);
        return;
      } else {
        // No session and not initialize
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(
          JSON.stringify({
            error: "invalid_request",
            error_description: "No valid session. Send an 'initialize' request first.",
          })
        );
        return;
      }
    }

    // --- 404 for anything else ---
    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: "not_found",
        endpoints: {
          mcp: "POST /mcp",
          health: "GET /health",
          discovery: "GET /.well-known/oauth-authorization-server",
        },
      })
    );
  });

  // Start local bridge daemon too (for dev bridge tools if in stdio+remote hybrid mode)
  try {
    await globalBridge.start();
  } catch {
    // Bridge is optional in remote mode
  }

  httpServer.listen(port, () => {
    console.error(`[shavin] Remote MCP server listening on http://0.0.0.0:${port}`);
    console.error(`[shavin] MCP endpoint:   POST /mcp`);
    console.error(`[shavin] Auth discovery: GET /.well-known/oauth-authorization-server`);
    console.error(`[shavin] Health:         GET /health`);
    console.error(`[shavin] Transport:      Streamable HTTP (stateful sessions)`);
    console.error(`[shavin] Tools:          ${"remote-filtered (no dev bridge, no filesystem)"}`);
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error(`[shavin] ⚠️  No Supabase config — auth disabled (dev mode)`);
    } else {
      console.error(`[shavin] Auth:          Supabase JWT Bearer token`);
    }
  });

  // Cleanup on shutdown
  const shutdown = async () => {
    console.error("[shavin] Shutting down remote server...");
    for (const [id, session] of sessions) {
      try {
        await session.transport.close();
      } catch {
        // ignore
      }
    }
    sessions.clear();
    httpServer.close();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  return httpServer;
}
