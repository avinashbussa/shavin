/**
 * MCP Tools for live Studio canvas control via Supabase Realtime relay.
 *
 * These 7 tools enable an AI agent to:
 *   1. connect_studio        — join a Studio session by pairing code
 *   2. compose_to_canvas     — synthesize a layout and inject it live
 *   3. inject_blocks         — inject raw BlockNode[] tree into the canvas
 *   4. set_studio_theme      — change theme config (accent, dark mode, etc.)
 *   5. get_studio_state      — read current canvas blocks + theme
 *   6. clear_studio_canvas   — remove all blocks from the canvas
 *   7. disconnect_studio     — end the session
 *
 * All tools share a global StudioRelay instance. connect_studio creates it;
 * the rest use the active relay. disconnect_studio cleans up.
 *
 * Environment variables required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
 *
 * The synthesize_layout pipeline from tools/synthesize.mjs is reused for
 * compose_to_canvas — it produces clean @shavin/ui JSX that parseTsxToBlocks()
 * in Studio can render.
 */

import { synthesizeLayout } from "../tools/synthesize.mjs";
import {
  getGlobalRelay,
  getActiveRelay,
  clearGlobalRelay,
} from "../bridge/studio-relay.mjs";

/**
 * Shared error helper — returns a standard MCP error response.
 */
function errorResponse(message) {
  return {
    content: [{ type: "text", text: message }],
    isError: true,
  };
}

/**
 * Check if relay is connected; return active relay or error response.
 */
function requireRelay() {
  const relay = getActiveRelay();
  if (!relay) {
    return {
      error: errorResponse(
        "Not connected to Studio. Call `connect_studio` first with a 6-character pairing code from Studio's 'Connect AI' modal.\n\n" +
        "How to get a code:\n" +
        "1. Open studio.shavin.cc in your browser\n" +
        "2. Click 'Connect AI' in the toolbar\n" +
        "3. Copy the 6-character pairing code\n" +
        "4. Call connect_studio with that code"
      ),
    };
  }
  return { relay };
}

import { checkUsage } from "./usage-check.mjs";

