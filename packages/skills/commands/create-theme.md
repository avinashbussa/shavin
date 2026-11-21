# Create `@shavin/ui` Custom Theme Preset

Automated recipe to add a new theme preset to the DS source (`THEME_PRESETS`).

## Input Argument
$ARGUMENTS (Theme Name, e.g., `emerald-dark`, `cyber-violet`, `minimal-slate`)

## Instructions

### 0. Read Project Context

- 💡 **If `shavin-mcp` is connected:** Call `get_project_context()` to check the project's current theme configuration and confirm the new preset doesn't duplicate an existing one.
- 💡 **Otherwise (No-MCP):** Read `SHAVIN.md` directly for the project's current theme values. If working inside the Shavin repository, check `packages/ui/src/lib/theme-presets.ts` for existing preset names to avoid duplicates.

### 1. Preset Configuration (`packages/ui/src/lib/theme-presets.ts`)
- Add new preset definition to `THEME_PRESETS`.
- Specify `brandColor` (`monochrome`, another named brand colour, or a hex).
- Specify `grayColor` (`gray` (pure neutral), `zinc` (cool tech), `slate` (slate blue), `sand` (warm earth), `olive` (earth green)).
- Specify `radius` scaling preset (`none` | `small` | `medium` | `large` | `full`).
- Specify `scaling` (`90%` | `95%` (dense SaaS) | `100%` (standard) | `105%` | `110%`).
- Specify `panelBackground` (`solid` (opaque high performance) | `translucent` (glassmorphism blur)).

### 2. Mounting via ThemeProvider

```tsx
<ThemeProvider
  brandColor="monochrome"
  grayColor="zinc"
  radius="large"
  scaling="95%"
  panelBackground="solid"
/>
```

> **For consumer projects:** Use `/apply-theme` instead — it reads `SHAVIN.md`'s `## 2. Design System Configuration` and mounts the correct `ThemeProvider` props for the project. This command is for adding presets to the DS source.

### 3. Verification
- Check contrast ratio compliance (WCAG 2.2 AA: 4.5:1 for text such as `--fg`, 3:1 for controls and large text).
- Preview it with `npm run playground` (theme switcher) across a few primitives in light and dark.
- 💡 **If `shavin-mcp` is connected:** Call `validate_code({ code })` on any demo JSX using the new preset.
- 💡 **Otherwise (No-MCP):** Run `npm run tokens:check` and `npm run typecheck` — these are npm scripts, no MCP required.
