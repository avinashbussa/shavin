# Shavin MCP (`@shavin/mcp`)

A Model Context Protocol server that gives AI coding agents (Claude Code, Cursor, Windsurf, VS Code, Claude Desktop) the real Shavin UI component APIs, design tokens and rules, so they stop guessing from training data, plus tools to validate and fix what they write.

- **Docs:** https://docs.shavin.cc

## Connect it

**Claude Code** (`.mcp.json` in your project), **Cursor** (`.cursor/mcp.json`) or **Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "shavin": { "command": "npx", "args": ["-y", "@shavin/mcp"] }
  }
}
```

`npx @shavin/cli init` writes these files for you.

## Tools (36)

| Group | Tools |
|---|---|
| Tokens & components | `get_tokens`, `get_components`, `get_project_context` |
| Page planning | `plan_page`, `check_page` |
| Blocks & layout | `get_studio_schema`, `get_block_template`, `synthesize_layout` |
| Quality | `validate_code`, `autofix_code`, `audit_source`, `inspect_environment`, `render_check`, `shavin_steer` |
| Guidelines & setup | `get_guidelines`, `get_setup_instructions` |
| Skills | `list_skills`, `get_skill`, `get_skill_mode`, `install_skills`, `list_commands` |
| Live browser audit | `get_live_audit`, `trigger_live_rescan`, `wait_for_live_clean` |
| Findings from the page | `await_finding`, `list_findings` |
| Shavin Studio canvas | `connect_studio`, `compose_to_canvas`, `inject_blocks`, `get_studio_state`, `set_studio_theme`, `clear_studio_canvas`, `duplicate_frame`, `resize_frame`, `export_frame`, `disconnect_studio` |

A typical agent loop: `plan_page` → fill and `check_page` the plan → look up components and tokens → write each section as `<Section data-composition="<ID>">` → `validate_code` (or `autofix_code`) → `check_page({ targetDir })` → `wait_for_live_clean` against the running page. Every result ends with a one-line "Next:" pointer to the following step.

## Live browser bridge

The server starts a local bridge on `http://127.0.0.1:7036`. In development, `<ThemeProvider>` mounts a dev inspector that streams token-compliance and contrast results from your open tabs, which the `*_live_*` tools read. Open `http://localhost:7036/` for the dashboard.

The bridge only answers this machine. It refuses a Host header that is not `localhost`, `127.0.0.1`, `[::1]` or `*.localhost`, and a browser request from any other origin gets 403. Dev servers on `localhost`, `127.0.0.1`, `[::1]` or `*.localhost` (any port) work as before. If your app runs on another origin, add it: `SHAVIN_BRIDGE_ALLOWED_ORIGINS=https://my-dev.example npm run dev`.

`shavin init` also wires the bridge into your Next or Vite config (`withShavinBridge` from `@shavin/mcp/next`, `shavinBridge()` from `@shavin/mcp/vite`), so it starts with `npm run dev`. Set `SHAVIN_BRIDGE=0` to opt out. The commands below are for other setups:

```sh
npx @shavin/mcp --bridge          # bridge + dashboard only
npx @shavin/mcp --remote          # streamable HTTP transport
npx @shavin/mcp --hybrid          # stdio + HTTP
npx @shavin/mcp --bridge --port 7430
```

## Related packages

[`@shavin/ui`](https://www.npmjs.com/package/@shavin/ui) · [`@shavin/skills`](https://www.npmjs.com/package/@shavin/skills) · [`@shavin/cli`](https://www.npmjs.com/package/@shavin/cli)

## Licence

MIT © 2026 Avinash Bussa and Shavin contributors. See [LICENSE](./LICENSE).
"Shavin" and the Shavin product names are trademarks of Avinash Bussa.
