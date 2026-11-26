/**
 * Edit hook: runs validate_code's rules on a file the agent just wrote, so the check does not depend on the
 * agent remembering to call it. Run as `shavin-mcp --hook` (bin/shavin-mcp.mjs), which `shavin init` registers as
 * a Claude Code PostToolUse hook for Write/Edit/MultiEdit.
 *
 * Audience: the agent. It only runs on the agent's own Write/Edit/MultiEdit tool calls, never on a user's manual
 * edits, never in the build or dev server, and the text is written as guidance for the agent ("use Button instead
 * of <button>"). Set SHAVIN_HOOK=off to switch it off.
 *
 * Contract (Claude Code hooks): the JSON payload arrives on stdin ({ tool_name, tool_input: { file_path }, cwd });
 * exit 0 = fine, exit 2 = the stderr text is shown to the agent so it fixes the file.
 */
import { existsSync, readFileSync } from "node:fs";
import { isAbsolute, relative, resolve } from "node:path";
import { validateCode, validateCodeDense } from "./tools/validation.mjs";
import { checkEnforcement, legacyPaths, isLegacyFile } from "./tools/enforce.mjs";

const UI_FILE = /\.(tsx|jsx)$/;
const SKIP = /(^|\/)(node_modules|\.next|\.claude|\.agents|\.shavin|dist|build|out)\//;

/**
 * @param {{ tool_input?: { file_path?: string }, tool_response?: { filePath?: string }, cwd?: string }} payload
 * @returns {{ code: 0 | 2, message: string }}
 */
export function runHook(payload, fallbackCwd = process.cwd(), env = process.env) {
  if (/^(off|0|false)$/i.test(env.SHAVIN_HOOK || "")) return { code: 0, message: "" };
  const cwd = payload?.cwd ? resolve(payload.cwd) : fallbackCwd;
  const file = payload?.tool_input?.file_path || payload?.tool_response?.filePath;
  if (!file || !UI_FILE.test(file)) return { code: 0, message: "" };
  const abs = isAbsolute(file) ? file : resolve(cwd, file);
  const rel = relative(cwd, abs).replace(/\\/g, "/");
  if (rel.startsWith("..") || SKIP.test(`${rel}`) || !existsSync(abs)) return { code: 0, message: "" };
  if (isLegacyFile(rel, legacyPaths(cwd))) return { code: 0, message: "" };

  const code = readFileSync(abs, "utf8");
  if (!validateCode(code, { enforce: true }).length) return { code: 0, message: "" };
  // Token problems first (colours, radius), then the component rules, each as "what to do instead".
  const tokenIssues = validateCodeDense(code).map((i) => `- ${i}`);
  const componentIssues = checkEnforcement(code).filter((f) => f.severity === "error").map((f) => `- line ${f.line}: ${f.message}. ${f.fix}.`);
  const items = [...componentIssues, ...tokenIssues];
  return {
    code: 2,
    message: `Shavin guidance for ${rel}: this project builds UI with @shavin/ui. Please update the file (${items.length} suggestion${items.length === 1 ? "" : "s"}):\n` +
      items.join("\n") +
      `\nLook components up with get_components, then re-run validate_code. Files listed under Legacy paths in SHAVIN.md are exempt.`,
  };
}

/** Read all of stdin as JSON (empty or invalid input is treated as "nothing to check"). */
export async function readPayload(stream = process.stdin) {
  let raw = "";
  for await (const chunk of stream) raw += chunk;
  try { return raw.trim() ? JSON.parse(raw) : {}; } catch { return {}; }
}
