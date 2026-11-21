import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

const dir = path.join(__dirname, "../../packages/ui/src/primitives/ShavinDevTools");
const read = (f: string) => fs.readFileSync(path.join(dir, f), "utf8");

// The dev panel is large and dev-only. A production page that never renders it must not download it, so the
// public component loads it on demand. These checks keep a later edit from importing it statically again.
describe("ShavinDevTools loads its panel on demand", () => {
  const wrapper = read("ShavinDevTools.tsx");

  it("imports the panel lazily", () => {
    expect(wrapper).toMatch(/React\.lazy\(\(\)\s*=>\s*import\("\.\/DevToolsPanel"\)\)/);
  });

  it("has no static import of the panel", () => {
    expect(wrapper).not.toMatch(/^\s*import\s[^;]*from\s+"\.\/DevToolsPanel"/m);
  });

  it("still renders nothing in production unless forced", () => {
    expect(wrapper).toMatch(/NODE_ENV === "production" && !forceShow/);
  });

  it("the package index reaches the panel only through the wrapper", () => {
    const index = read("index.ts");
    expect(index).not.toMatch(/DevToolsPanel/);
  });
});
