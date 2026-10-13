# Tier 1 presets

Each preset is small, attaches to attributes rather than restructuring markup, and includes its reduced-motion path. Tokens come from `tokens.md`. Adapt syntax to the stack (React, Vue, plain JS); the mechanics are the same.

Contents: 1 Reveal on view · 2 Page-load sequence · 3 Hover and press · 4 Accordion height · 5 Tab crossfade · 6 Count-up · 7 Marquee with pause · 8 Sticky header state · 9 Scroll-spy · 10 Light parallax · 11 Filter fade

---

## 1. Reveal on view

Content is visible by default; the hidden starting state exists only when JS has run and motion is allowed.

```css
@media (prefers-reduced-motion: no-preference) {
  .js [data-reveal] {
    opacity: 0;
    transform: translateY(var(--dist-md));
    transition:
      opacity var(--dur-enter) var(--ease-out),
      transform var(--dur-enter) var(--ease-out);
    transition-delay: calc(var(--i, 0) * var(--stagger));
  }
  .js [data-reveal][data-inview="true"] { opacity: 1; transform: none; }
}
```

```js
const io = new IntersectionObserver((entries) => {
  for (const e of entries) {
    if (e.isIntersecting) { e.target.dataset.inview = "true"; io.unobserve(e.target); }
  }
}, { rootMargin: "0px 0px -10% 0px", threshold: 0.1 });
document.querySelectorAll("[data-reveal]").forEach((el) => io.observe(el));
document.documentElement.classList.add("js"); // add only after the observer is set up
```

Stagger by setting `style="--i: 0"`, `--i: 1`, … on siblings (cap at ~8). Don't put `data-reveal` on above-the-fold content or the LCP element.

## 2. Page-load sequence (the one orchestrated moment)

Use for a hero. Total ≤ 800ms. Keep the LCP element visible: animate its `transform` or animate the supporting text, not its opacity from 0.

```css
@media (prefers-reduced-motion: no-preference) {
  [data-slot="overline"], [data-slot="sub"], [data-slot="cta"] {
    animation: rise var(--dur-enter) var(--ease-out) both;
  }
  [data-slot="sub"] { animation-delay: 80ms; }
  [data-slot="cta"] { animation-delay: 160ms; }
}
@keyframes rise { from { opacity: 0; transform: translateY(var(--dist-md)); } }
```

## 3. Hover and press

```css
.interactive {
  transition: transform var(--dur-fast) var(--ease-standard),
              background-color var(--dur-fast) var(--ease-standard);
}
@media (hover: hover) { .interactive:hover { transform: translateY(-2px); } }
.interactive:focus-visible { transform: translateY(-2px); }   /* same cue for keyboard */
.interactive:active { transform: scale(0.98); }
```

Apply to a few things that are actually interactive, not to every card.

## 4. Accordion height

Animate `grid-template-rows` instead of height:

```css
.acc-panel { display: grid; grid-template-rows: 0fr;
             transition: grid-template-rows var(--dur-base) var(--ease-standard); }
.acc-panel[data-open="true"] { grid-template-rows: 1fr; }
.acc-panel > div { overflow: hidden; }
```

Keep `aria-expanded` on the trigger in sync. Under reduced motion the tokens collapse to 0ms so it snaps open. Collapsed content should be non-focusable (`inert` or `hidden` when closed).

## 5. Tab crossfade

Stack all panels in one grid cell so the container keeps the tallest height (no layout shift):

```css
.tab-panels { display: grid; }
.tab-panels > [role="tabpanel"] {
  grid-area: 1 / 1;
  opacity: 0; visibility: hidden;
  transition: opacity var(--dur-base) var(--ease-standard), visibility 0s linear var(--dur-base);
}
.tab-panels > [role="tabpanel"][data-active="true"] {
  opacity: 1; visibility: visible; transition-delay: 0s;
}
```

## 6. Count-up (S3)

The final value is already in the DOM as real text. The animation only replays it.

