# Audit Checklist & Anti-Patterns

> **Load priority:** Loaded at the END of layout tasks for final verification.
> **Token cost:** ~4K tokens.
> **Contains:** Master anti-pattern table (structural/spacing/motion violations) + final audit checklist.
> **Companion:** `visual-compositor/anti-patterns.md` — the consolidated named catalogue (AP-01–AP-13) for AI-slop visual/copywriting anti-patterns with code examples and remediation.

---

## Master Anti-Pattern Table

> **Mode column:** `ALL` = applies to all modes; `S/M` = STRUCTURAL + MARKETING only; `E` = EDITORIAL only.

| Anti-pattern                                                   | Mode | Law / Chapter violated          |
| -------------------------------------------------------------- | :--: | ------------------------------- |
| Inner element has more padding than its parent                 | ALL  | Concentric Spacing Law          |
| `rounded-xl` or `rounded-2xl` as a literal                     | ALL  | Concentric Radius Law           |
| `rounded-full` on a Card, Dialog, or Panel                     | ALL  | Concentric Radius Law           |
| `px-*` on a `<section>` instead of on `<Container>`            | ALL  | Section Architecture            |
| `gap-*` instead of `p-*` inside a surface                      | ALL  | Gap vs Padding                  |
| Same padding value on every nesting level                      | ALL  | No spatial hierarchy            |
| Arbitrary spacing values (`py-[73px]`)                         | ALL  | Rhythm (Ch 08)                  |
| More than 6 div nesting levels                                 | S/M  | Cognitive weight                |
| More than 7 div nesting levels                                 |  E   | Cognitive weight                |
| Card nested inside card without semantic reason                | ALL  | False Containment (Ch 21)       |
| `justify="between"` with one child                             | ALL  | Meaningless alignment           |
| Heading below Badge below Body text (wrong order)              | ALL  | Reading path (Ch 07)            |
| Sibling gap <= internal group gap                              | ALL  | Grouping perception (Ch 03)     |
| Two primary-level elements on one screen                       | ALL  | Hierarchy (Ch 04)               |
| `font-bold` on tertiary / body text                            | ALL  | False primacy (Ch 04)           |
| Center-aligned paragraph or form label                         | ALL  | Reading path (Ch 07)            |
| Inconsistent padding across a card grid                        | ALL  | Rhythm / repeating unit (Ch 08) |
| Wrong density for interface type                               | ALL  | Density (Ch 09)                 |
| h1 below the fold on first load                                | ALL  | First-3-Seconds (Law 1)         |
| CTA more than 320px below the primary heading                  | S/M  | First-3-Seconds (Law 1)         |
| More than 3 focal elements in a hero                           | S/M  | Attention budget (Law 4)        |
| `gap-0` or `space-y-0` between conceptually separate items     | ALL  | Negative space (Law 3)          |
| Border/shadow/bg applied for aesthetics with no semantic group | ALL  | False Containment (Ch 21)       |
| `shadow-panel` on inner element, `shadow-card` on outer        | ALL  | Inverted containment (Ch 21)    |
| Padding reduced on mobile below section minimums               | ALL  | Responsive negative space       |
| Alignment mixed within a repeating element set                 | ALL  | Repeating unit (Ch 08)          |
| **Single italic/colored word in headline ("AI tell")**         | ALL  | Anti-Slop Design Law            |
| **Meaningless numbered markers ("01", "02") on non-sequences** | ALL  | Anti-Slop Design Law            |
| **Status-chip soup (over-badging every card)**                 | ALL  | Distillation & Cognitive Budget (AP-04, AP-08) |
| **Ambient accent glow ball (blur-3xl saturated orb)**         | ALL  | Atmospheric Depth & Assets (AP-02)      |
| **Context-heavy literal stock photo in block/template**        | ALL  | Atmospheric Depth & Assets (AP-03)      |
| **Content dumping / layout bloat (metric grid in hero, etc.)** | ALL  | Layout Restraint & Anti-Bloat (AP-05, AP-06, AP-07)   |
| **Scattered fade-up entrance animations on all cards**         | ALL  | Motion Restraint & Choreography |
| **Warm cream #F4F1EA background cliché on tech products**      | ALL  | Subject Grounding & Palette Intent |
| Editorial motion applied to UI feedback (button press)         |  E   | Motion Architecture             |
| `ease-linear` or `ease-in` on entrance animations              |  E   | Motion Architecture             |
| Stagger delay > 500ms total                                    |  E   | Motion Architecture             |
| `z-[999]` or non-scale z-index values                          |  E   | Z-Axis Scale                    |
| `rotateX/Y` > 6deg on a 3D card                                |  E   | Z-Axis — reads broken           |
| Grid escape on mobile without overflow-hidden wrapper          |  E   | Responsive Depth                |
| Glass effect over a flat solid background (no variation)       |  E   | Glassmorphism Rule              |
| backdrop-blur without fallback for mobile performance          |  E   | Responsive Atmosphere           |
| `100vh` instead of `100dvh` on mobile hero                     |  E   | Hero Scale — chrome cut-off     |
| Video background without a legibility overlay                  |  E   | Contrast — WCAG AA              |
| Parallax ratio > 0.6                                           |  E   | Parallax — reads mechanical     |
| Theatrical void section without a stated cognitive purpose     |  E   | Theatrical space rule           |
| Missing loading states on async content                        | ALL  | Cognitive Layer — State Coverage |
| Empty states showing nothing or generic "Nothing here"         | ALL  | Cognitive Layer — State Coverage |
| Error states without recovery path                             | ALL  | Cognitive Layer — State Coverage |
| Interactive elements indistinguishable from static             | ALL  | Cognitive Layer — Affordances    |
| Relying on hover as the only affordance                        | ALL  | Cognitive Layer — Affordances    |
| Navigation with no active/current state                        | ALL  | Cognitive Layer — Orientation    |
| Generic action labels ("Submit", "OK", "Click here")           | ALL  | Cognitive Layer — Action Hierarchy |
| Destructive actions with same emphasis as primary              | ALL  | Cognitive Layer — Action Hierarchy |
| Critical functionality hidden or not discoverable              | ALL  | Cognitive Layer — Progressive Disclosure |
| All features shown during onboarding                           | ALL  | Cognitive Layer — Progressive Disclosure |

