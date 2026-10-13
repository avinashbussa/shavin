# Apply / Configure `@shavin/ui` Theme

Automated recipe to configure theme tokens and mount the `ThemeProvider` in a consumer project.

## Input Argument
$ARGUMENTS (Theme Configuration: e.g., `accentColor="grass" grayColor="zinc" radius="large" scaling="95%"` — optional; if omitted, reads from `SHAVIN.md`)

## Instructions

### 0. Read Project Context (Source of Truth for Theme Values)

- 💡 **If `shavin-mcp` is connected:** Call `get_project_context()` — it reads `SHAVIN.md` and returns the project's current accent, gray color, theme mode, radius, scaling, and panel background. Use those values as the `ThemeProvider` props.
- 💡 **Otherwise (No-MCP):** Read `SHAVIN.md` directly (`view SHAVIN.md` or equivalent file read). Look for the `## 2. Design System Configuration` section for the configured values. If `SHAVIN.md` doesn't exist, use the defaults from `.agents/skills/shavin-core/SHAVIN.template.md` (or the defaults below).
- **If `$ARGUMENTS` provides explicit theme values, those override `SHAVIN.md`** — the user is intentionally changing the theme. Update `SHAVIN.md`'s `## 2. Design System Configuration` section to reflect the new values so future sessions don't revert.
- **If `$ARGUMENTS` is empty and `SHAVIN.md` exists, use `SHAVIN.md`'s values — do NOT apply the template defaults below as if they were the project's intended configuration.**

### 1. Locate Root Layout or App Provider
Find the root entry point (e.g. `src/app/layout.tsx`, `pages/_app.tsx`, or `src/App.tsx`).

### 2. Mount `<ThemeProvider>`
Ensure `ThemeProvider` is imported from `@shavin/ui` and wraps the application body:
```tsx
import { ThemeProvider } from "@shavin/ui";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-canvas text-fg">
        <ThemeProvider
          accentColor="grass"
          grayColor="zinc"
          radius="medium"
          scaling="95%"
          panelBackground="solid"
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```
> **Note:** The values above are template defaults from `SHAVIN.template.md`. Replace them with the values from `SHAVIN.md`'s `## 2. Design System Configuration` (or `$ARGUMENTS` if provided). See Step 0.

### 3. Available Theme Presets
- **Accent Colors**: `grass`, `ruby`, `amber`, `indigo`, `cyan`, `plum`, `crimson`, `sky`, `mint`, `orange`, `blue`, `violet`, `teal`, `lime`, `pink`, `yellow`.
- **Gray Colors**: `gray` (pure neutral), `zinc` (cool tech), `slate` (slate blue), `sand` (warm earth), `olive` (earth green).
- **Radius Presets**: `none` (0px), `small` (subtle), `medium` (standard 12px panel / 8px control), `large` (curved), `full` (pill controls).
- **Scaling**: `90%`, `95%` (dense SaaS), `100%` (standard), `105%`, `110%`.
- **Panel Background**: `solid` (opaque high performance) | `translucent` (glassmorphism blur).

### 4. Verify Dark Mode Support
Ensure root `<html>` or `<body>` toggles the `.dark` class for seamless dual-mode token switching.

### 5. Verification
- 💡 **If `shavin-mcp` is connected:** Call `validate_code({ code })` on the updated layout file to verify token purity.
- 💡 **Otherwise (No-MCP):** Run `npm run tokens:check` and `npm run typecheck` to verify the configuration compiles cleanly.
