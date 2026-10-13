import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { manifestWatch } from "./plugins/manifest-watch";

const repo = fileURLToPath(new URL("..", import.meta.url));
const at = (p: string) => fileURLToPath(new URL(p, import.meta.url));

// The playground renders @shavin/ui from source, not dist/, so edits to a
// primitive, its .doc.ts or the tokens show up without a build.
export default defineConfig(({ mode }) => ({
  plugins: [react(), manifestWatch(repo)],
  resolve: {
    alias: [
      { find: "@shavin/ui/components.json", replacement: at("../packages/ui/components.json") },
      { find: /^@shavin\/ui$/, replacement: at("../packages/ui/src/index.ts") },
      { find: /^@\//, replacement: at("../packages/ui/src/") },
    ],
    dedupe: ["react", "react-dom"],
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode === "production" ? "production" : "development"),
    "process.env": "{}",
  },
  // The whole of @shavin/ui (icons included) ships in one chunk; fine for a local tool.
  build: { chunkSizeWarningLimit: 12_000 },
  server: {
    port: 3700,
    open: true,
    fs: { allow: [repo] },
  },
}));
