/**
 * MCP Tools for live Studio canvas control via Supabase Realtime relay.
 *
 * These 10 tools enable an AI agent to:
 *   1. connect_studio        — join a Studio session by pairing code
 *   2. compose_to_canvas     — synthesize a layout and inject it live
 *   3. inject_blocks         — inject raw BlockNode[] tree into the canvas
 *   4. set_studio_theme      — change theme config (brand, dark mode, etc.)
 *   5. get_studio_state      — read current canvas blocks + theme
 *   6. clear_studio_canvas   — remove all blocks from the canvas
 *   7. disconnect_studio     — end the session
 *   8. duplicate_frame       — copy a frame (new ids), placed beside it
 *   9. export_frame          — render a frame to PNG / JPG / WebP on disk
 *  10. resize_frame          — resize a frame to a device / social preset or custom size
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
        "Not connected to Studio. Call `connect_studio` first with a 6-character pairing code from Studio's 'Connect AI' panel (the star tab in the inspector).\n\n" +
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

/**
 * Report the Studio theme without claiming anything that did not happen.
 * - `requested` null: nothing was asked, so the file theme was left alone (and is read back for the record).
 * - `requested` set: read the live theme back and compare; a mismatch or an unreadable state is said plainly,
 *   with the recovery steps.
 * @returns {Promise<string[]>} lines for a tool result
 */
export async function describeTheme(relay, requested) {
  let live = null;
  try {
    live = (await relay.getState(5000))?.theme ?? null;
  } catch {
    live = null;
  }
  const show = (t) => `brand ${t.brand ?? "?"}, gray ${t.gray ?? "?"}, radius ${t.radius ?? "?"}`;
  if (!requested) {
    return [
      `**Theme**: unchanged. compose_to_canvas only changes the file theme when you pass \`theme\`.${live ? ` Current: ${show(live)}.` : ""}`,
    ];
  }
  const asked = Object.entries(requested).filter(([, v]) => v !== undefined);
  const askedText = asked.map(([k, v]) => `${k} ${v}`).join(", ");
  if (!live) {
    return [
      `**Theme**: requested ${askedText}, but Studio's theme could not be read back, so it is NOT confirmed. ` +
        `Recovery: call get_studio_state to check; if it differs, call set_studio_theme with the same values.`,
    ];
  }
  const norm = (v) => String(v ?? "").trim().toLowerCase();
  const wrong = asked.filter(([k, v]) => {
    const got = norm(live[k]);
    return got !== norm(v) && !got.includes(norm(v));
  });
  if (wrong.length === 0) return [`**Theme**: applied and confirmed (${show(live)}).`];
  return [
    `**Theme**: requested ${askedText} but Studio reports ${show(live)}, so ${wrong.map(([k]) => k).join(", ")} did not apply. ` +
      `Recovery: call set_studio_theme with ${JSON.stringify(Object.fromEntries(wrong))}, then get_studio_state to confirm. ` +
      `Check the value is a valid Studio option (see get_studio_schema).`,
  ];
}

import { checkUsage } from "./usage-check.mjs";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, extname, isAbsolute, resolve } from "node:path";

import { SOCIAL_FRAME_PRESETS, SOCIAL_FRAME_SIZES } from "./social-presets.mjs";
import { composePoster } from "./poster-compose.mjs";
export { SOCIAL_FRAME_PRESETS, SOCIAL_FRAME_SIZES };

/** Shown when no `title` was passed: Studio, which knows the frames on the canvas, picks the name. */
const DEFAULT_FRAME_TITLE_NOTE = "(named by Studio from its type and size, e.g. \"Mobile 390\")";

const SOCIAL_DEVICE_DESCRIPTION =
  "Device preset for the frame. Default: Studio's default viewport (Desktop unless the file says otherwise). 'block' is retired and becomes 'desktop'. " +
  "Social presets are exact canvases (no padding, clipped at the edge, exported at exactly this size): " +
  "'social-portrait' 1080x1350 (Instagram 4:5), 'social-square' 1080x1080, 'social-wide' 1600x900 (16:9). Their width/height are ignored.";

