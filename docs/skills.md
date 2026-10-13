# Skills

`packages/skills` is the source of truth for the agent skills and slash commands that `npx @shavin/skills` installs into a project's `.agents/` folder. Never edit an installed `.agents/` copy; edit here.

```
packages/skills/
  skills/<name>/SKILL.md   one folder per skill, plus any reference files it loads on demand
  skills/core-rules.md     rules every skill shares
  commands/<name>.md       slash commands (/create-primitive, /audit-ui, …)
  token-budget.json        size limits per file, per skill and for always-loaded content
  build.mjs                checks structure and budgets
  bin/install.mjs          the installer
```

## Editing a skill

- Keep rules short, specific and testable: name the component, prop or class, and say what to do instead.
- Every rule that mentions an MCP tool also says what to do without MCP (agents may not have it connected).
- Prefer plain lists and tables over blockquotes.
- Don't duplicate a rule across skills; put shared rules in `core-rules.md`.

## Agent files

`AGENTS.md` and `CLAUDE.md` at the repo root, and the copies consumer projects get, are generated from `packages/skills/agents/` (rules, activation guide, layout and pipeline) and `packages/cli/src/templates/CLAUDE.md`. `SHAVIN.md` here, and the one `shavin init` and the MCP `shavin_steer` `init_brain` action write, come from `skills/shavin-core/SHAVIN.template.md`. Edit those sources, then run `npm run agents:gen`. `npm run agents:check` fails if a generated file is stale, if a skill, slash command or MCP tool is missing from the activation guide or the `shavin-core` tool list, or if an agent-facing file states a wrong count (compositions, anti-patterns, MCP tools).

## Budgets

Skills are loaded into an agent's context, so size matters. `token-budget.json` sets the limits, and the always-loaded set has a hard ceiling. Run:

```sh
npm run build -w @shavin/skills   # measures every file and skill against the budgets
npm run skills:check              # the check verify runs; fails on a budget overflow
```

If your change pushes a skill over budget, tighten the wording rather than raising the limit.

## Commands

A command file describes a task end to end (inputs, steps, the checks to run). Keep its steps in the order an agent should run them, and reference skills by name rather than copying their rules.

## Testing a change

`npm run eval` scores recorded agent output against the rules. Run it for any change to skills, rules or the validator; it must stay at 80 or above.
