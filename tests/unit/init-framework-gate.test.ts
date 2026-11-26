import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { detectFramework } from "../../packages/cli/src/lib/detect-tailwind.mjs";
// @ts-expect-error — plain .mjs module without types
import { checkFrameworkSupport } from "../../packages/cli/src/lib/init-detect.mjs";
// @ts-expect-error — plain .mjs module without types
import { runDoctor } from "../../packages/cli/src/lib/doctor.mjs";

// Runs initCommand in a child process (the real exit code and streams), without loading the other commands.
const INIT = pathToFileURL(join(dirname(fileURLToPath(import.meta.url)), "../../packages/cli/src/commands/init.mjs")).href;
const RUN_INIT = `import(${JSON.stringify(INIT)}).then((m) => m.initCommand({}))`;

function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "shavin-fw-"));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}
const pkg = (deps: Record<string, string>, dev: Record<string, string> = {}) => JSON.stringify({ name: "x", dependencies: deps, devDependencies: dev });
const gate = (dir: string) => checkFrameworkSupport(dir, detectFramework(dir));

describe("init framework gate: Next.js and Vite (with React) only", () => {
  it("accepts Next.js and Vite with React", () => {
    expect(gate(project({ "package.json": pkg({ next: "15", react: "19" }) })).ok).toBe(true);
    expect(gate(project({ "package.json": pkg({ react: "19" }, { vite: "7" }) })).ok).toBe(true);
  });

  it.each([
    ["Astro", { astro: "5", react: "19" }, {}],
    ["SvelteKit", {}, { "@sveltejs/kit": "2", vite: "7" }],
    ["Nuxt", { nuxt: "4", vue: "3" }, {}],
    ["Angular", { "@angular/core": "20" }, {}],
    ["Remix", { "@remix-run/react": "2", react: "19" }, { vite: "6" }],
    ["React Router 7", { react: "19" }, { "@react-router/dev": "7", vite: "7" }],
  ])("rejects %s, even when vite is also a dependency", (name, deps, dev) => {
    const r = gate(project({ "package.json": pkg(deps as Record<string, string>, dev as Record<string, string>) }));
    expect(r.ok).toBe(false);
    expect(r.found).toBe(name);
    const text = r.lines.join("\n");
    expect(text).toMatch(/Supported today: Next\.js and Vite/);
    expect(text).toMatch(/planned for later/);
    expect(text).toMatch(/npx create-next-app@latest/);
    expect(text).toMatch(/npm create vite@latest/);
    expect(text).toMatch(/Nothing was installed or changed/);
  });

  it("rejects Vite without React and says how to fix it", () => {
    const r = gate(project({ "package.json": pkg({ vue: "3" }, { vite: "7" }) })); // Vue wins: named as Vue
    expect(r.ok).toBe(false);
    const v = gate(project({ "package.json": pkg({}, { vite: "7" }) }));
    expect(v.ok).toBe(false);
    expect(v.found).toBe("Vite without React");
    expect(v.lines.join("\n")).toMatch(/react@19 react-dom@19/);
  });

  it("rejects a folder with no framework and a folder with no package.json", () => {
    const noFw = gate(project({ "package.json": pkg({ react: "19" }) }));
    expect(noFw.ok).toBe(false);
    expect(noFw.reason).toMatch(/No Next\.js or Vite app/);
    const none = gate(project({ "README.md": "x" }));
    expect(none.ok).toBe(false);
    expect(none.found).toBe("no package.json");
  });

  it("tells a monorepo user to run init inside the app folder", () => {
    const r = gate(project({ "package.json": JSON.stringify({ name: "root", workspaces: ["apps/*"] }) }));
    expect(r.ok).toBe(false);
    expect(r.lines.join("\n")).toMatch(/subfolder or a monorepo/);
  });
});

describe("shavin init on an unsupported project (real CLI process)", () => {
  it("exits non-zero, prints the recovery steps and writes nothing", () => {
    const dir = project({ "package.json": pkg({ astro: "5", react: "19" }) });
    const before = readFileSync(join(dir, "package.json"), "utf8");
    const r = spawnSync(process.execPath, ["-e", RUN_INIT], { cwd: dir, encoding: "utf8", timeout: 30_000, env: { ...process.env, CI: "1", NO_COLOR: "1" } });
    expect(r.status).toBe(1);
    expect(r.stderr).toMatch(/Astro is not supported yet/);
    expect(r.stderr).toMatch(/Supported today: Next\.js and Vite \(with React 19\)/);
    expect(r.stderr).toMatch(/cd my-app && npx @shavin\/cli init/);
    expect(r.stderr).not.toMatch(/docs\.shavin\.cc/); // the message stands on its own
    expect(readdirSync(dir)).toEqual(["package.json"]);
    expect(readFileSync(join(dir, "package.json"), "utf8")).toBe(before);
  });
});

describe("doctor framework check", () => {
  const byId = (r: { checks: { id: string; status: string; fix?: string }[] }, id: string) => r.checks.find((c) => c.id === id);
  it("passes for Next.js and Vite + React", () => {
    expect(byId(runDoctor(project({ "package.json": pkg({ next: "15", react: "19" }) })), "framework")?.status).toBe("pass");
    expect(byId(runDoctor(project({ "package.json": pkg({ react: "19" }, { vite: "7" }) })), "framework")?.status).toBe("pass");
  });
  it("fails with the supported list and a fix for any other framework", () => {
    const c = byId(runDoctor(project({ "package.json": pkg({ astro: "5", react: "19" }) })), "framework");
    expect(c?.status).toBe("fail");
    expect(c?.fix).toMatch(/create-next-app/);
  });
  it("skips the check at a monorepo root with no app of its own", () => {
    expect(byId(runDoctor(project({ "package.json": JSON.stringify({ name: "root", workspaces: ["apps/*"] }) })), "framework")).toBeUndefined();
  });
});