export const FRAME_DEVICES = ["desktop", "mobile", "tablet", "auto", "block", ...SOCIAL_FRAME_PRESETS];
/** Presets `resize_frame` accepts (no retired "block", no "auto": pass width/height for a custom size). */
export const RESIZE_DEVICES = ["desktop", "tablet", "mobile", ...SOCIAL_FRAME_PRESETS];
const MAX_FRAME_PX = 10000;

/** The `frame` input schema shared by compose_to_canvas and inject_blocks (one definition, same shape). */
export function frameInputSchema(description) {
  return {
    type: "object",
    description,
    properties: {
      title: {
        type: "string",
        description: "Frame title shown on canvas (e.g. 'Pricing Page', 'Mobile Hero'). Default when omitted: Studio names the frame by its type and size, e.g. 'Desktop 1440', 'Mobile 390', 'Instagram portrait 1080×1350', 'Custom 1200×800', numbered when taken ('Desktop 1440 (2)').",
      },
      device: { type: "string", enum: FRAME_DEVICES, description: SOCIAL_DEVICE_DESCRIPTION },
      width: { type: "integer", minimum: 1, maximum: MAX_FRAME_PX, description: "Frame width in pixels. Default: the device preset's width (desktop 1440, tablet 768, mobile 390), else 800." },
      height: { type: "integer", minimum: 1, maximum: MAX_FRAME_PX, description: "Frame height in pixels. Default: the device preset's height (desktop 1024, tablet 1024, mobile 844), else 600." },
    },
  };
}

/**
 * Validate a `frame` argument. Returns an error message with exact recovery steps, or null when it is fine.
 * Width and height on a social preset are ignored by design (the size is exact), so they are not an error here.
 */
export function validateFrameSpec(frame) {
  if (frame === undefined || frame === null) return null;
  if (typeof frame !== "object" || Array.isArray(frame)) return `frame must be an object like { device: "social-square", title: "Post" }. Got ${Array.isArray(frame) ? "an array" : typeof frame}.`;
  if (frame.device !== undefined && !FRAME_DEVICES.includes(frame.device)) {
    return `Unknown frame.device "${frame.device}". Use one of: ${FRAME_DEVICES.join(", ")}; or omit device and pass width/height for a custom size.`;
  }
  for (const k of ["width", "height"]) {
    const v = frame[k];
    if (v !== undefined && (!Number.isInteger(v) || v < 1 || v > MAX_FRAME_PX)) {
      return `frame.${k} must be a whole number of pixels from 1 to ${MAX_FRAME_PX}, got ${JSON.stringify(v)}. Pass e.g. { width: 1200, height: 800 }, or use a device preset (${RESIZE_DEVICES.join(", ")}).`;
    }
  }
  if (frame.title !== undefined && typeof frame.title !== "string") return `frame.title must be a string, got ${typeof frame.title}. Pass e.g. { title: "Pricing Page" }.`;
  return null;
}

/**
 * Validate resize_frame arguments. Returns an error message with exact recovery steps, or null.
 * Social presets are exact pixel sizes, so combining one with width/height is refused rather than silently ignored.
 */
