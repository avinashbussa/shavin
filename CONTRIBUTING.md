# Contributing to Shavin

Thanks for helping build Shavin. This covers the open packages: Shavin UI (`@shavin/ui`), the CLI, the MCP server, Shavin Skills and the block schema.

## Licence and sign-off

All open packages are MIT-licensed. By contributing, you agree your contribution is licensed under the same [MIT License](./LICENSE), and you keep the copyright in what you wrote.

Every commit must be signed off under the [Developer Certificate of Origin](https://developercertificate.org/) (DCO). Signing off certifies that you wrote the change, or otherwise have the right to submit it under the project's licence. Add the line with `-s`:

```sh
git commit -s -m "fix(ui): keep Select focus ring inside the panel"
```

which appends:

```
Signed-off-by: Your Name <you@example.com>
```

Use your real name and the email you commit with. A CI check blocks pull requests with unsigned commits. To fix one, run `git commit --amend -s --no-edit` (last commit) or `git rebase --signoff main` (all commits on your branch), then force-push.

**Easiest: let the hook sign for you.** Run this once per clone:

```sh
npm run setup:hooks
```

It points `core.hooksPath` at [`.githooks/`](./.githooks), whose `prepare-commit-msg` hook appends your `Signed-off-by` whenever a commit is missing one — so a forgotten `-s` can't fail the DCO check. `git commit -s` keeps working and is never double-signed; merge commits are left alone.

## Developer Certificate of Origin 1.1

```
By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```

## Getting set up

1. Fork the repository and clone your fork.
2. Use Node 22 (`nvm use` reads `.nvmrc`), then `npm ci` at the root. It installs every workspace from the lockfile.
3. Get your bearings: [`docs/README.md`](docs/README.md) is the documentation index — its "Quick Links for New Contributors" points to where each package lives and which files to read first. [`AGENTS.md`](AGENTS.md) holds the design-system rules.
4. Create a branch: `git checkout -b feat/my-change`.
5. Make your change, then test it (below).
6. Open a pull request against `main` and fill in the template.

## Previewing your change

`npm run playground` opens a local preview at http://localhost:3700, styled like the docs site. It renders every primitive straight from `packages/ui/src`, so you need no build step:

- **Live examples** from the primitive's `<Name>.doc.ts`, each with its source code. An example that fails to render shows the error in place.
- **Props and variants** from `components.json`. The playground re-runs `npm run manifest:gen` when you save a primitive, so the tables follow your edits.
- **Do and Don't, accessibility and keyboard notes**, as they will appear in the docs.
- **A checklist** at the top of each page listing anything still missing, and a coverage table on the overview page.

Saving a component, its `.doc.ts` or `global.css` updates the page as soon as you save. Use the toggle in the header to check light and dark themes. Commit the regenerated `components.json` with your change.

## Testing your change

Run these from the repo root, in this order. CI runs the same checks, so a green run locally means a green PR.

1. `npm run regen` regenerates every generated file (tokens, manifest, skills, `AGENTS.md`/`CLAUDE.md`) in the order they depend on each other. Generated files must be committed with your change: CI fails when one is stale. If `regen` reports changed files, commit them. `npm run regen -- --list` shows the steps.
2. The four checks below.

| Command | What it checks | When |
|---|---|---|
| `npm run verify` | Build, typecheck, token and class lint, generated files are up to date (manifest, tokens, agent files), skills within budget, no private names in docs, command docs match `package.json` | Every change |
| `npm test` | Unit tests: primitives render and pass axe, component contracts, MCP tools, CLI, validator, autofix, synthesis | Every change |
| `npm run eval` | Scores 20 recorded AI outputs (average must stay at 80 or above) and 10 layout syntheses (average must be 95 or above) against the design rules | Changes to rules, the validator, autofix, synthesis or skills |
| `npm run smoke` | Packs every package, installs the tarballs into a fresh Next.js + Tailwind v4 app, runs `init`, `add`, the MCP server and a real Tailwind build | Changes to package exports, the CLI, styles or the MCP server |

Useful while working:

- `npm run build` builds every package; build one on its own with `npm run build:ui`, `build:block-schema`, `build:mcp` or `build:skills` (or `npm run build -w @shavin/<pkg>`). `@shavin/cli` ships raw source, so it has no build.
- `npx vitest tests/unit/a11y.test.tsx` runs one test file; `npm run test:watch` re-runs on save.
- `npm run manifest:gen` regenerates `components.json` after you add or change a primitive's props, `npm run tokens:gen` does the same for `tokens.json`, and `npm run agents:gen` rebuilds `AGENTS.md` and `CLAUDE.md` from `packages/skills/agents/`. `npm run regen` runs all of them in order.
- `node evals/src/runner.mjs --file=path/to/Component.tsx` scores a single file the way the evals do.
- `npm run smoke -- --keep` leaves the throwaway app on disk so you can poke at it.
- `npm run pack` writes the open packages' tarballs to `prod-dist/packages/`. `npm run test:e2e` runs `shavin init` end-to-end through a local Verdaccio registry — the way to test init's own installs against unpublished changes (see [testing locally](docs/testing-locally.md)).

## Windows

The checks run on Windows as well as macOS and Linux, so scripts and tests have to work on all three.

- Build file paths with `path`, and compare paths with forward slashes (`packages/skills/posix-path.mjs` has the helpers).
- Start `npm` through `scripts/lib/spawn-cross.mjs`, which runs `npm.cmd` on Windows. Do not use POSIX-only commands such as `pkill` or `cp -c` in a script that CI runs.
- The repository may be checked out with CRLF line endings. Generators and checks compare normalised text, so a file that only differs in line endings is not a change.
- Vitest allows 5 seconds per test by default. A test that builds or spawns something passes its own timeout as the third argument.

## Pull requests

A good pull request:

- covers one topic, with a description of what changed and why;
- has tests for the change, and updated docs when a component's props or behaviour change;
- includes screenshots for visual changes;
- has every commit signed off (`git commit -s`) and a green CI run.

Maintainers review and merge. A pull request is not accepted when it contains secrets or tokens, names of private packages or services, hand-edited generated files (change their source instead), or unrelated reformatting.

## Design-system rules

Read [`AGENTS.md`](./AGENTS.md) first. The rules that reviews enforce:

- **Semantic tokens only:** `bg-surface`, `text-fg`, `border-hairline` and friends. No hex, `rgb()`, raw Tailwind colour scales or `--n-*` variables outside `global.css`.
- **Radius roles:** controls use `--radius-lg`, containers use `--radius-panel`; nested surfaces follow the concentric formula (`rounded-panel-p3`, `rounded-panel-p5`).
- **Variants with `cva()`**, `className` merged with `cn()`; floating surfaces carry `data-panel`; icons via `<Icon>`, never emoji or glyphs.
- **New components** need the primitive and its export, a `<Name>.doc.ts` (description, examples, Do and Don't, accessibility and keyboard notes; copy `Button.doc.ts`), a clean page in `npm run playground`, a regenerated manifest (`npm run manifest:gen`), and tests (render, axe and contract cases in `tests/unit/`). Maintainers add the docs page and the block registry entry after the change is merged.
- **Theme token changes** go into the Tailwind v3 preset and both v4 theme files together.
- **Agent skills** are edited in `packages/skills/`, never in `.agents/` or `packages/mcp-server/assets/` (both are generated). After a change run `npm run regen`, `npm run skills:check` (cross-references, frontmatter and token budgets) and `npm run agents:check`, and commit what `regen` changed. If a skill goes over its token budget, shorten the text; changing a budget is a maintainer decision.

## What's not open

Some parts of Shavin, such as the hosted services, are proprietary and are not accepted as contributions here; each carries its own `LICENSE`. Maintainers review and merge every pull request. Block authoring is closed for now; block contributions will open up later.

## Trademark

"Shavin" and the Shavin product names are trademarks of Avinash Bussa. The MIT licence covers the code, not the names or logos. Forks are welcome but must not present themselves as Shavin.
