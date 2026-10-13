# Shavin Skills (`@shavin/skills`)

Design-judgement skills for AI coding agents working with Shavin UI: the token rules, concentric geometry, typography, spacing, layout compositions, motion and the anti-slop catalogue that make agent output look designed instead of generated. Plain markdown, no runtime dependencies, and they work with or without the Shavin MCP server.

- **Docs:** https://docs.shavin.cc/start/working-with-ai
- **Requires:** Node 22+ (for the installer and linter)

## Install

```sh
npx @shavin/skills                       # copies skills to .agents/skills/ and commands to .agents/commands/
npx @shavin/skills --force               # overwrite existing files
npx @shavin/skills --target ./apps/web   # install into another project
```

`npx @shavin/cli init` offers to do this for you.

## What's inside

| Skill | Use it for |
|---|---|
| `core-rules.md` | Always loaded: token compliance, radius roles, typography, icons, anti-slop basics |
| `visual-compositor/` | Spacing, typography, motion, polish, the AP-01–AP-13 anti-pattern catalogue, audit checklist |
| `layout-compositions/` | 50+ page and section compositions across 9 families, with selection rules and page recipes |
| `layout-motion/`, `layout-choreography/` | Restrained UI motion, and cinematic scroll-driven scenes |
| `shavin-webpage/` | Marketing and landing pages |
| `shavin-app/` | SaaS apps, dashboards, tables |
| `shavin-ui-builder/`, `shavin-ui-qa-linter/` | Block building and design QA |
| `shavin-core/` | Contributing to the Shavin monorepo itself |

Slash commands: `/create-screen`, `/create-block`, `/create-primitive`, `/create-theme`, `/apply-theme`, `/audit-ui`, `/compose-page`, `/audit-layout`, `/add-composition`.

## Without the MCP server

Agents read the files directly from `.agents/skills/`. For token linting, the package ships a standalone checker that mirrors the MCP `validate_code` tool:

```sh
npx -p @shavin/skills shavin-lint-tokens "src/**/*.tsx"
```

## Maintainers

Edit skills here in `packages/skills/`, never in `.agents/` (compiled output). `npm run skills:check` validates cross-references, frontmatter and token budgets; `npm run skills:build` deploys. Background on past fixes: [MAINTAINERS.md](./MAINTAINERS.md).

## Licence

MIT © 2026 Avinash Bussa and Shavin contributors. See [LICENSE](./LICENSE).
"Shavin" and the Shavin product names are trademarks of Avinash Bussa.
