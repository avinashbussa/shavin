import type { Config } from "tailwindcss";
import preset from "../packages/ui/tailwind-preset";

// Same setup as the docs site: the shared preset, class-based dark mode, and
// content globs that include the primitives (so classes used in .doc.ts
// examples are generated too).
export default {
  presets: [preset],
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}", "../packages/ui/src/**/*.{ts,tsx}"],
} satisfies Config;
