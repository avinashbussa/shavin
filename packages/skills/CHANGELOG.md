# Changelog

All notable changes to `@shavin/skills` are recorded here. After 0.1.0, releases are versioned and described with [Changesets](https://github.com/changesets/changesets).

## 0.1.0 — first npm release

Agent skills and slash commands for @shavin/ui, installed into a project's `.agents/` folder.

### What's in it

- 7 skills (app and webpage building, layout compositions, motion and choreography, visual compositor, Studio; plus the always-loaded core rules) and 9 slash commands for common tasks. Maintainer-only skills stay in the repo and are never installed
- A "Theme for a new site or page" section in the font pairings guide: with colours and fonts still `UNSET`, the agent chooses them from the brief, applies them with `shavin brand`, reports the choice after the first page and offers to change it. A marketing page may run a full-bleed hero as well as a closing call to action; body text stays in the container
- One rule for page width, now in the always-loaded rules as well as the web page skill: every body section uses `Container size="lg"` (72rem) so all content shares one centred column with margins at 1280 and 1440; `xl` is for the nav and footer, `full` for media. `xl` never caps at a 1280px viewport, which left pages with almost no side margin
- `npx @shavin/skills` installs them; `--force` refreshes the marked block in `AGENTS.md`
- A token linter (`bin/lint-tokens.mjs`) that flags hex and raw palette colours
- Guidance for what `validate_code` checks and `autofix_code` fixes for concentric radius, the Studio default frame names, and the `brandSolid` and `focusRing` provider settings; a Hero by audience table and a Storefront recipe; the G6 Product Grid composition; navigation bar guidance for dropdown and mega panels (Popover disclosure, skip link, Drawer on phones)

### Also in this release

Anyone who copied Shavin from the public GitHub repository before this release should read the **Breaking** items.

- **Breaking**: skills and `AGENTS.md` use the `brand` names (`bg-brand`, `--brand`), with no `--brand-primary`. See the `@shavin/ui` entry.
- Bridge docs lead with `init` wiring the dev inspector into Next and Vite; agents are told not to ask users to start the bridge.
- The AGENTS.md section heading is in plain words; `init` still recognises the old headings.
- `shavin-app` six-state rule and patterns, and the Cursor rule, map each state to one component: `EmptyState`, `Button loading`, `FormField` / `FormErrorSummary`, `useToast`, `Button disabledReason`.
