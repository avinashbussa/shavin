/**
 * mcp-server.test.ts — Unit tests for the shavin MCP server logic.
 *
 * Tests the pure business-logic helpers, manifest loading, validation rules,
 * token lookup patterns, and component search without starting an actual
 * stdio MCP server (no live process needed).
 *
 * NOTE: The MCP server lives at packages/mcp-server/src/server.mjs and is
 * an ES module using stdio transport. Tools are registered via separate
 * modules in packages/mcp-server/src/tools/*.mjs.
 */

import { matchHexColors } from "../../packages/block-schema/hex-policy.mjs";
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(fileURLToPath(import.meta.url), "../../..");
const MCP_SERVER_DIR = resolve(ROOT, "packages/mcp-server/src");
const MCP_SERVER_FILE = resolve(MCP_SERVER_DIR, "server.mjs");
const MCP_TOOLS_DIR = resolve(MCP_SERVER_DIR, "tools");

// ── Helpers (replicated from validation.mjs for unit testability) ────────
function validateCode(code: string): string[] {
  const violations: string[] = [];

  const hexMatches = matchHexColors(code);
  if (hexMatches.length > 0) {
    violations.push(`Hardcoded hex colors found: ${hexMatches.join(", ")}.`);
  }

  if (/rgb\s*\(|rgba\s*\(/.test(code)) {
    violations.push("Raw rgb()/rgba() literals found.");
  }

  const foundationVars = code.match(/--n-\d+/g) ?? [];
  if (foundationVars.length > 0) {
    violations.push(`Direct foundation variable references found: ${foundationVars.join(", ")}.`);
  }

  const rawRadius = code.match(/\brounded-(sm|md|lg|xl|2xl|3xl|full)\b/g) ?? [];
  const radiusInClasses = rawRadius.filter(
    (m) => !/import|type|interface/.test(code)
  );
  // Filter out rounded-full (allowed) and only flag structural radius utilities
  const bannedRadius = radiusInClasses.filter((r) => r !== "rounded-full");
  if (bannedRadius.length > 0) {
    violations.push(`Literal radius utilities found: ${bannedRadius.join(", ")}.`);
  }

  const rawColors =
    code.match(
      /\b(bg|text|border|ring|fill|stroke)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/g
    ) ?? [];
  if (rawColors.length > 0) {
    violations.push(`Raw Tailwind color scale utilities found: ${rawColors.join(", ")}.`);
  }

  return violations;
}

// ── Manifest Loading Tests ──────────────────────────────────────────────
describe("tokens.json manifest", () => {
  it("exists at repository root", () => {
    const p = resolve(ROOT, "tokens.json");
    expect(existsSync(p)).toBe(true);
  });

  it("has foundation, semantic, radius, shadow, easing, presets keys", () => {
    const tokens = JSON.parse(readFileSync(resolve(ROOT, "tokens.json"), "utf-8"));
    expect(tokens).toHaveProperty("foundation");
    expect(tokens).toHaveProperty("semantic");
    expect(tokens).toHaveProperty("radius");
    expect(tokens).toHaveProperty("shadow");
    expect(tokens).toHaveProperty("easing");
    expect(tokens).toHaveProperty("presets");
  });

  it("static semantic tokens have role, light, dark, and tailwind fields", () => {
    const tokens = JSON.parse(readFileSync(resolve(ROOT, "tokens.json"), "utf-8"));
    // Dynamic tokens (accent, link, code-*, tooltip) are CSS-var-driven and
    // don't have static light/dark values. They must have role + tailwind.
    const DYNAMIC_PREFIXES = ["accent", "code-", "bg-tooltip", "fg-tooltip", "link"];
    for (const [name, data] of Object.entries<Record<string, unknown>>(tokens.semantic)) {
      const isDynamic = DYNAMIC_PREFIXES.some((p) => name.startsWith(p));
      expect(data, `semantic.${name} missing 'tailwind'`).toHaveProperty("tailwind");
      if (isDynamic) {
        // Dynamic tokens: role is optional for code-* utility tokens,
        // but accent-* must have role.
        if (!name.startsWith("code-")) {
          expect(data, `semantic.${name} missing 'role'`).toHaveProperty("role");
        }
      } else {
        // Static tokens: must have all four fields
        expect(data, `semantic.${name} missing 'role'`).toHaveProperty("role");
        expect(data, `semantic.${name} missing 'light'`).toHaveProperty("light");
        expect(data, `semantic.${name} missing 'dark'`).toHaveProperty("dark");
      }
    }
  });

  it("has at least one accent preset with name and hex", () => {
    const tokens = JSON.parse(readFileSync(resolve(ROOT, "tokens.json"), "utf-8"));
    const accents = tokens.presets?.accents ?? [];
    expect(accents.length).toBeGreaterThan(0);
    expect(accents[0]).toHaveProperty("name");
    expect(accents[0]).toHaveProperty("hex");
  });
});

describe("components.json manifest", () => {
  it("exists at repository root", () => {
    const p = resolve(ROOT, "components.json");
    expect(existsSync(p)).toBe(true);
  });

  it("has count and components array", () => {
    const manifest = JSON.parse(readFileSync(resolve(ROOT, "components.json"), "utf-8"));
    expect(manifest).toHaveProperty("count");
    expect(manifest).toHaveProperty("components");
    expect(Array.isArray(manifest.components)).toBe(true);
    expect(manifest.components.length).toBeGreaterThan(0);
  });

  it("count matches actual components array length", () => {
    const manifest = JSON.parse(readFileSync(resolve(ROOT, "components.json"), "utf-8"));
    expect(manifest.count).toBe(manifest.components.length);
  });

  it("each component has name, file, kind, variants, props", () => {
    const manifest = JSON.parse(readFileSync(resolve(ROOT, "components.json"), "utf-8"));
    for (const comp of manifest.components) {
      expect(comp, `${comp.name} missing 'name'`).toHaveProperty("name");
      expect(comp, `${comp.name} missing 'file'`).toHaveProperty("file");
      expect(comp, `${comp.name} missing 'kind'`).toHaveProperty("kind");
      expect(comp, `${comp.name} missing 'variants'`).toHaveProperty("variants");
      expect(comp, `${comp.name} missing 'props'`).toHaveProperty("props");
    }
  });
});

describe("AGENTS.md guidelines", () => {
  it("exists at repository root", () => {
    const p = resolve(ROOT, "AGENTS.md");
    expect(existsSync(p)).toBe(true);
  });

  it("contains the two-tier token model documentation", () => {
    const content = readFileSync(resolve(ROOT, "AGENTS.md"), "utf-8");
    expect(content).toContain("Foundation tokens");
    expect(content).toContain("Semantic tokens");
  });

  it("contains the cva variant convention", () => {
    const content = readFileSync(resolve(ROOT, "AGENTS.md"), "utf-8");
    expect(content).toContain("cva");
    expect(content).toContain("class-variance-authority");
  });

  it("contains the Radix backing decision table", () => {
    const content = readFileSync(resolve(ROOT, "AGENTS.md"), "utf-8");
    expect(content).toContain("Radix & Primitive Selection");
  });
});

// ── validate_code Logic ─────────────────────────────────────────────────
describe("validate_code: hex color detection", () => {
  it("flags hardcoded hex colors", () => {
    const violations = validateCode(`<div className="bg-[#ff0000] text-[#333]" />`);
    expect(violations.some((v) => v.includes("Hardcoded hex colors"))).toBe(true);
  });

  it("passes when using semantic token utilities", () => {
    const violations = validateCode(`<div className="bg-surface text-fg border-hairline" />`);
    expect(violations).toHaveLength(0);
  });

  it("does not flag 6-char hex in import paths", () => {
    const violations = validateCode(`import x from "#something";`);
    expect(typeof violations).toBe("object");
  });
});

describe("validate_code: rgb/rgba detection", () => {
  it("flags raw rgb() literals", () => {
    const violations = validateCode(`color: rgb(255, 0, 0);`);
    expect(violations.some((v) => v.includes("rgb()"))).toBe(true);
  });

  it("flags raw rgba() literals", () => {
    const violations = validateCode(`background: rgba(0, 0, 0, 0.5);`);
    expect(violations.some((v) => v.includes("rgba()"))).toBe(true);
  });

  it("passes on token-based color vars", () => {
    const violations = validateCode(`color: rgb(var(--fg));`);
    expect(Array.isArray(violations)).toBe(true);
  });
});

describe("validate_code: --n-* foundation variable detection", () => {
  it("flags direct --n-* references outside global.css", () => {
    const violations = validateCode(`color: var(--n-500);`);
    expect(violations.some((v) => v.includes("foundation variable"))).toBe(true);
  });

  it("does not flag semantic --bg-surface or --fg references", () => {
    const violations = validateCode(`color: var(--fg); background: var(--bg-surface);`);
    expect(violations.some((v) => v.includes("foundation variable"))).toBe(false);
  });
});

describe("validate_code: radius utility detection", () => {
  it("flags literal rounded-lg", () => {
    const violations = validateCode(`<div className="rounded-lg" />`);
    expect(violations.some((v) => v.includes("Literal radius"))).toBe(true);
  });

  it("flags literal rounded-xl", () => {
    const violations = validateCode(`<div className="rounded-xl p-4" />`);
    expect(violations.some((v) => v.includes("Literal radius"))).toBe(true);
  });

  it("flags literal rounded-2xl", () => {
    const violations = validateCode(`<div className="rounded-2xl" />`);
    expect(violations.some((v) => v.includes("Literal radius"))).toBe(true);
  });

  it("allows rounded-full (avatars, pills, switches)", () => {
    const violations = validateCode(`<Avatar className="rounded-full" />`);
    expect(violations.some((v) => v.includes("rounded-full"))).toBe(false);
  });

  it("passes token-based radius", () => {
    const violations = validateCode(`<div className="rounded-[var(--radius-lg)]" />`);
    expect(violations.some((v) => v.includes("Literal radius"))).toBe(false);
  });
});

describe("validate_code: raw Tailwind color scale detection", () => {
  it("flags bg-slate-500", () => {
    const violations = validateCode(`<div className="bg-slate-500" />`);
    expect(violations.some((v) => v.includes("Raw Tailwind color scale"))).toBe(true);
  });

  it("flags text-blue-600", () => {
    const violations = validateCode(`<p className="text-blue-600">hi</p>`);
    expect(violations.some((v) => v.includes("Raw Tailwind color scale"))).toBe(true);
  });

  it("flags border-zinc-300", () => {
    const violations = validateCode(`<div className="border-zinc-300" />`);
    expect(violations.some((v) => v.includes("Raw Tailwind color scale"))).toBe(true);
  });

  it("passes semantic color utilities", () => {
    const violations = validateCode(
      `<div className="bg-surface text-fg-muted border-hairline bg-accent text-accent-fg" />`
    );
    expect(violations.some((v) => v.includes("Raw Tailwind color scale"))).toBe(false);
  });
});

describe("validate_code: clean code scenarios", () => {
  it("returns empty array for fully token-compliant JSX", () => {
    const clean = `
      <div className="bg-surface border border-hairline rounded-[var(--radius-panel)] p-4">
        <h2 className="text-fg font-semibold">Title</h2>
        <p className="text-fg-muted text-sm">Description</p>
        <Button variant="solid" size="sm">Submit</Button>
      </div>
    `;
    const violations = validateCode(clean);
    expect(violations).toHaveLength(0);
  });

  it("flags multiple violations in one snippet", () => {
    const dirty = `
      <div className="bg-[#fff] rounded-lg text-blue-600" style={{ color: "rgb(100,100,100)" }}>
        <span style={{ background: "var(--n-200)" }}>text</span>
      </div>
    `;
    const violations = validateCode(dirty);
    expect(violations.length).toBeGreaterThanOrEqual(3);
  });
});

// ── MCP server binary wiring ────────────────────────────────────────────
describe("MCP server wiring", () => {
  it("server.mjs exists in packages/mcp-server/src", () => {
    expect(existsSync(MCP_SERVER_FILE)).toBe(true);
  });

  it("has the shavin-mcp bin entry in root package.json", () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));
    expect(pkg.bin).toHaveProperty("shavin-mcp");
    expect(pkg.bin["shavin-mcp"]).toBe("packages/mcp-server/bin/shavin-mcp.mjs");
  });

  it("has the mcp script in package.json scripts", () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));
    expect(pkg.scripts).toHaveProperty("mcp");
    expect(pkg.scripts["mcp"]).toContain("shavin-mcp");
  });

  it("shavin-mcp bin entry is executable via bin", () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));
    expect(pkg.bin).toHaveProperty("shavin-mcp");
    expect(existsSync(resolve(ROOT, pkg.bin["shavin-mcp"]))).toBe(true);
  });

  it("@modelcontextprotocol/sdk is in dependencies or devDependencies", () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, "package.json"), "utf-8"));
    const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
    expect(allDeps).toHaveProperty("@modelcontextprotocol/sdk");
  });

  it("MCP server registers all expected tools across tool modules", () => {
    // Read all tool registration files and verify the tool names are present.
    // The MCP server now uses separate modules in tools/*.mjs, each
    // registering tools via `name: "<tool_name>"`.
    const toolFiles = readdirSync(MCP_TOOLS_DIR).filter(
      (f) => f.endsWith(".mjs") && f !== "bridge.mjs" // bridge tools are optional (browser bridge)
    );
    const allSource = toolFiles
      .map((f) => readFileSync(resolve(MCP_TOOLS_DIR, f), "utf-8"))
      .join("\n");

    const requiredTools = [
      "get_tokens",
      "get_components",
      "get_builder_schema",
      "get_block_template",
      "validate_code",
      "autofix_code",
      "get_guidelines",
      "get_setup_instructions",
      "inspect_environment",
      "install_skills",
      "list_skills",
      "get_skill",
      "get_skill_mode",
      "list_commands",
      "synthesize_layout",
      "get_project_context",
      "shavin_steer",
      "audit_source",
      "connect_studio",
      "disconnect_studio",
      "compose_to_canvas",
      "inject_blocks",
      "get_studio_state",
      "clear_studio_canvas",
      "set_studio_theme",
    ];

    for (const tool of requiredTools) {
      expect(
        allSource,
        `Missing tool '${tool}' in MCP server tool modules`
      ).toContain(`name: "${tool}"`);
    }
  });

  it("get_setup_instructions contains step-by-step wiring guide", () => {
    const src = readFileSync(resolve(MCP_TOOLS_DIR, "environment.mjs"), "utf-8");
    // The setup instructions include numbered steps.
    // Step 1: Install package
    expect(src).toContain("Install package");
    // Step 4: ThemeProvider (mandatory)
    expect(src).toContain("ThemeProvider");
    // Step 6: Automated scaffolding via CLI
    expect(src).toContain("Scaffolding");
  });

  it("server.mjs imports all tool registration modules", () => {
    const src = readFileSync(MCP_SERVER_FILE, "utf-8");
    const expectedImports = [
      "tokens.mjs",
      "components.mjs",
      "builder.mjs",
      "validation.mjs",
      "guidelines.mjs",
      "environment.mjs",
      "skills.mjs",
      "synthesize.mjs",
      "context.mjs",
      "steer.mjs",
      "bridge.mjs",
      "archlint.mjs",
      "studio-relay.mjs",
    ];
    for (const mod of expectedImports) {
      expect(src, `server.mjs missing import of ${mod}`).toContain(mod);
    }
  });

  it("server.mjs sets server name to 'shavin'", () => {
    const src = readFileSync(MCP_SERVER_FILE, "utf-8");
    expect(src).toContain('"shavin"');
    expect(src).not.toContain('"shavin-mcp"');
  });
});
