import { describe, it, expect } from "vitest";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const MCP = path.resolve(__dirname, "../../packages/mcp-server");
const pkg = JSON.parse(fs.readFileSync(path.join(MCP, "package.json"), "utf8"));
const req = createRequire(import.meta.url);

/** Found by the fresh-consumer harness: init wires these into next.config.ts / vite.config.ts of a stock project. */
describe("@shavin/mcp/next and /vite ship types", () => {
  it("export types for /vite and /next, shipped in the package files", () => {
    expect(pkg.exports["./vite"].types).toMatch(/vite\.d\.mts$/);
    expect(pkg.exports["./next"].types.import).toMatch(/next\.d\.mts$/);
    expect(pkg.exports["./next"].types.require).toMatch(/next\.d\.cts$/);
    for (const t of [pkg.exports["./vite"].types, pkg.exports["./next"].types.import, pkg.exports["./next"].types.require]) {
      expect(fs.existsSync(path.join(MCP, t)), t).toBe(true);
      expect(pkg.files.some((f: string) => t.startsWith(`./${f}/`)), `${t} is covered by "files"`).toBe(true);
    }
  });

  it("tsc resolves both under strict + moduleResolution bundler (regression: TS7016 on vite.config.ts) and node16 CommonJS", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "shavin-mcp-types-"));
    try {
      fs.mkdirSync(path.join(dir, "node_modules/@shavin"), { recursive: true });
      // A directory junction on Windows (a symlink needs a privilege CI runners lack); a plain dir symlink elsewhere.
      fs.symlinkSync(MCP, path.join(dir, "node_modules/@shavin/mcp"), process.platform === "win32" ? "junction" : "dir");
      fs.writeFileSync(path.join(dir, "vite.config.ts"), `import { shavinBridge } from "@shavin/mcp/vite";\nexport const plugins = [shavinBridge()];\nexport const p: { name: string; apply: "serve" } = shavinBridge({ port: 7036 });\n`);
      fs.writeFileSync(path.join(dir, "next.config.ts"), `import { withShavinBridge } from "@shavin/mcp/next";\nconst c = withShavinBridge({ reactStrictMode: true });\nexport const s: boolean = c.reactStrictMode;\n`);
      fs.writeFileSync(path.join(dir, "next-cjs.cts"), `import { withShavinBridge } from "@shavin/mcp/next";\nexport = withShavinBridge({ a: 1 });\n`);
      fs.writeFileSync(path.join(dir, "tsconfig.json"), JSON.stringify({ compilerOptions: { strict: true, noEmit: true, target: "ES2022", module: "esnext", moduleResolution: "bundler", types: [] }, files: ["vite.config.ts", "next.config.ts"] }));
      fs.writeFileSync(path.join(dir, "tsconfig.cjs.json"), JSON.stringify({ compilerOptions: { strict: true, noEmit: true, target: "ES2022", module: "node16", moduleResolution: "node16", types: [] }, files: ["next-cjs.cts"] }));
      const tsc = req.resolve("typescript/bin/tsc");
      for (const project of ["tsconfig.json", "tsconfig.cjs.json"]) {
        const r = spawnSync(process.execPath, [tsc, "-p", path.join(dir, project)], { cwd: dir, encoding: "utf8" });
        expect(r.stdout + r.stderr, project).toBe("");
        expect(r.status, project).toBe(0);
      }
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  }, 60_000);
});
