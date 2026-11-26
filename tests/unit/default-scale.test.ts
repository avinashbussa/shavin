import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
import { THEME_PRESETS } from "../../packages/ui/src/lib/theme-presets";

const HERE = dirname(fileURLToPath(import.meta.url));
const INIT = pathToFileURL(join(HERE, "../../packages/cli/src/commands/init.mjs")).href;
const CONTEXT = join(HERE, "../../packages/mcp-server/src/context.mjs");

describe("the default scale is 100%", () => {
  it("the Monochrome preset is 100% in @shavin/ui, and the copy the MCP server keeps is identical", () => {
    const ui = THEME_PRESETS.find((t) => t.name === "Monochrome");
    expect(ui?.scaling).toBe(100);
    const src = readFileSync(CONTEXT, "utf8");
    const rows = src.slice(src.indexOf("const THEME_PRESETS_DATA = ["), src.indexOf("\n];", src.indexOf("const THEME_PRESETS_DATA = [")) + 3);
    const copy = (0, eval)(`(${rows.replace("const THEME_PRESETS_DATA = ", "").replace(/;\s*$/, "")})`) as typeof THEME_PRESETS;
    expect(copy.find((t) => t.name === "Monochrome")).toEqual(ui);
  });

  it("init writes scaling 100% to .shavin/config.json and SHAVIN.md", () => {
    const dir = mkdtempSync(join(tmpdir(), "shavin-scale-"));
    mkdirSync(join(dir, "app"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x", dependencies: { next: "15", react: "19", "@shavin/ui": "0.1.0" } }));
    writeFileSync(join(dir, "app/layout.tsx"), "export default function L({ children }) { return <html><body>{children}</body></html>; }\n");
    const run = spawnSync(process.execPath, ["-e", `import(${JSON.stringify(INIT)}).then((m) => m.initCommand({}))`], { cwd: dir, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    expect(run.status, run.stderr).toBe(0);
    expect(JSON.parse(readFileSync(join(dir, ".shavin/config.json"), "utf8")).presets.scaling).toBe("100%");
    expect(readFileSync(join(dir, "SHAVIN.md"), "utf8")).toMatch(/Scaling \/ Density\*\*: `100%`/);
  }, 60_000);
});
