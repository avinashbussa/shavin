# Typography Rules & Type Scale Hierarchy

> **Load priority:** ALL MODES.
> **Token cost:** ~2.5K tokens.
> **Synthesized from:** Vercel Web Interface Guidelines, Meng To Design Systems, and Interface Polish standards.

Typography is the backbone of UI design. In high-end digital products, typography communicates 90% of the hierarchy, mood, and perceived quality.

---

## 1. Type Scale & Paired Line Heights

Every font size in @shavin interfaces must snap to the strict geometric type scale with its paired line height. Never use arbitrary values like `text-[19px]`, `font-size: 22px`, or `leading-[38px]`.

| Class | Font Size | Line Height | Tracking | Primary Role |
|---|---|---|---|---|
| `text-xs` | 12px (0.75rem) | 16px (1rem) | `tracking-normal` / `tracking-wider` (caps) | Microcopy, badges, timestamps, tags |
| `text-sm` | 14px (0.875rem) | 20px (1.25rem) | `tracking-normal` | Controls, secondary buttons, tooltips, list labels |
| `text-base` | 16px (1rem) | 24px (1.5rem) | `tracking-normal` | Body copy, primary inputs, standard buttons |
| `text-lg` | 18px (1.125rem) | 28px (1.75rem) | `tracking-normal` | Lead paragraph, card titles, subheadings |
| `text-xl` | 20px (1.25rem) | 28px (1.75rem) | `tracking-tight` | Section headers, modal titles, bento headlines |
| `text-2xl` | 24px (1.5rem) | 32px (2rem) | `tracking-tight` | Major card headings, small hero titles |
| `text-3xl` | 30px (1.875rem) | 36px (2.25rem) | `tracking-tight` | Feature section titles, stat numbers |
| `text-4xl` | 36px (2.25rem) | 40px (2.5rem) | `tracking-tight` | Hero headlines (mobile), large display stats |
| `text-5xl` | 48px (3rem) | 1.1 (tight) | `tracking-tight` | Hero headlines (tablet/desktop) |
| `text-6xl` | 60px (3.75rem) | 1.08 (tight) | `tracking-tight` | Flagship marketing hero headlines |
| `text-7xl` | 72px (4.5rem) | 1.05 (tight) | `tracking-tighter` | Editorial impact statements, high-impact numbers |

> Heading `xl` and up are fluid (follow their container): section `2xl` 30→36px / `3xl` 36→48px, hero `4xl` 36→60px / `5xl` 36→72px. No `md:text-*` steps; a plain `text-*` class pins a fixed size. All Headings apply `text-balance`.

---

## 2. Text Wrapping & Orphan Prevention

Single orphaned words at the end of a sentence destroy visual balance and make layouts feel machine-assembled.

```tsx
// ✅ Headings MUST use text-wrap: balance
<h1 className="text-5xl font-extrabold tracking-tight text-fg text-balance">
  The Intelligent Design System for High-Velocity Teams
</h1>

// ✅ Body copy and descriptions MUST use text-wrap: pretty
<p className="text-base text-fg-subtle leading-relaxed text-pretty max-w-2xl">
  Ship accessible, token-strict React applications with zero design drift across light and dark themes.
</p>
```

- **`text-balance` (`text-wrap: balance`)**: Required on all display headings, hero titles, card titles, and modal headers ($\le 4$ lines).
- **`text-pretty` (`text-wrap: pretty`)**: Required on multi-line body copy, descriptions, and list prose to prevent single trailing words on the last line.

---

## 3. Tabular Numbers (`tabular-nums`)

Proportional digits have varying character widths (e.g. `1` is much narrower than `8`). Whenever numbers update, change, or sit in grids/telemetry, proportional digits cause distracting jitter and layout shift.

```tsx
// ✅ ALWAYS use tabular-nums on numbers, counters, timestamps, latency, and telemetry
<span className="font-mono text-fg tabular-nums font-semibold">&lt;3.2ms</span>
<span className="text-3xl font-extrabold text-fg font-mono tabular-nums">1,423,690</span>
```

**Where tabular numbers are mandatory:**
- Telemetry & performance metrics (`<3.2ms`, `99.9%`, `100.0%`).
- Currency & pricing numbers (`$24`, `$99.00`).
- Timers, dates, and version indicators (`v2.4.0`, `14:02:45`).
- Table numeric columns and data grid values.

---

## 4. Reading Line Length (Max-Width Bounds)

Never let body text or hero headlines span full-width across a widescreen monitor. Lines longer than 75 characters exhaust the eye and reduce comprehension.

- **Hero Headings**: `max-w-3xl` or `max-w-[680px]` centered or left-aligned.
- **Subheadings & Lead Copy**: `max-w-2xl` or `max-w-[600px]`.
- **Prose & Article Body**: `max-w-prose` (65ch–75ch).

---

## 5. Optical Contrast & Semantic Color Hierarchy

Never rely on grey washes that blend together. Establish crisp optical contrast:

```
Level 1: Primary Title       →  text-fg          (High contrast, bold/extrabold, tracking-tight)
Level 2: Paired Description  →  text-fg-subtle   (Readable neutral, leading-relaxed, text-pretty)
Level 3: Standalone Metadata →  text-fg-muted    (Desaturated secondary metadata, timestamps)
Level 4: Accent Highlights   →  text-accent      (Semantic highlights, active indicators)
```

> [!CRITICAL]
> Paired descriptions immediately underneath a title MUST use `text-fg-subtle`, NEVER `text-fg-muted`. `text-fg-muted` sits too close to dark backgrounds in light mode and causes eye fatigue.
>
> **Exception — on dark media** (`surface="dark-always"`): subtitles/overlines use `text-fg-muted`; `text-fg-subtle` is too faint.

---

## 6. Subtle Optical Text Gradients (Display Hero Headlines)

On flagship marketing heroes, a very subtle directional text gradient adds a luxurious, sculpted feel:

```tsx
// ✅ High-end subtle text gradient (Light: fg -> fg/80, Dark: white -> muted)
<Heading as="h1" size="5xl" weight="bold" className="bg-gradient-to-r from-fg via-fg to-fg/75 bg-clip-text text-transparent">
  The Intelligent Design System for High-Velocity Teams
</Heading>
```

**Rules:**
- Apply ONLY to large display titles (`text-4xl` and above).
- Never use rainbow or high-saturation electric neon gradients on text.
- Gradients must stay tonal (`from-fg via-fg to-fg/75`), preserving AAA legibility.
