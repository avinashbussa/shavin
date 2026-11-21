import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { runDoctor } from "../../packages/cli/src/lib/doctor.mjs";
// @ts-expect-error — plain .mjs module without types
import { satisfies } from "../../packages/cli/src/lib/compat.mjs";
// @ts-expect-error — plain .mjs module without types
import { inspectSetup } from "../../packages/cli/src/lib/inspect-setup.mjs";
// @ts-expect-error — plain .mjs module without types
import { addToastProvider } from "../../packages/cli/src/lib/init-detect.mjs";

function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "shavin-doctor-"));
  for (const [rel, body] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, rel)), { recursive: true });
    writeFileSync(join(dir, rel), body);
  }
  return dir;
}
const pkg = (deps: Record<string, string>, extra: Record<string, unknown> = {}) => JSON.stringify({ name: "x", dependencies: deps, ...extra });
const byId = (r: { checks: { id: string; status: string }[] }, id: string) => r.checks.find((c) => c.id === id)?.status;

const WIRED_V4 = `@import "tailwindcss";
@import "@shavin/ui/tokens.css";
@import "@shavin/ui/base.css" layer(base);
@import "@shavin/ui/theme-v4.css";
@source "../../node_modules/@shavin/ui";
@source not "../../.agents";
@source not "../../.claude";
`;
// What a fresh `shavin init` writes: ToastProvider directly inside ThemeProvider.
const LAYOUT = `import "./globals.css";
import { ThemeProvider, ToastProvider } from "@shavin/ui";
export default function L({ children }) { return <html suppressHydrationWarning><body><ThemeProvider><ToastProvider>{children}</ToastProvider></ThemeProvider></body></html>; }
`;
const LAYOUT_NO_TOAST = LAYOUT.replace(", ToastProvider", "").replace(/<\/?ToastProvider>/g, "");

