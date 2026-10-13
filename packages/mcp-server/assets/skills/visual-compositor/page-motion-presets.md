# Page-Level Motion Presets

> Tier-1 entrance presets using `@shavin/ui` motion tokens. Each preset is a self-contained recipe — easing, duration, distance, and stagger all reference foundation tokens, so reduced-motion collapses them automatically. See `composition-motion-map.md` for which preset to apply per layout composition. The full 11-preset catalogue and composition-motion-map now also live in the `layout-motion` skill (`layout-motion/references/presets.md`).

---

## How to Use

1. **Pick one or two presets per page section** — not all of them. Motion should guide the eye, not perform.
2. **Match the preset to the content density** — a hero can afford `word-reveal`; a dense feature grid should use a simple `fade-rise`.
3. **Always use tokens** — `var(--dur-*)`, `var(--dist-*)`, `var(--stagger)`, `var(--ease-out)`. Never hardcode ms/px values.
4. **Reduced-motion is automatic** — all tokens collapse to 0 via the safety net in `global.css`. No conditional code needed.

---

## P1: Fade-Rise (Default Entrance)

**Best for:** Most sections. Safe, subtle, universal.
**Feel:** Content rises into place with a gentle opacity fade. No blur, no overshoot.

```tsx
<div
  className="opacity-0 translate-y-[var(--dist-md)] ease-out
             [animation:fade-in-rise_var(--dur-enter)_var(--ease-out)_both]
             [animation-delay:calc(var(--stagger)*var(--i,0))]"
  style={{ "--i": 0 }}
/>
```

| Property | Value | Token |
|---|---|---|
| Duration | 560ms | `--dur-enter` |
| Distance | 16px | `--dist-md` |
| Easing | `cubic-bezier(0.23, 1, 0.32, 1)` | `--ease-out` |
| Stagger | 60ms per item | `--stagger` |

**Keyframe (if not using inline):**
```css
@keyframes fade-in-rise {
  from { opacity: 0; transform: translateY(var(--dist-md)); }
  to   { opacity: 1; transform: translateY(0); }
}
```

**When to use:** Feature grids, stats, testimonials, FAQ, footer. Any section where you want a gentle "content has arrived" feel without drawing attention to the motion itself.

**When NOT to use:** If the section is seen 100+ times/day (Frequency Law). Skip animation entirely.

---

## P2: Blur-Rise (Cinematic Entrance)

**Best for:** Hero sections, major section transitions, premium reveals.
**Feel:** Content emerges from a blurred state while rising — cinematic, high-production-value.

```tsx
<div
  className="opacity-0 translate-y-[var(--dist-md)] blur-[4px] ease-out
             [animation:blur-in-rise_var(--dur-enter)_var(--ease-out)_both]
             [animation-delay:calc(var(--stagger)*var(--i,0))]"
  style={{ "--i": 0 }}
/>
```

| Property | Value | Token |
|---|---|---|
| Duration | 560ms | `--dur-enter` |
| Distance | 16px | `--dist-md` |
| Blur | 4px → 0 | (fixed, not tokenized) |
| Easing | `cubic-bezier(0.23, 1, 0.32, 1)` | `--ease-out` |
| Stagger | 60ms per item | `--stagger` |

**Keyframe:**
```css
@keyframes blur-in-rise {
  from { opacity: 0; transform: translateY(var(--dist-md)); filter: blur(4px); }
  to   { opacity: 1; transform: translateY(0); filter: blur(0); }
}
```

**When to use:** Hero headline + subhead + CTA reveal. First viewport only — never repeat on scroll for below-the-fold sections (becomes tedious).

---

## P3: Split-Stagger (Rauno Sequence)

**Best for:** Hero sections with distinct semantic layers (badge → headline → text → CTA → visual).
**Feel:** Each layer enters in sequence, guiding the eye along the natural reading path.

This is not a single keyframe but a **choreography pattern** — apply P1 or P2 to each layer with incremental `--i` values:

```tsx
{/* Layer 0: Eyebrow badge */}
<div className="... [animation-delay:calc(var(--stagger)*0)]" style={{ "--i": 0 }} />

{/* Layer 1: Headline */}
<div className="... [animation-delay:calc(var(--stagger)*1)]" style={{ "--i": 1 }} />

{/* Layer 2: Subheading */}
<div className="... [animation-delay:calc(var(--stagger)*2)]" style={{ "--i": 2 }} />

{/* Layer 3: CTA buttons */}
<div className="... [animation-delay:calc(var(--stagger)*3)]" style={{ "--i": 3 }} />

{/* Layer 4: Visual artifact */}
<div className="... [animation-delay:calc(var(--stagger)*4)]" style={{ "--i": 4 }} />
```

**Total sequence duration:** `--dur-enter` + (4 × `--stagger`) = 560ms + 240ms = **800ms**.
Under reduced-motion: `--dur-enter` = 0, `--stagger` = 0 → **all layers appear instantly**.

