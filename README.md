<div align="center">

[![Shavin](https://shavin.cc/assets/og-image.jpg)](https://shavin.cc)

# Shavin

### The React design system built for AI coding agents

**Beta** · React 19 · Next.js · Tailwind v3 and v4

[![License: MIT](https://img.shields.io/badge/license-MIT-gray)](./LICENSE)
[![Node 22](https://img.shields.io/badge/node-22-blue)](./.nvmrc)
[![Primitives](https://img.shields.io/badge/primitives-89-purple)](./packages/ui)
[![MCP](https://img.shields.io/badge/MCP-30%20tools-green)](./packages/mcp-server)

**[Website](https://www.shavin.cc)** · **[Docs](https://docs.shavin.cc)** · **[Contributing](./CONTRIBUTING.md)**

</div>

---

Shavin gives people and AI coding agents the same source of truth: accessible primitives, a strict token system, and machine-readable rules. An agent using Shavin reads the real component APIs, checks its output against the design rules, and fixes violations before you see them, so what it builds looks designed instead of generated.

## What makes it different

| | |
|---|---|
| **Agent-native** | An MCP server exposes real component APIs, tokens and rules, validates and autofixes generated code, and audits the live DOM in your browser. Agent skills teach layout, typography and motion judgement. |
| **Two-tier tokens** | A foundation palette maps to role-based semantic utilities (`bg-surface`, `text-fg`, `border-hairline`). Theme accents and dark mode change without touching component code. |
| **Concentric geometry** | Nested surfaces keep their curves in step: R<sub>inner</sub> = max(floor, R<sub>outer</sub> − P). |
| **Accessible by default** | Built on Radix and WAI-ARIA patterns, with keyboard, focus and screen-reader behaviour covered by axe tests. |
| **Tailwind v3 and v4** | A v3 preset and a v4 `@theme` bridge, each in RGB or OKLCH. |

## Packages

| Package | What it is |
|---|---|
| [`@shavin/ui`](./packages/ui) | 89 React primitives on Radix, two-tier tokens, Tailwind v3 preset and v4 theme ([component docs](https://docs.shavin.cc/components/overview)) |
| [`@shavin/cli`](./packages/cli) | `npx @shavin/cli init` wires Tailwind, styles, ThemeProvider, brand tokens and agent config; `add` installs blocks |
| [`@shavin/mcp`](./packages/mcp-server) | MCP server: component APIs, tokens and rules for agents, code validation and autofix, live browser audit ([overview](https://www.shavin.cc/mcp)) |
| [`@shavin/skills`](./packages/skills) | Design-judgement skills and slash commands for AI coding agents |
| [`@shavin/block-schema`](./packages/block-schema) | Block types, schemas and the open block catalogue ([browse blocks](https://www.shavin.cc/blocks)) |

## Get started

One command sets up an existing React or Next.js app:

```sh
npx @shavin/cli init
```

`init` detects your Tailwind version and package manager, then:

- installs `@shavin/ui`, and offers to add `@shavin/mcp` and `@shavin/skills` for your agents
- wires Tailwind: the preset and content path on v3, the theme bridge and `@source` on v4
- imports the Shavin stylesheet and your brand tokens
- wraps the root layout in `<ThemeProvider>`
- writes `SHAVIN.md`, the project's design brief for people and agents
- installs agent skills into `.agents/` and registers the MCP server for Claude Code, Cursor and VS Code

Add `--oklch` to use the OKLCH colour space (wider gamut, perceptually even accents). Check the wiring at any time with `npx @shavin/cli check`.

### Use it

```tsx
import { Button, Card, Flex, Heading, Text } from "@shavin/ui";

export function Welcome() {
  return (
    <Card padding="md" className="max-w-sm">
      <Flex direction="column" gap="3">
        <Heading as="h3" size="md">Getting started</Heading>
        <Text color="subtle" size="sm">Every colour, radius and space here comes from the token system.</Text>
        <Button variant="solid" size="sm">Explore components</Button>
      </Flex>
    </Card>
  );
}
```

## For AI agents

### MCP server

Add `@shavin/mcp` to your editor (`init` does this for you):

```json
{
  "mcpServers": {
    "shavin": { "command": "npx", "args": ["-y", "@shavin/mcp"] }
  }
}
```

The same block works in `.mcp.json` (Claude Code), `.cursor/mcp.json`, `.vscode/mcp.json` and `claude_desktop_config.json`.

| Group | Tools |
|---|---|
| **Plan the page** | `plan_page`, `check_page` |
| **Learn the system** | `get_components`, `get_tokens`, `get_guidelines`, `get_setup_instructions`, `get_project_context`, `get_builder_schema`, `get_block_template` |
| **Check and fix code** | `validate_code`, `autofix_code`, `audit_source`, `inspect_environment` |
| **Compose** | `synthesize_layout`, `shavin_steer` |
| **Skills** | `list_skills`, `get_skill`, `get_skill_mode`, `install_skills`, `list_commands` |
| **Live browser audit** | `get_live_audit`, `trigger_live_rescan`, `wait_for_live_clean` |
| **Shavin Studio relay** | `connect_studio`, `compose_to_canvas`, `inject_blocks`, `get_studio_state`, `set_studio_theme`, `clear_studio_canvas`, `disconnect_studio` |

### Live browser audit (`:7428`)

When an agent starts `@shavin/mcp`, a bridge starts on port 7428. In development, `<ThemeProvider>` streams DOM snapshots to it, so the agent can see token violations and contrast failures in the page you are looking at, then wait until they reach zero. Run it on its own with `npx @shavin/cli bridge` and open `http://localhost:7428/` for the dashboard.

### Skills and project memory

`npx @shavin/skills` installs design-judgement skills and slash commands into `.agents/`:

| Skill | Use it for |
|---|---|
| `shavin-app` | Dashboards, SaaS apps and admin consoles |
| `shavin-webpage` | Marketing and landing pages |
| `layout-compositions` | 55 section layouts in 9 families, with selection rules |
| `visual-compositor` | Composition, typography, polish and the anti-pattern list (AP-01 to AP-13) |
| `layout-motion` / `layout-choreography` | Restrained motion, then cinematic scroll scenes |
| `shavin-ui-builder` / `shavin-ui-qa-linter` | Building blocks, then auditing tokens and accessibility |
| `shavin-core` | Working inside this repo |

`SHAVIN.md` at your project root records the brand, accent, density and radius choices so every session, human or agent, starts from the same brief. `.shavin/` holds generated prompt context and rollback snapshots.

## Develop

```sh
nvm use            # Node 22
npm install
npm run playground # preview every primitive from source at localhost:3700
npm run verify     # build, typecheck, token lint, manifests, skills
npm test           # unit tests
npm run eval       # score recorded AI output against the design rules
npm run smoke      # install the packed packages into a fresh Next.js + Tailwind v4 app
```

[CONTRIBUTING.md](./CONTRIBUTING.md) explains when to run each one. Agents working in this repo should read [AGENTS.md](./AGENTS.md).

## What isn't here

This repository is the open-source core — the UI primitives, CLI, MCP server, agent skills and the pre-built block catalogue. Some upstream build tooling and hosted services that build on these packages are maintained separately and are not part of this repo. New blocks are authored upstream; the catalogue ships pre-built here.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md), then the [contributor docs](./docs/README.md) for where things live and how to work on each package; every commit needs a DCO sign-off (`git commit -s`).

## Licence

[MIT](./LICENSE) © 2026 Avinash Bussa and Shavin contributors. "Shavin" and the Shavin product names are trademarks of Avinash Bussa.
