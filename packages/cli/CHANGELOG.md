# Changelog

All notable changes to `@shavin/cli` are recorded here. After 0.1.0, releases are versioned and described with [Changesets](https://github.com/changesets/changesets).

## 0.1.0 — first npm release

The `shavin` command: sets up a project for @shavin/ui and checks it.

### What's in it

- `shavin findings` lists, takes (`--take`) and finishes (`--ack`, `--nack`) the findings a developer sent from the page, for an agent that can run a shell command; `--json` for scripts
- `shavin check` visual runs (and the `render_check` MCP tool) hide the dev inspector bar, so it is not measured or shown in screenshots
- `shavin init` for Next.js and Vite, Tailwind 3 and 4, with optional MCP and agent skills setup
- `shavin brand --color <preset|#hex> --display-font <name> --body-font <name> --mode <dark-first|light-first|system> --confirm` applies a theme choice in one step: the `ThemeProvider` props, the `SHAVIN.md` lines and `.shavin/config.json`. A new project starts with the theme `UNSET` and `brandConfirmed: false`, so an agent proposes colours and fonts from the brief and then tells you what it chose
- The `CLAUDE.md` that `shavin init` writes carries the page body width rule: body sections use `Container size="lg"`, `xl` is for the nav and footer
- When `shavin init` cannot set a project up (an unsupported framework, no app at the folder), the message lists what to do in place and no longer ends with a link to the documentation website
- `shavin add <block>` installs a block into your project
- `shavin check` / `doctor`, `context`, `brand` (generates brand tokens with contrast checks) and `bridge`
- Works with npm, pnpm, yarn and bun

### Also in this release

Anyone who copied Shavin from the public GitHub repository before this release should read the **Breaking** items.

- **Breaking**: `init` writes the `brand` names, `tokens.css` plus `base.css` in `layer(base)` on Tailwind 4, and no `--brand-primary`. `shavin brand` migrates a `var(--accent)` alias and reserves the shadcn names. See the `@shavin/ui` entry.
- **Breaking**: `init` supports only Next.js and Vite (with React 19). In any other project (Remix, Astro, SvelteKit, Nuxt, Angular, Vite without React, no app found) it exits 1 before installing or writing anything, and prints what is supported and what to run instead. Other frameworks are planned for later. `shavin doctor` and `inspect_environment` get a `framework` check with the same rule. Frameworks that run on Vite (SvelteKit, React Router 7, Astro and the like) are no longer detected as plain Vite.
- `init` mounts `<ToastProvider>` directly inside `<ThemeProvider>` in the root layout, so `useToast()` works with no setup. `shavin doctor` (and the MCP `inspect_environment`) warn with the exact fix when it is missing.
- The CLAUDE.md template's six-state table names `EmptyState`, `FormField`, `FormErrorSummary`, `Button loading` and `Button disabledReason`.
- **Breaking**: `add` installs two blocks differently from the snapshot: `auth-signin`, `auth-signup`, `auth-sso-first` no longer take a `providers` prop (the buttons are written out, following Google and Apple branding rules), and `pricing-toggle` no longer takes `advisor`.
- `shavin check` / `doctor` (`--json`, `--target`, exit 1 on failure) share one implementation with the MCP `inspect_environment` tool (`@shavin/cli/doctor`).
- `init` handles more projects: finds `app/globals.css`, wraps the Vite entry in `ThemeProvider`, handles Tailwind 3 CommonJS and ES module configs, leaves other theme providers alone, writes VS Code's MCP config in the format VS Code reads, detects bun and shadcn by `components.json`.
- `add` offers to run `init` when `@shavin/ui` is missing, installs a block's npm packages with the project's package manager, and takes `--yes`.
- `engines.node` is `>=22`.
