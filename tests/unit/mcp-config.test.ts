import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs module without types
import { isPlainNpxDefault, mcpServerEntry } from "../../packages/cli/src/lib/mcp-config.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const INIT = pathToFileURL(join(HERE, "../../packages/cli/src/commands/init.mjs")).href;

const NPX = { command: "npx", args: ["-y", "@shavin/mcp"] };
const CMD = { command: "cmd", args: ["/c", "npx", "-y", "@shavin/mcp"] };

describe("mcpServerEntry", () => {
  it("runs npx through cmd /c on Windows, where npx is npx.cmd and a shell-less spawn fails with ENOENT", async () => {
    expect(mcpServerEntry("win32")).toEqual(CMD);
  });
  it.each(["darwin", "linux", "freebsd"])("keeps plain npx on %s, unchanged", (platform) => {
    expect(mcpServerEntry(platform)).toEqual(NPX);
    expect(JSON.stringify(mcpServerEntry(platform))).toBe('{"command":"npx","args":["-y","@shavin/mcp"]}');
  });
  it("defaults to this machine", async () => {
    expect(mcpServerEntry()).toEqual(mcpServerEntry(process.platform));
  });
});

describe("isPlainNpxDefault", () => {
  it("is true for what earlier versions wrote, with or without VS Code's type", async () => {
    expect(isPlainNpxDefault(NPX)).toBe(true);
    expect(isPlainNpxDefault({ type: "stdio", ...NPX })).toBe(true);
  });
  it("is false for anything the user changed or already the Windows entry", async () => {
    expect(isPlainNpxDefault(CMD)).toBe(false);
    expect(isPlainNpxDefault({ ...NPX, env: { A: "1" } })).toBe(false);
    expect(isPlainNpxDefault({ command: "npx", args: ["-y", "@shavin/mcp@latest"] })).toBe(false);
    expect(isPlainNpxDefault({ command: "node", args: ["server.js"] })).toBe(false);
    expect(isPlainNpxDefault({ type: "http", ...NPX })).toBe(false);
    expect(isPlainNpxDefault(null)).toBe(false);
  });
});

/** Runs node without blocking the event loop (a synchronous spawn starves the vitest worker's RPC on a slow runner). */
function runNode(args: string[], options: { cwd?: string } = {}): Promise<{ status: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
}

function project(): string {
  const dir = mkdtempSync(join(tmpdir(), "shavin-mcp-config-"));
  mkdirSync(join(dir, "app"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x", dependencies: { next: "15", react: "19", "@shavin/ui": "0.1.0" } }));
  writeFileSync(join(dir, "app/layout.tsx"), "export default function L({ children }) { return <html><body>{children}</body></html>; }\n");
  return dir;
}
async function init(dir: string, platform: string) {
  const run = await runNode(["-e", `import(${JSON.stringify(INIT)}).then((m) => m.initCommand({ platform: ${JSON.stringify(platform)} }))`], { cwd: dir });
  expect(run.status, run.stderr).toBe(0);
  return `${run.stdout}\n${run.stderr}`.replace(/\x1b\[[0-9;]*m/g, "");
}
const readJson = (dir: string, rel: string) => JSON.parse(readFileSync(join(dir, rel), "utf8"));

describe("init writes the platform's MCP server entry", () => {
  it("on Windows: .mcp.json, .cursor/mcp.json and .vscode/mcp.json all use cmd /c npx, and the files are valid JSON", async () => {
    const dir = project();
    await init(dir, "win32");
    expect(readJson(dir, ".mcp.json").mcpServers.shavin).toEqual(CMD);
    expect(readJson(dir, ".cursor/mcp.json").mcpServers.shavin).toEqual(CMD);
    expect(readJson(dir, ".vscode/mcp.json").servers.shavin).toEqual({ type: "stdio", ...CMD });
  }, 60_000);

  it("on macOS and Linux: plain npx, byte for byte what init has always written", async () => {
    const dir = project();
    await init(dir, "darwin");
    expect(readFileSync(join(dir, ".mcp.json"), "utf8")).toBe(JSON.stringify({ mcpServers: { shavin: NPX } }, null, 2));
    expect(readJson(dir, ".cursor/mcp.json").mcpServers.shavin).toEqual(NPX);
    expect(readJson(dir, ".vscode/mcp.json").servers.shavin).toEqual({ type: "stdio", ...NPX });
  }, 60_000);

  it("on Windows, an existing entry that is our old plain-npx default is updated, in all three files", async () => {
    const dir = project();
    writeFileSync(join(dir, ".mcp.json"), JSON.stringify({ mcpServers: { shavin: NPX, other: { command: "x" } } }, null, 2));
    mkdirSync(join(dir, ".cursor"));
    writeFileSync(join(dir, ".cursor/mcp.json"), JSON.stringify({ mcpServers: { shavin: NPX } }, null, 2));
    mkdirSync(join(dir, ".vscode"));
    writeFileSync(join(dir, ".vscode/mcp.json"), JSON.stringify({ servers: { shavin: { type: "stdio", ...NPX } } }, null, 2));
    const output = await init(dir, "win32");
    expect(output).toContain("Updated shavin in .mcp.json");
    expect(output).toContain("Updated shavin in .cursor/mcp.json");
    expect(output).toContain("Updated shavin in .vscode/mcp.json");
    expect(output).not.toContain("Added shavin to");
    expect(readJson(dir, ".mcp.json").mcpServers).toEqual({ shavin: CMD, other: { command: "x" } });
    expect(readJson(dir, ".cursor/mcp.json").mcpServers.shavin).toEqual(CMD);
    expect(readJson(dir, ".vscode/mcp.json").servers.shavin).toEqual({ type: "stdio", ...CMD });
  }, 60_000);

  it("says Added, not Updated, when the config exists but has no shavin entry yet", async () => {
    const dir = project();
    mkdirSync(join(dir, ".cursor"));
    writeFileSync(join(dir, ".cursor/mcp.json"), JSON.stringify({ mcpServers: { other: { command: "x" } } }, null, 2));
    const output = await init(dir, "win32");
    expect(output).toContain("Added shavin to .cursor/mcp.json");
    expect(output).not.toContain("Updated shavin in .cursor/mcp.json");
  }, 60_000);

  it("an entry the user edited is left alone on Windows, and nothing is rewritten on macOS", async () => {
    const edited = { command: "npx", args: ["-y", "@shavin/mcp@latest"], env: { SHAVIN_BRIDGE: "0" } };
    const win = project();
    writeFileSync(join(win, ".mcp.json"), JSON.stringify({ mcpServers: { shavin: edited } }, null, 2));
    await init(win, "win32");
    expect(readJson(win, ".mcp.json").mcpServers.shavin).toEqual(edited);

    const mac = project();
    const before = JSON.stringify({ mcpServers: { shavin: NPX } }, null, 2);
    writeFileSync(join(mac, ".mcp.json"), before);
    await init(mac, "darwin");
    expect(readFileSync(join(mac, ".mcp.json"), "utf8")).toBe(before);
  }, 120_000);
});
