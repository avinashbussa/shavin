# Shavin Timelines — native sequenced motion (`data-motion-tl-*`)

For **sequenced, multi-element choreography** (hero load sequences, scroll-scrubbed reveals, click-to-play
sequences), prefer Shavin's native **Timelines** over hand-written GSAP. They are **zero-setup**: emit
`data-motion-tl-*` attributes and the `@shavin/ui` motion runtime (self-booting, GSAP lazy-loaded)
drives them — no `<MotionRuntime>`, no `useEffect`, no ScrollTrigger wiring, no imports. They round-trip
losslessly through Studio and are what the Studio **Timelines** tab produces, so code and the visual
editor stay identical.

Use hand-rolled GSAP (the `scenes` / `tech-and-performance` references) only for what Timelines don't
cover: split-text, horizontal-scroll sections, cursor/magnetic effects, WebGL, page transitions.

## The contract

A timeline is **distributed over the nodes it touches** — no wrapper, no config object.

**Scope-root** (the common ancestor it plays within — a Section/Container):

| Attribute | Values |
|---|---|
| `data-motion-tl` | timeline id, document-unique (`t1`, `t2`, …) |
| `data-motion-tl-label` | human label ("Hero intro") |
| `data-motion-tl-trigger` | `load` · `scroll` · `click` |
| `data-motion-tl-mode` | scroll only: `reveal` (play once on enter) · `scrub` (tie progress to scroll) |
| `data-motion-tl-start` / `-end` | scroll only: ScrollTrigger offsets (e.g. `top top` / `+=150%`) |
| `data-motion-tl-pin` | scroll+scrub only: `"1"` pins the root while scrubbing |

**Member** (each element the timeline animates — a descendant of the root):

| Attribute | Values |
|---|---|
| `data-motion-tl-member` | the owning timeline id (`t1`) |
| `data-motion-tl-at` | position on the clock — **ms** for load/click, **0–100 (%)** for scrub |
| `data-motion-tl-effect` | `fade` · `fade-up` · `fade-down` · `scale-in` · `blur-in` · `mask-up` |
| `data-motion-tl-dist` / `-dur` / `-ease` | token selectors (`xs…lg` / `instant…enter` / `standard`,`out`,`in`,`overshoot`) |
| `data-motion-tl-stagger` | **container members** — ms between each direct child's entry (fans the children; `0`/absent = the whole element moves as one). Works on any container with 2+ children, repeat-grids included |
| `data-motion-tl-stagger-order` | fan order — `forward` (DOM order / rows, default) · `reverse` · `cols` (column-major, from a grid's columns) |
| `data-motion-tl-split` | **text members** — split the text and stagger the pieces (by `-stagger`): `words` · `chars` · `lines`. Needs GSAP SplitText at runtime; without it (or under reduced motion) the whole node reveals |

**Click trigger:** mark the control that replays it with `data-motion-tl-play` on a descendant (a
`<Button>`); clicking it, or Enter/Space when focused, restarts the sequence. With no marked control the
whole root is the trigger — prefer a real button for accessibility.

```tsx
// Hero load sequence — three lines on their own beats, zero setup.
<Section data-motion-tl="t1" data-motion-tl-label="Hero intro" data-motion-tl-trigger="load">
  <Heading data-motion-tl-member="t1" data-motion-tl-at="0"   data-motion-tl-effect="fade-up" data-motion-tl-dist="md" />
  <Text    data-motion-tl-member="t1" data-motion-tl-at="120" data-motion-tl-effect="fade-up" data-motion-tl-dist="sm" />
  <Button  data-motion-tl-member="t1" data-motion-tl-at="240" data-motion-tl-effect="scale-in" />
</Section>

// Pinned scroll-scrubbed scene — positions are 0–100% of the scroll range.
<Section data-motion-tl="t2" data-motion-tl-trigger="scroll" data-motion-tl-mode="scrub"
         data-motion-tl-start="top top" data-motion-tl-end="+=150%" data-motion-tl-pin="1">
  <Heading data-motion-tl-member="t2" data-motion-tl-at="0"   data-motion-tl-effect="fade-up" data-motion-tl-dist="lg" />
  <Text    data-motion-tl-member="t2" data-motion-tl-at="50"  data-motion-tl-effect="blur-in" />
  <Text    data-motion-tl-member="t2" data-motion-tl-at="100" data-motion-tl-effect="mask-up" />
</Section>

// Any container fans its children — each 80ms after the last, column by column.
<RepeatGrid data-motion-tl-member="t3" data-motion-tl-at="0" data-motion-tl-effect="fade-up"
            data-motion-tl-stagger="80" data-motion-tl-stagger-order="cols" />

// Split a heading into words and stagger them — "Know / where / every …" 60ms apart.
<Heading data-motion-tl-member="t4" data-motion-tl-at="0" data-motion-tl-effect="fade-up"
         data-motion-tl-split="words" data-motion-tl-stagger="60">
  Know where every dollar stands
</Heading>
```

**Container stagger.** On a container member (a `RepeatGrid`, any `display:grid`/`flex`, or any element with
>1 child), `-stagger` ms fans the direct children from the member's `-at` instead of moving the element as
one; `-stagger-order` sweeps `forward` (rows, default), `reverse`, or `cols` (column-major). No `-stagger` →
the element animates as a single block.

**Split text.** On a text member, `-split="words|chars|lines"` breaks the text into pieces and `-stagger` fans
them. Uses GSAP SplitText at runtime; without it, or under `prefers-reduced-motion`, the whole node reveals.

## Rules (enforced by `validate_code`)

- **One root per member.** Every `data-motion-tl-member="X"` needs an ancestor `data-motion-tl="X"`, or
  nothing drives it (`timeline-orphan-member`).
- **No dead timelines.** A root with no members is flagged (`timeline-no-members`).
- **Member opt-out.** A timeline member must **not** also carry its own `data-motion-entry` /
  `data-motion-scroll` — the timeline drives it; the runtime suppresses standalone entry for members, and
  double-declaring is flagged (`timeline-member-standalone`).
- **One subtree per timeline.** All members descend from the single root; scattered-member and nested
  timelines are not supported.
- **Scrub roots are block-level** and tall/pinnable; `at` is ms for time triggers, 0–100 for scrub.

## Accessibility & fallbacks

- **Reduced motion** is automatic: `prefers-reduced-motion: reduce` reveals every member at its final
  state with no travel — never build a timeline that hides content the reader can't get to otherwise.
- Members are hidden before the clock reveals them **only when the runtime booted** (`html.shavin-motion-js`);
  with no JS, reduced motion, or inside Studio's paused canvas, they stay visible. Keep content correct in
  all three.
- GSAP is **optional and lazy** — if absent, members are revealed (no animation) and the page still works;
  the one-flag kill switch is `motionConfig.gsap`.
- Timelines play on the live page / `/preview`, not Studio's editing canvas (it is intentionally paused).
