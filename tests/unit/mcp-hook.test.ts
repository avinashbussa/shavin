import { chmodSync, mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";
import { spawnSync } from "node:child_process";
import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { readPayload, runHook } from "../../packages/mcp-server/src/hook.mjs";
// @ts-expect-error — plain .mjs module without types
import { mergeClaudeHook } from "../../packages/cli/src/lib/init-detect.mjs";

function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "shavin-hook-"));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}
const payload = (dir: string, file: string) => ({ cwd: dir, tool_name: "Write", tool_input: { file_path: join(dir, file) } });
const BAD = 'import * as Dialog from "@radix-ui/react-dialog";\nexport const A = () => <button className="bg-[#fff]">x</button>;\n';
const GOOD = 'import { Button } from "@shavin/ui";\nexport const A = () => <Button>Save</Button>;\n';

describe("edit hook", () => {
  it("exits 2 with the problems and fixes on stderr for a bad file", () => {
    const dir = project({ "src/app/page.tsx": BAD });
    const r = runHook(payload(dir, "src/app/page.tsx"));
    expect(r.code).toBe(2);
    expect(r.message).toContain("src/app/page.tsx");
    expect(r.message).toMatch(/^Shavin guidance/);
    expect(r.message).toContain("Use Button / IconButton from @shavin/ui");
    expect(r.message).toContain("@radix-ui/react-dialog");
    expect(r.message).not.toMatch(/\b(failed|error|violation)\b/i);
  });
  it("exits 0 for a clean file, for non-UI files, and for a missing file", () => {
    const dir = project({ "src/app/page.tsx": GOOD, "src/lib/util.ts": BAD, "README.md": BAD });
    expect(runHook(payload(dir, "src/app/page.tsx")).code).toBe(0);
    expect(runHook(payload(dir, "src/lib/util.ts")).code).toBe(0);
    expect(runHook(payload(dir, "README.md")).code).toBe(0);
    expect(runHook(payload(dir, "src/app/gone.tsx")).code).toBe(0);
  });
  it("is off with SHAVIN_HOOK=off", () => {
    const dir = project({ "src/app/page.tsx": BAD });
    expect(runHook(payload(dir, "src/app/page.tsx"), dir, { SHAVIN_HOOK: "off" }).code).toBe(0);
    expect(runHook(payload(dir, "src/app/page.tsx"), dir, {}).code).toBe(2);
  });
  it("does not fail legacy files from SHAVIN.md or files outside the project", () => {
    const dir = project({ "SHAVIN.md": "- **Legacy paths**: `src/components/ui`\n", "src/components/ui/button.tsx": BAD });
    expect(runHook(payload(dir, "src/components/ui/button.tsx")).code).toBe(0);
    expect(runHook({ cwd: dir, tool_input: { file_path: "/etc/passwd.tsx" } }).code).toBe(0);
  });
  it("reads the payload from stdin and tolerates empty or invalid input", async () => {
    expect(await readPayload(Readable.from(['{"tool_input":{"file_path":"a.tsx"}}']))).toEqual({ tool_input: { file_path: "a.tsx" } });
    expect(await readPayload(Readable.from([""]))).toEqual({});
    expect(await readPayload(Readable.from(["{oops"]))).toEqual({});
  });

  it("runs as `shavin-mcp --hook`: payload on stdin, guidance on stderr, exit 2", () => {
    const dir = project({ "src/app/page.tsx": BAD });
    const bin = join(__dirname, "../../packages/mcp-server/bin/shavin-mcp.mjs");
    const r = spawnSync("node", [bin, "--hook"], { input: JSON.stringify(payload(dir, "src/app/page.tsx")), encoding: "utf8" });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/^Shavin guidance/);
    const ok = spawnSync("node", [bin, "--hook"], { input: JSON.stringify(payload(dir, "src/app/missing.tsx")), encoding: "utf8" });
    expect(ok.status).toBe(0);
  });

  // Headless (`claude -p`) runs the registered command through a shell with the project as cwd, so the command
  // `shavin init` writes must resolve the bin from the project's node_modules/.bin and still exit 2 with guidance.
  it("the command `shavin init` registers runs from the project dir and flags a bad file (headless path)", () => {
    const dir = project({ "src/app/page.tsx": BAD });
    const bin = join(__dirname, "../../packages/mcp-server/bin/shavin-mcp.mjs");
    mkdirSync(join(dir, "node_modules/.bin"), { recursive: true });
    // Shims like npm writes, not a symlink: Windows runners can't create symlinks without admin (EPERM).
    const shim = join(dir, "node_modules/.bin/shavin-mcp");
    writeFileSync(shim, `#!/bin/sh\nexec node "${bin.replace(/\\/g, "/")}" "$@"\n`);
    chmodSync(shim, 0o755);
    writeFileSync(`${shim}.cmd`, `@node "${bin}" %*\r\n`);
    const settings = JSON.parse(mergeClaudeHook("").src);
    const group = settings.hooks.PostToolUse[0];
    expect(group.matcher).toBe("Write|Edit|MultiEdit");
    const r = spawnSync("sh", ["-c", group.hooks[0].command], { cwd: dir, input: JSON.stringify(payload(dir, "src/app/page.tsx")), encoding: "utf8" });
    expect(r.status).toBe(2);
    expect(r.stderr).toMatch(/^Shavin guidance/);
  }, 30_000); // spawns a shell and node cold; the default 5 s flakes on a loaded or 2-core runner
});