**When to use:** Hero sections, major section reveals, onboarding sequences. Maximum 5 layers — more becomes exhausting.

---

## P4: Word-by-Word Tagline Reveal

**Best for:** Hero taglines, mission statements, brand-defining headlines.
**Feel:** Each word appears in sequence — forces the reader to consume the message at a deliberate pace.

```tsx
<h1 className="text-balance">
  {"Your headline split into words".split(" ").map((word, i) => (
    <span
      key={i}
      className="inline-block opacity-0 translate-y-[var(--dist-sm)] blur-[3px] ease-out
                 [animation:word-reveal_var(--dur-fast)_var(--ease-out)_both]
                 [animation-delay:calc(var(--stagger)*${i})]"
    >
      {word}&nbsp;
    </span>
  ))}
</h1>
```

| Property | Value | Token |
|---|---|---|
| Duration (per word) | 160ms | `--dur-fast` |
| Distance | 8px | `--dist-sm` |
| Blur | 3px → 0 | (fixed) |
| Easing | `--ease-out` | `--ease-out` |
| Stagger | 60ms per word | `--stagger` |

**Keyframe:**
```css
@keyframes word-reveal {
  from { opacity: 0; transform: translateY(var(--dist-sm)); filter: blur(3px); }
  to   { opacity: 1; transform: translateY(0); filter: blur(0); }
}
```

**When to use:** Exactly once per page — the hero tagline. Never repeat. This is a "rare/first-time" interaction per the Frequency Law.

**A11y note:** Each word is a separate `<span>` — screen readers still read the full sentence naturally since the text node is intact. The animation is purely visual.

---

## P5: Scale-In (Surface Appear)

**Best for:** Cards, modals, images entering the viewport on scroll.
**Feel:** Element scales up from 0.96 with opacity fade — organic, no singularity.

```tsx
<div
  className="opacity-0 scale-[0.96] ease-out
             [animation:scale-in_var(--dur-slow)_var(--ease-out)_both]
             [animation-delay:calc(var(--stagger)*var(--i,0))]"
  style={{ "--i": 0 }}
/>
```

| Property | Value | Token |
|---|---|---|
| Duration | 400ms | `--dur-slow` |
| Scale | 0.96 → 1.0 | (fixed ratio, not distance) |
| Easing | `--ease-out` | `--ease-out` |
| Stagger | 60ms per item | `--stagger` |

**Keyframe:**
```css
@keyframes scale-in {
  from { opacity: 0; transform: scale(0.96); }
  to   { opacity: 1; transform: scale(1); }
}
```

**When to use:** Image galleries, bento grid items, card-heavy sections on scroll-into-view. Pair with `IntersectionObserver` for scroll-triggered reveals.

---

## P6: Slide-In (Directional)

**Best for:** Drawers, sidebars, mobile sheets, off-canvas panels.
**Feel:** Surface slides in from its mounted edge with momentum easing.

```tsx
{/* Left drawer */}
<div
  className="ease-out
             [animation:slide-in-left_var(--dur-slow)_var(--ease-drawer)_both]"
/>

{/* Right drawer */}
<div
  className="ease-out
             [animation:slide-in-right_var(--dur-slow)_var(--ease-drawer)_both]"
/>

{/* Bottom sheet */}
<div
  className="ease-out
             [animation:slide-in-up_var(--dur-slow)_var(--ease-drawer)_both]"
/>
```

| Property | Value | Token |
|---|---|---|
| Duration | 400ms | `--dur-slow` |
| Distance | 100% of element width/height | (not tokenized — directional) |
| Easing | `cubic-bezier(0.32, 0.72, 0, 1)` | `--ease-drawer` |

**Keyframes:**
```css
@keyframes slide-in-left  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
@keyframes slide-in-right { from { transform: translateX(100%); }  to { transform: translateX(0); } }
@keyframes slide-in-up    { from { transform: translateY(100%); }  to { transform: translateY(0); } }
```

**When to use:** Drawers, sidebars, bottom sheets. Uses `--ease-drawer` for iOS tactile momentum.

> Note: Slide distance (100%) is intentionally NOT tokenized — it's always the full element dimension. Under reduced-motion, `--dur-slow` = 0 → instant appear.

---

## Reduced-Motion Behavior Summary

| Preset | Normal | Reduced Motion |
|---|---|---|
| P1 Fade-Rise | 560ms fade + 16px rise | Instant appear, no movement |
| P2 Blur-Rise | 560ms fade + 16px rise + blur | Instant appear, no movement, no blur |
| P3 Split-Stagger | Sequential 800ms total | All layers appear simultaneously |
| P4 Word-Reveal | 160ms per word, 60ms stagger | All words appear simultaneously |
| P5 Scale-In | 400ms scale 0.96→1 | Instant appear at full scale |
| P6 Slide-In | 400ms slide + drawer easing | Instant appear, no slide |

All automatic via token safety net. Zero conditional code in components.
