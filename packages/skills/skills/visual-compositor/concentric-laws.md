# Concentric Laws — The Mathematical Foundation

> **Load priority:** ALWAYS loaded. These two laws govern every spatial decision.
> **Token cost:** ~3K tokens.

Every spatial decision in a layout must satisfy two concentric laws simultaneously. They are not optional and not overridable by aesthetic preference.

---

## Law 1 — Concentric Radius

> **R_inner = max(floor, R_outer − P)**, floor = min(radius-lg, radius-panel / 2)
>
> **R_outer** = container radius; **P** = padding between container wall and inner element.

Inner radius = outer minus the padding, so both arcs share one center — that is what makes nested rounding look _right_. The floor keeps padded children from going square (0 only when the theme radius is 0).

**Why it matters:** When R_inner ≥ R_outer, the inner curve bulges out from behind the outer curve. The eye perceives a "corner gap" or a visual collision. It communicates broken structure, not deliberate containment.

### Token Mapping (@shavin/ui)

| Role                        | Token            | Default value        | Use on                                                                                       |
| --------------------------- | ---------------- | -------------------- | -------------------------------------------------------------------------------------------- |
| Large surfaces & containers | `--radius-panel` | 12px (medium preset) | Cards, dialogs, modals, dropdowns, section containers, accordions, accordion items, callouts |
| Controls                    | `--radius-lg`    | 8px (medium preset)  | Single-line controls: buttons, inputs, badges, chips, avatar frames, switches                |
| Tight controls              | `--radius-md`    | 6px                  | Dense list rows, inline tags, toolbar items                                                  |
| Never use on panels         | `rounded-full`   | 9999px               | Only pills (Badge), Avatar, Switch thumb — never panels or container items                   |

> [!CRITICAL]
> **Panel Radius vs Control Radius Role Discipline**:
>
> - Always evaluate whether an element acts as a **control** (single-line button/input) or a **container/surface** (holds multi-line content, lists, or child nodes).
> - Containers (`Card`, `Dialog`, `Popover`, `Menu`, `AccordionItem`, `Callout`, `Inset`) **MUST ALWAYS** use `--radius-panel`.
> - Never assign `--radius-lg` or `--radius-xl` to an `AccordionItem` or multi-line container surface. Doing so causes it to turn into a broken stadium capsule under the "Full" radius preset.

### Concentric Nesting Worked Examples

```
Section (no radius — full-bleed)
  └── Container (max-w, no radius — layout only)
       └── Card [--radius-panel = 12px, p-5 = 20px]
            └── Button [--radius-lg = 8px] ✓ (12 - 20 = negative → clamp to 0 → use token directly)
            └── Input  [--radius-lg = 8px] ✓

Card [--radius-panel = 12px, p-4 = 16px]
  └── Inner chip/badge → 12 - 16 = negative → use --radius-md = 6px ✓

Popover [--radius-panel = 12px, p-3 = 12px]
  └── List item row → 12 - 12 = 0 → use rounded-[var(--radius-md)] ✓

Dialog [--radius-panel = 12px, p-6 = 24px]
  └── Inner card [--radius-lg = 8px] ✓ (padding exceeds radius — inner is just control-sized)
```

### Radius Rules

- **Never use `--radius-panel`** on a control (button, input, badge). It creates a stadium shape at "full" preset.
- **Never use `--radius-lg` / `rounded-lg` literal** — always `rounded-[var(--radius-lg)]`.
- **Never use `rounded-2xl`, `rounded-xl`, `rounded-3xl` literals** — they don't track the ThemeProvider.
- If the concentric formula yields ≤ 0, use `rounded-none` or the next smaller token, not a literal value.

---

## Law 2 — Concentric Spacing

> **Outer containers hold more space than inner elements.**
>
> Padding decreases as you move inward through nesting levels. Space communicates containment — the outer boundary "holds" the inner content.

This is not about aesthetics. It is about perception: if an inner element has more padding than its parent, the eye reads the boundary as inverted. The container appears to be _inside_ its contents.

### The Four Spatial Zones

Every layout exists across four nested spatial zones. Each zone has a valid padding range. Do not skip zones or invert their order.

| Zone          | What it covers                     | Tailwind range                       | Notes                              |
| ------------- | ---------------------------------- | ------------------------------------ | ---------------------------------- |
| **Page**      | Full viewport, section backgrounds | `py-16 md:py-24` to `py-24 md:py-32` | No token — raw Tailwind spacing OK |
| **Container** | Max-width wrapper, centering shell | `px-4 md:px-6 lg:px-10`              | No token — layout utility          |
| **Surface**   | Card, panel, dialog body, sidebar  | `p-4` to `p-8`                       | Maps to `--radius-panel` surfaces  |
| **Element**   | Button, input, row, badge inner    | `px-2 py-1` to `px-4 py-2`           | Maps to `--radius-lg` controls     |

**The rule:** Page > Container > Surface > Element. If a child's padding matches or exceeds its parent's, the spatial hierarchy is broken.

### Vertical Section Rhythm (Web Pages / Marketing)

Major page sections should follow a consistent vertical rhythm. Rhythm = trust.

```
Page section (hero, features, FAQ, footer):
  py-16 md:py-24           ← body (Section size="body")
  py-24 md:py-32           ← hero / statement / CTA (size="hero")
  strip/compact: see layout-compositions/references/foundations.md §3

Section internal header (heading + subtext block):
  mb-10 md:mb-12           ← gap between section header and content grid

Content grid / card grid:
  gap-6                    ← standard card gap
  gap-4                    ← dense / compact grids

Card internal padding:
  p-5 or p-6               ← standard card
  p-4                      ← compact card
  p-8                      ← feature/showcase card

Card internal sections (header → body → footer within a card):
  space-y-3 or space-y-4   ← groups within a card
  border-t + pt-3          ← footer separator within card
```

**Never use arbitrary values** (`py-[73px]`, `mb-[22px]`). If the standard scale doesn't produce the right result, move up or down one step. Arbitrary values break rhythm.

### Vertical Section Rhythm (Web Apps / Dashboards)

Apps have denser, more compressed rhythms than marketing pages.

```
App shell / page wrapper:
  p-4 md:p-6               ← page-level inset

Panel / sidebar:
  p-4                      ← standard sidebar padding
  px-3 py-4                ← tighter nav sidebar

Content area sections:
  space-y-4 to space-y-6   ← vertical separation between page blocks

Card / widget:
  p-4 to p-5               ← standard dashboard card
  p-3                      ← compact metric widget

Form group (label + input + hint):
  space-y-1 to space-y-1.5 ← within a single field
  space-y-4 to space-y-5   ← between fields
  space-y-6 to space-y-8   ← between field groups / sections
```
