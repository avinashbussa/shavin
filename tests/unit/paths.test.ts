import { describe, expect, it } from "vitest";
// @ts-expect-error — plain .mjs module without types
import { posix, relPosix, relSpec } from "../../packages/cli/src/lib/paths.mjs";
// @ts-expect-error — plain .mjs module without types
import { isLegacyFile } from "../../packages/mcp-server/src/tools/enforce.mjs";

describe("paths print with forward slashes on every platform", () => {
  it("turns Windows separators into forward slashes", () => {
    expect(posix("src\\app\\layout.tsx")).toBe("src/app/layout.tsx");
    expect(posix("src/app/layout.tsx")).toBe("src/app/layout.tsx");
  });
  it("relPosix and relSpec give import and @source style paths", () => {
    expect(relPosix("/p", "/p/src/app/globals.css")).toBe("src/app/globals.css");
    expect(relSpec("/p/src/app", "/p/src/app/globals.css")).toBe("./globals.css");
    expect(relSpec("/p/src/app", "/p/.agents")).toBe("../../.agents");
  });
  it("legacy matching accepts backslash paths", () => {
    expect(isLegacyFile("src\\components\\ui\\button.tsx", ["src/components/ui"])).toBe(true);
  });
});
