# Claude instructions: build UI with Shavin

This project uses `@shavin/ui`. When you are asked for any page, section, screen or component, build it with Shavin without being told to: a plain request like "design a pricing section" or "add a settings page" means Shavin. The design brief and the full rules are imported here, so they are in your context on every turn:

@SHAVIN.md
@AGENTS.md

The Shavin MCP server (`.mcp.json`) is the source of truth for components, tokens, layouts and checks. If it is not connected, say so, then read `.agents/skills/` directly (see "No MCP" below).

## The rule

Every UI element is a `@shavin/ui` component. Never write a raw `<button>`, `<input>`, `<select>`, `<textarea>`, `<table>` or `<dialog>`, and never imitate a component with a hand-styled `<div>` (a "card", "badge", "modal", "tabs" or "toast" built from divs). Never add another UI library (Radix, MUI, Headless UI, Chakra, shadcn, etc.) to new code; existing code is covered under "Coexistence". If no Shavin component fits, say what is missing and compose from `Box`, `Flex`, `Grid`, `Text`, `Heading` and `Icon`.

## Every turn that writes UI

This applies to the first request and to every follow-up ("add a filter", "make it work on mobile", "change the colour"). A small follow-up is not an exception.

1. Re-read `SHAVIN.md` (it is imported above; call `get_project_context` if you need the live values).
   Colours and fonts still `UNSET` there, and the user did not name any: pick them from the brief, apply with `npx @shavin/cli brand --color … --display-font … --body-font … --mode …`, and after the first page tell the user what you chose and offer to change it (`get_skill({ name: "visual-compositor", section: "font-pairings" })`, "Theme for a new site or page"); then `npx @shavin/cli brand --confirm`.
2. `get_components({ name })` for every component you have not already looked up in this conversation. Never write props or markup from memory. `get_tokens()` for colours, spacing, radius and type.
3. New page or section: `plan_page({ brief })`, fill the plan, save it to `.shavin/plans/<page>.json`, `check_page({ plan })`. Changing an existing page: update its plan file to match.
4. Write the code, covering the states below.
5. Before you answer: `validate_code` on every file you changed (fix every error), then `check_page({ targetDir: "." })` for pages, then `audit_source` on the changed paths, then `render_check({ url })` on the running page and look at its screenshots.

Call `inspect_environment` at the start of a session and again after any change to CSS, Tailwind, the root layout or `package.json`. It must report 100%; fix the setup before building.

## States

