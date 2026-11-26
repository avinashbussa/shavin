import { describe, expect, it } from "vitest";
import {
  addBrandPresetRef,
  addTailwindPreset,
  isEsmTailwindConfig,
  // @ts-expect-error plain .mjs module without types
} from "../../packages/cli/src/lib/init-detect.mjs";

// What `npx tailwindcss init` (Tailwind 3) writes, and what the stock create-next-app Tailwind 3 setup uses.
const STOCK_CJS = `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {} },
  plugins: [],
};
`;
const BRAND = `const brandPreset = require("./src/app/brand-preset.mjs").default;`;
const BRAND_ESM = `import brandPreset from "./src/app/brand-preset.mjs";`;

const run = (src: string) => {
  const mod: { exports: any } = { exports: {} };
  const req = (id: string) => (id.includes("brand-preset") ? { default: { name: "brand" } } : { name: "shavin" });
  new Function("module", "require", src)(mod, req);
  return mod.exports;
};

describe("init merges brandPreset into a Tailwind 3 config by module format", () => {
  it("stock CommonJS config with the JSDoc import() type comment gets a require, not nothing (regression: ReferenceError: brandPreset is not defined)", () => {
    expect(isEsmTailwindConfig("tailwind.config.js", STOCK_CJS)).toBe(false);
    const withShavin = addTailwindPreset(STOCK_CJS, { esm: false }).src;
    const out = addBrandPresetRef(withShavin, BRAND, { esm: false });
    expect(out).toContain(BRAND);
    const cfg = run(out); // would throw ReferenceError before the fix
    expect(cfg.presets.map((p: { name: string }) => p.name)).toEqual(["shavin", "brand"]);
  });

  it("CommonJS config that already requires things puts the brand require after the last require", () => {
    const src = `const plugin = require("tailwindcss/plugin");\nmodule.exports = { presets: [require("@shavin/ui/tailwind-preset")], plugins: [plugin] };\n`;
    const out = addBrandPresetRef(src, BRAND, { esm: false });
    expect(out.indexOf(BRAND)).toBeGreaterThan(out.indexOf('require("tailwindcss/plugin")'));
    expect(out.indexOf(BRAND)).toBeLessThan(out.indexOf("module.exports"));
  });

  it("TypeScript/ESM config gets an import after the last import; one with no imports gets it at the top", () => {
    const ts = `import type { Config } from "tailwindcss";\nimport shavinPreset from "@shavin/ui/tailwind-preset";\nexport default { presets: [shavinPreset], content: [] } satisfies Config;\n`;
    const out = addBrandPresetRef(ts, BRAND_ESM, { esm: true });
    expect(out.indexOf(BRAND_ESM)).toBeGreaterThan(out.indexOf("@shavin/ui/tailwind-preset"));
    expect(out).toContain("presets: [shavinPreset, brandPreset]");
    const bare = addBrandPresetRef(`export default { presets: [] };\n`, BRAND_ESM, { esm: true });
    expect(bare.startsWith(BRAND_ESM)).toBe(true);
  });
});
