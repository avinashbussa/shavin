# Foundations: rules shared by every composition

Composition entries only state what is specific to them. Everything here applies to all of them, so it lives in one place. Read it once per page-building task.

Contents: 1 Measure · 2 Concentric radii · 3 Spacing and rhythm · 4 Responsive · 5 Accessibility · 6 Performance · 7 States and stress tests · 8 Motion baseline

---

## 1. Measure (line length)

Measure is set in `ch` (a unit that scales with the font), not in rem or pixels. A fixed `max-w-2xl` (672px) is only right at one specific font size.

| Text role | Target | Notes |
|---|---|---|
| Body / long reading | 60–72ch | Serif can run slightly longer; give serif a little more line-height |
| Lead / sub-headline | 45–58ch | Centred sub-headlines over ~2 lines read badly: left-align or shorten |
| Display headline | Wrap to 2–4 lines | Use `text-balance`; tune by eye, not by a fixed ch |
| Large pull quote | 28–45ch | Measure at the quote's own size |
| Caption / meta | ≤ 50ch | |
| Code | Don't wrap | Scroll horizontally inside its own container |

Use `text-pretty` on body copy to avoid orphans where supported. `max-w-2xl` (42rem / 672px) is the fallback for 16–18px body text.

## 2. Concentric radii

`@shavin/ui` uses a concentric radius system: when a rounded surface sits inside a padded rounded surface, the inner radius should be the outer radius minus the padding, so the curves stay parallel.

**Use `radius="concentric"` on any component nested inside a padded panel** — it auto-computes `R_inner = max(floor, R_outer - P)` (floor = `min(radius-lg, radius-panel / 2)`) by walking up the tree to find the nearest ancestor with a radius + padding.

Manual fallback if needed:
```css
:root { --radius-panel: 20px; }
.panel { border-radius: var(--radius-panel); padding: var(--panel-pad, 24px); }
.panel-inner { border-radius: max(calc(var(--radius-panel) - var(--panel-pad, 24px)), 4px); }
```

Tailwind utilities for manual concentric: `rounded-panel-inner`, `rounded-panel-p3`, `rounded-panel-p5`.

- With padding of 0 (an edge-to-edge image), the child uses the parent's radius.
- Never give parent and child the same radius when padding is non-zero.
- Container surfaces use `rounded-[var(--radius-panel)]`; controls use `rounded-[var(--radius-lg)]`. Never literal `rounded-lg`, `rounded-xl`, `rounded-2xl`.

## 3. Spacing and rhythm

Section padding scale (vertical, per side). This is the canonical table; other skill files defer to it. Older names map as compact→`strip`, default→`body`, spacious→`hero` (`md:py-32`).

| Role | Use | Classes | `<Section size>` |
|---|---|---|---|
| strip | Logo wall, stat bar, announcement | `py-10 md:py-14` | `size="strip"` |
| body | Features, pricing, testimonials, FAQ | `py-16 md:py-24` | `size="body"` |
| hero | Hero, statement, closing CTA | `py-24 md:py-32` | `size="hero"` |
| compact | App / dashboard panels | `py-8 md:py-12` | `size="compact"` |

Floor: never below `py-12` on mobile for marketing sections. Archetype overrides (Apple-style `py-28 md:py-44`, tagline reveal `py-28 md:py-40`) are explicitly scoped exceptions, not defaults.

Inside sections: grid gap 6 (24px) for card grids; 12 (48px) between text and media columns; 20 (80px) between stacked feature rows.

**Rhythm rules**
- No three consecutive sections with the same grid. Three F1s in a row is a template.
- Adjacent sections must differ in at least one of: background, alignment, density, column count.
- Alternate quiet and loud: after a dense section (F2, P2) put a low-density one (T1, C1).
- Container tokens: content ≈ 1120–1280px, reading ≈ 68ch, wide breakout ≈ content + 10%.

## 4. Responsive

- Build mobile-first. Every composition's `Grid:` line lists the breakpoints; follow them.
- Stack order is reading order, and DOM order is importance order. Reorder visually with CSS only, and only where the composition says so.
- Horizontal scroll is allowed only inside a dedicated scroller (rails, tables, code). The page body must never scroll sideways.
- Two-column splits stack at `lg` (1024px), not `md`, unless both columns are light.
- Tabs that don't fit become a scrollable tablist or an accordion.
- Tables scroll inside a wrapper with a visible edge cue and a sticky first column.
- Test widths: 360, 768, 1024, 1440 and one ultra-wide (container must cap).
- Touch targets: aim for ≥ 44px; WCAG 2.2 AA minimum is 24px.
- Safe areas: fixed/sticky bars respect `env(safe-area-inset-*)`.

**Item-count orphans.** If the grid has N columns and the item count leaves a short last row, fix the content or the layout instead of accepting it: 4 items in 3 columns → 2×2; 5 → add one or use F2; 7 → 6 or 8.

## 5. Accessibility baseline

- One `<h1>`; heading levels never skip; landmarks (`header`, `nav`, `main`, `footer`) present and labelled when repeated.
- Skip link first. `:focus-visible` styling on every interactive element, never removed.
- Contrast: 4.5:1 for body text, 3:1 for large text and UI boundaries. Text on media needs a scrim.
- Meaning never depends on colour alone (badges, status, check/cross).
- Images: meaningful `alt`; decorative `alt=""`. Logos that identify a company get the company name.
- Patterns: tabs follow the ARIA tabs pattern (roving tabindex, arrow keys); accordions are heading + button with `aria-expanded`; carousels have real buttons and no autoplay.
- Auto-moving content that lasts over 5 seconds (marquees, video, tickers) needs a way to pause, stop or hide (WCAG 2.2.2). Hover-only pausing is not enough.
- `prefers-reduced-motion: reduce` is honoured everywhere: content is present and complete without animation.
- Forms: visible labels, errors tied with `aria-describedby`, `autocomplete` set.
- Dynamic results (filters, price toggles, copy-to-clipboard) announce changes via a live region.

## 6. Performance

- The hero media is usually the LCP element: eager-load it with high fetch priority and explicit `width`/`height`. Everything below the fold is `loading="lazy"`.
- Reserve space (`aspect-ratio`, fixed heights) so nothing shifts. Use `tabular-nums` for changing numbers.
- Prefer CSS over JS. Animate `transform` and `opacity` only.
- Heavy blur, mesh and backdrop filters cost paint time on phones: pre-render or simplify.
- Web-vitals targets ("good"): LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1.

## 7. States and stress tests

Before delivering, mentally (or actually) run each section through:

| Stress | What to check |
|---|---|
| 3× longer headline / title | Wraps cleanly, no overflow, balance holds |
| Missing image | Layout holds; a fallback surface, not a hole |
| Fewer / more items than the contract | Composition still valid, or switch composition |
| Long translated strings (+30–40%) | Buttons, tabs and nav don't break |
| RTL | Use logical properties (`ps-`, `me-`, `text-start`) |
| Dark mode | Tokens flip cleanly; hairlines and glows still visible |
| No JS / reduced motion | All content visible, nothing waiting on animation |
| Empty / loading / error (forms, filters, search) | Each has a designed state |

## 8. Motion baseline

Default to Tier 0 (no motion). Layouts expose `data-slot` names from their `slots` metadata so motion can attach without changing structure. Use `layout-motion` for Tier 1 and `layout-choreography` for Tier 2. Content must be visible and complete without either.