describe("shavin doctor", () => {
  it("passes a wired Tailwind 4 app with no failures", () => {
    const dir = project({
      "package.json": pkg({ react: "^19.0.0", "react-dom": "^19.0.0", next: "15.5.0", "@shavin/ui": "^0.1.0", tailwindcss: "^4.1.0", "@tailwindcss/postcss": "^4.1.0" }),
      "postcss.config.mjs": 'export default { plugins: { "@tailwindcss/postcss": {} } };\n',
      "node_modules/react/package.json": JSON.stringify({ version: "19.2.0" }),
      "src/app/globals.css": WIRED_V4,
      "src/app/layout.tsx": LAYOUT,
    });
    const r = runDoctor(dir);
    expect(r.checks.filter((c: { status: string }) => c.status === "fail")).toEqual([]);
    expect(r.ok).toBe(true);
    expect(r.score).toBe(100);
    expect(byId(r, "base-layer")).toBe("pass");
  });

  it("fails React below 19 and a missing theme import, with a fix for each", () => {
    const dir = project({
      "package.json": pkg({ react: "^18.3.0", "react-dom": "^18.3.0", "@shavin/ui": "^0.1.0", tailwindcss: "^4.1.0" }),
      "src/app/globals.css": '@import "tailwindcss";\n',
      "src/app/layout.tsx": LAYOUT,
    });
    const r = runDoctor(dir);
    expect(byId(r, "react")).toBe("fail");
    expect(byId(r, "theme-v4")).toBe("fail");
    expect(r.ok).toBe(false);
    expect(r.checks.filter((c: { status: string; fix?: string }) => c.status === "fail").every((c: { fix?: string }) => !!c.fix)).toBe(true);
  });

  it("on Tailwind 3 checks that the preset is actually loaded, not just that a config exists", () => {
    const dir = project({
      "package.json": pkg({ react: "^19.0.0", "react-dom": "^19.0.0", "@shavin/ui": "^0.1.0", tailwindcss: "^3.4.0" }),
      "tailwind.config.js": "module.exports = { content: [] };\n",
      "src/app/globals.css": '@import "@shavin/ui/styles.css";\n@tailwind base;\n',
      "src/app/layout.tsx": LAYOUT,
    });
    expect(byId(runDoctor(dir), "tailwind-preset")).toBe("fail");
  });

  it("treats another library's ThemeProvider as info, not as Shavin's", () => {
    const dir = project({
      "package.json": pkg({ react: "^19.0.0", "react-dom": "^19.0.0", "@shavin/ui": "^0.1.0", tailwindcss: "^4.1.0", "next-themes": "^0.4.0" }),
      "src/app/globals.css": WIRED_V4,
      "src/app/layout.tsx": `import { ThemeProvider } from "next-themes";\nexport default function L({ children }) { return <ThemeProvider>{children}</ThemeProvider>; }\n`,
    });
    expect(byId(runDoctor(dir), "theme-provider")).toBe("info");
  });

  it("finds packages hoisted to a parent node_modules", () => {
    const root = project({ "node_modules/@shavin/ui/package.json": JSON.stringify({ version: "0.1.0" }) });
    const app = join(root, "apps/web");
    mkdirSync(join(app, "src/app"), { recursive: true });
    writeFileSync(join(app, "package.json"), pkg({ react: "^19.0.0", "react-dom": "^19.0.0", "@shavin/ui": "*", tailwindcss: "^4.1.0" }));
    writeFileSync(join(app, "src/app/globals.css"), WIRED_V4);
    writeFileSync(join(app, "src/app/layout.tsx"), LAYOUT);
    expect(byId(runDoctor(app), "ui-package")).toBe("pass");
  });

  it("skips app checks at a workspace root and says so", () => {
    const r = runDoctor(project({ "package.json": pkg({}, { workspaces: ["apps/*"] }) }));
    expect(byId(r, "workspace-root")).toBe("info");
    expect(byId(r, "react")).toBeUndefined();
    expect(byId(r, "theme-provider")).toBeUndefined();
  });

  it("shavin add only hears about wiring and the package, not agent files", () => {
    const dir = project({
      "package.json": pkg({ react: "^19.0.0", "react-dom": "^19.0.0", "@shavin/ui": "^0.1.0", tailwindcss: "^4.1.0" }),
      "node_modules/@shavin/ui/package.json": JSON.stringify({ version: "0.1.0" }),
      "postcss.config.mjs": 'export default { plugins: { "@tailwindcss/postcss": {} } };\n',
      "src/app/globals.css": WIRED_V4,
      "src/app/layout.tsx": LAYOUT,
    });
    expect(inspectSetup(dir).issues).toEqual([]);
  });

  describe("agent files (CLAUDE.md, Claude Code skills, Cursor rule)", () => {
    const base = {
      "package.json": pkg({ react: "^19.0.0", "react-dom": "^19.0.0", "@shavin/ui": "^0.1.0", tailwindcss: "^4.1.0" }),
      "src/app/globals.css": WIRED_V4,
      "src/app/layout.tsx": LAYOUT,
    };

    it("warns when CLAUDE.md neither imports AGENTS.md and SHAVIN.md nor carries the rules, and says how to fix it", () => {
      const r = runDoctor(project({ ...base, "CLAUDE.md": "# My project\n\nUse tabs.\n" }));
      expect(byId(r, "claude-md")).toBe("warn");
      expect(r.checks.find((c: { id: string }) => c.id === "claude-md").fix).toMatch(/@SHAVIN\.md/);
    });

    it("passes CLAUDE.md that imports both files", () => {
      const r = runDoctor(project({ ...base, "CLAUDE.md": "# x\n\n@SHAVIN.md\n@AGENTS.md\n" }));
      expect(byId(r, "claude-md")).toBe("pass");
    });

    it("warns when .claude/skills is missing (Claude Code does not read .agents/skills) and passes when deployed", () => {
      expect(byId(runDoctor(project(base)), "claude-skills")).toBe("warn");
      const r = runDoctor(project({ ...base, ".claude/skills/shavin-app/SKILL.md": "---\nname: shavin-app\n---\n" }));
      expect(byId(r, "claude-skills")).toBe("pass");
    });

    it("checks the Cursor rule only in projects that use Cursor", () => {
      expect(byId(runDoctor(project(base)), "cursor-rule")).toBeUndefined();
      expect(byId(runDoctor(project({ ...base, ".cursor/mcp.json": "{}" })), "cursor-rule")).toBe("warn");
      expect(byId(runDoctor(project({ ...base, ".cursor/rules/shavin.mdc": "x" })), "cursor-rule")).toBe("pass");
    });

    it("only checks setup: raw controls and other UI libraries in the code never change the result", () => {
      const clean = runDoctor(project(base));
      const dirty = runDoctor(project({ ...base, "src/app/page.tsx": 'import * as D from "@radix-ui/react-dialog";\nexport default () => <button style={{ color: "#fff" }}>x</button>;\n' }));
      expect(dirty.ok).toBe(clean.ok);
      expect(dirty.score).toBe(clean.score);
      expect(dirty.checks.map((c: { id: string }) => c.id)).toEqual(clean.checks.map((c: { id: string }) => c.id));
    });

    it("warns when the edit hook is registered but @shavin/mcp is not installed", () => {
      const r = runDoctor(project({ ...base, ".claude/settings.json": JSON.stringify({ hooks: { PostToolUse: [{ matcher: "Write", hooks: [{ type: "command", command: "npx --no-install shavin-mcp --hook" }] }] } }) }));
      expect(byId(r, "edit-hook")).toBe("warn");
      expect(r.checks.find((c: { id: string }) => c.id === "edit-hook").message).toMatch(/not installed/);
    });

    it("checks the edit hook once @shavin/mcp is installed", () => {
      const withMcp = { ...base, "node_modules/@shavin/mcp/package.json": "{}" };
      expect(byId(runDoctor(project(base)), "edit-hook")).toBeUndefined();
      const missing = runDoctor(project(withMcp));
      expect(byId(missing, "edit-hook")).toBe("warn");
      expect(missing.checks.find((c: { id: string }) => c.id === "edit-hook").fix).toMatch(/shavin-mcp --hook/);
      const ok = runDoctor(project({ ...withMcp, ".claude/settings.json": JSON.stringify({ hooks: { PostToolUse: [{ matcher: "Write|Edit", hooks: [{ type: "command", command: "npx --no-install shavin-mcp --hook" }] }] } }) }));
      expect(byId(ok, "edit-hook")).toBe("pass");
    });

    it("warns when Tailwind may scan .claude skill docs", () => {
      const r = runDoctor(project({ ...base, "src/app/globals.css": WIRED_V4.replace('@source not "../../.claude";\n', "") }));
      expect(byId(r, "source-not-claude")).toBe("warn");
    });
  });

  it("uses the same Node floor as the packages' engines", async () => {
    const { readFileSync } = await import("node:fs");
    const engines = JSON.parse(readFileSync(join(__dirname, "../../packages/cli/package.json"), "utf8")).engines.node as string;
    const floor = Number(engines.match(/(\d+)/)![1]);
    const r = runDoctor(project({ "package.json": pkg({}) }));
    const node = r.checks.find((c: { id: string }) => c.id === "node");
    // The check's own floor must equal engines: on this machine's Node it passes iff Node >= floor.
    expect(node.status).toBe(Number(process.versions.node.split(".")[0]) >= floor ? "pass" : "fail");
    if (node.status === "fail") expect(node.fix).toContain(String(floor));
  });

  describe("shadcn/ui theme bridge", () => {
    const shadcn = JSON.stringify({ $schema: "https://ui.shadcn.com/schema.json", aliases: { components: "@/components" } });
    const files = (css: string, extra: Record<string, string> = {}) => ({
      "package.json": pkg({ react: "^19.0.0", "react-dom": "^19.0.0", "@shavin/ui": "^0.1.0", tailwindcss: "^4.1.0" }),
      "components.json": shadcn,
      "src/app/globals.css": css,
      "src/app/layout.tsx": LAYOUT,
      ...extra,
    });
    it("is not checked in projects without shadcn/ui", () => {
      expect(byId(runDoctor(project({ "package.json": pkg({ react: "^19.0.0", "react-dom": "^19.0.0", "@shavin/ui": "^0.1.0", tailwindcss: "^4.1.0" }), "src/app/globals.css": WIRED_V4, "src/app/layout.tsx": LAYOUT })), "shadcn-bridge")).toBeUndefined();
    });
    it("warns with the init fix when shadcn is installed but its variables are not mapped", () => {
      const r = runDoctor(project(files(WIRED_V4)));
      expect(byId(r, "shadcn-bridge")).toBe("warn");
      expect(r.checks.find((c: { id: string }) => c.id === "shadcn-bridge").fix).toMatch(/init/);
    });
    it("passes when the bridge file exists and is imported", () => {
      const r = runDoctor(project(files(`${WIRED_V4}@import "./shavin-shadcn-bridge.css";\n`, { "src/app/shavin-shadcn-bridge.css": "html:root {}" })));
      expect(byId(r, "shadcn-bridge")).toBe("pass");
    });
    it("says so when the file exists but is not imported", () => {
      const r = runDoctor(project(files(WIRED_V4, { "src/app/shavin-shadcn-bridge.css": "html:root {}" })));
      expect(byId(r, "shadcn-bridge")).toBe("warn");
      expect(r.checks.find((c: { id: string }) => c.id === "shadcn-bridge").fix).toMatch(/@import/);
    });
  });

  describe("rendering chain (the gaps that leave Shavin unstyled)", () => {
    const deps = { react: "^19.0.0", "react-dom": "^19.0.0", next: "15.5.0", "@shavin/ui": "^0.1.0", tailwindcss: "^4.1.0", "@tailwindcss/postcss": "^4.1.0" };
    const files = {
      "package.json": pkg(deps),
      "postcss.config.mjs": 'export default { plugins: { "@tailwindcss/postcss": {} } };\n',
      "src/app/globals.css": WIRED_V4,
      "src/app/layout.tsx": LAYOUT,
    };

    it("passes when the root layout imports the global stylesheet, PostCSS runs Tailwind and <html> suppresses hydration warnings", () => {
      const r = runDoctor(project(files));
      expect(byId(r, "css-imported")).toBe("pass");
      expect(byId(r, "postcss-plugin")).toBe("pass");
      expect(byId(r, "html-hydration")).toBe("pass");
      expect(r.ok).toBe(true);
    });

    it("fails with the exact import line when the layout does not import globals.css (healthy files, unstyled page)", () => {
      const r = runDoctor(project({ ...files, "src/app/layout.tsx": LAYOUT.replace('import "./globals.css";\n', "") }));
      expect(byId(r, "css-imported")).toBe("fail");
      expect(r.ok).toBe(false);
      expect(r.checks.find((c: { id: string }) => c.id === "css-imported").fix).toBe('Add import "./globals.css"; at the top of src/app/layout.tsx');
    });

    it("fails when Tailwind 4 has no PostCSS plugin on a non-Vite framework", () => {
      const r = runDoctor(project({ ...files, "postcss.config.mjs": "export default {};\n" }));
      expect(byId(r, "postcss-plugin")).toBe("fail");
      expect(r.checks.find((c: { id: string }) => c.id === "postcss-plugin").fix).toMatch(/@tailwindcss\/postcss/);
    });

    it("fails when ThemeProvider is imported but no longer rendered", () => {
      const r = runDoctor(project({ ...files, "src/app/layout.tsx": LAYOUT_NO_TOAST.replace(/<\/?ThemeProvider>/g, "") }));
      expect(byId(r, "theme-provider")).toBe("fail");
      expect(r.checks.find((c: { id: string }) => c.id === "theme-provider").fix).toMatch(/<ThemeProvider>/);
    });

    it("passes ToastProvider when it is mounted inside ThemeProvider", () => {
      const withToast = addToastProvider(LAYOUT_NO_TOAST).src;
      const r = runDoctor(project({ ...files, "src/app/layout.tsx": withToast }));
      expect(byId(r, "toast-provider")).toBe("pass");
    });

    it("finds ToastProvider in a providers file next to the layout", () => {
      const r = runDoctor(project({
        ...files,
        "src/app/layout.tsx": LAYOUT_NO_TOAST,
        "src/app/providers.tsx": `"use client";\nimport { ToastProvider } from "@shavin/ui";\nexport function P({ children }) { return <ToastProvider>{children}</ToastProvider>; }\n`,
      }));
      expect(byId(r, "toast-provider")).toBe("pass");
    });

    it("warns with the exact fix when ToastProvider is missing", () => {
      const r = runDoctor(project({ ...files, "src/app/layout.tsx": LAYOUT_NO_TOAST }));
      expect(byId(r, "toast-provider")).toBe("warn");
      const check = r.checks.find((c: { id: string }) => c.id === "toast-provider");
      expect(check.message).toMatch(/useToast\(\) throws/);
      expect(check.fix).toMatch(/npx @shavin\/cli init/);
      expect(check.fix).toMatch(/<ToastProvider>\{children\}<\/ToastProvider> directly inside <ThemeProvider>/);
    });

    it("warns when <html> lacks suppressHydrationWarning", () => {
      const r = runDoctor(project({ ...files, "src/app/layout.tsx": LAYOUT.replace(" suppressHydrationWarning", "") }));
      expect(byId(r, "html-hydration")).toBe("warn");
    });
  });
});

