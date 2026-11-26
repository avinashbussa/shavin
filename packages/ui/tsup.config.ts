import { defineConfig } from "tsup";

const shared = {
  format: ["esm" as const],
  dts: true,
  clean: false,
  minify: false,
  sourcemap: true,
  external: ["react", "react-dom", "lucide-react", "tailwindcss", "@phosphor-icons/react", "@radix-ui/react-icons", "@mdi/js"],
};

// Per-module ESM: one output file per source module (bundle: false), so consumers' bundlers can
// drop what a page does not import. `scripts/rewrite-specifiers.mjs` then adds the `.js` extensions
// Node's ESM resolver needs. Only the three public client entries carry "use client": every other
// module is reached through them, so it belongs to the client graph anyway, and `server.js` and the
// modules it imports must stay free of the directive.
const modules = {
  ...shared,
  bundle: false,
  splitting: false,
  dts: false,
  sourcemap: false,
  external: undefined,
};
const sourceGlobs = ["src/**/*.{ts,tsx}", "!src/**/*.d.ts", "!src/**/*.{test,spec,stories}.{ts,tsx}"];
const clientEntries = ["src/index.ts", "src/panels.ts", "src/icons.ts"];

export default defineConfig([
  // Everything except the client entries: no banner (server.js stays server-safe).
  { ...modules, entry: [...sourceGlobs, ...clientEntries.map((e) => `!${e}`)] },
  { ...modules, entry: clientEntries, banner: { js: '"use client";' } },
  // Bundled type declarations for the public entries.
  { ...shared, entry: { server: "src/server.ts", index: "src/index.ts", panels: "src/panels.ts", icons: "src/icons.ts", "lib/theme-presets": "src/lib/theme-presets.ts" }, dts: { only: true } },
  // CommonJS preset for `require()` in a Tailwind 3 tailwind.config.js: `module.exports = preset`, so
  // Tailwind gets the preset itself (it does not unwrap `default` on presets).
  {
    ...shared,
    entry: { "tailwind-preset": "tailwind-preset.ts" },
    format: ["cjs" as const],
    footer: { js: "module.exports = module.exports.default;" },
    dts: false,
    sourcemap: false,
    outExtension: () => ({ js: ".cjs" }),
  },
  // ESM preset with its declarations, the stylesheets and the brand preset template.
  {
    ...shared,
    entry: {
      "tailwind-preset": "tailwind-preset.ts",
      "styles/global": "src/styles/global.css",
      // Tailwind v4: tokens without element defaults, plus the defaults on their own for layer(base).
      "styles/tokens": "src/styles/tokens.css",
      "styles/base": "src/styles/base.css",
      "styles/tokens-oklch": "src/styles/tokens-oklch.css",
      "styles/base-oklch": "src/styles/base-oklch.css",
      "styles/brand-tokens": "src/styles/brand-tokens.css",
      "styles/brand-preset": "src/styles/brand-preset.mjs",
      "styles/brand-tokens-oklch": "src/styles/brand-tokens-oklch.css",
      "styles/brand-theme-v4": "src/styles/brand-theme-v4.css",
      "styles/brand-theme-v4-oklch": "src/styles/brand-theme-v4-oklch.css",
      "styles/theme-v4": "src/styles/theme-v4.css",
      "styles/global-oklch": "src/styles/global-oklch.css",
      "styles/theme-v4-oklch": "src/styles/theme-v4-oklch.css",
    },
    sourcemap: false,
  },
]);
