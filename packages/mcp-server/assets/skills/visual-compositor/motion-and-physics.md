# Motion, Physics & Animation Invariants

> Synthesizing the motion doctrines of **Emil Kowalski** (*animations.dev*) and **Rauno Freiberg** (*Interface Craft*), bound strictly to `@shavin/ui` token architecture and hardware-accelerated CSS.

---

## 1. The Animation Decision Framework (Emil Kowalski)

Before writing any animation or transition, answer these four questions in order:

### 1. Should this animate at all? (The Frequency Law)

How often will users trigger this interaction?

| Frequency | Decision | Rule / Reference |
|---|---|---|
| **100+ times / day** | **No animation. Ever.** | Keyboard shortcuts, command palettes (`Cmd+K`), quick search, row navigation. Any animation here feels slow, delayed, and frustrating (e.g. Raycast has zero open/close animation). |
| **Tens of times / day** | **Subtle or instant (<150ms)** | Hover states, tab switches, list sorting. |
| **Occasional** | **Standard animation (150–250ms)** | Dialogs, drawers, popovers, dropdowns, toast notifications. |
| **Rare / First-time** | **Delight allowed (300–600ms)** | Onboarding sequences, billing confirmation, empty state celebrations. |

> ⚠️ **Never animate keyboard-initiated actions.** Keyboards mean high-intent and high-frequency. Animate mouse gestures or viewport scroll, never keyboard triggers.

---

### 2. What is the purpose?

Every motion must satisfy at least one functional purpose:
- **Spatial consistency**: Toast enters and exits from the same direction; drawer slides from its edge.
- **State feedback**: A button scales down on `:active` press to acknowledge input.
- **Cognitive continuity**: Shared element morphing so users don't lose context between views.
- **Preventing jarring cuts**: Elements appearing or vanishing instantaneously feel broken or glitchy.

If the purpose is merely *"it looks cool"* and users see it repeatedly, **do not animate**.

---

### 3. Custom Easing Curves (Foundation Tokens)

Default CSS easings (`ease`, `ease-in`) feel weak and sluggish. UI motions require high-initial-velocity custom cubic beziers — now **tokenized** as foundation-level CSS variables:

```css
/* Foundation tokens — defined in :root, never overridden per-component */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);      /* Snappy UI: dropdowns, popovers, enter */
--ease-in-out: cubic-bezier(0.77, 0, 0.175, 1);   /* On-screen morph: elements changing shape */
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);    /* Sheet/drawer: iOS tactile momentum */
```

**Tailwind utilities:** `ease-out`, `ease-in-out`, `ease-drawer` (via `transitionTimingFunction` preset).

#### The Ease-In Ban
- ❌ **Never use `ease-in` for UI animations.** It starts slow, creating noticeable lag during the first 100ms when the user's eye is most focused.
- ✅ **Entering / Appearing elements:** Always use `--ease-out` (snappy, high initial velocity).
- ✅ **Sheet / Drawer / Sidebar:** Use `--ease-drawer` for iOS-momentum tactile feel.
- ✅ **Exiting / Disappearing elements:** Fast `--ease-out` under 160ms.

---

### 4. Duration Tokens (Foundation → Semantic)

Durations are now **tokenized** at the foundation level. Every semantic utility and page-level preset references these — **never hardcode `ms` values in components**.

| Token | Value | Purpose | Tailwind Utility |
|---|---|---|---|
| `--dur-instant` | 100ms | Press feedback, instant toggles, tooltip re-open | `duration-instant` |
| `--dur-fast` | 160ms | Hover color shifts, panel exit, quick transitions | `duration-fast` |
| `--dur-base` | 240ms | State changes: modals, menus, accordions, backdrop | `duration-base` |
| `--dur-slow` | 400ms | Large surface changes, sidebar collapse, sheet open | `duration-slow` |
| `--dur-enter` | 560ms | Entrances, reveals, page-load stagger sequences | `duration-enter` |

> **Perception Rule:** UI animations should almost always stay **under 300ms** (`--dur-base`). A 160ms dropdown feels significantly more responsive than a 350ms dropdown. `--dur-slow` and `--dur-enter` are reserved for large-surface and entrance choreography only.

---

### 5. Distance Tokens (Foundation)

Entrance travel distances are tokenized so that reduced-motion can zero them in one place:

| Token | Value | Purpose |
|---|---|---|
| `--dist-xs` | 4px | Micro-shifts, subtle parallax |
| `--dist-sm` | 8px | Popover/tooltip entrance travel |
| `--dist-md` | 16px | Default entrance travel for stagger reveals |
| `--dist-lg` | 24px | Maximum entrance travel, hero reveals |

---

### 6. Stagger Token

| Token | Value | Purpose |
|---|---|---|
| `--stagger` | 60ms | Interval between sequentially revealed elements |

