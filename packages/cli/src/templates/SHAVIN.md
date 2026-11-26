# Shavin Project Design Manifest

This is the project's design brief. Read it at the start of every task that touches UI, including small follow-ups, or call `get_project_context` through the Shavin MCP. Then follow `AGENTS.md`. Edit the values; keep the labels, because the MCP and the skills read them.

## 0. The rules that always apply

- **Every UI element is a `@shavin/ui` component.** No raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>` or `<dialog>`, no hand-styled `<div>` standing in for a card, badge, modal, tabs or toast, and no other UI library in new code. If nothing fits, compose from `Box`, `Flex`, `Grid`, `Text`, `Heading`, `Icon` and say what is missing.
- **Every screen covers all six states by default, without being asked:** first-time, empty, loading (`Skeleton`, never a spinner for content), error, success, disabled, plus a not-found page and an error boundary for the site (components per state: `CLAUDE.md` "States", or the `shavin-app` skill).
- **Every turn that writes UI** looks up components with `get_components`, then runs `validate_code` (and `check_page` for pages) on what it changed.
- **Colours come from semantic tokens.** The only places a hex may appear are `brandColor="#hex"` on `ThemeProvider` / `ScopedThemeProvider`, `.shavin/config.json` and `brand-tokens.css`.
- **Existing UI from another library** (see section 4) is left alone unless the user asks to migrate it. New UI is Shavin.

## 1. Product & Domain Context
- **Product Name**: [project name]
- **Domain**: Web Application
- **Brand Personality**: `UNSET` <!-- three adjectives for this product; UNSET = the agent proposes them from the brief -->

## 2. Design System Configuration
- **Engine**: `@shavin/ui`
- **Primary Brand**: `UNSET` <!-- a preset name or a hex; UNSET = the agent picks one from the brief -->
- **Display / Body Font**: `UNSET` <!-- a pair from the font list; UNSET = the agent picks one from the brief -->
- **Neutral Scale**: `zinc`
- **Theme Mode**: `AUTO` <!-- AUTO = follow the brief: light for editorial and content, dark where the product suits it -->
- **Scaling / Density**: `100%`
- **Base Radius**: `medium`
- **Panel Background**: `solid`

## 3. Site & Mode Defaults
- **Site Type**: `AUTO` <!-- AUTO | MARKETING | APP | DOCS -->
- **Default Visual Mode**: `AUTO` <!-- AUTO | STRUCTURAL | MARKETING | EDITORIAL | HYBRID | DOCS -->

`AUTO` means: decide per request. App screens (dashboard, settings, auth, onboarding, data tables, forms) are `APP` with `STRUCTURAL` mode and use the `shavin-app` skill; landing, pricing and product pages are `MARKETING`; documentation is `DOCS`; essays and articles are `EDITORIAL`. Once the project's main surface is clear, replace `AUTO` with a fixed value here. An explicit request from the user overrides this section for that request only; a follow-up edit to an existing page keeps that page's mode.

## 4. Existing UI from other libraries
- **Other UI library**: `none`
- **Legacy paths**: `none` <!-- comma-separated folders or files that use another library, for example src/components/ui -->

New UI is always Shavin. Files under the legacy paths are not rewritten unless the user asks; the checks report them instead of failing them. Do not mix libraries inside one screen or component.

## 5. Icons and spacing

- Use `<Icon name="Check" size="sm" color="brand" />`. No emoji or Unicode glyphs (✓, ★, →, •) in UI. Sizes and colours: `get_components({ name: "Icon" })`.
- `Card`, `Container` and `<div>` do not space their children. Wrap `Card` children in `<Flex direction="column" gap="3">`.
- Responsive behaviour, breakpoints and the radius rules are in `AGENTS.md`.
