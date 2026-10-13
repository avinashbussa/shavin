# Scene recipes

Twelve recurring choreography scenes. Each names the compositions it fits, what the static baseline must already provide, the trigger and beats, and the main risk. Use them as starting specs (see the template in `SKILL.md`), then tune for the brief.

Compositions must allow choreography (`motion: choreography-ok`). Those currently: H3, H4, H5, F6, X1, X2, X3, X4, X5. Other compositions can adopt a scene only after their metadata is changed deliberately.

Contents: 1 Hero intro · 2 Split-text reveal · 3 Pinned scrollytelling · 4 Horizontal scroll section · 5 Stacked cards · 6 Mask / clip reveal · 7 Frame-sequence scrub · 8 Scroll-velocity marquee · 9 Cursor-follow and magnetic · 10 Page and shared-element transitions · 11 Preloader / intro gate · 12 WebGL hero

---

## 1. Hero intro

- **Fits:** H3, H4, H5 (slots: overline, headline, sub, cta, visual)
- **Trigger:** load (after fonts and the LCP image are ready)
- **Beats:** headline lines rise/unmask (0–600ms, staggered 70ms) → sub fades (300–700ms) → CTA (450–850ms) → visual settles (0–900ms, transform only). Total ≤ 1.2s.
- **Static baseline:** everything visible and in place.
- **Risk:** hiding the LCP element delays LCP. Animate transforms and masks, not the LCP element's opacity from 0. Skip or shorten on repeat visits.

## 2. Split-text reveal

- **Fits:** H5, X2 (slots: headline, line)
- **Trigger:** load or in-view
- **Beats:** split into lines (not letters) inside overflow-hidden wrappers; each line translates up from 100% (staggered 60–90ms). Words only for very short text.
- **Static baseline:** the real, unsplit text.
- **Risk:** splitting before fonts load breaks line detection: wait for `document.fonts.ready`, and re-split on resize. Keep the original sentence readable by assistive tech (`aria-label` on the container, `aria-hidden` on split spans).

## 3. Pinned scrollytelling

- **Fits:** F6, X3 (slots: step-title, step-desc, pinned-visual / pinned, scroller)
- **Trigger:** scroll-scrub
- **Length:** 3–4 viewports max per scene.
- **Beats:** pin the visual; progress 0→1 across N steps; each step crossfades/morphs the visual to its state and highlights its text. Progress markers optional.
- **Static baseline:** F6/X3 as laid out: steps stacked with each state's visual visible.
- **Mobile:** no pin; steps become a plain stack.
- **Risk:** pinned content taller than the viewport at zoom or short heights. Only pin when height ≥ 600px and width ≥ 1024px.

## 4. Horizontal scroll section

- **Fits:** X4 (slots: track, card, caption, progress)
- **Trigger:** scroll-scrub with pin
- **Length:** track overflow width, capped at ~3 viewports of scroll.
- **Beats:** pin the section; translate the track on X by scroll progress; progress bar tracks it; cards may scale/parallax lightly.
- **Static baseline:** the native horizontal scroller from X4, which already works with trackpad, touch and keyboard.
- **Mobile:** keep the native scroller.
- **Risk:** classic scroll-jacking. Never trap vertical scroll: the pin releases at the end, and Tab/arrow keys still reach every card.

## 5. Stacked cards

- **Fits:** F6, X3, or a card list in an X* section
- **Trigger:** scroll-scrub
- **Beats:** each card is `position: sticky` at a staggered `top`; as the next card arrives, the previous scales to ~0.94 and dims slightly.
- **Static baseline:** a normal vertical list.
- **Tech:** sticky + CSS scroll-driven animation where supported (progressive enhancement) or a light ScrollTrigger.
- **Risk:** sticky broken by an ancestor's `overflow`.

## 6. Mask / clip reveal

- **Fits:** H3, X1 (slots: visual, primary)
- **Trigger:** in-view
- **Beats:** the frame opens via `clip-path: inset()` (600–900ms, `--ease-out`) while the inner image scales from 1.15 to 1.
- **Static baseline:** image fully visible.
- **Risk:** large clip-path animations can be costly on big images: test with CPU throttling; keep image dimensions sensible.

## 7. Frame-sequence scrub

- **Fits:** H4 (slots: background, scroll-cue)
- **Trigger:** scroll-scrub
- **Beats:** a canvas draws pre-rendered frames tied to scroll progress.
- **Static baseline:** poster image plus short text.
- **Budget:** very heavy. Cap frame count and resolution, load progressively, don't start until the section is near the viewport. Use only for a product reveal that genuinely needs it.
- **Risk:** memory and bandwidth. Provide a low-data fallback (poster only).

## 8. Scroll-velocity marquee

- **Fits:** X2 (type marquee), or a marquee strip in an X* section
- **Trigger:** scroll (speed and direction modulated by scroll velocity)
- **Beats:** base drift plus velocity-based boost; direction flips with scroll direction.
- **Static baseline:** the static wrapped text or logo grid.
- **Risk:** must still be pausable and stop under reduced motion (WCAG 2.2.2).

## 9. Cursor-follow and magnetic

- **Fits:** X5 (preview follows the pointer), buttons in H3/H5
- **Trigger:** pointer (fine pointers only: `(hover: hover) and (pointer: fine)`)
- **Beats:** target eases toward the pointer using a lerp (factor ~0.15); magnetic buttons pull ≤ 8–12px.
- **Static baseline:** fixed-position preview on hover *and* focus; normal buttons.
- **Risk:** input lag and covering text. Never rely on it for meaning; keyboard users get the same information.

## 10. Page and shared-element transitions

- **Fits:** X5 → detail pages, G4 → case studies (with X* styling)
- **Trigger:** route change
- **Beats:** outgoing content fades/slides ≤ 250ms; a shared element (thumbnail) morphs into the destination's hero; incoming content rises.
- **Tech:** View Transitions API where supported (progressive enhancement), or router-level transitions.
- **Static baseline:** instant navigation with no animation.
- **Risk:** focus and scroll position. Move focus to the new page's `<h1>`, restore scroll on back, and never delay navigation beyond ~300ms.

## 11. Preloader / intro gate

- **Fits:** H4, H5
- **Trigger:** first visit only
- **Beats:** short branded sequence (≤ 1.5s) that overlaps real loading; skip on repeat visits (remembered per viewer) and under reduced motion.
- **Static baseline:** the page itself, immediately.
- **Risk:** blocking content, harming LCP, frustrating repeat visitors. If the page is ready earlier than the sequence, cut it short.

## 12. WebGL hero

- **Fits:** H4
- **Trigger:** load (lazy, after first paint), pointer or scroll
- **Beats:** a shader/3D scene reacts subtly to the pointer or scroll; idle state is calm.
- **Static baseline:** a poster image with the real text and CTA in the DOM.
- **Budget:** lazy-load the 3D library, cap device pixel ratio at 2, pause when offscreen or the tab is hidden, cap frame work.
- **Risk:** battery, thermal throttling, old devices. Detect capability and fall back to the poster. Text and CTA are never drawn in the canvas.
