# Tokens and theming

## Two tiers

1. **Foundation values** (`--n-50` … `--n-950`, accent scales) live only in `packages/ui/src/styles/global.css` and `global-oklch.css`.
2. **Semantic tokens** (`--bg-canvas`, `--bg-surface`, `--fg`, `--fg-muted`, `--hairline`, `--accent`, `--accent-fg`, `--accent-contrast` …) map onto them per theme. Components use only semantic tokens, through Tailwind utilities such as `bg-surface` and `text-fg-muted`.

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

`ThemeProvider` and `ThemeScript` apply accent, gray, radius and scaling presets from `src/lib/theme-presets.ts`. Theme variables are rendered on the server so the first paint is already themed. New presets go in that file, and need a test in `tests/unit/`.

## Brand tokens

Consumers who bring their own brand colours run `npx shavin brand --init` to scaffold `brand-tokens.css` (hex input), edit it, then `npx shavin brand` to write the derived tokens and preset (`--check` fails in CI when they are stale). If you change the generator, test both RGB and OKLCH output.

## Dark and light

Every semantic token has a value for both themes. Check every change with the theme toggle in `npm run playground`.