export function validateResizeArgs(args) {
  const { frameId, device, width, height } = args ?? {};
  if (typeof frameId !== "string" || !frameId.trim()) {
    return "frameId is required. Call `get_studio_state` and pass the id of one of its frames (listed as `frame-...`), e.g. resize_frame({ frameId: \"frame-main\", device: \"social-square\" }).";
  }
  const hasSize = width !== undefined || height !== undefined;
  if (device === undefined && !hasSize) {
    return `Nothing to resize to. Pass a device preset (${RESIZE_DEVICES.join(", ")}) or a custom width and/or height in pixels.`;
  }
  if (device !== undefined && hasSize) {
    return `Pass either device or width/height, not both. Social presets are exact sizes (${Object.entries(SOCIAL_FRAME_SIZES).map(([k, v]) => `${k} ${v.width}x${v.height}`).join(", ")}) and cannot be adjusted: drop width/height to use ${device}, or drop device for a custom size.`;
  }
  if (device !== undefined && !RESIZE_DEVICES.includes(device)) {
    return `Unknown device "${device}". Use one of: ${RESIZE_DEVICES.join(", ")}; or omit device and pass width/height for a custom size.${device === "block" || device === "auto" ? ` "${device}" is not a size: use desktop for the default web size.` : ""}`;
  }
  for (const [k, v] of [["width", width], ["height", height]]) {
    if (v !== undefined && (!Number.isInteger(v) || v < 1 || v > MAX_FRAME_PX)) {
      return `${k} must be a whole number of pixels from 1 to ${MAX_FRAME_PX}, got ${JSON.stringify(v)}. Pass e.g. { width: 1200, height: 800 }.`;
    }
  }
  return null;
}

/** Pixel size a frame spec resolves to (social presets are exact). */
export function frameSize(frame) {
  const fixed = SOCIAL_FRAME_SIZES[frame?.device];
  if (fixed) return fixed;
  const web = WEB_FRAME_SIZES[frame?.device];
  return { width: frame?.width || web?.width || 800, height: frame?.height || web?.height || 600 };
}

const WEB_FRAME_SIZES = { desktop: { width: 1440, height: 1024 }, tablet: { width: 768, height: 1024 }, mobile: { width: 390, height: 844 } };

const EXPORT_EXT = { png: ".png", jpg: ".jpg", webp: ".webp" };

/**
 * Resolve and write an exported image. Relative paths resolve against the MCP process's working directory.
 * The extension must match the format (or be missing, then it is added), so a .png file never holds JPEG bytes.
 * @returns {Promise<string>} the absolute path written
 */
export async function writeExportFile(buffer, path, format) {
  if (typeof path !== "string" || !path.trim()) throw new Error("path is required. Pass where to save the image, e.g. \"/tmp/post.png\".");
  const want = EXPORT_EXT[format];
  if (!want) throw new Error(`Unsupported format "${format}". Use png, jpg or webp.`);
  let abs = isAbsolute(path) ? path : resolve(process.cwd(), path);
  const ext = extname(abs).toLowerCase();
  if (!ext) abs += want;
  else if (!(ext === want || (format === "jpg" && ext === ".jpeg"))) throw new Error(`path ends in "${ext}" but format is "${format}". Use a ${want} path or change the format.`);
  await mkdir(dirname(abs), { recursive: true });
  await writeFile(abs, buffer);
  return abs;
}

