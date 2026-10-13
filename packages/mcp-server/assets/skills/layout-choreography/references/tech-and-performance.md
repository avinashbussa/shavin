# Tech choices, patterns and budgets

Contents: 1 Choosing the tool · 2 GSAP + ScrollTrigger pattern · 3 Lenis smooth scroll · 4 CSS scroll-driven animations · 5 View Transitions · 6 React and cleanup · 7 Performance budgets · 8 Loading strategy

Check current documentation and browser support for anything version-sensitive before relying on it; APIs and support tables change.

---

## 1. Choosing the tool

Use the lightest tool that does the job.

| Need | First choice | Escalate to |
|---|---|---|
| Simple scroll-linked transform/opacity | CSS scroll-driven animations (`animation-timeline`) as progressive enhancement | GSAP ScrollTrigger |
| Pinning, scrubbed multi-element timelines | GSAP + ScrollTrigger | |
| Smooth (inertial) scrolling | None: native scroll. Only if the brief demands it, Lenis | |
| React component-level animation | Motion (formerly Framer Motion) | GSAP via a React hook |
| Route / shared-element transitions | View Transitions API | Router-level transitions |
| 3D / shader hero | three.js or a lighter WebGL wrapper | |
| Vector illustration animation | Lottie or Rive | |

Licensing and versions change: confirm the current terms of any library before choosing it for a commercial project.

## 2. GSAP + ScrollTrigger pattern

Every scene is a function that returns a cleanup, wrapped in `matchMedia` so reduced motion and small screens get the right behaviour.

```js
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

const mm = gsap.matchMedia();

mm.add(
  {
    motionOk: "(prefers-reduced-motion: no-preference)",
    wide: "(min-width: 1024px) and (min-height: 600px)",
  },
  (ctx) => {
    const { motionOk, wide } = ctx.conditions;
    if (!motionOk) return;            // static baseline stays as-is

    if (wide) {
      // pinned scrollytelling (scene 3)
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "[data-scene='steps']",
          start: "top top",
          end: "+=300%",              // ≈ 3 viewports
          pin: true,
          scrub: true,
          anticipatePin: 1,
        },
      });
      tl.to("[data-slot='pinned-visual'] [data-state='2']", { opacity: 1 }, 0.33)
        .to("[data-slot='pinned-visual'] [data-state='3']", { opacity: 1 }, 0.66);
    }
    // everything registered here is reverted automatically when conditions change
  }
);
```

Guidelines:

- Target `data-slot` and `data-scene` attributes, not generated class names.
- Keep timelines declarative: positions as fractions of the scene, easing chosen from the token set where possible.
- Call `ScrollTrigger.refresh()` after fonts and images settle, and after layout-changing route updates.
- Use `scrub: true` (or a small smoothing value) for direct scroll-linking; use `toggleActions` for one-shot scenes.

## 3. Lenis smooth scroll

Use only when the design depends on it. Requirements:

```js
import Lenis from "lenis";

if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const lenis = new Lenis();
  lenis.on("scroll", ScrollTrigger.update);                 // keep ScrollTrigger in sync
  gsap.ticker.add((time) => lenis.raf(time * 1000));        // one shared ticker
  gsap.ticker.lagSmoothing(0);
}
```

- Disabled under reduced motion.
- Anchor links, keyboard scrolling (Space, PageUp/Down, arrows), focus-into-view and find-in-page must still land correctly: test them.
- Nested scroll containers (modals, code blocks) need the library's prevent/ignore attribute so they scroll natively.

## 4. CSS scroll-driven animations

```css
@supports (animation-timeline: scroll()) {
  @media (prefers-reduced-motion: no-preference) {
    .progress-bar { animation: grow linear both; animation-timeline: scroll(root); transform-origin: left; }
    @keyframes grow { from { transform: scaleX(0); } to { transform: scaleX(1); } }
  }
}
```

Good for progress bars, light parallax and simple reveals with no JS. No pinning, no complex sequencing. Verify browser support for your audience and always leave the static state as the fallback.

## 5. View Transitions

```js
function go(update) {
  if (!document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) {
    update();                                   // no animation, same result
    return;
  }
  document.startViewTransition(update);
}
```

Give shared elements a `view-transition-name` unique per page. After a transition, move focus to the new `<h1>` and restore scroll on back navigation. Frameworks may provide their own integration: prefer it.

## 6. React and cleanup

- Use the library's React hook or a `useLayoutEffect` with a context/`matchMedia` scope, and return the cleanup so triggers revert on unmount and on hot reload.
- In development strict mode, effects run twice: make setup idempotent.
- Don't animate React-controlled `style` values that state re-renders will overwrite; animate refs or data attributes.
- Route changes: kill or refresh triggers, then re-run scene setup after the new DOM paints.

## 7. Performance budgets

| Metric | Target | Notes |
|---|---|---|
| LCP | ≤ 2.5s | Scenes must not delay the LCP element |
| INP | ≤ 200ms | Keep scroll handlers off the main thread; use rAF/tickers |
| CLS | ≤ 0.1 | Pinned sections reserve their space; use `anticipatePin` |
| Long tasks during scroll | none over ~50ms | Profile with CPU throttling |
| Frame rate while scrolling | 60fps target; 30fps floor on the floor device | |
| Added JS (animation libs) | as small as possible; lazy-loaded | Report the kB in the scene spec |

- Animate `transform`, `opacity`, and (sparingly) `clip-path`. Avoid animating `filter: blur`, box-shadows, or layout properties.
- Use `will-change` only on elements about to animate, and remove it afterwards.
- Cap canvas device pixel ratio at 2. Pause canvas, video and tickers when offscreen (`IntersectionObserver`) or the tab is hidden.
- Limit concurrent scroll-linked timelines; combine where possible.

## 8. Loading strategy

1. Render the static page first. Text, CTA and media are in the DOM and readable.
2. Load animation code with dynamic `import()` after first paint, or when the scene approaches the viewport (`IntersectionObserver` with a generous `rootMargin`).
3. Wait for `document.fonts.ready` before measuring text or setting pin lengths.
4. Feature-detect (`startViewTransition`, `animation-timeline`, WebGL) and fall back to the static baseline.
5. Remember "already seen" intros per viewer and skip them on return visits.
