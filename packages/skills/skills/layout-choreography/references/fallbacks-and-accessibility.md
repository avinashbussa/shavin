# Fallbacks and accessibility for choreographed scenes

Choreography fails people in specific ways: trapped scrolling, hidden content, dizziness, lost focus. Every scene needs answers to the questions below before it ships.

Contents: 1 The static baseline contract · 2 Reduced motion · 3 Scroll ownership · 4 Keyboard, focus and anchors · 5 Screen readers and content order · 6 Flashing and vestibular safety · 7 Small screens and short viewports · 8 Test matrix

---

## 1. The static baseline contract

- With JS disabled, with the animation library failing to load, and with reduced motion on, the page shows every piece of content in a sensible, complete layout.
- Never start content hidden in CSS and rely on JS to reveal it, unless the hiding rule is scoped to a class added by the same script that will reveal it and only when motion is allowed.
- Text, links and CTAs live in the DOM as real elements, never only inside a canvas or image.

## 2. Reduced motion

`prefers-reduced-motion: reduce` means the scene resolves to its **final state** immediately: no movement, no scrubbing, no parallax, no autoplaying loops, no smooth-scroll library. Crossfades of short duration can remain if they are not spatial. Provide an in-page motion toggle when the site is animation-heavy.

## 3. Scroll ownership

- Don't change scroll speed or direction except through a smooth-scroll library that is off under reduced motion.
- A pinned or scrubbed section always releases: the user can reach the content after it by continuing to scroll normally.
- Horizontal-by-vertical scenes keep a native alternative and never capture scroll at the ends.
- Total choreographed scroll length stays a small part of the page. Each pinned scene ≲ 3–4 viewport heights.
- Back/forward navigation restores scroll position sensibly.

## 4. Keyboard, focus and anchors

- Tab reaches every interactive element inside pinned/scrubbed scenes; focusing an element scrolls it into view and the scene updates coherently.
- Space, PageUp/PageDown, Home/End and arrow keys work as normal.
- Anchor links land on the right position despite pin spacers (offset for header height; refresh triggers).
- Browser find-in-page can find text that is currently offscreen or in an inactive step.
- `:focus-visible` remains visible over media, masks and overlays.
- Page transitions move focus to the new page's `<h1>` (or a labelled main region) and announce the route change if the framework doesn't.

## 5. Screen readers and content order

- DOM order equals reading order; visual choreography never reorders it.
- Split-text animation keeps the sentence intact for assistive tech: `aria-label` on the container and `aria-hidden="true"` on split spans (or visually-hidden real text plus hidden animated copy).
- Decorative motion elements are `aria-hidden`. Meaningful content isn't hidden by an animation state (`visibility: hidden` or `inert` must be undone when it becomes relevant).
- Progress indicators that convey position have text or ARIA equivalents.

## 6. Flashing and vestibular safety

- Nothing flashes more than three times per second (WCAG 2.3.1).
- Avoid large-area parallax at different speeds, big zooms and spinning full-screen motion; these trigger vestibular symptoms. Keep travel modest, or off under reduced motion.
- Video or canvas backgrounds that run longer than 5 seconds offer a pause control (WCAG 2.2.2).

## 6b. Battery and data

Lazy-load heavy scenes, respect `prefers-reduced-data` where supported, and fall back to posters on save-data connections or low-power modes when detectable.

## 7. Small screens and short viewports

- Pinning and scrubbing require adequate size: enable only for `min-width: 1024px` and `min-height: 600px` (tune per scene).
- Below that, the scene becomes the static baseline or a lighter reveal.
- Test at 200% zoom and with large text sizes: pinned blocks that no longer fit must unpin.
- Touch devices don't get hover-only or cursor-follow behaviour.

## 8. Test matrix

Run each scene through these before delivery, and record results in the scene spec.

| Condition | Expected |
|---|---|
| JS disabled | Full static page, no missing content |
| Animation library blocked | Same as above |
| Reduced motion on | Final state, no movement |
| Keyboard only | Every control reachable; scene stays coherent |
| Screen reader pass | Correct reading order; no repeated/hidden text noise |
| 200% zoom / short viewport (≈ 600px tall) | Pins release; nothing clipped |
| Phone (360–430px), mid-range device | Simplified or static; smooth |
| 4× CPU throttle | No long tasks during scroll; no visible jank |
| Slow 4G | Static content usable before animation code arrives |
| Back button and reload mid-scene | Scroll restored; scene state correct |
| Font load delay | Text splits and pin lengths recalculated correctly |