export function registerStudioRelayTools(server, COMPONENTS) {
  return [
    // 1. connect_studio
    {
      schema: {
        name: "connect_studio",
        description:
          "Connect to a live Shavin Studio canvas by 6-character pairing code (studio.shavin.cc → 'Connect AI'). " +
          "Only for Studio sessions: the other Studio tools (compose_to_canvas, inject_blocks, set_studio_theme, get_studio_state, clear_studio_canvas, disconnect_studio) are listed after this succeeds.",
        inputSchema: {
          type: "object",
          properties: {
            pairingCode: {
              type: "string",
              description:
                "6-character pairing code shown in Studio's 'Connect AI' panel (the star tab in the inspector). " +
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
          return errorResponse("pairingCode is required. Get it from Studio's 'Connect AI' panel (the star tab in the inspector).");
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
                  `Before you compose, load the Studio rules: \`get_skill({ name: "shavin-studio" })\` (BlockNode prop names, @tablet/@mobile overrides, frames). They are only needed while Studio is connected.`,
                  ``,
                  `The Studio canvas is now live. You can:`,
                  `• \`compose_to_canvas\` — Generate a full layout from a prompt and inject it live`,
                  `• \`inject_blocks\` — Inject a raw BlockNode[] tree`,
                  `• \`set_studio_theme\` — Change brand, dark mode, radius, etc.`,
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
            `2. The 'Connect AI' panel (the star tab in the inspector) is showing a pairing code\n` +
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
          "The user sees the design appear in real-time. Requires a prior `connect_studio` call. " +
          "For a social frame (device social-portrait / social-square / social-wide) it composes ONE poster section that fits the exact canvas and uses the prompt's own text: " +
          "put the copy in quotes, e.g. headline \"Ship faster\", subhead \"One line\", CTA \"Start free\". Fixture copy is never used; if the text cannot fit, the result says so with the recovery steps.",
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
                "Injection mode: 'replace' makes these the main (first) frame's sections, 'append' adds them after its existing sections. " +
                "A frame holds any number of sections, stacked top to bottom. Default: 'replace'. Ignored when frame is provided.",
            },
            frame: frameInputSchema(
              "When provided, creates a NEW spatial frame on the canvas (alongside existing ones) " +
                "and injects the composed layout into it. Use this to design for mobile/tablet viewports " +
                "or to add multiple screens to the canvas.",
            ),
            theme: {
              type: "object",
              description:
                "Optional. Set the FILE's theme (brandColor, grayColor, radius, panelBackground) before injection; the result reads it back and says whether it applied. " +
                "If omitted, the file's theme is left exactly as it is (compose never picks a theme for you). Use set_studio_theme to change it later.",
              properties: {
                brandColor: { type: "string" },
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
          return errorResponse("prompt is required. Pass a description like \"SaaS landing page with hero, features, pricing and CTA\".");
        }
        const frameError = validateFrameSpec(frame);
        if (frameError) return errorResponse(frameError);

        try {
          // 1. Social presets are exact poster canvases: compose ONE poster section from the prompt's own text.
          //    Explicit `sections` keep the block pipeline (the caller picked those blocks on purpose).
          const poster =
            SOCIAL_FRAME_PRESETS.includes(frame?.device) && !(sections && sections.length > 0)
              ? composePoster({ prompt, device: frame.device })
              : null;
          // Otherwise synthesize page sections from the scored block registry.
          const synthResult = poster
            ? {
                code: poster.code,
                sections: [{ slug: poster.slug, name: "Poster", code: poster.code }],
                blocksUsed: [poster.slug],
                visualCompositor: { activationMode: "POSTER" },
              }
            : synthesizeLayout({ prompt, category, theme, sections });

          // 2. Theme: compose never changes the file theme on its own. It is set only when `theme` is passed
          //    (then read back below), so the report can say what is really in the file.
          const themeRequested = {
            brand: theme?.brandColor,
            gray: theme?.grayColor,
            radius: theme?.radius,
            panelBackground: theme?.panelBackground,
          };
          const themeKeys = Object.keys(themeRequested).filter((k) => themeRequested[k] !== undefined);
          if (themeKeys.length > 0) {
            await relay.setTheme(themeRequested);
          }

          // 3. Parse the synthesized JSX into BlockNode[] tree
          // The Studio's parseTsxToBlocks handles arbitrary @shavin/ui JSX.
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
          const composeWarnings = [...(poster?.warnings || []), ...(renderInfo?.warnings || [])].map((w) => `⚠ ${w}`);
          const composeRender = renderInfo
            ? `Rendered in ${renderInfo.renderTime}ms, confirmed on canvas (${renderInfo.blockCount} root block${renderInfo.blockCount === 1 ? "" : "s"}).`
            : `Sent, but Studio did not confirm a render within 15s. Call get_studio_state to verify.`;

          // Theme line: only what is true. Read the live theme back.
          const themeLines = await describeTheme(relay, themeKeys.length > 0 ? themeRequested : null);

          // Prompt text that the block pipeline cannot place (fixture copy is kept): say so, with the way out.
          const quoted = !poster && /["\u201C][^"\u201D]{2,}["\u201D]/.test(prompt);
          if (quoted) {
            composeWarnings.push(
              "⚠ Text quoted in the prompt was NOT used: page blocks keep their own sample copy. " +
                "Recovery: compose into a social frame (frame.device \"social-portrait\", \"social-square\" or \"social-wide\") to place the prompt's text, " +
                "or write the layout yourself and call inject_blocks with `code`, or double-click the text on the canvas to edit it.",
            );
          }

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
                  ...(frame ? [`**Frame**: ${frame.title || DEFAULT_FRAME_TITLE_NOTE} (${frame.device || "block"}, ${frameSize(frame).width}×${frameSize(frame).height})`] : []),
                  ...(poster
                    ? [
                        `**Composition**: one poster section for ${frame.device} (prompt text, no fixture copy)`,
                        `**Headline**: ${poster.copy.headline}`,
                        ...(poster.copy.subhead ? [`**Subhead**: ${poster.copy.subhead}`] : []),
                        ...(poster.copy.cta ? [`**CTA**: ${poster.copy.cta}`] : []),
                        `**Fit**: ${poster.fit.ok ? "fits the canvas" : "may be clipped (see warning)"} (heading ${poster.fit.headingSize}, ~${poster.fit.usedHeight}px of ${poster.fit.availableHeight}px)`,
                      ]
                    : [
                        `**Blocks used**: ${synthResult.blocksUsed?.join(", ") || "auto-selected"}`,
                        `**Activation mode**: ${synthResult.visualCompositor?.activationMode || "N/A"}`,
                      ]),
                  ...themeLines,
                  ``,
                  composeRender,
                  ...composeWarnings,
                  synthResult.code
                    ? `\n--- Generated JSX (${synthResult.code.length} chars)${poster ? "" : "; its ThemeProvider is a preview, the canvas keeps the file theme"} ---\n\`\`\`tsx\n${synthResult.code.slice(0, 2000)}${synthResult.code.length > 2000 ? "\n... (truncated)" : ""}\n\`\`\``
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
                      "For Icon blocks: { name: 'Check', size: 'sm', color: 'brand' } \u2014 name is a Lucide icon name (Check, Star, ArrowRight, etc.). " +
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
              description:
                "Injection mode: 'replace' makes the blocks the main (first) frame's sections, 'append' adds them after its existing " +
                "sections (one call per section is fine). Default: 'replace'. Ignored when frame is provided.",
            },
            frame: frameInputSchema(
              "When provided, creates a NEW spatial frame on the canvas (alongside existing ones) " +
                "and injects the blocks into it. Existing frames are left untouched. " +
                "Use this to design for mobile/tablet viewports, social posts (social-* presets) or to add multiple screens.",
            ),
          },
        },
      },
      handler: async (args) => {
        const { relay, error } = requireRelay();
        if (error) return error;

        const { code, mode = "replace", frame } = args ?? {};
        let { blocks } = args ?? {};
        const frameError = validateFrameSpec(frame);
        if (frameError) return errorResponse(frameError);

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
                  ...(result.frame ? [`**Frame**: ${result.frame.title || DEFAULT_FRAME_TITLE_NOTE} (${result.frame.device || "block"}, ${frameSize(result.frame).width}×${frameSize(result.frame).height})`] : []),
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
          "Change the Studio canvas theme in real-time. Updates brand color, gray scale, radius preset, dark/light mode, scaling, and panel background. " +
          "The user sees the theme change instantly. Requires a prior `connect_studio` call.",
        inputSchema: {
          type: "object",
          properties: {
            brand: {
              type: "string",
              description:
                "Brand color preset name. Valid values: Monochrome, Tomato, Red, Ruby, Crimson, Pink, Plum, Purple, Violet, Iris, Indigo, Blue, Cyan, Teal, Jade, Green, Grass, Lime, Mint, Sky, Amber, Gold, Bronze, Brown.",
            },
            gray: {
              type: "string",
              description: "Gray color preset name. Valid values: Zinc, Slate, Gray, Neutral, Stone.",
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
          // Read the theme back so the reply says what Studio now has, not just what was sent.
          const lines = await describeTheme(relay, {
            brand: theme.brand,
            gray: theme.gray,
            radius: theme.radius,
            panelBackground: theme.panelBackground,
          });

          return {
            content: [
              {
                type: "text",
                text: [
                  `Studio theme request sent: ${JSON.stringify(result.theme)}`,
                  ...lines,
                  `The user can see the theme on the canvas.`,
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
          "Read the current Studio canvas state — its frames, loose elements and theme. " +
          "Each frame's rootBlock is a `Frame` node whose children are the frame's sections (any number, possibly none); " +
          "`blocks` is the main frame's content. " +
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

          const describe = (b) => {
            const childCount = b.children?.length || 0;
            return `[${b.type}] ${b.props?.children || b.props?.title || b.id}${childCount > 0 ? ` (${childCount} children)` : ""}`;
          };
          // Frames list their sections (the children of each frame's `Frame` node); older Studios send one root.
          const frames = state.frames || [];
          const blockSummary = frames.length
            ? frames.flatMap((f, i) => {
                const root = f.rootBlock;
                const sections = root?.type === "Frame" ? root.children || [] : root ? [root] : [];
                return [
                  `  ${i + 1}. Frame "${f.title || f.id}" (${sections.length} section${sections.length === 1 ? "" : "s"})`,
                  ...sections.map((b) => `     - ${describe(b)}`),
                ];
              })
            : (state.blocks || []).map((b, i) => `  ${i + 1}. ${describe(b)}`);

          return {
            content: [
              {
                type: "text",
                text: [
                  `📊 Studio Canvas State`,
                  ``,
                  frames.length ? `**Frames**: ${frames.length}` : `**Blocks**: ${(state.blocks || []).length}`,
                  blockSummary.length > 0 ? blockSummary.join("\n") : "  (empty canvas)",
                  ``,
                  `**Theme**:`,
                  `  Brand: ${state.theme?.brand || "default"}`,
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

    // 8. duplicate_frame
    {
      schema: {
        name: "duplicate_frame",
        description:
          "Duplicate a frame on the live Studio canvas: same size, preset and content with fresh node ids, placed to the right of the original and selected. " +
          "Use it to make variants (copy, then edit the copy) or several social posts from one layout. " +
          "Get frame ids from `get_studio_state`. Requires a prior `connect_studio` call.",
        inputSchema: {
          type: "object",
          properties: {
            frameId: { type: "string", description: "Id of the frame to copy (from get_studio_state). Default: the selected frame, else the main frame." },
            title: { type: "string", description: "Title for the copy. Default: '<title> (Copy)', or the next number for a default-named frame ('Desktop 1440 (2)'). With count > 1 the copies are numbered." },
            count: { type: "integer", minimum: 1, maximum: 10, description: "How many copies to make. Default: 1." },
          },
        },
      },
      handler: async (args) => {
        const { relay, error } = requireRelay();
        if (error) return error;
        const { frameId, title, count } = args ?? {};
        try {
          const { frames } = await relay.duplicateFrame({ frameId, title, count });
          return {
            content: [
              {
                type: "text",
                text: [
                  `✅ Duplicated ${frames.length === 1 ? "frame" : `${frames.length} frames`}.`,
                  ``,
                  ...frames.map((f) => `- \`${f.id}\` "${f.title}" at (${Math.round(f.bounds.x)}, ${Math.round(f.bounds.y)}), ${Math.round(f.bounds.width)}×${Math.round(f.bounds.height)}`),
                ].join("\n"),
              },
            ],
          };
        } catch (err) {
          return errorResponse(`Failed to duplicate frame: ${err.message}`);
        }
      },
    },

    // 8b. resize_frame
    {
      schema: {
        name: "resize_frame",
        description:
          "Resize a frame on the live Studio canvas to a device preset or a custom pixel size, keeping its content. " +
          "Social presets are exact canvases and never rounded or scaled: 'social-portrait' 1080x1350, 'social-square' 1080x1080, 'social-wide' 1600x900. " +
          "Web presets: desktop 1440x1024, tablet 768x1024, mobile 390x844. Pass device, or width and/or height (a missing side keeps its current size), not both. " +
          "Get frame ids from `get_studio_state`. Requires a prior `connect_studio` call.",
        inputSchema: {
          type: "object",
          properties: {
            frameId: { type: "string", description: "Id of the frame to resize (from get_studio_state)." },
            device: { type: "string", enum: RESIZE_DEVICES, description: "Device preset to resize to. Social presets are exact pixel sizes. Cannot be combined with width/height." },
            width: { type: "integer", minimum: 1, maximum: MAX_FRAME_PX, description: "Custom width in pixels. A size that equals a preset exactly becomes that preset. Cannot be combined with device." },
            height: { type: "integer", minimum: 1, maximum: MAX_FRAME_PX, description: "Custom height in pixels. Cannot be combined with device." },
          },
          required: ["frameId"],
        },
      },
      handler: async (args) => {
        const { relay, error } = requireRelay();
        if (error) return error;
        const invalid = validateResizeArgs(args);
        if (invalid) return errorResponse(invalid);
        const { frameId, device, width, height } = args;
        try {
          const { frame } = await relay.resizeFrame({ frameId, device, width, height });
          const b = frame.bounds || {};
          return {
            content: [
              {
                type: "text",
                text: [
                  `✅ Resized "${frame.title}" (\`${frame.id}\`) to ${Math.round(b.width)}×${Math.round(b.height)} px (${frame.presetDevice || "custom"}).`,
                  ``,
                  `Content was kept; check it still fits with get_studio_state or export_frame.`,
                ].join("\n"),
              },
            ],
          };
        } catch (err) {
          return errorResponse(`Failed to resize frame: ${err.message}${/No frame/.test(err.message) ? "" : " Check the frameId with get_studio_state and retry."}`);
        }
      },
    },

    // 9. export_frame
    {
      schema: {
        name: "export_frame",
        description:
          "Render a frame on the live Studio canvas to an image file on this machine (PNG, JPG or WebP, 1x to 3x) and return its path and pixel size. " +
          "A social preset frame ('social-portrait' 1080x1350, 'social-square' 1080x1080, 'social-wide' 1600x900) exports at exactly that size at 1x. " +
          "Studio must be open and visible in a browser tab (hidden tabs do not render). Requires a prior `connect_studio` call.",
        inputSchema: {
          type: "object",
          properties: {
            path: { type: "string", description: "Where to write the image: an absolute path, or relative to the MCP server's working directory. Folders are created. The extension must match the format (added when missing)." },
            frameId: { type: "string", description: "Id of the frame to export (from get_studio_state). Default: the selected frame, else the main frame." },
            format: { type: "string", enum: ["png", "jpg", "webp"], description: "Image format. Default: png." },
            scale: { type: "integer", enum: [1, 2, 3], description: "Pixel ratio, 1 to 3. Default: 1." },
          },
          required: ["path"],
        },
      },
      handler: async (args) => {
        const { relay, error } = requireRelay();
        if (error) return error;
        const { path, frameId, format = "png", scale = 1 } = args ?? {};
        if (!path) return errorResponse("path is required. Pass where to save the image, e.g. \"/tmp/post.png\" or \"out/post.png\".");
        if (!EXPORT_EXT[format]) return errorResponse(`Unsupported format "${format}". Use png, jpg or webp.`);
        if (![1, 2, 3].includes(scale)) return errorResponse("scale must be 1, 2 or 3.");
        try {
          const img = await relay.exportFrame({ frameId, format, scale });
          const written = await writeExportFile(img.buffer, path, img.format);
          return {
            content: [
              {
                type: "text",
                text: [
                  `✅ Exported "${img.title}" (\`${img.frameId}\`).`,
                  ``,
                  `- File: ${written}`,
                  `- Size: ${img.width}×${img.height} px (${scale}x, ${img.format.toUpperCase()}, ${(img.buffer.length / 1024).toFixed(0)} KB)`,
                ].join("\n"),
              },
            ],
          };
        } catch (err) {
          return errorResponse(`Failed to export frame: ${err.message}`);
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