describe("shavin doctor: brand solid fill", () => {
  const base = (layout: string, css = WIRED_V4) =>
    project({
      "package.json": pkg({ react: "^19.0.0", "react-dom": "^19.0.0", next: "15.5.0", "@shavin/ui": "^0.1.0", tailwindcss: "^4.1.0", "@tailwindcss/postcss": "^4.1.0" }),
      "postcss.config.mjs": 'export default { plugins: { "@tailwindcss/postcss": {} } };\n',
      "node_modules/react/package.json": JSON.stringify({ version: "19.2.0" }),
      "src/app/globals.css": css,
      "src/app/layout.tsx": layout,
    });
  const check = (r: { checks: { id: string; status: string; message?: string; fix?: string }[] }, id: string) => r.checks.find((c) => c.id === id);

  it("passes with the default (accessible) and says so", () => {
    const r = runDoctor(base(LAYOUT));
    expect(byId(r, "brand-solid")).toBe("pass");
    expect(check(r, "brand-solid-override")).toBeUndefined();
    expect(r.score).toBe(100);
  });
  it("reports the active mode when it is set, and flags perceptual with the way back", () => {
    expect(byId(runDoctor(base(LAYOUT.replace("<ThemeProvider>", '<ThemeProvider brandSolid="accessible">'))), "brand-solid")).toBe("pass");
    expect(byId(runDoctor(base(LAYOUT.replace("<ThemeProvider>", '<ThemeProvider brandSolid="exact">'))), "brand-solid")).toBe("info");
    const perceptual = runDoctor(base(LAYOUT.replace("<ThemeProvider>", '<ThemeProvider brandSolid="perceptual">')));
    expect(byId(perceptual, "brand-solid")).toBe("warn");
    expect(check(perceptual, "brand-solid")?.fix).toContain('brandSolid="accessible"');
    expect(byId(runDoctor(base(LAYOUT.replace("<ThemeProvider>", "<ThemeProvider brandSolid={'perceptual'}>"))), "brand-solid")).toBe("warn");
  });
  it("flags a --brand-solid / --brand-fg override pair under 4.5:1, and ignores values it cannot read", () => {
    const low = runDoctor(base(LAYOUT, `${WIRED_V4}\n:root { --brand-solid: #7cc4ff; --brand-fg: 255 255 255; }\n`));
    expect(byId(low, "brand-solid-override")).toBe("warn");
    expect(check(low, "brand-solid-override")?.message).toContain("1.");
    const ok = runDoctor(base(LAYOUT, `${WIRED_V4}\n:root { --brand-solid: #0075d8; --brand-fg: #ffffff; }\n.dark { --brand-solid: var(--n-200); --brand-fg: oklch(0.2 0 0); }\n`));
    expect(check(ok, "brand-solid-override")).toBeUndefined();
  });
});

