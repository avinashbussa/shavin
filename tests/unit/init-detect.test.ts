import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  addCssImports,
  addTailwindPreset,
  detectOtherUi,
  mergeClaudeHook,
  SHAVIN_HOOK_COMMAND,
  findGlobalCss,
  hasShavinThemeProvider,
  isEsmTailwindConfig,
  isShadcnProject,
  usesNextThemes,
  wrapRenderCall,
  // @ts-expect-error — plain .mjs module without types
} from "../../packages/cli/src/lib/init-detect.mjs";

const PRESET = `require("@shavin/ui/tailwind-preset")`;

function project(files: Record<string, string>) {
  const dir = mkdtempSync(join(tmpdir(), "shavin-init-"));
  for (const [rel, body] of Object.entries(files)) {
    const path = join(dir, rel);
    mkdirSync(join(path, ".."), { recursive: true });
    writeFileSync(path, body);
  }
  return dir;
}

describe("init: global stylesheet", () => {
  it("finds app/globals.css, the create-next-app default", () => {
    const dir = project({ "app/globals.css": '@import "tailwindcss";' });
    expect(findGlobalCss(dir)).toBe(join(dir, "app/globals.css"));
  });
  it("finds src/app/globals.css, src/index.css and app/app.css", () => {
    for (const rel of ["src/app/globals.css", "src/index.css", "app/app.css"]) {
      const dir = project({ [rel]: "" });
      expect(findGlobalCss(dir)).toBe(join(dir, rel));
    }
  });
  it("returns undefined when there is none", () => {
    expect(findGlobalCss(project({ "README.md": "" }))).toBeUndefined();
  });
});

describe("init: CSS imports", () => {
  const lines = ['@import "./brand-tokens.css";', '@import "@shavin/ui/styles.css";', '@import "@shavin/ui/theme-v4.css";'];
  it("puts them right after Tailwind's own import, as the docs do", () => {
    const { src, added } = addCssImports('@import "tailwindcss";\n@import "tw-animate-css";\n\n:root { --x: 1; }\n', lines);
    expect(added).toEqual(lines);
    expect(src.startsWith('@import "tailwindcss";\n' + lines.join("\n") + '\n@import "tw-animate-css";')).toBe(true);
  });
  it("adds only what is missing and is idempotent", () => {
    const first = addCssImports('@import "tailwindcss";\n', lines).src;
    expect(addCssImports(first, lines).added).toEqual([]);
  });
  it("prepends when the file has no imports (Tailwind 3 directives)", () => {
    const { src } = addCssImports("@tailwind base;\n@tailwind components;\n", ['@import "@shavin/ui/styles.css";']);
    expect(src.startsWith('@import "@shavin/ui/styles.css";\n@tailwind base;')).toBe(true);
  });
});

describe("init: Tailwind 3 preset", () => {
  it("handles module.exports and export default objects", () => {
    expect(addTailwindPreset("module.exports = {\n  content: [],\n};").src).toContain(`presets: [${PRESET}]`);
    expect(addTailwindPreset("export default {\n  content: [],\n};").src).toContain(`presets: [${PRESET}]`);
  });
  it("handles the named config that shadcn and create-next-app write", () => {
    const src = 'import type { Config } from "tailwindcss";\n\nconst config = {\n  content: [],\n} satisfies Config;\n\nexport default config;\n';
    const out = addTailwindPreset(src);
    expect(out.changed).toBe(true);
    expect(out.src).toContain(`const config = {\n  presets: [${PRESET}],`);
  });
  it("handles a typed const", () => {
    const out = addTailwindPreset("const config: Config = {\n  content: [],\n};\nexport default config;");
    expect(out.changed).toBe(true);
  });
  it("adds to an existing presets array", () => {
    expect(addTailwindPreset("module.exports = { presets: [other] };").src).toContain(`presets: [${PRESET}, other]`);
  });
  it("reports an unknown shape instead of claiming success", () => {
    const out = addTailwindPreset("module.exports = makeConfig();");
    expect(out.changed).toBe(false);
    expect(out.already).toBeFalsy();
  });
  it("leaves a config that already has the preset alone", () => {
    expect(addTailwindPreset(`module.exports = { presets: [${PRESET}] };`).already).toBe(true);
  });
  it("tells ES module configs, where require() is not defined, from CommonJS and TypeScript ones", () => {
    expect(isEsmTailwindConfig("tailwind.config.mjs", "export default {}")).toBe(true);
    expect(isEsmTailwindConfig("tailwind.config.js", 'import x from "y";\nexport default {}')).toBe(true);
    expect(isEsmTailwindConfig("tailwind.config.js", "module.exports = {}")).toBe(false);
    expect(isEsmTailwindConfig("tailwind.config.ts", "export default {}")).toBe(false);
  });
  it("imports the preset in an ES module config instead of calling require()", () => {
    const out = addTailwindPreset('import forms from "@tailwindcss/forms";\n\nexport default {\n  content: [],\n};\n', { esm: true });
    expect(out.changed).toBe(true);
    expect(out.src).not.toContain("require(");
    expect(out.src).toContain('import forms from "@tailwindcss/forms";\nimport shavinPreset from "@shavin/ui/tailwind-preset";');
    expect(out.src).toContain("presets: [shavinPreset],");
    expect(addTailwindPreset(out.src, { esm: true }).already).toBe(true);
  });
});

