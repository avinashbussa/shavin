# Shavin CLI (`@shavin/cli`)

Sets up Shavin UI in a Next.js or Vite (React 19) project, installs blocks, and keeps brand tokens and agent context in sync.

```sh
npx @shavin/cli init          # or: npx @shavin/cli init --oklch
```

- **Docs:** https://docs.shavin.cc

## What `init` does

1. Installs `@shavin/ui` with your package manager (npm, pnpm, yarn or bun).
2. Detects Tailwind v3 or v4 and wires it: the v3 preset plus `content` entry, or the v4 CSS imports plus `@source`.
3. Imports the Shavin styles into your global CSS.
4. Scaffolds `brand-tokens.css` and its generated Tailwind output, and adds `brand:gen` to `predev` / `prebuild`.
5. Wraps your root layout in `<ThemeProvider>`.
6. Writes `SHAVIN.md`, `AGENTS.md` and `CLAUDE.md` (the project brain for AI agents).
7. Creates `.shavin/` (config, prompt history, snapshots).
8. Optionally installs `@shavin/mcp` and `@shavin/skills`, and writes MCP configs for Cursor, VS Code and Claude Code (`.mcp.json`).
9. Adds VS Code autocomplete data and snippets.

## Commands

| Command | Description |
|---|---|
| `init [--oklch]` | Set up the project (above) |
| `add <slug> [--yes]` | Install a block from the registry (`hero-centered-media`, `@author/slug` or a registry URL). Offers to run `init` when `@shavin/ui` is missing, then installs the npm packages the block needs; `--yes` does both without asking |
| `list [category] [--community]` | Browse blocks |
| `check` (alias `doctor`) `[--json] [--target <dir>] [--render <url>]` | Health check: Node, React and version alignment, Tailwind wiring, `@source`, `ThemeProvider`, agent files. `--render <url>` also loads that page headless (needs a running dev server and Playwright) and confirms Shavin renders styled. Exits 1 when a check fails (warnings pass), so it works in CI |
| `context` | Print a compact (< 300 token) project manifest for AI prompts |
| `brand` | With no flags, generate brand colour tokens from the hex values in `brand-tokens.css` (`--init` scaffolds it, `--check` for CI, `--oklch`). With `--color <preset\|#hex> --display-font <name> --body-font <name> --mode <dark-first\|light-first\|system> [--confirm] [--json]`, apply a theme choice in one step: the `ThemeProvider` props, the `SHAVIN.md` lines and `.shavin/config.json` |
| `findings [--take] [--ack <id>] [--nack <id>] [--state <state>] [--lease <id>] [--target <dir>] [--json]` | Read, take or finish the findings a developer sent from the page, for agents that can run a shell command but have no MCP tools (needs `@shavin/mcp` installed) |
| `bridge [--port <port>]` | Start the agent–browser bridge and live audit dashboard (default port 7036) |
| `publish <file>` | Validate a block against the quality gate and package its manifest |

Common options: `--overwrite` (replace files when adding blocks), `--yes` / `-y` (let `add` run `init` and install packages without asking), `--json` (machine-readable output), `--version` (also `-v`), `--help`.

## Related packages

[`@shavin/ui`](https://www.npmjs.com/package/@shavin/ui) · [`@shavin/mcp`](https://www.npmjs.com/package/@shavin/mcp) · [`@shavin/skills`](https://www.npmjs.com/package/@shavin/skills)

## Licence

MIT © 2026 Avinash Bussa and Shavin contributors. See [LICENSE](./LICENSE).
"Shavin" and the Shavin product names are trademarks of Avinash Bussa.
