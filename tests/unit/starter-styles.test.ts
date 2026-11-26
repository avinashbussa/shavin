import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { describe, expect, it } from "vitest";
// @ts-expect-error plain .mjs module without types
import { hasStarterBodyStyle, neutraliseStarterStyles, starterStylesAdvice } from "../../packages/cli/src/lib/starter-styles.mjs";
// @ts-expect-error plain .mjs module without types
import { runDoctor } from "../../packages/cli/src/lib/doctor.mjs";

// create-next-app leaves `body { font-family: Arial ... }` and plain white/near-black variables in app/globals.css. They
// come after Shavin's imports and win over them, so a fresh page was Arial on white and the Shavin tokens were unused.

const HERE = dirname(fileURLToPath(import.meta.url));
const INIT = pathToFileURL(join(HERE, "../../packages/cli/src/commands/init.mjs")).href;

// The files create-next-app 15.5 (Tailwind 4) and 14.2 (Tailwind 3) write, byte for byte.
const NEXT15_TW4 = `@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: Arial, Helvetica, sans-serif;
}
`;
const NEXT14_TW3 = `@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #0a0a0a;
    --foreground: #ededed;
  }
}

body {
  color: var(--foreground);
  background: var(--background);
  font-family: Arial, Helvetica, sans-serif;
}

@layer utilities {
  .text-balance {
    text-wrap: balance;
  }
}
`;
const FIXED_PARTS = ["--background: rgb(var(--bg-canvas));", "--foreground: rgb(var(--fg));", "font-family: var(--font-body), ui-sans-serif, system-ui, sans-serif;"];
const crlf = (s: string) => s.replace(/\n/g, "\r\n");