Used in page-level presets (see `page-motion-presets.md`). Multiply by index: delay = `calc(var(--stagger) * N)`.

---

## 2. Reduced-Motion Safety Net

Shavin's reduced-motion strategy is **token-level, not rule-level**. Instead of overriding each animation utility individually, all motion tokens collapse to zero in one media query:

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --dur-instant: 0ms; --dur-fast: 0ms; --dur-base: 0ms;
    --dur-slow: 0ms; --dur-enter: 0ms; --stagger: 0ms;
    --dist-xs: 0px; --dist-sm: 0px; --dist-md: 0px; --dist-lg: 0px;
  }
}
```

**What this achieves automatically:**
- All `.animate-*` utilities collapse to 0ms duration → content appears instantly.
- All entrance travel distances become 0px → nothing shifts position.
- Stagger intervals become 0ms → all elements reveal simultaneously.
- CSS `transition-duration` is zeroed via the existing `*{}` rule.

**What still runs (by design):**
- Functional infinite loops: Spinner's spin, Skeleton's pulse, caret-blink — these are keyframe animations, not transition-duration based, so they keep running. They're non-distracting and communicate ongoing state.
- Opacity fades via `fade-only` / `fade-only-out` keyframes still provide gentle enter/exit (at 0ms = instant snap, or 100ms = barely perceptible).

**Component code needs zero changes.** No `@media` checks in components. No conditional logic. The token safety net handles everything.

---

## 3. Spring Physics & Velocity Preservation

Springs simulate physical mass, stiffness, and damping. Unlike fixed-duration curves, springs settle naturally and preserve velocity when interrupted.

### Apple Spring Presets
```ts
// Standard UI Interaction (Snappy, no oscillation)
const snappySpring = { type: "spring", duration: 0.35, bounce: 0 };

// Interactive Gesture / Sheet (Subtle tactile bounce)
const tactileSpring = { type: "spring", duration: 0.5, bounce: 0.15 };

// Playful / Celebration
const playfulSpring = { type: "spring", duration: 0.6, bounce: 0.28 };
```

### Interruptibility: CSS Transitions vs. Keyframes (Rauno Freiberg)

- **CSS Transitions (`transition: transform ...`)**: Interpolate toward the *latest* state. When a user changes intent mid-interaction (e.g. clicking away while a drawer opens), transitions retarget smoothly from the current position.
- **CSS Keyframes (`animation: slideIn ...`)**: Run on an immutable timeline. Reversing mid-motion causes sudden snapping or jumpy restarts.
- **Rule**: Always use CSS transitions or springs for interactive states. Reserve keyframes strictly for non-interactive, one-shot loop sequences (e.g. pulsing status lights).

---

## 4. Semantic Animation Utilities (Two-Tier System)

Shavin's motion system follows the same two-tier architecture as colors and radii — **foundation tokens** (raw cubic-beziers + durations + distances) are wrapped into **semantic utilities** (purpose-driven CSS classes that bundle easing + duration + keyframes). Always reach for the semantic utility, never the raw cubic-bezier.

| Utility | Purpose | Duration Token | Easing | Keyframe |
|---|---|---|---|---|
| `.animate-rise` | Popover / tooltip / hover-card enter (directional) | `--dur-fast` (160ms) | `--ease-out` | `fade-rise-{up,down,left,right}` |
| `.animate-rise-fast` | Quick tooltip re-open (skips delay) | `--dur-instant` (100ms) | `--ease-out` | `fade-rise-{dir}` |
| `.animate-modal-in` | Modal dialog enter (scale + fade from center) | `--dur-base` (240ms) | `--ease-out` | `fade-zoom` |
| `.animate-overlay` | Dialog / spotlight backdrop fade | `--dur-base` (240ms) | `ease` | `fade-only` (opacity only) |
| `.animate-accordion-down` | Accordion content expand | `--dur-base` (240ms) | `--ease-out` | `accordion-down` |
| `.animate-accordion-up` | Accordion content collapse | `--dur-base × 0.8` (192ms) | `--ease-out` | `accordion-up` |
| `.animate-progress-indeterminate` | Loading bar indeterminate loop | loop | `ease-in-out` | `progress-indeterminate` |
| `.animate-pulse-dot` | Status light pulse (functional loop) | loop | `ease-in-out` | `pulse-dot` |
| `.animate-caret-blink` | Code editor caret blink | loop | `steps(2)` | `caret-blink` |

> **Closed-state animations**: Radix `data-state="closed"` variants reuse `fade-fall` (`--dur-instant`) for exit — faster than enter, as the user already decided to dismiss.
>
> **Reduced motion**: All duration tokens collapse to 0ms via the safety net. Utilities effectively snap to final state. Components need no extra code.

---

## 5. Enter Choreography: Split & Stagger (Rauno Freiberg)

When revealing a new screen, hero section, or modal, never animate the entire container as one monolithic block. Split the content into semantic layers and stagger their entrance using `--stagger` and `--dist-md`:

### Stagger Recipe (Token-Based)
1. **Group 1 (0ms)**: Eyebrow badge / category pill.
2. **Group 2 (`--stagger × 1`)**: Headline (`<Heading>`).
3. **Group 3 (`--stagger × 2`)**: Subheading and description (`<Text>`).
4. **Group 4 (`--stagger × 3`)**: Primary & secondary action buttons (`<Button>`).
5. **Group 5 (`--stagger × 4`)**: Visual artifact (mockup, metric grid, inspector window).

### Visual State Transition
Combine three properties for cinematic entrance:
```css
/* Initial State — uses distance token */
opacity: 0;
transform: translateY(var(--dist-md));   /* 16px, collapses to 0 under reduced-motion */
filter: blur(4px);

