import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs module without types
import { applyTheme } from "../../packages/cli/src/lib/theme-set.mjs";

// AGENTS.md allows a hex only in `brandColor="#hex"` on ThemeProvider, and `shavin brand --color "#hex"` writes exactly
// that into app/layout.tsx. validate_code already exempted it; the standalone shavin-lint-tokens did not, so it failed
// the file `shavin brand` had just written.

const LINT = join(dirname(fileURLToPath(import.meta.url)), "../../packages/skills/bin/lint-tokens.mjs");
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
const lint = (file: string, ...flags: string[]) => runNode([LINT, file, ...flags]);
const tmp = () => mkdtempSync(join(tmpdir(), "shavin-lint-"));

describe("shavin-lint-tokens and ThemeProvider brandColor", () => {
  it("passes a root layout whose ThemeProvider has brandColor=\"#hex\"", async () => {
    const dir = tmp();
    const file = join(dir, "layout.tsx");
    writeFileSync(file, 'export default function L({ children }) { return <ThemeProvider brandColor="#1a73e8" displayFont="Rethink Sans">{children}</ThemeProvider>; }\n');
    const r = await lint(file);
    expect(r.status, r.stdout + r.stderr).toBe(0);
  });

  it("accepts the other spellings of the prop value", async () => {
    const dir = tmp();
    const file = join(dir, "layout.tsx");
    writeFileSync(file, "export const A = () => <ScopedThemeProvider brandColor={'#0a7d4f'}>x</ScopedThemeProvider>;\n");
    expect((await lint(file)).status).toBe(0);
  });

  it("still fails a raw hex anywhere else, even next to a brandColor", async () => {
    const dir = tmp();
    const file = join(dir, "page.tsx");
    writeFileSync(file, 'export const A = () => <ThemeProvider brandColor="#1a73e8"><div style={{ color: "#ff0000" }} /></ThemeProvider>;\n');
    const r = await lint(file);
    expect(r.status).not.toBe(0);
    expect(r.stdout + r.stderr).toContain("#ff0000");
  });

  it("--fix leaves the brandColor value alone", async () => {
    const dir = tmp();
    const file = join(dir, "layout.tsx");
    const src = 'export const A = () => <ThemeProvider brandColor="#ffffff">x</ThemeProvider>;\n';
    writeFileSync(file, src);
    await lint(file, "--fix");
    expect(readFileSync(file, "utf8")).toContain('brandColor="#ffffff"');
  });

  it("passes the layout that `shavin brand --color #hex` writes", async () => {
    const dir = tmp();
    mkdirSync(join(dir, "app"));
    writeFileSync(join(dir, "SHAVIN.md"), "# Shavin Project Design Manifest\n\n## 2. Design System Configuration\n- **Primary Brand**: `UNSET`\n");
    writeFileSync(join(dir, "app/layout.tsx"), 'import { ThemeProvider } from "@shavin/ui";\nexport default function L({ children }) { return <html><body><ThemeProvider>{children}</ThemeProvider></body></html>; }\n');
    const result = applyTheme(dir, { color: "#1a73e8", confirm: true });
    const layout = readFileSync(join(dir, "app/layout.tsx"), "utf8");
    expect(layout, JSON.stringify(result)).toContain('brandColor="#1a73e8"');
    const r = await lint(join(dir, "app/layout.tsx"));
    expect(r.status, r.stdout + r.stderr).toBe(0);
  });
});
