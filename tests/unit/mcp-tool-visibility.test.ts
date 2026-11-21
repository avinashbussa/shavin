import { describe, expect, it } from "vitest";
// @ts-expect-error — plain ESM module without types
import { isToolVisible } from "../../packages/mcp-server/src/tool-visibility.mjs";
// @ts-expect-error — plain ESM module without types
import { createMcpServer } from "../../packages/mcp-server/src/server.mjs";

const off = { studioConnected: false, bridgeTabs: 0, env: {} };

describe("tool visibility", () => {
  it("always lists connect_studio and ordinary tools", () => {
    expect(isToolVisible("connect_studio", off)).toBe(true);
    expect(isToolVisible("plan_page", off)).toBe(true);
  });
  it("hides Studio tools until connected", () => {
    for (const n of ["compose_to_canvas", "inject_blocks", "set_studio_theme", "get_studio_state", "clear_studio_canvas", "duplicate_frame", "resize_frame", "export_frame", "disconnect_studio"]) {
      expect(isToolVisible(n, off)).toBe(false);
      expect(isToolVisible(n, { ...off, studioConnected: true })).toBe(true);
    }
  });
  it("hides live-audit tools until a bridge tab connects", () => {
    for (const n of ["get_live_audit", "trigger_live_rescan", "wait_for_live_clean"]) {
      expect(isToolVisible(n, off)).toBe(false);
      expect(isToolVisible(n, { ...off, bridgeTabs: 1 })).toBe(true);
    }
  });
  it("SHAVIN_MCP_ALL_TOOLS=1 lists everything", () => {
    expect(isToolVisible("get_live_audit", { ...off, env: { SHAVIN_MCP_ALL_TOOLS: "1" } })).toBe(true);
  });
  it("server: tools/list hides them, CallTool on a hidden tool still dispatches", async () => {
    const server = createMcpServer();
    const handlers = (server as any)._requestHandlers;
    const list = await handlers.get("tools/list")({ method: "tools/list", params: {} }, {});
    const names = list.tools.map((t: any) => t.name);
    expect(names).toContain("connect_studio");
    expect(names).not.toContain("inject_blocks");
    const res = await handlers.get("tools/call")({ method: "tools/call", params: { name: "get_studio_state", arguments: {} } }, {});
    expect(res.content[0].text).not.toMatch(/^Unknown tool/);
  });

  it("renamed tools: get_studio_schema is listed, the old get_builder_schema still works as an alias and is not listed", async () => {
    const server = createMcpServer();
    const handlers = (server as any)._requestHandlers;
    const list = await handlers.get("tools/list")({ method: "tools/list", params: {} }, {});
    const names = list.tools.map((t: any) => t.name);
    expect(names).toContain("get_studio_schema");
    expect(names).not.toContain("get_builder_schema");
    const call = (name: string) => handlers.get("tools/call")({ method: "tools/call", params: { name, arguments: { category: "hero" } } }, {});
    const fresh = await call("get_studio_schema");
    const old = await call("get_builder_schema");
    expect(old.isError).toBeFalsy();
    expect(old.content[0].text).toBe(fresh.content[0].text);
    expect(old.content[0].text).not.toMatch(/^Unknown tool/);
  });
});
