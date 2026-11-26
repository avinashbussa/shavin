/**
 * The `shavin` server entry that `init` writes into .mcp.json, .cursor/mcp.json and .vscode/mcp.json.
 *
 * On Windows `npx` is `npx.cmd`, and an MCP client that starts the command without a shell fails with
 * `spawn npx ENOENT`. `cmd /c npx ...` works there. macOS and Linux keep the plain `npx` entry.
 * Pure: no file access, so tests can pass the platform in.
 */

const PACKAGE_ARGS = ["-y", "@shavin/mcp"];

/** The entry for `platform` (default: this machine). */
export function mcpServerEntry(platform = process.platform) {
  if (platform === "win32") return { command: "cmd", args: ["/c", "npx", ...PACKAGE_ARGS] };
  return { command: "npx", args: [...PACKAGE_ARGS] };
}

/**
 * True when `entry` is exactly what earlier versions of `init` wrote (plain `npx`), apart from the `type` field
 * VS Code's file carries. A user-edited entry (extra args, env, another command) is not.
 */
export function isPlainNpxDefault(entry) {
  if (!entry || typeof entry !== "object") return false;
  const { type, ...rest } = entry;
  if (type !== undefined && type !== "stdio") return false;
  const keys = Object.keys(rest).sort().join(",");
  return keys === "args,command" && rest.command === "npx" && JSON.stringify(rest.args) === JSON.stringify(PACKAGE_ARGS);
}
