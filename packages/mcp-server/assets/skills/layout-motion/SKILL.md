---
name: layout-motion
description: >
  Clean, smooth, restrained motion for web layouts (Tier 1) — motion tokens (durations, easings,
  distances, stagger), scroll reveals, hover and press states, tab and accordion transitions,
  count-ups, marquees with pause controls, sticky-header effects, scroll-spy and light parallax,
  all with reduced-motion fallbacks. Use whenever the user wants to add animation, transitions,
  reveals, hover effects, micro-interactions, count-up numbers, marquees or "smooth, subtle,
  polished motion" to a page, section or component, including "make this feel more
  premium/alive", and whenever a layout-compositions page needs motion. Not for pinned scenes,
  scroll-scrubbed timelines, page transitions, WebGL or cursor choreography — use
  layout-choreography for those.
sections:
  - id: tokens
    file: references/tokens.md
    description: "Motion tokens — durations, distances, stagger, reduced-motion safety net (~1K tokens)"
  - id: presets
    file: references/presets.md
    description: "11 tier-1 motion presets with code and reduced-motion paths (~2.5K tokens)"
  - id: composition-motion-map
    file: references/composition-motion-map.md
    description: "Which preset per composition ID, with escalation markers (~1K tokens)"
---

- **Token-efficient usage:** This skill is modular. For specific rules, call:
> - `get_skill({ name: "layout-motion", section: "tokens" })` — motion token reference
> - `get_skill({ name: "layout-motion", section: "presets" })` — 11 tier-1 preset recipes
> - `get_skill({ name: "layout-motion", section: "composition-motion-map" })` — which preset per composition
>
> **Core motion tokens:** Already defined in `@shavin/ui` `global.css` (`--dur-*`, `--dist-*`, `--stagger`).
> See also `visual-compositor/motion-and-physics.md` for the canonical token reference and The Frequency Law.

# Layout Motion (Tier 1)

Tier 1 is motion that supports a layout without changing it: entrances, state changes, and small moments of emphasis. It is what most "clean, smooth" sites actually need. It sits on top of the static layout (Tier 0) and below choreography (Tier 2).

## Principles

1. **Motion answers something.** It shows what changed (a tab switched, a panel opened, a number arrived) or draws attention to one important thing. Decorative motion everywhere reads as generic.
2. **One orchestrated moment beats many effects.** A single page-load sequence or one reveal is stronger than fade-up on every section and a hover-lift on every card.
3. **Content never depends on it.** Everything is visible and correct with JS off and with `prefers-reduced-motion: reduce`.
4. **Cheap properties only.** Animate `transform` and `opacity`. Never animate width, height, top or left on the main thread if a transform will do.
5. **Consistent vocabulary.** Use the tokens (`references/tokens.md`) so speed and easing feel like one system.

## Workflow

1. Read the composition's `slots` and `motion` metadata (from `layout-compositions`). If `motion: tier0`, add nothing unless the user insists.
2. Look up the composition in `references/composition-motion-map.md` and pick from its suggested presets. Fewer is better.
3. The token block is already installed in `@shavin/ui` `global.css` (`--dur-*`, `--dist-*`, `--stagger`). Reference tokens, don't re-declare.
4. Implement each chosen preset from `references/presets.md`, attaching to `data-slot` / `data-reveal` attributes, not by restructuring markup.
5. Add the reduced-motion path for each preset (the presets show how). The token safety net in `global.css` already zeros durations/distances under `prefers-reduced-motion: reduce`.
6. Run the checks below.

## Rules of thumb

| Thing | Guideline |
|---|---|
| Hover / press feedback | 100–160ms, `--ease-standard` |
| State change (tabs, toggles) | 160–240ms |
| Entrance | 400–600ms, `--ease-out`, travel ≤ 24px |
| Exit | ~65% of the entrance duration, `--ease-in` |
| Stagger | 40–80ms per item, total ≤ 400ms; cap at ~8 items |
| Auto-moving content | Must be pausable if it runs over 5s (WCAG 2.2.2) |
| Simultaneous animations | Keep few; budget by what the eye can follow |

- Don't put entrance animation on the LCP element (usually hero media or headline): opacity-0 elements can delay LCP. Animate supporting elements or use `transform` only.
- Gate hover effects behind `@media (hover: hover)` so touch devices don't get sticky states.
- Trigger reveals once (unobserve after firing). Re-triggering on every scroll is noisy.
- Above-the-fold elements shouldn't wait for a scroll trigger.

## When to escalate to `layout-choreography`

Switch when the request involves any of: pinned sections, scroll-scrubbed timelines, sequenced multi-element timelines, page transitions, horizontal scroll driven by vertical scroll, text split-and-stagger sequences, image mask reveals, WebGL/canvas scenes, cursor-following effects, or smooth-scroll libraries. Those need scene specs, fallbacks and performance budgets.

## Checks before delivering

- [ ] Works with JS disabled (content visible) and with reduced motion (no movement, no hidden content).
- [ ] No layout shift from animated elements (space reserved; `tabular-nums` on counters).
- [ ] No animation on the LCP element's opacity.
- [ ] Marquees/tickers have a pause control and stop on focus-within.
- [ ] Hover effects also appear on `:focus-visible`.
- [ ] Only `transform`/`opacity` animated (or `grid-template-rows` for the accordion technique).
- [ ] Total motion is restrained: name the one moment that is meant to stand out.
