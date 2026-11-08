# Repository map

```
packages/
  ui/              @shavin/ui: primitives, tokens, styles, Tailwind preset
  cli/             @shavin/cli: shavin init / add / list / check / context / bridge / brand / publish
  mcp-server/      @shavin/mcp: MCP server for coding agents, plus the :7036 browser bridge
  skills/          @shavin/skills: agent skills and slash commands (source of truth)
  block-schema/    @shavin/block-schema: block types, schemas and the open block catalogue
playground/        npm run playground: preview every primitive from source on :3700
scripts/           generators and linters used by verify (manifest, tokens, OKLCH, lints, smoke test)
tests/             unit tests (vitest)
evals/             recorded AI output scored against the design rules (npm run eval)
components.json    generated component manifest (also in packages/ui and the MCP assets)
tokens.json        generated token dictionary
AGENTS.md          design rules for people and agents (generated)
SHAVIN.md          project memory file that agents read
```

## Inside `@shavin/ui`

```
packages/ui/src/
  primitives/<Name>/   one folder per primitive: <Name>.tsx, <Name>.doc.ts, index.ts
  lib/                 shared helpers: cn, theme presets, chart kit, surfaces, URL helpers
  styles/              global.css and global-oklch.css (tokens), theme-v4*.css (Tailwind v4), brand token files
  authoring/types.ts   the shape of a <Name>.doc.ts file
  index.ts             the public root export: everything consumers import comes from here
  server.ts            server-safe helpers (cn, URL helpers) for React Server Components
packages/ui/tailwind-preset.ts   the Tailwind v3 preset
```

Consumers import from the package root (`import { Button } from "@shavin/ui"`), never from `primitives/*`. Server Components import helpers from `@shavin/ui/server`.

## Generated files: never edit by hand

| File | Made by | Run |
|---|---|---|
| `components.json` (root, `packages/ui`, `packages/mcp-server/assets`) | `scripts/gen-manifest.mjs` from the primitives and their `.doc.ts` files | `npm run manifest:gen` |
| `packages/ui/src/lib/meta.ts` (`SHAVIN_META`: counts used in copy) | `scripts/gen-manifest.mjs` | `npm run manifest:gen` |
| `packages/ui/src/lib/docs-routes.ts` (docs link per component) | `scripts/gen-manifest.mjs` | `npm run manifest:gen` |
| `tokens.json` | `scripts/gen-tokens.mjs` from `global.css` | `npm run tokens:gen` |
| OKLCH style files | `scripts/gen-oklch.mjs` | part of `npm run tokens:gen` |
| `packages/block-schema/src/generated/*` | the block build | built upstream; see [Block schema](./block-schema.md) |
| `AGENTS.md`, `CLAUDE.md`, `packages/skills/AGENTS.md`, `packages/cli/src/templates/AGENTS.md`, `SHAVIN.md`, `packages/cli/src/templates/SHAVIN.md` | `scripts/gen-agents.mjs` from `packages/skills/agents/`, the CLI's `CLAUDE.md` template and `shavin-core/SHAVIN.template.md` | `npm run agents:gen` |
| `.agents/` in a consumer project | `@shavin/skills` installer | `npx @shavin/skills` |

`npm run regen` runs every generator above in the right order. `npm run verify` fails when a generated file is out of date, so commit the regenerated files with your change.

## Counts in prose

Never type the number of primitives or MCP tools in code. Use `SHAVIN_META.primitiveCount` and `SHAVIN_META.mcpToolCount`. In markdown, `npm run manifest:check` fails if a written "N primitives" differs from the manifest.
