# CLI

`@shavin/cli` sets up and checks projects that use Shavin.

| Command | What it does |
|---|---|
| `shavin init` | Detects the framework and Tailwind version, wires styles and the preset or v4 theme, wraps the app in `ThemeProvider`, writes `SHAVIN.md`, agent config and `.agents/`, and offers the MCP server |
| `shavin add <block>` | Copies an open block into `components/blocks` (`src/components/blocks` when the project has a `src` folder; `--overwrite` replaces an existing file). If `@shavin/ui` is missing it offers to run `init` first; if the wiring is incomplete (Tailwind theme import, the v4 `@source`, `ThemeProvider`) it offers to repair it. After writing the block it installs any npm package the block needs that the project lacks, or declares below the block's minimum (such as an older `@shavin/ui`), with the project's package manager. On a terminal each step asks first; `--yes` runs them without asking, and without `--yes` a non-interactive run only prints the commands |
| `shavin list` | Lists the open blocks |
| `shavin check` (alias `doctor`) | Read-only health check: environment (Node, React, package versions), setup (stylesheet imports, Tailwind 3 preset or Tailwind 4 theme and `@source`, `ThemeProvider`) and agent files (AGENTS.md, SHAVIN.md, MCP config, skills). Each problem has a fix. `--render <url>` also loads that page headless (needs a running dev server and Playwright) and confirms Shavin renders styled. `--json` prints `{ apiVersion, type: "doctor", data }`; exits 1 when a check fails, so it can run in CI |
| `shavin context` | Prints the project context agents read |
| `shavin bridge` | Starts the `:7036` browser bridge |
| `shavin brand` | Two flows. **Apply a choice:** `--color <preset\|#hex> --display-font <name> --body-font <name> --mode <dark-first\|light-first\|system> [--confirm] [--json]` writes the `ThemeProvider` props, the `SHAVIN.md` lines and `.shavin/config.json` in one step; a new project starts with the theme `UNSET` until `--confirm`. **Brand tokens:** with no flags it generates brand tokens and the preset from `brand-tokens.css` (`--init` scaffolds it, `--check` for CI, `--oklch` for OKLCH) |
| `shavin findings` | Reads the findings a developer sent from the page, for an agent that can run a shell command: lists them (`--state pending\|leased\|acked\|withdrawn\|all`), `--take` leases the next one for two minutes, `--ack <id>` marks it done, `--nack <id>` puts it back, `--lease <leaseId>` names the lease, `--target <dir>` picks the project, `--json` for scripts. Needs `@shavin/mcp` installed |
| `shavin publish <file>` | Validates a block against the quality gate and writes its manifest as `<slug>.block.json` in the current folder |
| `shavin --version` (`-v`) | Prints the CLI version |

### Installing blocks with the shadcn CLI

Every open block is also published as a [shadcn registry item](https://ui.shadcn.com/docs/registry/registry-item-json) at `https://shavin.cc/r/shadcn/<slug>.json`, so projects that already use the shadcn CLI can install it without `@shavin/cli`:

```bash
npx shadcn@latest add https://shavin.cc/r/shadcn/hero-centered-media.json
```

Or register the namespace once in `components.json`:

```json
{ "registries": { "@shavin": "https://shavin.cc/r/shadcn/{name}.json" } }
```

then `npx shadcn@latest add @shavin/hero-centered-media`, `npx shadcn@latest search @shavin`. The file lands in your `components/blocks/` folder and shadcn installs `@shavin/ui`. shadcn does not wire the Shavin theme, so a project that has not run `npx @shavin/cli init` gets a reminder to do that.

```
packages/cli/
  bin/shavin.mjs            entry point
  src/index.mjs             command routing
  src/commands/<name>.mjs   one file per command
  src/templates/            files init writes (AGENTS.md, CLAUDE.md, SHAVIN.md and the vscode/ snippets and HTML data)
  src/ui.mjs                terminal output helpers
```

## Working on a command

- Never overwrite a user's file without asking or a flag. When `init` edits a file (a layout, a config), it makes the smallest change it can and says what it changed.
- Support Tailwind v3 and v4, and Next.js App Router, Pages Router and Vite (with React) projects. Those two frameworks are all `init` supports today; it must fail, before writing anything, on any other (the gate is `checkFrameworkSupport` in `src/lib/init-detect.mjs`, mirrored by the `framework` check in `doctor.mjs`). Do not add a framework without detection, a wiring path, a smoke test and a test for both.
- `src/templates/vscode/*` are generated from the component manifest; report problems in them as issues rather than editing the files.
- `check`, `add` and the MCP `inspect_environment` tool share one checker, `src/lib/doctor.mjs` (pure, no writes; exported as `@shavin/cli/doctor`). `add` reads only the setup and package results through `src/lib/inspect-setup.mjs`. Change the rules in `doctor.mjs`, so all three stay in step.
- `init` and `add` share `src/lib/package-manager.mjs` for package-manager detection, install commands and the minimum-version check.

## Testing

```sh
cd ../my-test-app && node <repo>/packages/cli/bin/shavin.mjs check   # run a command straight from source (commands act on the current folder)
npm test                                                     # tests/cli.test.ts
npm run smoke                                                # init + add in a fresh Next.js + Tailwind v4 app
```

`npm run smoke -- --keep` leaves the test app on disk so you can inspect what `init` wrote.