/* Final Settled State */
opacity: 1;
transform: translateY(0);
filter: blur(0px);
```
```tsx
// Tailwind representation with staggered delays using --stagger token
<div className="opacity-0 translate-y-[var(--dist-md)] blur-sm
     animate-fade-up [animation-delay:calc(var(--stagger)*0)]
     [animation-fill-mode:forwards]">...</div>
<div className="opacity-0 translate-y-[var(--dist-md)] blur-sm
     animate-fade-up [animation-delay:calc(var(--stagger)*1)]
     [animation-fill-mode:forwards]">...</div>
<div className="opacity-0 translate-y-[var(--dist-md)] blur-sm
     animate-fade-up [animation-delay:calc(var(--stagger)*2)]
     [animation-fill-mode:forwards]">...</div>
```

> 💡 Under `prefers-reduced-motion`, `--stagger` and `--dist-md` both collapse to 0 — all elements appear instantly at their final position with zero blur. No conditional code needed.

---

## 6. Micro-Interaction Invariants

### 1. The Press State
Every pressable element (`<Button>`, `<IconButton>`, clickable card) MUST provide immediate tactile feedback:
```tsx
className="active:scale-[0.97] transition-transform duration-instant ease-out"
```

### 2. Never Animate From `scale(0)`
In the physical world, objects do not appear from a single zero-dimension singularity. Animating from `scale(0)` feels jarring and cartoonish.
- ❌ `transform: scale(0) -> scale(1)`
- ✅ `transform: scale(0.95) opacity: 0 -> transform: scale(1) opacity: 1`

### 3. Origin Anchor Alignment
Popovers, dropdown menus, and tooltips must animate outward from their trigger element:
- ❌ Scaling from `transform-origin: center` for dropdowns.
- ✅ Scaling from `transform-origin: top left` or `transform-origin: top center` matching the trigger anchor.

---

## 7. Page-Level Motion Presets

For entrance choreography patterns, stagger recipes, and composition-specific motion recommendations, see:

- **`page-motion-presets.md`** — Tier-1 entrance presets (fade-rise, blur-rise, split-stagger, word-reveal) with token-based timing.
- **`composition-motion-map.md`** — Which preset to apply per layout composition. "None" is a valid and often best answer.

**Key principle:** Pick one or two presets per page section, not all of them. Motion should guide the eye, not perform.

---

## 8. Review Format: Before / After / Why Table

When reviewing, auditing, or refactoring UI motion in `@shavin`, format all findings into this mandatory comparative table:

| Before | After | Why |
|---|---|---|
| `transition: all 300ms ease` | `transition: transform var(--dur-fast) ease-out, opacity var(--dur-fast) ease-out` | Specify exact hardware properties; ban `all`; token-based duration; snappy custom easing. |
| `duration: 200ms` hardcoded | `duration-fast` (`var(--dur-fast)`) | Duration tokens enable reduced-motion safety net + consistency across components. |
| `translateY(12px)` hardcoded | `translateY(var(--dist-md))` | Distance tokens collapse to 0 under reduced-motion. |
| `scale(0) -> scale(1)` | `scale(0.95) opacity(0) -> scale(1) opacity(1)` | Elements in reality never pop out of zero space; starting at 95% scale looks organic. |
| `animate-bounce` on button | `active:scale-[0.97]` | Bouncing is distracting; physical press feedback confirms interaction. |
| Monolithic container fade | Split & stagger (badge → h1 → text → cta) | Staggering guides eye along natural reading path. |
| `ease-in` on dropdown menu | `ease-out` (`--ease-out`) | `ease-in` delays initial movement, making menus feel unresponsive. |
| Per-component `@media (reduced-motion)` checks | Token safety net (automatic) | One media query zeros all durations/distances; zero component-level conditionals. |
