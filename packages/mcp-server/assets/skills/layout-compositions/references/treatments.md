# Treatments: how a composition is dressed

A **composition** is the arrangement (columns, spans, order). A **treatment** is the container language wrapped around it: whether items sit in cards, between rules, on flat blocks, edge to edge, or in open space. The same skeleton in a different treatment produces a different style, so one composition serves many styles instead of needing a copy for each.

Contents: 1 The five treatments · 2 Converting between treatments · 3 Mixing rules · 4 Worked example · 5 Which treatment for which style

---

## 1. The five treatments

| Treatment | Container | Dividers | Radius / shadow | Feels like |
|---|---|---|---|---|
| **carded** | `bg-surface` panel with `border-hairline` | Gaps between cards | `rounded-[var(--radius-panel)]`, shadow optional | Product UI, SaaS, dashboards |
| **ruled** | No fill; `border-hairline` rules separate items | Horizontal/vertical rules, whitespace | None | Editorial, documentation, technical |

> **Alignment rule (ruled lists).** When a ruled list has a label/title column next to a description column, the label column MUST use a **fixed width** (`sm:w-72 shrink-0`, `sm:w-56 shrink-0`, etc.) so every description starts at the same x position. Never use `grid-cols-[auto_1fr]` or bare `shrink-0` without a width — content of different lengths (`.gitignore` vs `SHAVIN.md`) will push descriptions out of alignment. Pick the widest label as the column width and apply it uniformly to every row.
| **flat** | `bg-canvas-subtle` fills, no border, no shadow | Colour change or gaps | `rounded-[var(--radius-panel)]`, no shadow | Friendly, modern, calm |
| **full-bleed** | Edge-to-edge media or colour; content overlays it | Section boundaries | None | Cinematic, immersive |
| **open** | No containers at all; space and type do the work | Whitespace, scale | None | Expressive, brand-led, publishing |

## 2. Converting between treatments

Start from the composition's grid (unchanged) and swap the container language:

1. Remove the panel fill, border and shadow (→ ruled/open), or replace them with a fill only (→ flat).
2. Turn card gaps into rules: `divide-x divide-hairline`/`divide-y divide-hairline` or `border-t border-hairline` per item, with the gap becoming padding.
3. Move padding inside items so type keeps the same distance from the rule as it had from the card edge.
4. Where a card gave media a rounded frame, decide: keep the frame (flat), square it (ruled), or let it run to the edge (full-bleed/open).
5. Re-check contrast and focus rings: without card boundaries, hover and focus states carry more weight.

## 3. Mixing rules

- One dominant treatment per page and at most one accent treatment (for example, `ruled` throughout with a `full-bleed` closing CTA).
- Docs pages inside a marketing site switch to `ruled` or `flat`; editorial pages switch to `open` or `ruled`. Tokens stay the same.
- Don't mix carded and flat in adjacent sections; it reads as inconsistency.
- Radius scale is one system: concentric inside padded panels (`foundations.md` §2). Use `rounded-panel-inner` or `rounded-panel-p5` for nested radii.

## 4. Worked example: F1 (3-Column Feature Grid)

Same grid (`base` 1 · `sm` 2 · `lg` 3), same slots (`item-media`, `item-title`, `item-desc`):

| Treatment | Item container | Result |
|---|---|---|
| carded | `bg-surface border border-hairline rounded-[var(--radius-panel)] p-6`, media in an inner `rounded-panel-inner` block | Standard SaaS feature tiles |
| ruled | No panel; `border-t border-hairline pt-6` on each item; no media frame | Editorial "three points" |
| flat | `bg-canvas-subtle rounded-[var(--radius-panel)] p-6`, no border | Softer, friendlier tiles |
| open | No container; large number/label typographic lead; generous gap | Statement-style list |
| full-bleed | Not suitable: choose a different composition (F6 or H4) | |

Some compositions don't support every treatment; the `treatments` list in each composition's metadata says which do.

## 5. Which treatment for which style

| Style | Primary | Accent |
|---|---|---|
| Marketing / SaaS | carded or flat | full-bleed closing CTA (C3) |
| Editorial | open or ruled | full-bleed image breaks |
| Documentation | ruled or flat | carded callouts |
| Structural / app | carded or ruled | none |
| Expressive | open or full-bleed | flat colour blocks |
