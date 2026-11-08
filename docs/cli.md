# CLI

`@shavin/cli` sets up and checks projects that use Shavin.

| Command | What it does |
|---|---|
| `shavin init` | Detects the framework and Tailwind version, wires styles and the preset or v4 theme, wraps the app in `ThemeProvider`, writes `SHAVIN.md`, agent config and `.agents/`, and offers the MCP server |
| `shavin add <block>` | Copies an open block into `src/components/blocks` (`--dir` picks another folder, `--overwrite` replaces an existing file). Stops if `@shavin/ui` is missing; if it is present but the wiring is incomplete (Tailwind theme import, the v4 `@source`, `ThemeProvider`), it warns and — on a terminal — offers to repair with `init` before continuing |
| `shavin list` | Lists the open blocks |
| `shavin check` | Audits a project's setup and reports what is missing or misconfigured |
| `shavin context` | Prints the project context agents read |
| `shavin bridge` | Starts the `:7036` browser bridge |
| `shavin brand` | Generates brand tokens and the preset from `brand-tokens.css` (`--init` scaffolds it, `--check` for CI) |
| `shavin publish` | Packaging helper used by maintainers |

```
packages/cli/
  bin/shavin.mjs            entry point
  src/index.mjs             command routing
  src/commands/<name>.mjs   one file per command
  src/templates/            files init writes (CLAUDE.md, VS Code snippets and HTML data)
  src/ui.mjs                terminal output helpers
```

## Working on a command

- Never overwrite a user's file without asking or a flag. When `init` edits a file (a layout, a config), it makes the smallest change it can and says what it changed.
- Support Tailwind v3 and v4, and Next.js App Router, Pages Router and Vite projects.
- `src/templates/vscode/*` are generated from the component manifest; report problems in them as issues rather than editing the files.
- `add` and `check` share one setup detector, `src/lib/inspect-setup.mjs` (pure, no writes). Change the wiring rules there, not in either command, so both stay in step.

## Testing

```sh
cd ../my-test-app && node <repo>/packages/cli/bin/shavin.mjs check   # run a command straight from source (commands act on the current folder)
npm test                                                     # tests/cli.test.ts
npm run smoke                                                # init + add in a fresh Next.js + Tailwind v4 app
```

`npm run smoke -- --keep` leaves the test app on disk so you can inspect what `init` wrote.
