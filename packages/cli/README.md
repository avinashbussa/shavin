# Shavin CLI (`@shavin/cli`)

Sets up Shavin UI in a React or Next.js project, installs blocks, and keeps brand tokens and agent context in sync.

```sh
npx @shavin/cli init          # or: npx @shavin/cli init --oklch
```

- **Docs:** https://docs.shavin.cc/start/getting-started

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
| `add <slug>` | Install a block from the registry (`hero-centered-media`, `@author/slug` or a registry URL) |
| `list [category] [--community]` | Browse blocks |
| `check` | Audit setup: Tailwind wiring, `@source`, styles, `ThemeProvider` |
| `context` | Print a compact (< 300 token) project manifest for AI prompts |
| `brand [--init] [--check] [--oklch]` | Generate brand colour tokens from the hex values in `brand-tokens.css` |
| `bridge [--port <port>]` | Start the agent–browser bridge and live audit dashboard (default port 7428) |
| `publish <file>` | Validate a block against the quality gate and package its manifest |

Common options: `--overwrite` (replace files when adding blocks), `--json` (machine-readable output), `--help`.

## Related packages

[`@shavin/ui`](https://www.npmjs.com/package/@shavin/ui) · [`@shavin/mcp`](https://www.npmjs.com/package/@shavin/mcp) · [`@shavin/skills`](https://www.npmjs.com/package/@shavin/skills)

## Licence

MIT © 2026 Avinash Bussa and Shavin contributors. See [LICENSE](./LICENSE).
"Shavin" and the Shavin product names are trademarks of Avinash Bussa.
