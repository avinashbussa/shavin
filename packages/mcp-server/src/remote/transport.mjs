/**
 * Transport-aware tool loading.
 *
 * All 30 MCP tools are defined ONCE in their respective modules.
 * This module controls which tools are available based on the transport:
 *
 *   - stdio (Dev Mode):     ALL 30 tools — local dev has full access
 *   - remote (Remote Mode):  26 tools — everything except the local dev bridge and filesystem tools
 *                            (auth via Supabase JWT)
 *   - rest (REST Relay):    LIMITED tools — browser-only AI gets a
 *                            simplified subset via HTTP POST
 *
 * The Studio relay tools (connect_studio, compose_to_canvas, etc.) are
 * available in all modes — they work via Supabase Realtime regardless
 * of how the AI agent connects.
 */

/**
 * Tool categories for filtering.
 */
export const TOOL_CATEGORIES = {
  // Design system knowledge tools — read-only, always available
  KNOWLEDGE: [
    "get_tokens",
    "get_components",
    "get_builder_schema",
    "get_block_template",
    "get_guidelines",
    "get_setup_instructions",
    "inspect_environment",
    "list_skills",
    "get_skill",
    "get_skill_mode",
    "list_commands",
    "get_project_context",
  ],

  // Layout synthesis tools — always available
  SYNTHESIS: [
    "plan_page",
    "synthesize_layout",
  ],

  // Validation & quality tools — always available
  VALIDATION: [
    "validate_code",
    "autofix_code",
    "audit_source",
    "check_page",
  ],

  // Steering tools — always available
  STEERING: [
    "shavin_steer",
  ],

  // Studio relay tools — always available (work via Supabase Realtime)
  STUDIO_RELAY: [
    "connect_studio",
    "compose_to_canvas",
    "inject_blocks",
    "set_studio_theme",
    "get_studio_state",
    "clear_studio_canvas",
    "disconnect_studio",
  ],

  // Dev bridge tools — only in stdio mode (require localhost:7036)
  DEV_BRIDGE: [
    "get_live_audit",
    "trigger_live_rescan",
    "wait_for_live_clean",
  ],

  // Environment/skills install — only in stdio mode (filesystem access)
  FILESYSTEM: [
    "install_skills",
  ],
};

/**
 * Get the list of tool names available for a given transport.
 *
 * @param {"stdio"|"remote"|"rest"} transport
 * @returns {string[]} Array of enabled tool names
 */
export function getEnabledTools(transport) {
  const alwaysOn = [
    ...TOOL_CATEGORIES.KNOWLEDGE,
    ...TOOL_CATEGORIES.SYNTHESIS,
    ...TOOL_CATEGORIES.VALIDATION,
    ...TOOL_CATEGORIES.STEERING,
    ...TOOL_CATEGORIES.STUDIO_RELAY,
  ];

  switch (transport) {
    case "stdio":
      // Dev mode: everything including dev bridge + filesystem
      return [
        ...alwaysOn,
        ...TOOL_CATEGORIES.DEV_BRIDGE,
        ...TOOL_CATEGORIES.FILESYSTEM,
      ];

    case "remote":
      // Remote MCP: everything except filesystem tools and dev bridge
      // (dev bridge requires localhost:7036 which isn't available remotely)
      return alwaysOn;

    case "rest":
      // REST relay: simplified subset for browser-only AI
      // Knowledge + synthesis + studio relay only
      return [
        ...TOOL_CATEGORIES.KNOWLEDGE,
        ...TOOL_CATEGORIES.SYNTHESIS,
        ...TOOL_CATEGORIES.STUDIO_RELAY,
      ];

    default:
      return alwaysOn;
  }
}

/**
 * Filter a tool registry to only include enabled tools for a transport.
 *
 * @param {Map<string, {schema: object, handler: Function}>} registry
 * @param {"stdio"|"remote"|"rest"} transport
 * @returns {Map<string, {schema: object, handler: Function}>}
 */
export function filterToolRegistry(registry, transport) {
  const enabled = new Set(getEnabledTools(transport));
  const filtered = new Map();

  for (const [name, tool] of registry) {
    if (enabled.has(name)) {
      filtered.set(name, tool);
    }
  }

  return filtered;
}
