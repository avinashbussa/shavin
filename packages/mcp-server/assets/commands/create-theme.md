# Create `@shavin/ui` Custom Theme Preset

Automated recipe to add a new theme preset to the DS source (`THEME_PRESETS`).

## Input Argument
$ARGUMENTS (Theme Name, e.g., `emerald-dark`, `cyber-violet`, `minimal-slate`)

## Instructions

### 0. Read Project Context

- 💡 **If `shavin-mcp` is connected:** Call `get_project_context()` to check the project's current theme configuration and confirm the new preset doesn't duplicate an existing one.
- 💡 **Otherwise (No-MCP):** Read `SHAVIN.md` directly for the project's current theme values. If working inside the monorepo, check `packages/ui/src/lib/theme-presets.ts` for existing preset names to avoid duplicates.

### 1. Preset Configuration (`packages/ui/src/lib/theme-presets.ts`)
- Add new preset definition to `THEME_PRESETS`.
- Specify `accentColor` (`grass`, `ruby`, `amber`, `indigo`, `cyan`, `plum`, `crimson`, `sky`, `mint`, `orange`, `blue`, `violet`, `teal`, `lime`, `pink`, `yellow`).
- Specify `grayColor` (`gray` (pure neutral), `zinc` (cool tech), `slate` (slate blue), `sand` (warm earth), `olive` (earth green)).
- Specify `radius` scaling preset (`none` | `small` | `medium` | `large` | `full`).
- Specify `scaling` (`90%` | `95%` (dense SaaS) | `100%` (standard) | `105%` | `110%`).
- Specify `panelBackground` (`solid` (opaque high performance) | `translucent` (glassmorphism blur)).

### 2. Mounting via ThemeProvider

```tsx
<ThemeProvider
  accentColor="grass"
  grayColor="zinc"
  radius="large"
  scaling="95%"
  panelBackground="solid"
/>
```

> **For consumer projects:** Use `/apply-theme` instead — it reads `SHAVIN.md`'s `## 2. Design System Configuration` and mounts the correct `ThemeProvider` props for the project. This command is for adding presets to the DS source.

### 3. Verification
- Check contrast ratio compliance (WCAG 2.1 AAA for text `--fg`, AA for controls).
- Preview it with `npm run playground` (theme switcher) across a few primitives in light and dark.
- 💡 **If `shavin-mcp` is connected:** Call `validate_code({ code })` on any demo JSX using the new preset.
- 💡 **Otherwise (No-MCP):** Run `npm run tokens:check` and `npm run typecheck` — these are npm scripts, no MCP required.