```html
<span class="stat" data-slot="value">
  <span aria-hidden="true" data-count-to="1200000">1,200,000</span>
  <span class="sr-only">1,200,000</span>
</span>
```

```js
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const fmt = new Intl.NumberFormat();
function countUp(el, ms = 1200) {
  const to = Number(el.dataset.countTo), t0 = performance.now();
  const tick = (t) => {
    const p = Math.min((t - t0) / ms, 1);
    el.textContent = fmt.format(Math.round(to * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
if (!reduce) {
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { countUp(e.target); io.unobserve(e.target); }
  }), { threshold: 0.6 });
  document.querySelectorAll("[data-count-to]").forEach((el) => io.observe(el));
}
```

Use `tabular-nums` and a `min-width` (in `ch`) so digits don't move the layout. Skip years, versions and ratings.

## 7. Marquee with pause (T4, G3)

```html
<div class="marquee" data-paused="false" role="group" aria-label="Customers">
  <ul class="track">…logos…</ul>
  <ul class="track" aria-hidden="true">…same logos…</ul>
</div>
<button type="button" aria-pressed="false" data-marquee-toggle>Pause</button>
```

```css
.marquee { --gap: 3rem; display: flex; gap: var(--gap); overflow: hidden;
  mask-image: linear-gradient(to right, transparent, #000 10%, #000 90%, transparent); }
.track { display: flex; flex: none; gap: var(--gap); min-width: 100%;
  justify-content: space-around; animation: marquee 40s linear infinite; }
@keyframes marquee { to { transform: translateX(calc(-100% - var(--gap))); } }
.marquee:hover .track, .marquee:focus-within .track,
.marquee[data-paused="true"] .track { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .marquee { flex-wrap: wrap; overflow: visible; mask-image: none; }
  .track { animation: none; flex-wrap: wrap; }
  .track[aria-hidden="true"], [data-marquee-toggle] { display: none; }
}
```

The toggle button flips `data-paused` and `aria-pressed`. Pausing on hover alone doesn't satisfy WCAG 2.2.2.

## 8. Sticky header state (ST1)

Toggle a data attribute from an `IntersectionObserver` on a sentinel element at the top of the page; style the change with a short transition.

```js
const sentinel = document.querySelector("[data-header-sentinel]");
new IntersectionObserver(([e]) => {
  document.querySelector("header").dataset.stuck = String(!e.isIntersecting);
}).observe(sentinel);
```

```css
header { transition: background-color var(--dur-base) var(--ease-standard),
                     box-shadow var(--dur-base) var(--ease-standard); }
header[data-stuck="true"] { background: var(--canvas); box-shadow: 0 1px 0 var(--hairline); }
```

Don't change the header's height on scroll (causes reflow); change colour/shadow instead.

## 9. Scroll-spy (D1 TOC, F6 steps)

```js
const links = new Map([...document.querySelectorAll("[data-toc] a")].map(a => [a.hash.slice(1), a]));
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      links.forEach((a) => a.removeAttribute("aria-current"));
      links.get(e.target.id)?.setAttribute("aria-current", "true");
    }
  });
}, { rootMargin: "-20% 0px -70% 0px" });
links.forEach((_, id) => { const h = document.getElementById(id); if (h) io.observe(h); });
```

## 10. Light parallax

Progressive enhancement with CSS scroll-driven animations where supported (check current browser support before relying on it):

```css
@supports (animation-timeline: view()) {
  @media (prefers-reduced-motion: no-preference) {
    [data-parallax] { animation: drift linear both; animation-timeline: view(); }
    @keyframes drift { from { transform: translateY(24px); } to { transform: translateY(-24px); } }
  }
}
```

Limit travel to ±24–40px. Anything bigger or scripted belongs in `layout-choreography`.

## 11. Filter fade (G2)

Fade the result set with a 120–160ms opacity transition on the container when the filter changes, then swap content and fade back in. Announce the count in a live region. Don't animate layout positions of individual cards at this tier.
