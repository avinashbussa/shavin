# Adapter: `@shavin/ui`

Composition entries are written in neutral terms (section, container, grid, stack, panel, heading…). This file maps them to `@shavin/ui` primitives and tokens.

**Source of truth.** Verify prop names and values against the library's own source or docs before relying on one, and never invent a prop. If something isn't listed here, check the package rather than guessing.

Contents: 1 Vocabulary map · 2 Conventions · 3 Tokens · 4 Treatment recipes · 4b Media backgrounds · 5 Concentric radius · 6 Component language · 7 Verify before use

---

## 1. Vocabulary map

| Neutral term | `@shavin/ui` | Notes |
|---|---|---|
| section | `<Section size="…">` | role sizes `"strip"`, `"body"`, `"hero"`, `"compact"` (see `foundations.md` §3) |
| container | `<Container size="…">` | sizes `"2"` (single-card plan), `"3"` (CTA), `"4"` (hero) |
| grid | `<Grid columns="…" stack="auto" gap="…">` | `columns="3" stack="auto"`, `gap="6"`, `gap="12"` |
| stack / row | `<Flex direction align justify gap>` | `direction="column"`, `align="center"`, `justify="between"` |
| panel | `<Card>` | `className="p-6"` etc. |
| heading / body | `<Heading size>` · `<Text size>` | hero display `size="4xl"` (fluid 36→60px) / `size="5xl"` (36→72px); section `size="3xl"` (36→48px), `size="2xl"` (30→36px); no `md:text-*` steps. All Headings apply `text-balance` |
| button | `<Button size variant>` | `size="lg"`, variants `"ghost"`, `"outline"` |
| tabs | `<Tabs defaultValue>` `<TabsList>` `<TabsContent>` | F5, G2 |
| accordion | `<Accordion type="single" collapsible>` `<AccordionItem>` | Q2 |
| avatar | `<Avatar size="md">` | T1, T2 |
| table | `<Table>` `<TableRow>` | P2 |
| segmented filter | `<SegmentedControl>` | G2 |
| badge / chip | `<Badge variant="…">` | overlines, status — verify variants against source; don't default to it for every overline (see `component-language.md` §1) |
| preview frame | `BrowserFrame` (mentioned in H1) | verify it exists |

## 2. Conventions

1. **Equal-column grids use `<Grid columns="…" stack="auto">`**, always: `stack="auto"` collapses 3+ columns → 2 on tablet → 1 on mobile, and 2 columns → 1 on mobile. Never pass a bare `columns` without `stack` on a multi-column layout (a fixed count applies at every width, so three columns on a phone), and don't hand-write `md:grid-cols-*` breakpoint classes on `<Grid>`.
2. **Span-based layouts use plain Tailwind on a `<div>`**: `grid grid-cols-1 md:grid-cols-6 lg:grid-cols-12` plus `col-span-*`. This covers F2, H3, E3, D-shells and anything with unequal columns. Don't mix `<Grid columns={12}>` with Tailwind span classes.
3. **Use a raw `<section className="relative …">`** (instead of `<Section>`) only for full-bleed compositions (H4, C3) and expressive ones (X*) where the container semantics fight the layout. Keep landmarks and `aria-labelledby` on it.
4. **Measure** uses `ch` (see `foundations.md`): `max-w-[68ch]`. `max-w-2xl` is only the fallback.
5. **Slots** are exposed as `data-slot="headline"` etc. on the elements named in each composition's `slots` metadata, so Tier 1/2 motion can attach.
6. **Concentric radius**: use `radius="concentric"` on any nested component inside a padded panel. For manual control, use `rounded-panel-inner`, `rounded-panel-p3`, or `rounded-panel-p5` utilities.
7. **Component language** (overline form, tabs vs. buttons, typographic voice, colour application) is decided per page from `component-language.md` before reaching for `@shavin/ui` primitives — don't let `<Badge>` become the reflex overline or `<Button>` the reflex control for every choice.

## 3. Tokens

| Purpose | Token / class |
|---|---|
| Page background | `bg-canvas` |
| Subtle inset background | `bg-canvas-subtle` |
| Panel surface | `bg-surface` |
| Primary text | `text-fg` |
| Secondary text | `text-fg-subtle` |
| Hairline border | `border-hairline`, `divide-hairline` |
| Accent | `text-accent`, `border-accent` |
| Panel radius (outer) | `rounded-[var(--radius-panel)]` |
| Control radius | `rounded-[var(--radius-lg)]` |
| Panel radius (inner, concentric) | `rounded-panel-inner` |
| Concentric with specific padding | `rounded-panel-p3`, `rounded-panel-p5` |
| Panel shadow | `shadow-panel` |
| Motion duration | `duration-instant`, `duration-fast`, `duration-base`, `duration-slow`, `duration-enter` |
| Utilities | `no-scrollbar`, `animate-marquee` |

Use tokens for every colour so dark mode and re-theming work. Don't hard-code hex values in compositions. Never use `--n-*` foundation tokens outside `global.css`.