describe("neutraliseStarterStyles", () => {
  it("replaces the stock Next 15 / Tailwind 4 starter with the Shavin tokens, keeps the rest, drops the dark block", async () => {
    const r = neutraliseStarterStyles(NEXT15_TW4);
    expect(r.status).toBe("fixed");
    for (const part of FIXED_PARTS) expect(r.css).toContain(part);
    expect(r.css).not.toMatch(/Arial|prefers-color-scheme|#ffffff|#0a0a0a/);
    expect(r.css).toContain('@import "tailwindcss";');
    expect(r.css).toContain("--color-background: var(--background);");
    expect(r.css).toContain("--font-sans: var(--font-geist-sans);");
  });

  it("replaces the stock Next 14 / Tailwind 3 starter and keeps its utilities layer", async () => {
    const r = neutraliseStarterStyles(NEXT14_TW3);
    expect(r.status).toBe("fixed");
    for (const part of FIXED_PARTS) expect(r.css).toContain(part);
    expect(r.css).not.toMatch(/Arial|prefers-color-scheme/);
    expect(r.css).toContain("@tailwind utilities;");
    expect(r.css).toContain(".text-balance");
  });

  it("is idempotent: the second run changes nothing", async () => {
    for (const stock of [NEXT15_TW4, NEXT14_TW3]) {
      const once = neutraliseStarterStyles(stock);
      const twice = neutraliseStarterStyles(once.css);
      expect(twice.status).toBe("already");
      expect(twice.css).toBe(once.css);
    }
  });

  it("keeps CRLF line endings and a BOM", async () => {
    const r = neutraliseStarterStyles("﻿" + crlf(NEXT15_TW4));
    expect(r.status).toBe("fixed");
    expect(r.css.startsWith("﻿")).toBe(true);
    expect(r.css).not.toMatch(/[^\r]\n/);
    expect(r.css.replace(/\r\n/g, "\n").replace(/^﻿/, "")).toBe(neutraliseStarterStyles(NEXT15_TW4).css);
  });

  it("matches with other indentation", async () => {
    expect(neutraliseStarterStyles(NEXT15_TW4.replace(/ {2}/g, "\t")).status).toBe("fixed");
  });

  it("leaves a file alone when anything differs from the stock starter, and says edited", async () => {
    const variants = [
      NEXT15_TW4.replace("#171717", "#222222"), // changed colour
      NEXT15_TW4.replace("Arial, Helvetica, sans-serif;", "Arial, Helvetica, sans-serif;\n  margin: 0;"), // extra declaration in body
      NEXT15_TW4 + "\nh1 { color: red; }\n", // user rule appended: still the stock blocks, so this one IS fixed (checked below)
      NEXT15_TW4.replace("#ededed", "#fafafa"), // changed dark colour
    ];
    for (const v of [variants[0], variants[1], variants[3]]) {
      const r = neutraliseStarterStyles(v);
      expect(r.status).toBe("edited");
      expect(r.css).toBe(v);
    }
    // Rules the user added around the stock blocks are theirs and are kept.
    const added = neutraliseStarterStyles(variants[2]);
    expect(added.status).toBe("fixed");
    expect(added.css).toContain("h1 { color: red; }");
  });

  it("does nothing to a stylesheet without the starter body style", async () => {
    const css = '@import "tailwindcss";\nbody { font-family: Inter, sans-serif; }\n';
    const r = neutraliseStarterStyles(css);
    expect(r.status).toBe("none");
    expect(r.css).toBe(css);
  });

  it("the advice names the file and the exact edits", async () => {
    const msg = starterStylesAdvice("app/globals.css");
    expect(msg).toContain("app/globals.css");
    expect(msg).toContain("rgb(var(--bg-canvas))");
    expect(msg).toContain("rgb(var(--fg))");
    expect(msg).toContain("prefers-color-scheme: dark");
    expect(msg).toContain("var(--font-body)");
  });

  it("hasStarterBodyStyle is true for the stock file, false once fixed", async () => {
    expect(hasStarterBodyStyle(NEXT15_TW4)).toBe(true);
    expect(hasStarterBodyStyle(neutraliseStarterStyles(NEXT15_TW4).css)).toBe(false);
  });
});

function project(cssRel: string, css: string): string {
  const dir = mkdtempSync(join(tmpdir(), "shavin-starter-"));
  const appDir = cssRel.startsWith("src/") ? "src/app" : "app";
  mkdirSync(join(dir, appDir), { recursive: true });
  writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x", dependencies: { next: "15", react: "19", tailwindcss: "^4", "@shavin/ui": "0.1.0" } }));
  writeFileSync(join(dir, appDir, "layout.tsx"), "import \"./globals.css\";\nexport default function L({ children }) { return <html><body>{children}</body></html>; }\n");
  writeFileSync(join(dir, cssRel), css);
  return dir;
}
/** Runs init without blocking the event loop (a synchronous spawn starves the vitest worker's RPC on a slow runner). */
async function init(dir: string) {
  const run = await new Promise<{ status: number | null; stdout: string; stderr: string }>((resolve, reject) => {
    const child = spawn(process.execPath, ["-e", `import(${JSON.stringify(INIT)}).then((m) => m.initCommand({}))`], { cwd: dir, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("error", reject);
    child.on("close", (status) => resolve({ status, stdout, stderr }));
  });
  expect(run.status, run.stderr).toBe(0);
  return `${run.stdout}\n${run.stderr}`.replace(/\x1b\[[0-9;]*m/g, "");
}

describe("init and the starter styles", () => {
  it.each(["app/globals.css", "src/app/globals.css"])("rewrites the stock %s, and a second init changes nothing", async (cssRel) => {
    const dir = project(cssRel, NEXT15_TW4);
    const out = await init(dir);
    const css = readFileSync(join(dir, cssRel), "utf8");
    for (const part of FIXED_PARTS) expect(css).toContain(part);
    expect(css).not.toMatch(/Arial|prefers-color-scheme/);
    expect(css).toContain('@import "@shavin/ui/base.css" layer(base);');
    expect(out).toContain("replaced the create-next-app starter styles");
    const out2 = await init(dir);
    expect(readFileSync(join(dir, cssRel), "utf8")).toBe(css);
    expect(out2).not.toContain("replaced the create-next-app starter styles");
  }, 120_000);

  it("a stylesheet that differs from the stock one is left alone, with a warning that gives the exact edits", async () => {
    const edited = NEXT15_TW4.replace("#171717", "#222222");
    const dir = project("app/globals.css", edited);
    const out = await init(dir);
    const css = readFileSync(join(dir, "app/globals.css"), "utf8");
    expect(css).toContain("#222222");
    expect(css).toContain("Arial, Helvetica, sans-serif");
    expect(out).toContain("app/globals.css still has the create-next-app starter styles");
    expect(out).toContain("rgb(var(--bg-canvas))");
    expect(out).toContain("var(--font-body)");
  }, 120_000);

  it("handles a CRLF stock file", async () => {
    const dir = project("app/globals.css", crlf(NEXT15_TW4));
    await init(dir);
    const css = readFileSync(join(dir, "app/globals.css"), "utf8");
    expect(css).toContain("rgb(var(--bg-canvas))");
    expect(css).not.toMatch(/Arial/);
  }, 120_000);
});

describe("check reports a leftover starter body style", () => {
  const WIRED = '@import "tailwindcss";\n@import "@shavin/ui/tokens.css";\n@import "@shavin/ui/base.css" layer(base);\n@import "@shavin/ui/theme-v4.css";\n';
  function wired(css: string) {
    const dir = mkdtempSync(join(tmpdir(), "shavin-starter-doctor-"));
    mkdirSync(join(dir, "app"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name: "x", dependencies: { next: "15", react: "19", tailwindcss: "^4", "@shavin/ui": "0.1.0" } }));
    writeFileSync(join(dir, "app/globals.css"), css);
    return dir;
  }
  it("warns with the recovery steps while the starter body style is there", async () => {
    const report = runDoctor(wired(WIRED + NEXT15_TW4.replace('@import "tailwindcss";\n', "")));
    const check = report.checks.find((c: { id: string }) => c.id === "starter-styles");
    expect(check?.status).toBe("warn");
    expect(check?.fix).toContain("npx @shavin/cli init");
    expect(check?.fix).toContain("rgb(var(--bg-canvas))");
  });
  it("is silent for a stylesheet without it", async () => {
    const report = runDoctor(wired(WIRED));
    expect(report.checks.find((c: { id: string }) => c.id === "starter-styles")).toBeUndefined();
  });
});
