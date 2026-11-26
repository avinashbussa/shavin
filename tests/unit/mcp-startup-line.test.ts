import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs module without types
import { SHAVIN_META } from "../../packages/ui/src/lib/meta";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "../..");
const BIN = join(ROOT, "packages/mcp-server/bin/shavin-mcp.mjs");

// Everything here is asynchronous on purpose. A synchronous child process (spawnSync) blocks the vitest worker's event
// loop, the worker then cannot answer vitest's own RPC, and vitest fails the run with "Timeout calling onTaskUpdate"
// even though every test passed. The stdio server also does not exit when stdin closes, so the child is killed as soon as
// the line has been read instead of waiting for it.

/** Runs a command to its end without blocking the event loop. */
function run(command: string, args: string[], options: { cwd?: string; shell?: boolean } = {}): Promise<{ code: number | null; out: string }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { ...options, stdio: ["ignore", "pipe", "pipe"] });
    let out = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (out += d));
    child.on("error", reject);
    child.on("close", (code) => resolve({ code, out }));
  });
}

// The server is started as a real child process, which resolves @shavin/block-schema to its built dist (the vitest
// alias does not apply). CI builds @shavin/ui before the unit tests but not the block schema, so build it here when
// it is missing.
beforeAll(async () => {
  if (existsSync(join(ROOT, "packages/block-schema/dist/index.js"))) return;
  const build = await run("npm run build --workspace=@shavin/block-schema", [], { cwd: ROOT, shell: true });
  if (build.code !== 0) throw new Error(`could not build @shavin/block-schema:\n${build.out}`);
}, 240_000);

/** Starts the server and resolves with its startup line as soon as it is printed, then stops it. */
function start(env: Record<string, string> = {}, timeoutMs = 20_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [BIN], { env: { ...process.env, ...env }, stdio: ["pipe", "ignore", "pipe"] });
    let stderr = "";
    let done = false;
    const finish = (fn: () => void) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      child.kill();
      fn();
    };
    const timer = setTimeout(() => finish(() => reject(new Error(`no startup line within ${timeoutMs} ms. stderr so far:\n${stderr}`))), timeoutMs);
    child.stdin.end();
    child.stderr.on("data", (d) => {
      stderr += d;
      const line = stderr.split("\n").find((l) => l.includes("Standalone MCP server"));
      if (line) finish(() => resolve(line));
    });
    child.on("error", (e) => finish(() => reject(e)));
    child.on("exit", () => finish(() => reject(new Error(`the server exited before printing its startup line. stderr:\n${stderr}`))));
  });
}

// The stderr startup line used to say "36 tools" while tools/list returned 22: the Studio and live-audit tools are
// hidden until a Studio session or a browser tab connects.
describe("MCP startup line", () => {
  it("says how many tools are listed out of the total, and how to list them all", async () => {
    const line = await start({ SHAVIN_MCP_ALL_TOOLS: "" });
    const total = SHAVIN_META.mcpToolCount;
    expect(line).toMatch(new RegExp(`(\\d+) of ${total} tools listed`));
    const listed = Number(line.match(/(\d+) of \d+ tools listed/)?.[1]);
    expect(listed).toBeGreaterThan(0);
    expect(listed).toBeLessThan(total);
    expect(line).toContain("SHAVIN_MCP_ALL_TOOLS=1");
  }, 60_000);

  it("says the full count when all tools are listed", async () => {
    const line = await start({ SHAVIN_MCP_ALL_TOOLS: "1" });
    expect(line).toContain(`with ${SHAVIN_META.mcpToolCount} tools.`);
    expect(line).not.toContain("of");
  }, 60_000);
});
