import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs module without types
import { invalidJsonMessage, parseJson, readJsonFile, stripBom } from "../../packages/cli/src/lib/json-file.mjs";
// @ts-expect-error plain .mjs module without types
import { applyTheme } from "../../packages/cli/src/lib/theme-set.mjs";
// @ts-expect-error plain .mjs module without types
import { parseJson as mcpParseJson } from "../../packages/mcp-server/src/json-file.mjs";

// Windows editors and PowerShell (`Out-File -Encoding utf8`) write a UTF-8 BOM and CRLF line endings. JSON.parse
// rejects the BOM, so a good config file looked corrupt: init skipped it silently, or overwrote it.

const BOM = "﻿";
const HERE = dirname(fileURLToPath(import.meta.url));
const INIT = pathToFileURL(join(HERE, "../../packages/cli/src/commands/init.mjs")).href;
const NPX = { command: "npx", args: ["-y", "@shavin/mcp"] };
const crlf = (s: string) => s.replace(/\n/g, "\r\n");

describe("json helpers", () => {
  it("strip a leading BOM only", async () => {
    expect(stripBom(`${BOM}{"a":1}`)).toBe('{"a":1}');
    expect(stripBom('{"a":"﻿"}')).toBe('{"a":"﻿"}');
  });
  it("parse BOM and CRLF variants in the CLI and the MCP package", async () => {
    const text = crlf('{\n  "a": 1,\n  "b": [2]\n}\n');
    for (const parse of [parseJson, mcpParseJson]) {
      expect(parse(`${BOM}${text}`)).toEqual({ a: 1, b: [2] });
      expect(parse(text)).toEqual({ a: 1, b: [2] });
    }
  });
  it("still throw on invalid JSON, and the message names the file and the way out", async () => {
    expect(() => parseJson(`${BOM}{"a":1,}`)).toThrow();
    const msg = invalidJsonMessage(".mcp.json", new Error("Unexpected token }"), "init did not add the Shavin server to it");
    expect(msg).toContain(".mcp.json is not valid JSON (Unexpected token })");
    expect(msg).toContain("init did not add the Shavin server to it");
    expect(msg).toMatch(/Fix the file .* or move it aside, then run the command again/);
  });
  it("readJsonFile reads a BOM file from disk", async () => {
    const dir = mkdtempSync(join(tmpdir(), "shavin-bom-"));
    writeFileSync(join(dir, "x.json"), `${BOM}{"ok":true}`);
    expect(readJsonFile(join(dir, "x.json"))).toEqual({ ok: true });
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
  const dir = mkdtempSync(join(tmpdir(), "shavin-bom-init-"));
  mkdirSync(join(dir, "app"));
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x", dependencies: { next: "15", react: "19", "@shavin/ui": "0.1.0" } }));
  writeFileSync(join(dir, "app/layout.tsx"), "export default function L({ children }) { return <html><body>{children}</body></html>; }\n");
  return dir;
}
function init(dir: string, platform = "darwin") {
  return runNode(["-e", `import(${JSON.stringify(INIT)}).then((m) => m.initCommand({ platform: ${JSON.stringify(platform)} }))`], { cwd: dir });
}
const readJson = (dir: string, rel: string) => JSON.parse(readFileSync(join(dir, rel), "utf8"));
const out = (r: { stdout: string; stderr: string }) => `${r.stdout}\n${r.stderr}`.replace(/\x1b\[[0-9;]*m/g, "");

describe("init with BOM and CRLF project files", () => {
  it("adds the Shavin server to existing .mcp.json, .cursor/mcp.json and .vscode/mcp.json written with a BOM and CRLF, keeping the other servers", async () => {
    const dir = project();
    const other = { command: "other" };
    writeFileSync(join(dir, ".mcp.json"), BOM + crlf(JSON.stringify({ mcpServers: { other } }, null, 2)));
    mkdirSync(join(dir, ".cursor"));
    writeFileSync(join(dir, ".cursor/mcp.json"), BOM + crlf(JSON.stringify({ mcpServers: { other } }, null, 2)));
    mkdirSync(join(dir, ".vscode"));
    writeFileSync(join(dir, ".vscode/mcp.json"), BOM + crlf(JSON.stringify({ servers: { other } }, null, 2)));
    const run = await init(dir);
    expect(run.status, run.stderr).toBe(0);
    expect(readJson(dir, ".mcp.json").mcpServers).toEqual({ other, shavin: NPX });
    expect(readJson(dir, ".cursor/mcp.json").mcpServers).toEqual({ other, shavin: NPX });
    expect(readJson(dir, ".vscode/mcp.json").servers).toEqual({ other, shavin: { type: "stdio", ...NPX } });
    expect(out(run)).not.toMatch(/is not valid JSON/);
  }, 60_000);

  it("reads a package.json with a BOM", async () => {
    const dir = project();
    writeFileSync(join(dir, "package.json"), BOM + crlf(JSON.stringify({ name: "x", dependencies: { next: "15", react: "19", "@shavin/ui": "0.1.0" } }, null, 2)));
    const run = await init(dir);
    expect(run.status, out(run)).toBe(0);
  }, 60_000);

  it("a .mcp.json that is not valid JSON is left alone and init says so, with the way out", async () => {
    const dir = project();
    const broken = '{ "mcpServers": { "a": 1, } }';
    writeFileSync(join(dir, ".mcp.json"), broken);
    const run = await init(dir);
    expect(run.status, out(run)).toBe(0);
    expect(readFileSync(join(dir, ".mcp.json"), "utf8")).toBe(broken);
    expect(out(run)).toContain(".mcp.json is not valid JSON");
    expect(out(run)).toContain("then run the command again");
  }, 60_000);

  it("a .vscode/settings.json with comments is not overwritten, and init says so", async () => {
    const dir = project();
    mkdirSync(join(dir, ".vscode"));
    const settings = '{\n  // my editor settings\n  "editor.fontSize": 15\n}\n';
    writeFileSync(join(dir, ".vscode/settings.json"), settings);
    const run = await init(dir);
    expect(run.status, out(run)).toBe(0);
    expect(readFileSync(join(dir, ".vscode/settings.json"), "utf8")).toBe(settings);
    expect(out(run)).toContain(".vscode/settings.json is not valid JSON");
    expect(out(run)).toContain("html.customData");
  }, 60_000);

  it("a package.json that is not valid JSON stops init with a message naming the file", async () => {
    const dir = project();
    writeFileSync(join(dir, "package.json"), '{ "name": "x", }');
    const run = await init(dir);
    expect(out(run)).toContain("is not valid JSON");
    expect(out(run)).toContain("package.json");
  }, 60_000);
});

describe("applyTheme and .shavin/config.json", () => {
  function themed(config: string): string {
    const dir = mkdtempSync(join(tmpdir(), "shavin-bom-theme-"));
    writeFileSync(join(dir, "SHAVIN.md"), "# Shavin Project Design Manifest\n\n## 2. Design System Configuration\n- **Primary Brand**: `UNSET`\n- **Theme Mode**: `dark-first`\n");
    mkdirSync(join(dir, ".shavin"));
    writeFileSync(join(dir, ".shavin/config.json"), config);
    return dir;
  }
  it("keeps the other settings of a config written with a BOM", async () => {
    const dir = themed(BOM + crlf(JSON.stringify({ keep: "me", presets: { gray: "zinc" } }, null, 2)));
    const r = applyTheme(dir, { color: "teal", confirm: true });
    expect(r.notes.join("\n")).not.toMatch(/not valid JSON/);
    const cfg = readJson(dir, ".shavin/config.json");
    expect(cfg.keep).toBe("me");
    expect(cfg.presets).toEqual({ gray: "zinc", brandColor: "teal", neutrals: "neutral", neutralsAmount: "subtle" });
    expect(cfg.brandConfirmed).toBe(true);
  });
  it("does not replace a config it cannot read: it warns and leaves the file as it was", async () => {
    const broken = '{ "keep": "me", }';
    const dir = themed(broken);
    const r = applyTheme(dir, { color: "teal" });
    expect(readFileSync(join(dir, ".shavin/config.json"), "utf8")).toBe(broken);
    expect(r.notes.join("\n")).toContain(".shavin/config.json is not valid JSON");
  });
});