## 4. Treatment recipes

| Treatment | Class recipe (starting point) |
|---|---|
| carded | `<Card className="p-6">` (`bg-surface border-hairline rounded-[var(--radius-panel)]`), media in `rounded-panel-inner bg-canvas-subtle` |
| ruled | No `<Card>`. Items: `border-t border-hairline pt-6`. Columns: `divide-x divide-hairline` with padding on items. **Label column must use a fixed width** (`sm:w-72 shrink-0`) so descriptions align across rows — never `grid-cols-[auto_1fr]` or bare `shrink-0` without a width |
| flat | `<div className="bg-canvas-subtle rounded-[var(--radius-panel)] p-6">`, no border, no shadow |
| full-bleed | Raw `<section>`, media absolutely positioned, scrim layer, content in `<Container>` |
| open | No container; use type scale and `gap` for structure |

## 4b. Media backgrounds

`Section`, `Grid`, `Flex`, `Box`, `Container`, and `Card` accept layout bg props. Use them for hero / main media instead of hand-rolled absolute layers.

| Prop | Use |
|---|---|
| `bgImage` | Curated Lummi (`assets.lummi.ai`) / Unsplash / user photo |
| `bgVideo` + `bgPoster` | Pexels loop; `bgPoster` is the poster and the reduced-motion static fallback |
| `bgOverlays` | Comma-separated stack, e.g. `"scrim-left, dark-20"` |
| `surface` | `"dark-always"` / `"light-always"` on the media container so text doesn't flip with page theme |

**Overlay presets:** `mesh-lime`, `mesh-night`, `mesh-mint`, `mesh-peach` (fixed pastel palettes), `mesh-accent` (theme accent); append `-animated` for slow drift that stops under reduced motion (`bgOverlays="mesh-lime-animated, dark-20"`). `scrim-left` = directional scrim for left-aligned copy over media; `fade-canvas` = theme-aware dissolve into the page. Off-centre radial: `radial(at 20% 30%, #8b5cf699/0%, #8b5cf600/45%)`; 8-digit hex alpha works in overlay colours.

**On-media text:** on dark media use `text-fg` for headings and `text-fg-muted` (not `text-fg-subtle`, too faint over media) for subtitles/overlines. Off media the `text-fg-subtle` subtitle rule stands.

```tsx
<Section size="hero" surface="dark-always" bgImage="https://assets.lummi.ai/…" bgOverlays="scrim-left, dark-20">
  <Container size="4">
    <Heading size="5xl">Headline</Heading>
    <Text className="text-fg-muted">Subtitle over media.</Text>
  </Container>
</Section>
```

## 5. Concentric radius

`@shavin/ui` implements concentric radii at the foundation level. The formula: `R_inner = max(floor, R_outer - P)` with `floor = min(radius-lg, radius-panel / 2)` — padded children never collapse to square corners (only a 0-radius theme yields 0).

- **Automatic**: set `radius="concentric"` on any component — it walks up the tree to find the nearest ancestor with a radius + padding value and auto-computes the inner radius.
- **Manual utilities**: `rounded-panel-inner` (uses current `--radius-panel` and `--panel-pad`), `rounded-panel-p3` (assumes p-3 = 12px), `rounded-panel-p5` (assumes p-5 = 20px).
- **Fallback**: if no ancestor has radius or padding, the theme's default radius is used and a warning is surfaced.

Never give parent and child the same radius when padding is non-zero. Container surfaces always use `rounded-[var(--radius-panel)]`; controls use `rounded-[var(--radius-lg)]`.

## 6. Component language

`component-language.md` governs the four repeated micro-choices (overline form, interactive control, typographic voice, colour application) that compound across every section. Decide these per page before reaching for primitives:

- **Overline:** don't reflex `<Badge>` for every eyebrow — plain small-caps label, rule+label, numeral, icon+label, or none are all valid (`component-language.md` §1).
- **Controls:** `<Button>` is for a single action; use `<Tabs>`/`<SegmentedControl>` for 2–5 mutually exclusive views of the same content (`component-language.md` §2).
- **Type voice:** decide weight contrast, family pairing, and scale ratio per page — don't default to the last project's choice (`component-language.md` §3).
- **Colour application:** name a pattern (single accent, duotone, per-section rotation, monochrome+break, gradient ground) — don't reach for the same accent at the same opacity everywhere (`component-language.md` §4).

## 7. Verify before use

Confirm in the package source:

- What pixel widths `Container size` values map to (and whether `"1"` and larger than `"4"` exist).
- `Grid` `columns` is a string variant `"1"`–`"6"` with `stack` (`none` | `auto` | `mobile` | `tablet`); it does not take responsive objects or `columns={12}`.
- The valid `Heading`/`Text` size scale.
- `Section size` role values (`compact`, `strip`, `body`, `hero`) against `Section.tsx` before use.
- The `Table` sub-components beyond `Table` and `TableRow`.
