/**
 * tool-visibility — which tools appear in tools/list.
 *
 * A consumer agent pays for every listed schema on turn 1, so tools that cannot
 * work yet stay out of the list (CallTool still reaches them):
 *   - Studio tools (all but connect_studio) appear once a Studio session is connected.
 *   - Live-audit bridge tools appear once the browser bridge reports a connected tab.
 *   - SHAVIN_MCP_ALL_TOOLS=1 lists everything.
 */
export const STUDIO_TOOLS = new Set([
  "compose_to_canvas", "inject_blocks", "set_studio_theme", "get_studio_state", "clear_studio_canvas", "duplicate_frame", "resize_frame", "export_frame", "disconnect_studio",
]);
export const BRIDGE_TOOLS = new Set(["get_live_audit", "trigger_live_rescan", "wait_for_live_clean", "await_finding", "list_findings"]);

/** @param {{studioConnected: boolean, bridgeTabs: number, env?: Record<string,string|undefined>}} state */
export function isToolVisible(name, { studioConnected, bridgeTabs, env = process.env }) {
  if (env.SHAVIN_MCP_ALL_TOOLS === "1") return true;
  if (STUDIO_TOOLS.has(name)) return !!studioConnected;
  if (BRIDGE_TOOLS.has(name)) return bridgeTabs > 0;
  return true;
}