describe("init: ToastProvider inside ThemeProvider", () => {
  it("wraps the ThemeProvider children and extends the @shavin/ui import", () => {
    const r = addToastProvider(LAYOUT_NO_TOAST);
    expect(r.patched).toBe(true);
    expect(r.src).toContain('import { ThemeProvider, ToastProvider } from "@shavin/ui";');
    expect(r.src).toContain("<ThemeProvider><ToastProvider>{children}</ToastProvider></ThemeProvider>");
  });

  it("is idempotent and needs a ThemeProvider", () => {
    const once = addToastProvider(LAYOUT_NO_TOAST).src;
    expect(addToastProvider(once)).toEqual({ patched: false, reason: "already-wired" });
    expect(addToastProvider("export default function L({ children }) { return children; }").reason).toBe("no-theme-provider");
  });
});

describe("package compatibility (shavin.compat)", () => {
  const compatPkg = (version: string, range?: string) =>
    JSON.stringify({ name: "x", version, ...(range ? { shavin: { compat: { "@shavin/ui": range } } } : {}) });
  const base = (extra: Record<string, string>) => project({
    "package.json": pkg({ react: "^19.0.0", "react-dom": "^19.0.0", "@shavin/ui": "^0.1.0", tailwindcss: "^4.1.0" }),
    "src/app/globals.css": WIRED_V4,
    "src/app/layout.tsx": LAYOUT,
    ...extra,
  });
  const compat = (r: { checks: { id: string; status: string; message: string; fix?: string }[] }) => r.checks.find((c) => c.id === "package-compat");

  it("passes when the installed @shavin/ui is inside every installed tool's range", () => {
    const r = runDoctor(base({
      "node_modules/@shavin/ui/package.json": compatPkg("0.1.4"),
      "node_modules/@shavin/mcp/package.json": compatPkg("0.1.0", ">=0.1.0 <0.2.0"),
      "node_modules/@shavin/skills/package.json": compatPkg("0.1.2", ">=0.1.0 <0.2.0"),
    }));
    expect(compat(r)?.status).toBe("pass");
  });

  it("checks @shavin/fx against its declared @shavin/ui range", () => {
    const ok = runDoctor(base({
      "node_modules/@shavin/ui/package.json": compatPkg("0.1.4"),
      "node_modules/@shavin/fx/package.json": compatPkg("0.1.0", ">=0.1.0 <0.2.0"),
    }));
    expect(compat(ok)?.status).toBe("pass");
    const old = runDoctor(base({
      "node_modules/@shavin/ui/package.json": compatPkg("0.1.4"),
      "node_modules/@shavin/fx/package.json": compatPkg("0.2.0", ">=0.2.0 <0.3.0"),
    }));
    expect(compat(old)?.message).toBe("@shavin/fx 0.2.0 documents @shavin/ui >=0.2.0 <0.3.0, but 0.1.4 is installed");
    expect(compat(old)?.fix).toBe('Run npm install "@shavin/ui@^0.2.0"');
  });

  it("upgrades @shavin/fx as a runtime dependency (no -D) when @shavin/ui is newer than its range", () => {
    const r = runDoctor(base({
      "node_modules/@shavin/ui/package.json": compatPkg("0.3.0"),
      "node_modules/@shavin/fx/package.json": compatPkg("0.1.0", ">=0.1.0 <0.2.0"),
      "node_modules/@shavin/mcp/package.json": compatPkg("0.1.0", ">=0.1.0 <0.2.0"),
    }));
    const c = compat(r)!;
    expect(c.status).toBe("warn");
    expect(c.fix).toBe("Run npm install -D @shavin/mcp@latest and npm install @shavin/fx@latest");
  });

  it("warns when @shavin/ui is older than the range, with the install command for @shavin/ui", () => {
    const r = runDoctor(base({
      "node_modules/@shavin/ui/package.json": compatPkg("0.1.4"),
      "node_modules/@shavin/mcp/package.json": compatPkg("0.2.0", ">=0.2.0 <0.3.0"),
    }));
    const c = compat(r)!;
    expect(c.status).toBe("warn");
    expect(c.message).toBe("@shavin/mcp 0.2.0 documents @shavin/ui >=0.2.0 <0.3.0, but 0.1.4 is installed");
    expect(c.fix).toBe('Run npm install "@shavin/ui@^0.2.0"');
    expect(r.summary.warn).toBeGreaterThan(0);
    expect(r.checks.some((x: { id: string; status: string }) => x.id === "package-compat" && x.status === "fail")).toBe(false); // a warning, never a failure
  });

  it("warns when @shavin/ui is newer than the range, with the install command for the tool", () => {
    const r = runDoctor(base({
      "node_modules/@shavin/ui/package.json": compatPkg("0.3.0"),
      "node_modules/@shavin/cli/package.json": compatPkg("0.1.0", ">=0.1.0 <0.2.0"),
      "node_modules/@shavin/mcp/package.json": compatPkg("0.1.0", ">=0.1.0 <0.2.0"),
    }));
    const c = compat(r)!;
    expect(c.status).toBe("warn");
    expect(c.message).toMatch(/@shavin\/cli 0\.1\.0 documents @shavin\/ui >=0\.1\.0 <0\.2\.0, but 0\.3\.0 is installed; @shavin\/mcp/);
    expect(c.fix).toBe("Run npm install -D @shavin/cli@latest @shavin/mcp@latest");
  });

  it("uses the project's package manager in the fix", () => {
    const r = runDoctor(base({
      "pnpm-lock.yaml": "lockfileVersion: 9\n",
      "node_modules/@shavin/ui/package.json": compatPkg("0.3.0"),
      "node_modules/@shavin/mcp/package.json": compatPkg("0.1.0", ">=0.1.0 <0.2.0"),
    }));
    expect(compat(r)?.fix).toBe("Run pnpm add -D @shavin/mcp@latest");
  });

  it("is silent when @shavin/ui is absent, no tool is installed, or the tool declares no range", () => {
    expect(compat(runDoctor(base({ "node_modules/@shavin/mcp/package.json": compatPkg("0.1.0", ">=0.1.0 <0.2.0") })))).toBeUndefined();
    expect(compat(runDoctor(base({ "node_modules/@shavin/ui/package.json": compatPkg("0.1.0") })))).toBeUndefined();
    expect(compat(runDoctor(base({
      "node_modules/@shavin/ui/package.json": compatPkg("0.1.0"),
      "node_modules/@shavin/mcp/package.json": compatPkg("0.1.0"),
    })))).toBeUndefined();
  });

  it("shavin add hears about a mismatch too", () => {
    const dir = base({
      "node_modules/@shavin/ui/package.json": compatPkg("0.3.0"),
      "node_modules/@shavin/mcp/package.json": compatPkg("0.1.0", ">=0.1.0 <0.2.0"),
      "postcss.config.mjs": 'export default { plugins: { "@tailwindcss/postcss": {} } };\n',
    });
    expect(inspectSetup(dir).issues.map((i: { label: string }) => i.label)).toEqual(["Package compatibility"]);
  });

  it("reads ranges: >= < pairs, caret, tilde, x, ||; unreadable ranges are not judged", () => {
    expect(satisfies("0.1.9", ">=0.1.0 <0.2.0")).toBe(true);
    expect(satisfies("0.2.0", ">=0.1.0 <0.2.0")).toBe(false);
    expect(satisfies("0.1.5", "^0.1.0")).toBe(true);
    expect(satisfies("0.2.0", "^0.1.0")).toBe(false);
    expect(satisfies("1.4.0", "^1.2.0")).toBe(true);
    expect(satisfies("0.1.9", "~0.1.2")).toBe(true);
    expect(satisfies("0.1.3", "0.1.x")).toBe(true);
    expect(satisfies("0.3.0", "^0.1.0 || ^0.3.0")).toBe(true);
    expect(satisfies("0.1.0", "workspace:*")).toBeNull();
  });
});
