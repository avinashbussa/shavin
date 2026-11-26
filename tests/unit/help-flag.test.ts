import { spawn } from "node:child_process";
import { mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

// `shavin brand --help` ran the brand generator, `shavin bridge --help` started the daemon, and
// `npx @shavin/skills --help` installed into the current folder. A help flag must print usage and do nothing else.

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const CLI = join(ROOT, "packages/cli/bin/shavin.mjs");
const INSTALL = join(ROOT, "packages/skills/bin/install.mjs");
const MCP = join(ROOT, "packages/mcp-server/bin/shavin-mcp.mjs");

const strip = (s: string) => s.replace(/\x1b\[[0-9;]*m/g, "");
/** Runs a script in an empty folder without blocking the event loop (a synchronous spawn starves the vitest worker's RPC on a slow runner). */
function inEmptyDir(script: string, args: string[]): Promise<{ out: string; status: number | null; files: string[] }> {
  const dir = mkdtempSync(join(tmpdir(), "shavin-help-"));
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [script, ...args], { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    const timer = setTimeout(() => child.kill(), 30_000);
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("error", reject);
    child.on("close", (status) => {
      clearTimeout(timer);
      resolve({ out: strip(out), status, files: readdirSync(dir) });
    });
  });
}

describe("shavin <command> --help", () => {
  it.each(["init", "add", "list", "check", "doctor", "context", "publish", "bridge", "brand", "findings"])(
    "%s --help and -h print the usage and touch nothing",
    async (command) => {
      for (const flag of ["--help", "-h"]) {
        const r = await inEmptyDir(CLI, [command, flag]);
        expect(r.out, `${command} ${flag}`).toContain("Usage:");
        expect(r.status).toBe(0);
        expect(r.files).toEqual([]);
      }
    },
    60_000,
  );

  it("brand --help mentions the theme flags", async () => {
    expect((await inEmptyDir(CLI, ["brand", "--help"])).out).toContain("--color");
  });
});

describe("the other binaries", () => {
  it("npx @shavin/skills --help prints the usage and installs nothing", async () => {
    const r = await inEmptyDir(INSTALL, ["--help"]);
    expect(r.out).toContain("Usage:");
    expect(r.files).toEqual([]);
  });
  it("shavin-mcp --help prints the usage and starts no server", async () => {
    const r = await inEmptyDir(MCP, ["--help"]);
    expect(r.out).toContain("Usage:");
    expect(r.out).not.toContain("Standalone MCP server running");
    expect(r.files).toEqual([]);
  });
});