export function registerStudioRelayTools(server, COMPONENTS) {
  return [
    // 1. connect_studio
    {
      schema: {
        name: "connect_studio",
        description:
          "Connect to a live Shavin Studio canvas session via Supabase Realtime. " +
          "The user must open studio.shavin.cc, click 'Connect AI', and share the 6-character pairing code. " +
          "Once connected, the AI agent can compose designs, inject blocks, change themes, and read canvas state in real-time while the user watches. " +
          "This is the entry point for all other Studio relay tools.",
        inputSchema: {
          type: "object",
          properties: {
            pairingCode: {
              type: "string",
              description:
                "6-character pairing code shown in Studio's 'Connect AI' modal. " +
                "Example: 'K7M2X9'",
              minLength: 6,
              maxLength: 6,
            },
            agentName: {
              type: "string",
              description:
                "Display name for the AI agent (shown in Studio UI). Default: 'Shavin MCP Agent'.",
            },
            timeoutMs: {
              type: "number",
              description:
                "Maximum milliseconds to wait for Studio to confirm the connection. Default: 10000.",
            },
          },
          required: ["pairingCode"],
        },
      },
      handler: async (args) => {
        const { pairingCode, agentName, timeoutMs } = args ?? {};

        if (!pairingCode) {
          return errorResponse("pairingCode is required. Get it from Studio's 'Connect AI' modal.");
        }

        try {
          const relay = await getGlobalRelay();
          const result = await relay.connect(pairingCode, {
            agentName,
            timeoutMs,
          });

          return {
            content: [
              {
                type: "text",
                text: [
                  `✅ Connected to Shavin Studio!`,
                  ``,
                  `**Session**: ${result.pairingCode}`,
                  `**Agent**: ${relay.agentName}`,
                  `**Status**: ${result.session?.status || "connected"}`,
                  ``,
                  `The Studio canvas is now live. You can:`,
                  `• \`compose_to_canvas\` — Generate a full layout from a prompt and inject it live`,
                  `• \`inject_blocks\` — Inject a raw BlockNode[] tree`,
                  `• \`set_studio_theme\` — Change accent, dark mode, radius, etc.`,
                  `• \`get_studio_state\` — Read current canvas blocks + theme`,
                  `• \`clear_studio_canvas\` — Clear all blocks`,
                  `• \`disconnect_studio\` — End the session`,
                  ``,
                  `Current canvas: ${result.studioInfo?.blocks?.length || 0} blocks`,
                  `Theme: ${JSON.stringify(result.studioInfo?.theme || {})}`,
                ].join("\n"),
              },
            ],
          };
        } catch (err) {
          return errorResponse(
            `Failed to connect to Studio: ${err.message}\n\n` +
            `Make sure:\n` +
            `1. Studio is open at studio.shavin.cc\n` +
            `2. The 'Connect AI' modal is showing a pairing code\n` +
            `3. The code hasn't expired (30-minute TTL — ask the user for a fresh code)\n\n` +
            `Only if you self-host Studio: point the MCP at your own Supabase — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (Supabase → Settings → API) and enable Realtime.`
          );
        }
      },
    },

    // 2. compose_to_canvas
    {
      schema: {
        name: "compose_to_canvas",
        description:
          "Synthesize a complete multi-section page layout from a natural language prompt and inject it directly into the live Studio canvas. " +
          "Uses the synthesize_layout pipeline to generate @shavin/ui JSX, which is rendered as a BlockNode tree on the canvas. " +
          "The user sees the design appear in real-time. Requires a prior `connect_studio` call.",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description:
                "Natural language description of the desired layout. " +
                "Example: 'A SaaS landing page with hero, feature grid, pricing, and CTA'",
            },
            category: {
              type: "string",
              enum: ["landing", "dashboard", "pricing", "auth", "content", "portfolio", "ecommerce"],
              description: "Layout category. Default: 'landing'.",
            },
            mode: {
              type: "string",
              enum: ["replace", "append"],
              description:
                "Injection mode: 'replace' clears canvas first, 'append' adds to existing blocks. Default: 'replace'. Ignored when frame is provided.",
            },
            frame: {
              type: "object",
              description:
                "When provided, creates a NEW spatial frame on the canvas (alongside existing ones) " +
                "and injects the composed layout into it. Use this to design for mobile/tablet viewports " +
                "or to add multiple screens to the canvas.",
              properties: {
                title: {
                  type: "string",
                  description: "Frame title shown on canvas (e.g. 'Pricing Page', 'Mobile Hero'). Default: 'AI Frame N'.",
                },
                device: {
                  type: "string",
                  enum: ["desktop", "mobile", "tablet", "auto", "block"],
                  description: "Device preset for the frame. Default: 'block'.",
                },
                width: { type: "integer", description: "Frame width in pixels. Default: 800." },
                height: { type: "integer", description: "Frame height in pixels. Default: 600." },
              },
            },
            theme: {
              type: "object",
              description: "Optional theme override applied before injection.",
              properties: {
                accentColor: { type: "string" },
                grayColor: { type: "string" },
                radius: { type: "string" },
                panelBackground: { type: "string" },
              },
            },
            sections: {
              type: "array",
              items: { type: "string" },
              description:
                "Specific block slugs to use (from the block registry). " +
                "If omitted, blocks are auto-selected by keyword scoring.",
            },
          },
          required: ["prompt"],
        },
      },
      handler: async (args) => {
        const { relay, error } = requireRelay();
        if (error) return error;

        const {
          prompt,
          category = "landing",
          mode = "replace",
          frame,
          theme = {},
          sections = [],
        } = args ?? {};

        if (!prompt) {
          return errorResponse("prompt is required.");
        }

        try {
          // 1. Synthesize the layout using the existing pipeline
          const synthResult = synthesizeLayout({
            prompt,
            category,
            theme,
            sections,
          });

          // 2. Apply theme if provided
          if (theme && Object.keys(theme).length > 0) {
            await relay.setTheme({
              accent: theme.accentColor,
              gray: theme.grayColor,
              radius: theme.radius,
              panelBackground: theme.panelBackground,
            });
          }

          // 3. Parse the synthesized JSX into BlockNode[] tree
          // The Studio's parseTsxToBlocks handles arbitrary @shavin/ui JSX.
          // We send the raw JSX as a special "jsx" block type that the Studio
          // will parse on the client side.
          // One __jsx_source__ per block: each rawCode is a self-contained
          // module that parses to a real node tree. Falls back to the joined
          // file only when the synthesizer returned no sections.
          const stamp = Date.now();
          const sources = synthResult.sections?.length
            ? synthResult.sections
            : [{ slug: "composed", code: synthResult.code }];
          const blocks = sources.map((sec, i) => ({
            id: `compose-${stamp}-${i}`,
            type: "__jsx_source__",
            props: {
              code: sec.code,
              blocksUsed: JSON.stringify(synthResult.blocksUsed),
              activationMode: synthResult.visualCompositor?.activationMode || "",
            },
            children: [],
          }));

          // 4. Inject into canvas
          const renderWait = relay.awaitRender(15000).catch(() => null);
          const injectResult = await relay.inject(blocks, mode, frame);
          const renderInfo = await renderWait;
          if (renderInfo?.error) {
            return errorResponse(`Studio rejected the composed layout: ${renderInfo.error}`);
          }
          const composeWarnings = (renderInfo?.warnings || []).map((w) => `⚠ ${w}`);
          const composeRender = renderInfo
            ? `Rendered in ${renderInfo.renderTime}ms, confirmed on canvas (${renderInfo.blockCount} root block${renderInfo.blockCount === 1 ? "" : "s"}).`
            : `Sent, but Studio did not confirm a render within 15s. Call get_studio_state to verify.`;

          return {
            content: [
              {
                type: "text",
                text: [
                  `✅ Composed and injected layout into Studio canvas!`,
                  ``,
                  `**Prompt**: ${prompt}`,
                  `**Category**: ${category}`,
                  `**Mode**: ${mode}`,
                  ...(frame ? [`**Frame**: ${frame.title || "AI Frame"} (${frame.device || "block"}, ${frame.width || 800}×${frame.height || 600})`] : []),
                  `**Blocks used**: ${synthResult.blocksUsed?.join(", ") || "auto-selected"}`,
                  `**Activation mode**: ${synthResult.visualCompositor?.activationMode || "N/A"}`,
                  `**Theme applied**: ${JSON.stringify(synthResult.themeApplied)}`,
                  ``,
                  composeRender,
                  ...composeWarnings,
                  synthResult.code
                    ? `\n--- Generated JSX (${synthResult.code.length} chars) ---\n\`\`\`tsx\n${synthResult.code.slice(0, 2000)}${synthResult.code.length > 2000 ? "\n... (truncated)" : ""}\n\`\`\``
                    : "",
                ].join("\n"),
              },
            ],
          };
        } catch (err) {
          return errorResponse(`Failed to compose to canvas: ${err.message}`);
        }
      },
    },

    // 3. inject_blocks
    {
      schema: {
        name: "inject_blocks",
        description:
          "Inject a raw BlockNode[] tree directly into the live Studio canvas, OR pass `code` (a Block TSX / @shavin/ui JSX module) and Studio parses it into the same editable node tree. Give exactly one of `blocks` or `code`. " +
          "Each block has an id, type (any @shavin/ui component name from the registry), props, and optional children. " +
          "The tree is rendered live by BlockRenderer. Requires a prior `connect_studio` call. " +
          "IMPORTANT: (1) Card/Container do NOT auto-space children \u2014 always wrap card children in a Flex block with gap prop. " +
          "(2) Use Icon type with name prop for all icons \u2014 never use emoji/glyph characters (\u2713\u2605\u2192) in text content.",
        inputSchema: {
          type: "object",
          properties: {
            code: {
              type: "string",
              description:
                "Alternative to `blocks`: one self-contained TSX module (imports from @shavin/ui, one exported component). " +
                "Studio parses it into editable layers; anything it cannot model stays a locked code island. " +
                "Pass several modules by calling inject_blocks with mode 'append'.",
            },
            blocks: {
              type: "array",
              description:
                "Array of BlockNode objects to inject. Each block: { id, type, props, children }.",
              items: {
                type: "object",
                properties: {
                  id: { type: "string", description: "Unique node id" },
                  type: {
                    type: "string",
                    description:
                      "Component type \u2014 any @shavin/ui primitive from the registry " +
                      "(e.g. 'Container', 'Heading', 'Text', 'Button', 'Card', 'Flex', 'Grid', 'Badge', 'Avatar', 'Icon', 'Separator', 'IconButton')",
                  },
                  props: {
                    type: "object",
                    description:
                      "Component props as key-value pairs. " +
                      "Example: { size: '1', children: 'Hello World' }. " +
                      "Use the same prop names as @shavin/ui CVA variants: weight (not fontWeight), name (not icon). " +
                      "For responsive design, use @tablet/@mobile suffixes: " +
                      "{ columns: '3', 'columns@mobile': '1', gap: '6', 'gap@mobile': '4' }. " +
                      "For Icon blocks: { name: 'Check', size: 'sm', color: 'accent' } \u2014 name is a Lucide icon name (Check, Star, ArrowRight, etc.). " +
                      "Never set the same style via both a prop and className (e.g. size='7' AND className='text-3xl' conflicts).",
                  },
                  children: {
                    type: "array",
                    description: "Child blocks (same structure)",
                    items: { type: "object" },
                  },
                },
              },
            },
            mode: {
              type: "string",
              enum: ["replace", "append"],
              description: "Injection mode. Default: 'replace'. Ignored when frame is provided.",
            },
            frame: {
              type: "object",
              description:
                "When provided, creates a NEW spatial frame on the canvas (alongside existing ones) " +
                "and injects the blocks into it. Existing frames are left untouched. " +
                "Use this to design for mobile/tablet viewports or to add multiple screens.",
              properties: {
                title: {
                  type: "string",
                  description: "Frame title shown on canvas (e.g. 'Pricing Page', 'Mobile Hero'). Default: 'AI Frame N'.",
                },
                device: {
                  type: "string",
                  enum: ["desktop", "mobile", "tablet", "auto", "block"],
                  description: "Device preset for the frame. Default: 'block'.",
                },
                width: { type: "integer", description: "Frame width in pixels. Default: 800." },
                height: { type: "integer", description: "Frame height in pixels. Default: 600." },
              },
            },
          },
        },
      },
      handler: async (args) => {
        const { relay, error } = requireRelay();
        if (error) return error;

        const { code, mode = "replace", frame } = args ?? {};
        let { blocks } = args ?? {};

        let usageWarnings = [];
        if (typeof code === "string" && code.trim()) {
          if (blocks) return errorResponse("Pass either `blocks` or `code`, not both.");
          // Values outside a component's variant set (e.g. <Section size="sm">) are
          // kept by Studio but have no effect, so tell the agent now, not after it
          // sees a wrong-looking canvas.
          try { usageWarnings = COMPONENTS ? checkUsage(code, COMPONENTS) : []; } catch { usageWarnings = []; }
          blocks = [{ id: `code-${Date.now()}`, type: "__jsx_source__", props: { code }, children: [] }];
        }
        if (!blocks || !Array.isArray(blocks)) {
          return errorResponse("Provide `blocks` (BlockNode[]) or `code` (a TSX module string).");
        }

        try {
          // Register the render waiter first so a fast confirmation is never missed.
          const renderWait = relay.awaitRender(15000).catch(() => null);
          const result = await relay.inject(blocks, mode, frame);

          // Wait for Studio to confirm the blocks have been rendered.
          // This closes the feedback loop — the agent knows the design is
          // actually visible, not just that the broadcast was sent.
          const renderInfo = await renderWait;

          if (renderInfo?.error) {
            return errorResponse(`Studio rejected the injection: ${renderInfo.error}`);
          }
          const warnLines = (renderInfo?.warnings || []).map((w) => `⚠ ${w}`);
          const renderLine = renderInfo
            ? `Rendered in ${renderInfo.renderTime}ms, confirmed on canvas (${renderInfo.blockCount} root block${renderInfo.blockCount === 1 ? "" : "s"}).`
            : `Sent, but Studio did not confirm a render within 15s. Call get_studio_state to verify before assuming it is visible.`;

          return {
            content: [
              {
                type: "text",
                text: [
                  `✅ Injected ${result.blockCount} blocks into Studio canvas (mode: ${result.mode}).`,
                  ...(result.frame ? [`**Frame**: ${result.frame.title || "AI Frame"} (${result.frame.device || "block"}, ${result.frame.width || 800}×${result.frame.height || 600})`] : []),
                  ``,
                  `Block types: ${blocks.map((b) => b.type).join(", ")}`,
                  renderLine,
                  ...warnLines,
                  ...usageWarnings.map((u) => `⚠ will not render as intended: ${u}`),
                ].join("\n"),
              },
            ],
          };
        } catch (err) {
          return errorResponse(`Failed to inject blocks: ${err.message}`);
        }
      },
    },

    // 4. set_studio_theme
    {
      schema: {
        name: "set_studio_theme",
        description:
          "Change the Studio canvas theme in real-time. Updates accent color, gray scale, radius preset, dark/light mode, scaling, and panel background. " +
          "The user sees the theme change instantly. Requires a prior `connect_studio` call.",
        inputSchema: {
          type: "object",
          properties: {
            accent: {
              type: "string",
              description:
                "Accent color preset name. Valid values: Maeve, Grass, Amber, Tomato, Crimson, Pink, Plum, Iris, Indigo, Blue, Sky, Cyan, Teal, Mint, Monochrome, Black.",
            },
            gray: {
              type: "string",
              description: "Gray color preset name. Valid values: Gray, Slate, Mauve, Olive, Sand, Zinc.",
            },
            radius: {
              type: "string",
              description: "Radius preset. Valid values: none, small, medium, large, full.",
            },
            dark: {
              type: "boolean",
              description: "Enable dark mode (true) or light mode (false).",
            },
            scaling: {
              type: "string",
              description: "Scaling percentage. Valid values: 90%, 95%, 100%, 105%, 110%.",
            },
            panelBackground: {
              type: "string",
              enum: ["solid", "translucent"],
              description: "Panel background style.",
            },
          },
        },
      },
      handler: async (args) => {
        const { relay, error } = requireRelay();
        if (error) return error;

        const theme = args ?? {};
        if (Object.keys(theme).length === 0) {
          return errorResponse("At least one theme property is required.");
        }

        try {
          const result = await relay.setTheme(theme);

          return {
            content: [
              {
                type: "text",
                text: [
                  `✅ Studio theme updated!`,
                  ``,
                  `Applied: ${JSON.stringify(result.theme, null, 2)}`,
                  `The user can see the theme change live on the canvas.`,
                ].join("\n"),
              },
            ],
          };
        } catch (err) {
          return errorResponse(`Failed to set theme: ${err.message}`);
        }
      },
    },

    // 5. get_studio_state
    {
      schema: {
        name: "get_studio_state",
        description:
          "Read the current Studio canvas state — all blocks and theme configuration. " +
          "Use this to understand what's currently on the canvas before making changes, or to verify that injected blocks rendered correctly. " +
          "Requires a prior `connect_studio` call.",
        inputSchema: {
          type: "object",
          properties: {
            timeoutMs: {
              type: "number",
              description: "Maximum milliseconds to wait for Studio response. Default: 5000.",
            },
          },
        },
      },
      handler: async (args) => {
        const { relay, error } = requireRelay();
        if (error) return error;

        const { timeoutMs = 5000 } = args ?? {};

        try {
          const state = await relay.getState(timeoutMs);

          const blockSummary = (state.blocks || []).map((b, i) => {
            const childCount = b.children?.length || 0;
            return `  ${i + 1}. [${b.type}] ${b.props?.children || b.props?.title || b.id}${childCount > 0 ? ` (${childCount} children)` : ""}`;
          });

          return {
            content: [
              {
                type: "text",
                text: [
                  `📊 Studio Canvas State`,
                  ``,
                  `**Blocks**: ${(state.blocks || []).length}`,
                  blockSummary.length > 0 ? blockSummary.join("\n") : "  (empty canvas)",
                  ``,
                  `**Theme**:`,
                  `  Accent: ${state.theme?.accent || "default"}`,
                  `  Gray: ${state.theme?.gray || "default"}`,
                  `  Radius: ${state.theme?.radius || "default"}`,
                  `  Dark mode: ${state.theme?.dark ? "on" : "off"}`,
                  `  Scaling: ${state.theme?.scaling || "100%"}`,
                  `  Panel bg: ${state.theme?.panelBackground || "solid"}`,
                ].join("\n"),
              },
            ],
          };
        } catch (err) {
          return errorResponse(`Failed to get studio state: ${err.message}`);
        }
      },
    },

    // 6. clear_studio_canvas
    {
      schema: {
        name: "clear_studio_canvas",
        description:
          "Remove all blocks from the Studio canvas, leaving it empty. " +
          "Use before composing a fresh layout or to start over. " +
          "Requires a prior `connect_studio` call.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      handler: async () => {
        const { relay, error } = requireRelay();
        if (error) return error;

        try {
          await relay.clearCanvas();

          return {
            content: [
              {
                type: "text",
                text: `✅ Studio canvas cleared. All blocks removed. The canvas is now empty.`,
              },
            ],
          };
        } catch (err) {
          return errorResponse(`Failed to clear canvas: ${err.message}`);
        }
      },
    },

    // 7. disconnect_studio
    {
      schema: {
        name: "disconnect_studio",
        description:
          "Disconnect from the Studio session. Sends a disconnect event to Studio (closing the 'AI Connected' indicator), unsubscribes from the Realtime channel, and marks the session as disconnected. " +
          "Call this when the design session is complete or before connecting to a different Studio session.",
        inputSchema: {
          type: "object",
          properties: {},
        },
      },
      handler: async () => {
        const relay = getActiveRelay();
        if (!relay) {
          return {
            content: [
              {
                type: "text",
                text: `Not currently connected to any Studio session.`,
              },
            ],
          };
        }

        try {
          await relay.disconnect();
          clearGlobalRelay();

          return {
            content: [
              {
                type: "text",
                text: [
                  `✅ Disconnected from Studio session.`,
                  ``,
                  `The Studio's 'AI Connected' indicator has turned off.`,
                  `The user can start a new session by clicking 'Connect AI' again.`,
                ].join("\n"),
              },
            ],
          };
        } catch (err) {
          return errorResponse(`Failed to disconnect: ${err.message}`);
        }
      },
    },
  ];
}