---

## Audit Checklist

Run this before finalising any layout. Each item maps to a specific law or chapter.

### Concentric Laws `[ALL MODES]`

- [ ] **Concentric Radius:** Does every inner element satisfy `R_inner = max(floor, R_outer - P)` (floor = `min(radius-lg, radius-panel / 2)`)?
- [ ] **No literal radius:** Are `rounded-lg`, `rounded-xl`, `rounded-2xl` literals absent (use `rounded-[var(--radius-panel)]` for containers, `rounded-[var(--radius-lg)]` for controls)?
- [ ] **Concentric Spacing:** Does padding decrease as nesting depth increases?
- [ ] **Section padding:** Is `px-*` on `<Container>`, never on `<section>`?

### Hierarchy + Weight `[ALL MODES]`

- [ ] **Single primary:** Is there exactly one primary-level element per screen?
- [ ] **Size ratio:** Is the primary element at least 2× (STRUCTURAL/MARKETING) or 6× (EDITORIAL) the font-size of the nearest secondary?
- [ ] **Weight balance:** Does every `shadow-panel` element have `p-5`+ padding?
- [ ] **No false primacy:** Is `font-bold` absent from tertiary / body-copy elements?

### Alignment + Reading Path `[ALL MODES]`

- [ ] **Center limit:** Is center alignment restricted to ≤ 3 lines of text?
- [ ] **No centered prose:** Are paragraphs, form labels, and list content left-aligned?
- [ ] **Consistent alignment:** Within any repeating element set, is alignment identical?
- [ ] **Section header order:** Overline/Badge → Heading → Text — in that order?

### Rhythm + Density `[ALL MODES]`

- [ ] **Repeating units:** Do all cards / rows / items in a set have identical `p-*`, `gap-*`, and `rounded-*`?
- [ ] **Correct density:** Is the density level appropriate for the interface type?
- [ ] **No density mix:** Is density consistent across the full view?
- [ ] **Rhythm:** Does every section use the standard rhythm (or a deliberate, justified deviation)?

### First-3-Seconds + Negative Space `[ALL MODES]`

