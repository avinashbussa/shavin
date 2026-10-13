# DOCS Mode — Documentation Portal Composition

Load this file ONLY when `visual-compositor`'s Activation Modes table (in `SKILL.md`) resolves to `DOCS` — e.g. `docs.shavin.cc`, API reference sites, changelog pages, knowledge bases.

## Why DOCS is a separate mode

Before this file existed, documentation portals were force-fit into either `MARKETING` (wrong — no hero-reveal-and-convert arc, no CTA rhythm, no Tagline Reveal moment) or `STRUCTURAL` (partially right on density, wrong on navigation and content shape). Neither models a docs site's actual layout problem: a persistent sidebar table of contents, dense reference prose, code blocks as first-class content, and a reading experience optimized for scanning + search rather than conversion.

## Core layout shape

- **Persistent left sidebar** (collapsible on mobile) for the nested page tree. Sidebar width: `w-64` to `w-72`, `border-r border-hairline`, independently scrollable from main content.
- **Right-hand "on this page" mini-TOC** for pages with 3+ headings (`w-56`, `sticky top-16`), auto-generated from `h2`/`h3` — omit on short pages.
- **Content column measure**: `max-w-2xl` to `max-w-3xl` for prose — narrower than MARKETING's hero measure, because dense reference text needs a tighter line length than a marketing headline.
- **No hero-reveal arc.** The `page-architecture.md` 12-section vertical arc and Tagline Reveal moment (from `shavin-webpage`) do NOT apply in DOCS mode — skip them entirely.

## Typography & density

- Inherit `spacing-dense.md`'s density framework (`STRUCTURAL`/`DOCS` share this file — see Mode Rule Map) — reference prose benefits from the same compact rhythm as dashboards, not MARKETING's generous `py-24`.
- Body copy: `text-sm leading-relaxed text-fg-subtle`, same as elsewhere, but line length capped tighter (`max-w-2xl`) per above.
- Code blocks are first-class: `font-mono text-xs`, `bg-surface border border-hairline rounded-[var(--radius-panel)]`, always with a copy button and language label. Never omit syntax highlighting language hints.
- Inline `<code>` uses `bg-surface-hover border border-hairline rounded-[var(--radius-lg)] px-1 py-0.5 text-xs font-mono`.

## Navigation & wayfinding

- Sidebar items use active-state styling matching the current route (`bg-accent-subtle text-accent` or `border-l-2 border-accent`), not a full-card selected state.
- Breadcrumbs above the `h1` for pages nested more than one level deep.
- Prev/Next page links at the bottom of content, `border-t border-hairline pt-6`.
- A `Cmd+K` / search trigger is expected in the header on any real docs site — flag its absence in `audit-checklist.md` review for DOCS-mode pages, even though it isn't literally part of this skill's own token rules.

## What still applies unchanged

`cognitive-layer.md`, `concentric-laws.md`, `spacing-core.md`, `layout-restraint.md`, `typography-rules.md`, and `interface-polish.md` are ALWAYS strict in DOCS mode exactly as in every other mode — see the Mode Rule Map in `SKILL.md`. `graphics-and-assets.md`, `spacing-marketing.md`, and `editorial-mode.md` are skipped entirely: documentation portals should not carry atmospheric marketing backdrops or theatrical motion.
