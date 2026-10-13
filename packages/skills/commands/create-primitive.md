# Create `@shavin/ui` Primitive Component

Automated recipe to create a new WCAG 2.1 AAA compliant UI primitive inside `@shavin/ui`.

## Input Argument
$ARGUMENTS (Component Name, e.g., `Accordion`, `Rating`, `Kbd`)

## Instructions

### 0. Read Project Context

- 💡 **If `shavin-mcp` is connected:** Call `get_project_context()` to confirm the project's current theme configuration and token setup.
- 💡 **Otherwise (No-MCP):** Read `SHAVIN.md` directly. Also read `AGENTS.md` (its Component Addition Pipeline section is the current checklist).

Execute the primitive pipeline in order:

### 1. Primitive Source (`packages/ui/src/primitives/{ComponentName}/{ComponentName}.tsx`)
- Import `cva` from `class-variance-authority`, `cn` from `../../lib/cn`.
- Use ONLY semantic tokens (`bg-surface`, `text-fg`, `border-hairline`, `bg-accent`, `text-accent`, etc.). ZERO raw hex, `rgb()`, or `--n-*`.
- Controls use `--radius-lg`; floating containers use `--radius-panel` + `data-panel` attribute.
- Define `componentVariants` with `cva()` and merge `className` via `cn()`.
- Create index file: `packages/ui/src/primitives/{ComponentName}/index.ts`.

### 2. Export Registration (`packages/ui/src/index.ts`)
- Export `{ComponentName}` and its prop types from `packages/ui/src/index.ts`.
- Run `npm run manifest:gen` to update `components.json` and `meta.ts`.

### 3. Doc File (`packages/ui/src/primitives/{ComponentName}/{ComponentName}.doc.ts`)
- Describe the component, its guidance (do / don't) and examples. Examples define their own data and state; doc files may only `import type`.
- `npm run manifest:gen` compiles it into `components.json`, which `get_components` and the playground read.

### 4. Preview & Tests
- `npm run playground`, open the component's page and clear its checklist; every example must render.
- Add render, axe and contract cases in `tests/unit/` (`smoke`, `a11y`, `contracts`).
- The docs site page and the Studio block registry are wired by maintainers after merge.

### 5. Quality Verification
- 💡 **If `shavin-mcp` is connected:** Call `validate_code({ code })` to verify token purity of the new primitive.
- 💡 **Otherwise (No-MCP):** Run `node bin/lint-tokens.mjs packages/ui/src/primitives/{ComponentName}/{ComponentName}.tsx` — same regexes, no MCP required.
- Run `npm run verify` to confirm build, typecheck, token linting, and ledger pass >= 90/100.
