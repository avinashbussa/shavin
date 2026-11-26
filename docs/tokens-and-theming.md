# Tokens and theming

## Two tiers

1. **Foundation values** (`--n-50` … `--n-950`, brand scales) live only in `packages/ui/src/styles/global.css` and `global-oklch.css`.
2. **Semantic tokens** (`--bg-canvas`, `--bg-surface`, `--fg`, `--fg-muted`, `--hairline`, `--brand`, `--brand-fg`, `--brand-contrast` …) map onto them per theme. Components use only semantic tokens, through Tailwind utilities such as `bg-surface` and `text-fg-muted`.

`npm run lint` (token and class lint) rejects hex, `rgb()`, raw Tailwind colours and `--n-*` outside the style files.

## Where a token change goes

A theme token change must land in every place consumers read it:

| File | Used by |
|---|---|
| `styles/global.css` | Tailwind v3 and v4 consumers (RGB channels) |
| `styles/global-oklch.css` | consumers who opt into OKLCH |
| `tailwind-preset.ts` | Tailwind v3 utilities |
| `styles/theme-v4.css`, `styles/theme-v4-oklch.css` | Tailwind v4 utilities |

Then run `npm run tokens:gen` (it also regenerates the OKLCH files) and commit the results.

In the v4 theme files, never map a token to itself inside `@theme inline` (for example `--shadow-panel: var(--shadow-panel)`): it resolves to nothing. Use an `@utility` rule instead, as the shadow, easing and `rounded-panel` utilities do.

## Theme presets

`ThemeProvider` and `ThemeScript` apply brand, gray, radius and scaling presets from `src/lib/theme-presets.ts`. Theme variables are rendered on the server so the first paint is already themed. New presets go in that file, and need a test in `tests/unit/`.

## Brand-tinted greys (opt in)

The grey scale (`--n-0` … `--n-1000`) is plain neutral by default. A project can opt in to greys that take a very small amount of the brand hue, for a warm canvas under a rust brand or a cool one under teal. Each step keeps the relative luminance of the plain scale, so every contrast pair the scale was checked for (`fg-subtle` on canvas, `border-control`, dark-surface text) still holds; `tests/unit/neutral-tint.test.ts` proves it across 72 hues. Pure white (`--n-0`) and black (`--n-1000`) are never tinted, and grey or monochrome brands keep the plain scale even when opted in.

| Option | Values | Default |
|---|---|---|
| `ThemeProvider neutrals` | `"neutral"`, `"brand"` | `"neutral"`; `"brand"` wins over a gray preset (`grayColor`, or the one a named theme carries) |
| `ThemeProvider neutralsAmount` | `"subtle"`, `"medium"` | `"subtle"` (peak OKLCH chroma 0.007; `"medium"` is 0.015) |

`npx @shavin/cli brand --neutrals brand --neutrals-amount subtle|medium` sets them with the rest of a theme choice; the choice is recorded in `.shavin/config.json` and `SHAVIN.md`. The maths lives in `packages/ui/src/lib/neutral-tint.ts`; `packages/cli/src/lib/neutrals.mjs` is a copy for the CLI, and the same test keeps the two identical in RGB and OKLCH output. Tailwind v3, v4 and the OKLCH files need no change: they read `--n-*` through the semantic tokens, which `themeCss` overrides on the server for the first paint.

If you change the scale or the tint maths, run `tests/unit/neutral-tint.test.ts`. Hard-coded greys in components are a bug: use semantic tokens so the tint reaches them. The fixed code-syntax colours are not greys and are checked against tinted surfaces in the same test.

## Brand tokens

Consumers who bring their own brand colours run `npx @shavin/cli brand --init` to scaffold `brand-tokens.css` (hex input), edit it, then `npx @shavin/cli brand` to write the derived tokens and preset (`--check` fails in CI when they are stale). A project can also apply a choice in one step with `npx @shavin/cli brand --color <preset|#hex> --display-font <name> --body-font <name> --mode <dark-first|light-first|system> --confirm`: it writes the `ThemeProvider` props, the `SHAVIN.md` lines and `.shavin/config.json`. Until that runs with `--confirm`, a new project's theme is `UNSET` and agents are told to choose colours and fonts from the brief and confirm them. If you change the generator, test both RGB and OKLCH output.

## Dark and light

Every semantic token has a value for both themes. Check every change with the theme toggle in `npm run playground`.
