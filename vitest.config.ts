import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

// Unit tests run against package sources, not dist/, so no build is needed first.
const at = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@shavin/ui/components.json": at("./packages/ui/components.json"),
      "@shavin/ui/tokens.json": at("./packages/ui/tokens.json"),
      "@shavin/ui/lib/theme-presets": at("./packages/ui/src/lib/theme-presets.ts"),
      "@shavin/ui/lib/cn": at("./packages/ui/src/lib/cn.ts"),
      "@shavin/ui/primitives": at("./packages/ui/src/primitives"),
      "@shavin/ui/lib": at("./packages/ui/src/lib"),
      "@shavin/ui/styles": at("./packages/ui/src/styles"),
      "@shavin/ui": at("./packages/ui/src/index.ts"),
      "@shavin/block-schema/hex-policy": at("./packages/block-schema/hex-policy.mjs"),
      "@shavin/block-schema": at("./packages/block-schema/src/index.ts"),
      "@": at("./packages/ui/src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./tests/setup.ts"],
    css: false,
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