Every screen, list, form and component you build covers all six states, using these components. These are the default: build them without being asked (the user's request will not mention them).

| State | Build it with |
|---|---|
| First-time (nothing done yet) | `EmptyState kind="first-time"` with one primary `Button` that starts the first task. Multi-step onboarding: `Stepper` |
| Empty (had data, none now) | `EmptyState kind="empty"` with a `Button` that fixes it ("Add order"). Never blank space or the word "None" |
| No results (filter or search matched nothing) | `EmptyState kind="no-results"` echoing the filter, with a "Clear filters" `Button` |
| Loading | `Skeleton` or `SkeletonMimic` shaped like the content (`loading.tsx` for each data route in Next). Content is never a spinner. An action in progress: `Button loading` (optionally `loadingLabel="Saving…"`); long jobs: `useToast().promise` |
| Error | Page or region: `Callout color="danger"` with a retry `Button`. Field: `TextField errorMessage`, or `FormField error` around any other control. Form submit (3+ fields): `FormErrorSummary` at the top, which takes focus |
| Success | Small and reversible: `const { success } = useToast()` (`init` mounts `ToastProvider` inside `ThemeProvider`). A finished flow: `EmptyState kind="success"`. Must stay visible: `Callout color="success"` |
| Disabled | `Button disabledReason="Upgrade to Pro to export"` (focusable, reason in a Tooltip); a field: `FormField disabled` with the reason in `hint`. Disable a submit only while it runs (`loading`) |

Every site and app also has the site-level states: a not-found page (Next: `app/not-found.tsx`) and an error boundary (`app/error.tsx` and `app/global-error.tsx`, with a retry button calling `reset()`), both built with `Heading`, `Text`, `Callout` and `Button`. `check_page` fails a project without them.

Hover, pressed, focus and active states come with the components, which is why nothing interactive is hand-built. Never remove a focus ring (`outline-none` without a `focus-visible` replacement).

Destructive actions (delete, remove, discard) go through `AlertDialog intent="danger"`, never a plain `Dialog` and never a click that acts at once.

## Pick the workflow by task

| Task | Workflow |
|---|---|
| Marketing site, landing page, pricing, portfolio, editorial page | `plan_page({ brief })`, build per section, then `check_page` |
| Dashboard, admin, console, data table | `get_skill({ name: "shavin-app" })`; `AppFrame`, `Sidebar`, `Table`, `StatCard`; high density |
| Settings, forms | `get_skill({ name: "shavin-app" })`, "Settings" pattern; `TextField`, `Select`, `Switch`, one Save, danger zone via `AlertDialog` |
| Sign-in, sign-up, reset | `get_skill({ name: "shavin-app" })`; centred single-column form, `data-composition="none"` |
| Onboarding | `get_skill({ name: "shavin-app" })`; `Stepper`, one decision per step, validate before advancing, a skip path, a done screen |
| One component, block or screen | `get_block_template({ key })` first, then `get_components`. The states and per-turn steps above still apply |
| Scroll-driven, pinned or cinematic motion | Finish the static page first, then `get_skill({ name: "layout-choreography" })` |
| Review or fix existing UI | `audit_source`, `autofix_code`, then `get_skill({ name: "visual-compositor" })` |

For marketing and editorial pages: frame the brief (subject, audience, the page's one job, real content on hand; where the user gave none, write believable fictional content, never copied from a real site or brand, and say in your reply that it is placeholder), plan before code, build each section as `<Section data-composition="<ID>">` (`"none"` for utility screens), write real copy, and keep motion at Tier 0 or Tier 1 unless the brief calls for a signature scene.

For apps: build the shell first (`AppFrame`, `Sidebar`, header), then screens; inputs are at least 16px on mobile; keyboard and focus behaviour comes from the components, do not rebuild it.

## Brand colour

The brand comes from `SHAVIN.md` and `.shavin/config.json`. To change it: a preset name (`brandColor="teal"`) or a custom hex on `ThemeProvider` / `ScopedThemeProvider` (`brandColor="#0f766e"`), or `npx @shavin/cli brand` (writes `brand-tokens.css`). Also update `SHAVIN.md` and `.shavin/config.json` to match. A hex is allowed in those places only; everywhere else use semantic tokens.

Two provider settings you may meet: `brandSolid` chooses the fill under text on the brand (solid `Button`, `Badge`): `accessible` (default, white text clears 4.6:1), `exact` (the exact brand fill) or `perceptual` (APCA; it does not meet WCAG 2 AA on every colour). `focusRing` sets the keyboard ring to `subtle` (default, 1px), `default` (2px) or `strong` (3px). Leave both at their defaults unless the user asks, and never remove the ring.

## Hard rules

- Semantic tokens only: `bg-surface`, `text-fg`, `text-fg-subtle`, `border-hairline`. No hex, no `rgb()`, no `--n-*`, no raw Tailwind palette colours.
- Controls use `--radius-lg`, containers use `--radius-panel`; nested radius follows the concentric formula in `AGENTS.md`. `data-panel` on floating surfaces.
- Import from the `@shavin/ui` root, never deep paths. Variants use `cva()` and `cn()`. Icons are `<Icon>`, never emoji or ad-hoc SVG sets.
- Page body: every body section is `<Container size="lg">` (72rem), so all content shares one centred column with visible margins at 1280 and 1440. `xl` (88rem) is for the nav and footer only; `full` only for media or FX that should bleed.
- Card children go in `<Flex direction="column" gap="3">`. Title is `text-fg`, description is `text-fg-subtle`.
- No AI slop (AP-01 to AP-13, listed in `visual-compositor/anti-patterns`): no glow balls, badge soup, paragraph walls, metric clutter, vacuous copy.
- Responsive by container first: `AppFrame` + `SidebarTrigger` for app shells, `Grid columns="auto"` for card grids, fluid `Heading` sizes. Use `@tablet` / `@mobile` overrides only for what still needs a breakpoint. Check 375px, 768px and desktop.

## Coexistence with other UI libraries

New UI is always Shavin, even in a project that already has shadcn/ui, Radix, MUI or similar.

- Do not rewrite existing components from another library unless the user asks. You may offer to migrate them.
- One library per screen and per component: do not nest a Shavin component inside another library's component or the reverse. A screen that is already built with another library stays that way until it is migrated.
- Files listed as legacy in `SHAVIN.md` are reported by the checks, not failed.
- Third-party registry blocks (shadcn blocks, templates from other sites): adapt them to Shavin components and tokens, or flag them as non-Shavin. Shavin's own blocks from its shadcn-compatible registry are fine as they are.

When migrating or matching a shadcn/ui pattern, map it:

| shadcn/ui | Shavin |
|---|---|
| `Button` | `Button` (`variant`, `tone`, `size`) |
| `Input`, `Label` | `TextField` (`label`, `hint`, `errorMessage`) |
| `Textarea` | `TextArea` |
| `Select` | `Select` (or `Dropdown` for a native select), `Combobox` for search |
| `Checkbox`, `Switch`, `RadioGroup` | `Checkbox`, `Switch`, `RadioGroup` |
| `Dialog`, `AlertDialog` | `Dialog`, `AlertDialog` |
| `Sheet` | `Drawer` |
| `Tabs` | `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent` |
| `Toast`, `Sonner` | `ToastProvider` + `useToast()` |
| `Alert` | `Callout` |
| `Popover`, `Tooltip`, `HoverCard` | `Popover`, `Tooltip`, `HoverCard` |
| `DropdownMenu`, `ContextMenu` | `Menu`, `ContextMenu` |
| `Card` | `Card` (children in a `Flex`) |
| `Table` | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell` |
| `Badge`, `Avatar`, `Skeleton`, `Progress`, `Separator`, `Accordion` | same names |
| `Command` | `Spotlight` |
| `Breadcrumb`, `Pagination` | `Breadcrumbs`, `Pagination` |

## Before you say it is done

1. `validate_code` on every changed file; fix every error and justify any warning.
2. `audit_source` on the changed paths, then `autofix_code` for what it can fix.
3. `check_page({ targetDir: "." })` for pages.
4. Run the project's typecheck and build scripts if they exist in `package.json` (otherwise say they do not exist).
5. Visual review: run the dev server, then `render_check({ url })` on every page you built (the first turn included). Fix every FAIL, then open its screenshots and look at the empty, loading and error states as well as the filled one. Re-check, up to three rounds. If `render_check` reports skipped, screenshot at 375, 768 and 1280 yourself; if no browser is available, say the page was not visually reviewed.
6. Report what you checked and what you could not.

## No MCP

Read `.agents/skills/core-rules.md`, then the skill files the task needs (see the activation matrix in `AGENTS.md`). Look up primitives in `node_modules/@shavin/ui/components.json`, run `npx shavin-lint-tokens` and the project's lint script after, and tell the user the MCP was unavailable.

## Server Components

`@shavin/ui` is a "use client" bundle: components work anywhere, but helpers like `cn`, `get*Url` and `surfaceClass` throw when called from a Server Component. In files without `"use client"`, import them from `@shavin/ui/server`.
