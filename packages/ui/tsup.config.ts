import { defineConfig } from "tsup";

const shared = {
  format: ["esm" as const],
  dts: true,
  clean: false,
  minify: false,
  sourcemap: true,
  external: ["react", "react-dom", "lucide-react", "tailwindcss", "@phosphor-icons/react", "@radix-ui/react-icons", "@mdi/js"],
};

export default defineConfig([
  // Server-safe entry: no "use client" banner.
  { ...shared, entry: { server: "src/server.ts" } },
  {
    ...shared,
    entry: {
      index: "src/index.ts",
      // Opt-in subpath: keeps react-resizable-panels out of the root bundle.
      panels: "src/panels.ts",
      "tailwind-preset": "tailwind-preset.ts",
      "styles/global": "src/styles/global.css",
      "styles/brand-tokens": "src/styles/brand-tokens.css",
      "styles/brand-preset": "src/styles/brand-preset.mjs",
      "styles/brand-tokens-oklch": "src/styles/brand-tokens-oklch.css",
      "styles/brand-theme-v4": "src/styles/brand-theme-v4.css",
      "styles/brand-theme-v4-oklch": "src/styles/brand-theme-v4-oklch.css",
      "styles/theme-v4": "src/styles/theme-v4.css",
      "styles/global-oklch": "src/styles/global-oklch.css",
      "styles/theme-v4-oklch": "src/styles/theme-v4-oklch.css",
    },
    banner: {
      js: '"use client";',
    },
},
]);