describe("init: theme providers", () => {
  it("only counts Shavin's ThemeProvider", () => {
    expect(hasShavinThemeProvider('import { ThemeProvider } from "@shavin/ui";')).toBe(true);
    expect(hasShavinThemeProvider('import { Button, ThemeProvider } from "@shavin/ui";')).toBe(true);
    expect(hasShavinThemeProvider('import { ThemeProvider } from "next-themes";')).toBe(false);
    expect(hasShavinThemeProvider('import { ThemeProvider } from "@/components/theme-provider";')).toBe(false);
  });
  it("spots next-themes and shadcn's theme-provider wrapper", () => {
    expect(usesNextThemes('import { ThemeProvider } from "next-themes";')).toBe(true);
    expect(usesNextThemes('import { ThemeProvider } from "@/components/theme-provider";')).toBe(true);
    expect(usesNextThemes('import { Inter } from "next/font/google";')).toBe(false);
  });
  it("detects shadcn by its components.json", () => {
    const shadcn = { $schema: "https://ui.shadcn.com/schema.json", style: "new-york", tailwind: { css: "app/globals.css" }, aliases: { components: "@/components" } };
    expect(isShadcnProject(project({ "components.json": JSON.stringify(shadcn) }))).toBe(true);
    const { $schema, ...noSchema } = shadcn;
    expect(isShadcnProject(project({ "components.json": JSON.stringify(noSchema) }))).toBe(true);
  });
  it("ignores other files named components.json", () => {
    // Shavin's own component manifest has the same name.
    expect(isShadcnProject(project({ "components.json": JSON.stringify({ count: 170, components: [] }) }))).toBe(false);
    expect(isShadcnProject(project({ "components.json": "{}" }))).toBe(false);
    expect(isShadcnProject(project({ "components.json": "not json" }))).toBe(false);
    expect(isShadcnProject(project({ "package.json": "{}" }))).toBe(false);
  });
});

describe("init: Vite and plain React entries", () => {
  it("wraps a single-line render call", () => {
    const out = wrapRenderCall('createRoot(document.getElementById("root")!).render(<App />);\n');
    expect(out).toBe('createRoot(document.getElementById("root")!).render(\n  <ThemeProvider>\n    <App />\n  </ThemeProvider>\n);\n');
  });
  it("keeps StrictMode outermost", () => {
    const src = 'createRoot(el).render(\n  <StrictMode>\n    <App />\n  </StrictMode>,\n);\n';
    const out = wrapRenderCall(src);
    expect(out).toContain("<StrictMode>\n    <ThemeProvider>\n      <App />\n    </ThemeProvider>\n  </StrictMode>,");
  });
  it("handles React.StrictMode and ReactDOM.render with a container argument", () => {
    expect(wrapRenderCall("root.render(<React.StrictMode><App /></React.StrictMode>);")).toContain("<React.StrictMode>\n    <ThemeProvider>");
    const legacy = wrapRenderCall('ReactDOM.render(<App />, document.getElementById("root"));');
    expect(legacy).toContain('</ThemeProvider>, document.getElementById("root"));');
  });
  it("leaves files without a JSX render call alone", () => {
    expect(wrapRenderCall("export const x = 1;")).toBeNull();
    expect(wrapRenderCall("root.render(app);")).toBeNull();
  });
});

describe("detectOtherUi", () => {
  const proj = (deps: Record<string, string>, dirs: string[] = [], components?: object) => {
    const dir = mkdtempSync(join(tmpdir(), "shavin-ui-"));
    writeFileSync(join(dir, "package.json"), JSON.stringify({ dependencies: deps }));
    if (components) writeFileSync(join(dir, "components.json"), JSON.stringify(components));
    for (const d of dirs) mkdirSync(join(dir, d), { recursive: true });
    return dir;
  };
  it("finds nothing in a plain project", () => {
    expect(detectOtherUi(proj({ react: "19" }))).toEqual({ libs: [], legacyPaths: [] });
  });
  it("finds shadcn/ui, Radix and MUI and the components/ui legacy folder", () => {
    const dir = proj({ "@radix-ui/react-dialog": "1", "@mui/material": "6" }, ["src/components/ui"], { $schema: "https://ui.shadcn.com/schema.json" });
    expect(detectOtherUi(dir)).toEqual({ libs: ["shadcn/ui", "Radix UI", "MUI"], legacyPaths: ["src/components/ui"] });
  });
});

describe("mergeClaudeHook", () => {
  it("creates settings with the PostToolUse hook for Write, Edit and MultiEdit", () => {
    const r = mergeClaudeHook("");
    expect(r.changed).toBe(true);
    const json = JSON.parse(r.src);
    expect(json.hooks.PostToolUse).toEqual([{ matcher: "Write|Edit|MultiEdit", hooks: [{ type: "command", command: SHAVIN_HOOK_COMMAND }] }]);
  });
  it("keeps the user's other settings and hooks, and is idempotent", () => {
    const user = JSON.stringify({ permissions: { allow: ["Bash(ls)"] }, hooks: { PostToolUse: [{ matcher: "Bash", hooks: [{ type: "command", command: "echo hi" }] }], Stop: [] } });
    const once = mergeClaudeHook(user);
    const json = JSON.parse(once.src);
    expect(json.permissions.allow).toEqual(["Bash(ls)"]);
    expect(json.hooks.PostToolUse).toHaveLength(2);
    expect(json.hooks.Stop).toEqual([]);
    const twice = mergeClaudeHook(once.src);
    expect(twice.changed).toBe(false);
  });
  it("leaves a settings file that is not valid JSON alone", () => {
    expect(mergeClaudeHook("{ not json")).toBeNull();
  });
});
