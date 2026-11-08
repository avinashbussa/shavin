---
name: layout-choreography
description: >
  Scene-based, awwwards-style choreographed motion for web pages (Tier 2) — pinned
  scrollytelling, scroll-scrubbed timelines, horizontal-scroll sections, split-text and mask
  reveals, stacked-card scenes, cursor-follow and magnetic effects, page and shared-element
  transitions, preloader/intro sequences, WebGL/canvas heroes, smooth-scroll integration —
  specified as scenes with triggers, timelines, fallbacks and performance budgets, built with
  GSAP/ScrollTrigger, Lenis, CSS scroll-driven animations, View Transitions or three.js. Use
  whenever the user asks for awwards-style, cinematic, immersive, scroll-driven, scrollytelling,
  "fancy", GSAP, Lenis, pinned, parallax-heavy or timeline-based animation, or wants a signature
  motion moment on a hero, portfolio or story page. Requires a finished static layout first
  (layout-compositions); for simple reveals, hovers and count-ups use layout-motion instead.
sections:
  - id: scenes
    file: references/scenes.md
    description: "12 scene recipes mapped to compositions — pinned scrollytelling, scroll-scrubbed timelines, horizontal scroll, split-text, stacked cards, cursor effects, page transitions, preloader, WebGL hero (~2.5K tokens)"
  - id: tech-and-performance
    file: references/tech-and-performance.md
    description: "Stack choices, code patterns, budgets, cleanup — CSS scroll-driven, GSAP+ScrollTrigger, Lenis, Motion, View Transitions, three.js (~2K tokens)"
  - id: fallbacks-and-accessibility
    file: references/fallbacks-and-accessibility.md
    description: "Reduced motion, keyboard, focus, scroll-jacking rules, test matrix (~1.5K tokens)"
  - id: shavin-timelines
    file: references/shavin-timelines.md
    description: "Native sequenced motion via data-motion-tl-* — zero-setup load/scroll/click timelines the Studio Timelines tab emits; prefer over hand-rolled GSAP for sequenced reveals (~1.5K tokens)"
---

- **Token-efficient usage:** This skill is modular. For specific rules, call:
> - `get_skill({ name: "layout-choreography", section: "scenes" })` — 12 scene recipes
> - `get_skill({ name: "layout-choreography", section: "tech-and-performance" })` — stack choices and budgets
> - `get_skill({ name: "layout-choreography", section: "fallbacks-and-accessibility" })` — accessibility and fallback rules
> - `get_skill({ name: "layout-choreography", section: "shavin-timelines" })` — native `data-motion-tl-*` sequenced motion (zero-setup; prefer for load/scroll/click sequences)
>
> **This is the cinematic brain partner.** It is deliberately separate from standard composition
> guidelines (`layout-compositions`) and restrained motion (`layout-motion`). It only activates
> when the brief asks for scroll-linked, pinned, or timeline-driven motion.
>
> **Motion tokens:** Already defined in `@shavin/ui` `global.css` (`--dur-*`, `--dist-*`, `--stagger`).
> See `visual-compositor/motion-and-physics.md` for the canonical reference.

# Layout Choreography (Tier 2)

Choreography is motion as **composition over time**. Where a layout arranges a section in space, a scene arranges elements in time, often tied to scroll position. It is a separate discipline from layout because its unit is the **scene** (a trigger, a timeline, a length of scroll), its failures are different (jank, scroll-jacking, inaccessibility), and its cost is much higher (JS weight, testing, fallbacks).

## Preconditions

1. **A finished static layout exists** (Tier 0) built from `layout-compositions`, with `data-slot` attributes on the parts that will move. A scene targets slots and never restructures the layout.
2. **The composition allows it.** Its metadata says `motion: choreography-ok`. If it says `tier0` or `tier1`, use `layout-motion` or leave it static, or discuss changing the composition.
3. **There is a reason.** Choreography earns its cost when motion explains, guides or creates a memorable moment. It does not earn it as decoration. For award-level or brand-led briefs, one signature scene is expected, not optional: plan it with the page, not after.

If the static layout is missing, build that first.

## Scene budget

Per page: **one signature scene** (the memorable moment) and at most **two supporting scenes**. Everything else stays at Tier 0 or Tier 1. A page where every section is choreographed is exhausting, slow, and hard to make accessible.

## Workflow

1. **Clarify** with the user, briefly: which single moment matters most; target devices and performance floor; the stack (React? existing GSAP or Lenis?); brand tone (restrained, playful, cinematic); any license constraints on libraries.
2. **Choose scenes** from `references/scenes.md` (12 scene recipes, each mapped to compositions).
3. **Write a scene spec** for each, using the template below, and show it before coding. The spec forces the fallback and budget decisions early.
4. **Choose the tech** with `references/tech-and-performance.md`. Prefer the lightest tool that does the job: CSS first, then a small library, then a full timeline library.
5. **Implement** as isolated modules: one init function and one teardown per scene; every scene wrapped in a `matchMedia` branch that handles reduced motion and small screens.
6. **Verify** with the checks in `references/fallbacks-and-accessibility.md` and the performance budgets in `references/tech-and-performance.md`.

## Scene spec template

Copy this into the response (or a `scenes/<name>.md` file) and fill every field. A blank field means the decision hasn't been made.

```markdown
### Scene: <name>
- **Targets:** composition ID(s) and the slots animated (e.g. H5: headline lines, sub, cta)
- **Goal:** one sentence: what should the viewer understand or feel?
- **Trigger:** load | in-view | scroll-scrub | pointer | route change
- **Scroll length:** pin/scrub duration in viewport heights (scroll scenes), or total duration in ms
- **Timeline:** beats table (time or scroll progress → slot → property → ease)
- **Tech:** CSS scroll-driven | GSAP+ScrollTrigger | Lenis | Motion | View Transitions | WebGL (+ why)
- **Static baseline:** what Tier 0 shows (must be complete and correct on its own)
- **Reduced motion:** what happens (usually: final state, no movement)
- **Mobile / short viewport:** what happens (usually: simplified or static)
- **Budget:** JS added (kB), max long task, target frame rate, assets
- **Accessibility:** keyboard, focus, screen-reader order, anchors, find-in-page
- **Teardown:** how listeners, triggers, and tickers are cleaned up
```

## Rules that keep it good

- **Scroll belongs to the user.** Don't change scroll speed, direction or position in ways that trap them. If a smooth-scroll library is used, it is disabled under reduced motion and never blocks keyboard, anchors, or find-in-page.
- **Pin lengths are bounded.** Each pinned scene ≤ ~3–4 viewport heights; total choreographed scroll stays a small fraction of the page.
- **Static first.** Every scene has a complete non-animated state; reduced motion and no-JS users get it.
- **Load lazily.** Animation libraries load after first paint, or only when the scene is near the viewport.
- **Refresh after layout changes.** Fonts, images and route changes shift positions: refresh triggers when they settle.
- **Test on the floor device.** Mid-range Android and a 4× CPU throttle, not just a fast laptop.

## Reference map

| Need | Read |
|---|---|
| Scene recipes and which compositions they fit | `references/scenes.md` |
| Stack choices, code patterns, budgets, cleanup | `references/tech-and-performance.md` |
| Reduced motion, keyboard, focus, scroll-jacking rules, test matrix | `references/fallbacks-and-accessibility.md` |
