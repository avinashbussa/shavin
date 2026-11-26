# MCP server

`@shavin/mcp` gives coding agents the component APIs, tokens and rules of `@shavin/ui`, checks the code they write, and connects to a running app through the browser bridge on `:7036`.

```
packages/mcp-server/
  bin/shavin-mcp.mjs     entry point (stdio)
  src/server.mjs         creates the server and registers every tool
  src/tools/*.mjs        tools, grouped by topic (tokens, components, validation, skills, environment, …)
  src/next-steps.mjs     the short "Next:" line added to tool results
  src/bridge/            the :7036 browser bridge
  assets/                bundled copies of components.json, tokens.json, AGENTS.md and the skills
  build.mjs              refreshes assets/
```

## Running it

```sh
npm run mcp                          # start the server over stdio
node packages/mcp-server/build.mjs   # refresh assets/ after changing skills, AGENTS.md or the manifest
```

Restart your MCP client after a change; most clients keep the old process running.

## What `tools/list` shows

The server registers 36 tools but lists 22 by default. The nine Studio tools (all but `connect_studio`) appear once a Studio session is connected, and the five live-audit bridge tools (`get_live_audit`, `trigger_live_rescan`, `wait_for_live_clean`, `await_finding`, `list_findings`) appear once a browser tab reports in to the bridge. A hidden tool can still be called. `SHAVIN_MCP_ALL_TOOLS=1` lists all 36; the rule lives in `src/tool-visibility.mjs`.

The bridge only answers this machine: it refuses a Host header that is not `localhost`, `127.0.0.1`, `[::1]` or `*.localhost`, and a browser request from another origin gets 403. Add a dev origin with `SHAVIN_BRIDGE_ALLOWED_ORIGINS`. `await_finding` and `list_findings` read what a developer sent from the page (the same queue `shavin findings` reads).

## Adding or changing a tool

Each topic file exports a `register…Tool(s)` function that returns `{ schema, handler }` (or a list of them):

```js
export function registerExampleTool(server, COMPONENTS) {
  return {
    schema: {
      name: "get_example",
      description: "Call when … Returns …",
      inputSchema: { type: "object", properties: { name: { type: "string", description: "…" } } },
    },
    handler: async (args) => ({ content: [{ type: "text", text: "…" }] }),
  };
}
```

Then register it in `src/server.mjs` with the others.

- **Description:** start with when an agent should call the tool, then what it returns. Agents choose tools from these sentences.
- **Results:** plain text or markdown, short by default. Offer a `density` argument (`dense` / `full`) when the full answer is long.
- **Next step:** if the tool sits in a workflow, add its follow-up to `src/next-steps.mjs` so agents know what to call next.
- **Data:** read components and tokens from the bundled manifests, never from hard-coded lists, so the tool stays correct when the library changes.
- **Rules in `validate_code`:** a new check needs a clear message that says what to do instead, and test cases for both the warning and a clean example, so it doesn't flag correct code.

## Tests

Tool tests live in `tests/unit/` (`mcp-server.test.ts` and the tool-specific files). Run `npm test`, and `npm run smoke` if you changed how the package starts or what it ships.
