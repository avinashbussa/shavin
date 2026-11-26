import { describe, it, expect, vi, afterEach } from "vitest";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { runCli } from "../../packages/cli/src/index.mjs";

const ROOT = path.resolve(__dirname, "../..");
const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, "packages/cli/package.json"), "utf8"));

describe("shavin --version", () => {
  afterEach(() => vi.restoreAllMocks());

  it.each(["--version", "-v", "version"])("%s prints the package.json version and nothing else", async (flag) => {
    const out: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation(((s: string) => (out.push(String(s)), true)) as never);
    await runCli([flag]);
    expect(out.join("")).toBe(`${pkg.version}\n`);
  });

  it("the bin prints the version when run as a process", () => {
    const out = execFileSync(process.execPath, [path.join(ROOT, "packages/cli/bin/shavin.mjs"), "--version"]).toString();
    expect(out).toBe(`${pkg.version}\n`);
  });

  it("the help text lists the flag", async () => {
    const out: string[] = [];
    vi.spyOn(process.stdout, "write").mockImplementation(((s: string) => (out.push(String(s)), true)) as never);
    vi.spyOn(console, "log").mockImplementation(((s: string) => void out.push(String(s))) as never);
    await runCli(["--help"]);
    expect(out.join("")).toMatch(/--version, -v/);
  });
});
