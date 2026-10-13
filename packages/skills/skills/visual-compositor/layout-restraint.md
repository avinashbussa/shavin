# Layout Restraint, Spatial Breathing Room & Anti-Bloat

> **Load priority:** ALL MODES (especially MARKETING, EDITORIAL, and SaaS blocks).
> **Token cost:** ~2.5K tokens.
> **Companion to:** `graphics-and-assets.md` (atmospheric depth) and `spacing-marketing.md` (visual weight).

This section addresses a primary cause of low-quality AI-generated UI: **layout bloat and content dumping**. When AI models attempt to appear thorough, they frequently generate cluttered, text-heavy wireframes that feel machine-assembled rather than human-curated.

---

## 1. The Content Bloat Trap ("AI Wireframe Slop")

The following named anti-patterns are the primary causes of AI-generated layout degradation. Each is documented with code examples and remediation in `visual-compositor/anti-patterns.md`:
- **AP-05 Paragraph Walls**: 3–4 lines of dense marketing prose under every heading.
- **AP-06 Metric Clutter**: 4–6 telemetry boxes jammed into the hero.
- **AP-04 Badge Soup**: Multiple colored pills stacked above a heading.
- **AP-07 Kitchen-Sink Bento Grids**: 6–8 miniature cards with no breathing room.

> [!CAUTION]
> A layout stuffed with dense text and micro-widgets does not look "production-ready"—it looks like a wireframe draft that hasn't undergone editorial distillation.

---

## 2. The "Single Clear Thought" Principle

Every section, hero, or template block must communicate **exactly one clear idea** effortlessly within 3 seconds.

```
┌─────────────────────────────────────────────────────────────┐
│ Overline Label (Optional, single concise text)               │
│                                                             │
│ Headline (4–8 words, punchy, confident, text-fg)           │
│                                                             │
│ Subtitle (1–2 sentences max, 15–25 words, text-fg-subtle)   │
│                                                             │
│ Action Group (1 primary Button + 1 subtle ghost/link)       │
│                                                             │
│ Trust Row (Clean horizontal inline markers)                 │
└─────────────────────────────────────────────────────────────┘
```

### The Distillation Budget

| Element | Maximum Allowed | Recommended Treatment |
|---|---|---|
| **Top Label** | 1 overline text or badge | Small, subtle, `uppercase tracking-wider text-fg-subtle`. Badge only for stateful labels. |
| **Headline** | 4 to 8 words | Large (`text-4xl` to `text-6xl`), tight leading, confident. |
| **Subtitle** | 15 to 25 words (1–2 sentences) | `text-fg-subtle`, clear value proposition, no corporate jargon. |
| **Call-to-Action** | 2 buttons max | 1 Primary (`bg-accent` or solid `bg-fg`), 1 Secondary (outline or ghost). |
| **Trust Markers** | 1 horizontal line | Inline checkmarks (`✓ Zero Config   ✓ 100% TypeScript`) or 4–5 subtle monochrome logos. Never a multi-card metric grid inside a hero! |

---

## 3. Generous Spatial Breathing Room

High-end digital products convey confidence through **negative space**, not density.

### Spacing Scale Rules
- **Section Vertical Rhythm**:
  - `<Section size>`: `hero` `py-24 md:py-32` · `body` `py-16 md:py-24` · `strip` `py-10 md:py-14` · `compact` `py-8 md:py-12` (app only). Marketing floor `py-12` mobile. Canonical: `layout-compositions/references/foundations.md` §3.
- **Card & Surface Internal Padding**:
  - Hero focal containers: `p-8 md:p-12`.
  - Secondary feature cards: `p-6 md:p-8`.
  - Dense widgets: `p-4 md:p-5`.
- **Grid Restraint**:
  - Bento grids: 3 to 4 thoughtfully balanced cards maximum.
  - Multi-column feature grids: 3 columns maximum on desktop, with generous `gap-6` or `gap-8`.
- **Whitespace is not empty space**: It is an active structural element that elevates the perceived value and luxury of the interface.

---

## 4. Anti-Bloat Pre-Flight Audit

Before submitting any layout, block, or screen, audit against these 5 checks:

1. [ ] **Can a user scan the core value in under 3 seconds?** If they have to read a paragraph, cut 50% of the words.
2. [ ] **Did you add a metric grid inside the hero?** If yes, remove it or move it to a dedicated proof section below the fold.
3. [ ] **Are there multiple competing badges?** Use overline text instead of badges for section labels. Keep at most 1 `<Badge>` per section (only for stateful labels).
4. [ ] **Does the container feel crammed?** Increase `py-*` on the section and `p-*` on the surfaces.
5. [ ] **Is the layout airy and focused?** Ensure the primary CTA stands out with clear vertical margin (`mt-6` to `mt-8`).