- [ ] **Above fold:** Is the h1 fully visible without scrolling on desktop and mobile?
- [ ] **CTA reach:** Is the primary CTA within 320px (desktop) / 240px (mobile) of the h1 bottom? _(relax for EDITORIAL — CTA may be below a dramatic statement)_
- [ ] **Focal count:** Are there ≤ 3 focal elements in the hero? _(≤ 2 on mobile)_
- [ ] **Gap integrity:** Is `gap-0` / `space-y-0` absent between conceptually separate items?
- [ ] **Section minimum:** Is section py at least `py-12` on mobile?

### Containment `[ALL MODES]`

- [ ] **Semantic boundary:** Does every border/bg/shadow answer "what group does this define"?
- [ ] **No false containment:** Are borders and backgrounds absent from purely decorative wrappers?
- [ ] **Hierarchy match:** Is `shadow-panel` used on outer surfaces, `shadow-card` on inner surfaces?
- [ ] **Mobile containment:** Does every boundary still communicate correctly at mobile viewport?

### Editorial & Expressive `[EDITORIAL + HYBRID only]`

- [ ] **Mode declared:** Is the mode identified and declared before writing markup?
- [ ] **Easing vocabulary:** Are editorial animations using `--ease-editorial` or `--ease-reveal` (not `ease-linear` or `ease-in`)?
- [ ] **Stagger limit:** Is total stagger delay ≤ 500ms across siblings?
- [ ] **Scroll trigger threshold:** Is IntersectionObserver threshold set to 0.1–0.2?
- [ ] **reduced-motion:** Is `prefers-reduced-motion` respected for all scroll animations?
- [ ] **clamp() used:** Are hero headlines using `clamp(min, vw, max)` instead of breakpoint steps?
- [ ] **Z-index scale:** Are only the 6 defined z-index steps used (no `z-[999]`)?
- [ ] **3D max rotation:** Is rotateX/Y ≤ 6deg on any 3D transform?
- [ ] **Mobile overflow:** Is `overflow-hidden` wrapping any grid-escape elements on mobile?
- [ ] **Glass background:** Does any glass element have a non-flat visual layer behind it?
- [ ] **Mobile backdrop-blur:** Is `backdrop-blur` reduced or removed on mobile?
- [ ] **Hero uses `100dvh`:** Are editorial heroes using `100dvh` not `100vh`?
- [ ] **Video contrast:** Does every video/image hero have a legibility overlay achieving WCAG AA?
- [ ] **Theatrical void justified:** Can you state what each void section communicates?

### Atmospheric Depth & Asset Choice `[ALL MODES]`

> See also: `anti-patterns.md` AP-01 (Defensive Minimalism), AP-02 (Glow Balls), AP-03 (Stock Photos).

- [ ] **No AI-slop accent glow balls:** Are garish `bg-accent/20 blur-3xl` saturated glow balls replaced by soft, diffuse pastel meshes?
- [ ] **Aesthetic abstraction over literal stock photos:** Are cliché photos (people at laptops, handshakes, office desks) replaced by curated Lummi/Unsplash photography, mesh gradients, video backdrops, or abstract textures (3D only as optional decoration)?
- [ ] **Directional scrims:** Does any text placed over background textures use a semantic token gradient scrim?

### Layout Restraint & Anti-Bloat `[ALL MODES]`

> See also: `anti-patterns.md` AP-04 (Badge Soup), AP-05 (Paragraph Walls), AP-06 (Metric Clutter), AP-07 (Bento Grids), AP-09 (Over-Containment).

- [ ] **Single clear thought:** Does the hero communicate one single punchy value proposition in 4–8 words?
- [ ] **No metric clutter in hero:** Is telemetry/metric data placed in a dedicated section below the fold, rather than jammed into the hero?
- [ ] **Distillation budget:** At most 1 badge (or overline label) and 2 action buttons? No badge soup across sections?
- [ ] **Airy breathing room:** Does the section use generous vertical padding (`py-24 md:py-32` for marketing)?

### Responsive `[ALL MODES]`

- [ ] **Spacing grows:** Does spacing only grow (never shrink) at larger breakpoints?
- [ ] **Mobile density:** Is mobile at least one density level more compact than desktop?
- [ ] **Ratio preserved:** Is the hierarchy size ratio maintained on mobile?
- [ ] **No arbitrary spacing:** Are all spacing values on the 4px Tailwind scale?
- [ ] **Gap vs padding:** Are `gap-*` and `p-*` used for their correct semantic roles at all viewports?
