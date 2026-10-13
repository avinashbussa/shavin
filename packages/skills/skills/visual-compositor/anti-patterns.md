# Anti-Pattern Registry — The Slop Catalogue

> **Load priority:** ON-DEMAND. Load whenever composing or reviewing blocks, screens, or sections — especially when the output "feels AI-generated" or looks like a wireframe draft.
> **Token cost:** ~2K tokens.
> **Referenced by:** `core-rules.md` §7 & §11, `layout-restraint.md`, `interface-polish.md`, `shavin-core/SKILL.md` §2, `audit-checklist.md`.

This file is the **single consolidated catalog** of named anti-patterns that signal AI-generated UI degradation. Always-loaded files reference these by ID (e.g. "see AP-03") to stay token-lean; the full explanation, code examples, and remediation live here.

- 💡 If `shavin-mcp` is connected: call `get_skill({ name: "visual-compositor", section: "anti-patterns" })`.
- 💡 Otherwise (No-MCP): read this file directly — `view skills/visual-compositor/anti-patterns.md`.

---

## The One Governing Principle

> **Prefer typographic hierarchy (size, weight, color, spacing) over decorative elements (badges, pills, chips, colored dividers) for structural/organizational labeling. Reserve decorative elements for stateful, interactive, or status-bearing information only.**

This single principle covers badges, chips, pills, dividers, and any future decorative element. Every anti-pattern below is a specific violation of it or of one of the other principles in this file. When in doubt, ask: *am I reaching for a visual element because it adds information, or because it fills space?*

---

## Registry

### AP-01: Defensive Minimalism (Sterile Wireframe)
**Symptom:** Token-pure but visually flat — stark white background, harsh black text, zero depth, zero atmosphere. Looks like an unstyled HTML document.
**Why it's slop:** Confuses token compliance with aesthetic poverty. Real production UI uses layered depth.
**Fix:** Add atmospheric layering — soft pastel mesh backdrops (`opacity 15–30% light, 10–20% dark`), frosted glass panels (`bg-surface/80 backdrop-blur-md border border-hairline/70`), directional gradient scrims.

### AP-02: Ambient Accent Glow Balls
**Symptom:** Garish `bg-accent/20 blur-3xl` glowing orbs placed in corners of sections.
**Why it's slop:** A recognized AI design cliché. Saturated, distracting, and cheap-looking.
**Fix:** Replace with diffuse **pastel meshes** (lavender, soft sage, mist, peach, slate) at low opacity with CSS mask gradient dissolves (`maskImage: linear-gradient(...)`).

### AP-03: Literal Stock Photos
**Symptom:** Context-heavy cliché stock — people typing on laptops, handshakes, generic office desks — or dense, tiny, unreadable UI screenshots dropped into hero or feature sections.
**Why it's slop:** Looks cheap, breaks visual cohesion, and signals "I couldn't think of what to put here."
**Fix:** Choose: (1) Curated editorial photography from Lummi (`assets.lummi.ai`), Unsplash, or the user — usable anywhere, including as accents for visual balance, not only for people/testimonials; (2) Mesh gradients (`bgOverlays="mesh-lime"` etc.) or animated backgrounds (Pexels video via `bgVideo` + `bgPoster`) with copy on top behind a scrim; (3) Abstract atmospheric textures (procedural waves, blurred chromatic grain). 3D renders are **optional decorative graphics only** — never focal hero/feature media. Do NOT rebuild product mockups/UI screenshots from Shavin primitives as imagery unless you are highly confident of the result (rarely the right call).

### AP-04: Badge Soup
**Symptom:** Stacking 3–4 colored `<Badge>` pills above a single heading ("⚡ FAST", "🔒 SECURE", "✨ NEW", "v2.4"). Scattering `<Badge>` across every section, card, or feature row.
**Why it's slop:** Adds visual noise without information value. Multiple decorative pills per viewport is the #1 hallmark of AI-generated UI.
**Fix:** Maximum 1 `<Badge>` per section, only for genuine state changes (version tags, success/error, notification counts). For section labels, category markers, and eyebrow text, use **overline text** instead:
```jsx
<Text size="xs" className="uppercase tracking-wider text-fg-subtle font-medium">
  Section Label
</Text>
```
Overline is typographically lighter (no fill, no border, no pill), respects reading hierarchy via `text-fg-subtle`, and doesn't compete with the headline.

### AP-05: Paragraph Walls
**Symptom:** 3–4 lines of dense marketing prose under every heading.
**Why it's slop:** Looks like an AI trying to appear thorough. Humans curate; machines dump.
**Fix:** 1 paired description, 15–25 words max, `text-fg-subtle`. If more context is needed, use a dedicated sub-section, not a wall of text.

### AP-06: Metric Clutter in Heroes
**Symptom:** Jamming 4–6 arbitrary telemetry boxes ("99.9% uptime", "500k queries", "10x speed", "$2M saved") directly underneath the hero headline.
**Why it's slop:** Dilutes the single clear thought. The hero should communicate one idea in 3 seconds.
**Fix:** Move metrics to a dedicated proof/social-proof section below the fold. Hero keeps: 1 title, 1 subtitle, 1 primary CTA + 1 secondary, 1 clean horizontal trust line.

### AP-07: Kitchen-Sink Bento Grids
**Symptom:** Packing 6–8 miniature cards with charts, lists, toggles, and buttons into a single section with no breathing room.
**Why it's slop:** Looks like a wireframe that hasn't undergone editorial distillation.
**Fix:** Maximum 3–4 thoughtfully balanced cards. Generous `gap-6` or `gap-8`. Each card communicates one concept.

### AP-08: Status-Chip Soup
**Symptom:** Multiple colored status chips/pills on a card to communicate priority instead of using size, weight, and placement.
**Why it's slop:** Relies on decorative labels instead of hierarchy. Violates "Hierarchy before Labels."
**Fix:** Size, weight, placement, and contrast must do 90% of the work. At most 1 concise badge per view, only for urgent state changes.

### AP-09: Over-Containment (The Box Law Violation)
**Symptom:** Wrapping every piece of content, metric, or feature in its own bordered card or box. Related items separated by containers instead of proximity.
**Why it's slop:** Looks like a clunky spreadsheet. Proximity is the primary grouping tool; containers are secondary.
**Fix:** Use proximity to group related items (`gap-2` to `gap-4`); separate conceptual groups by whitespace (`gap-8` to `gap-12`). Reserve `<Card>` for top-level interactive surfaces only. If 3 metrics share a card, use a horizontal layout with subtle dividers — don't wrap each in a sub-card.

### AP-10: Vacuous Copywriting
**Symptom:** Tech clichés ("Empower your workflow", "Revolutionize your efficiency", "Seamless intelligence"), binary contrast tropes ("It's not just a dashboard. It's your command center."), throat-clearing openers ("In today's fast-paced digital ecosystem...").
**Why it's slop:** Generic, instantly recognizable as machine-generated.
**Fix:** Use domain-specific telemetry (`p99: 42ms`, `99.98% SLA`), real RBAC terms (`viewer`, `billing_admin`), precise action labels ("Generate API Key", "Deploy to Production"), and contextual callouts ("Cluster degraded — 2 of 5 replicas unhealthy in us-east-1").

### AP-11: Lazy Placeholder Content
**Symptom:** `"Card Title"`, `"Card Description"`, `"Option 1, 2, 3"`, `"Lorem ipsum"`, `"John Doe"`, `"user@example.com"`.
**Why it's slop:** Signals no editorial thought was applied to the content.
**Fix:** Write authentic microcopy that reflects the actual product domain. Even placeholder content should sound like a real user wrote it.

### AP-12: Harsh Border Glare (Over-Accenting Card Borders)
**Symptom:** Using `border-accent` or `ring-accent` for active, selected, or featured cards in standard product apps, dashboards, consoles, and documentation.
**Why it's slop:** In dark themes, `--accent` is mapped to high-contrast foreground (`#fafafa` / `--n-100`). Applying raw `border-accent` creates a harsh 100% white outline that causes distracting glare and disrupts reading flow.
**Fix:** In functional product interfaces, apps, dashboards, and docs, always use `border-hairline` for resting cards and `border-hairline-strong` for active, hover, or featured cards. Reserve `border-accent` exclusively for expressive website/marketing moments where vibrant brand accent color is explicitly demanded for creative impact.

### AP-13: Sparkles Icon
**Symptom:** `<Icon name="sparkles">`, Lucide `Sparkles`, ✨ for AI, "magic" or "thinking" cues.
**Why it's slop:** The default tell of machine-made UI.
**Fix:** Omit it, or use a domain icon (`message-square`, `wand` only if asked). For AI activity use `<Murmur>`. Only use sparkles when the user explicitly requests it.

---

## Quick-Reference Decision Table

| You're about to... | Stop and ask... | Correct alternative |
|---|---|---|
| Add a `<Badge>` above a heading | "Does this convey a **state change** or **status**?" | No → use overline text (AP-04) |
| Add a 3rd+ badge in a section | "Am I filling space or adding information?" | Remove. Use hierarchy instead (AP-04, AP-08) |
| Wrap content in another `<Card>` | "Would **proximity** group these just as well?" | Use `gap-*` spacing, not a border (AP-09) |
| Add 4+ metric boxes to a hero | "Can the user scan this in 3 seconds?" | Move to dedicated section below fold (AP-06) |
| Write 3+ lines of body text | "Can I say this in 1–2 sentences?" | Cut to 15–25 words, `text-fg-subtle` (AP-05) |
| Use a stock photo of people | "Does this add **context** or just fill space?" | Use curated Lummi/Unsplash photography, a mesh, or an abstract texture (AP-03) |
| Add `bg-accent/20 blur-3xl` glow | "Is this a soft mesh or a garish orb?" | Use pastel mesh with mask dissolve (AP-02) |
| Write "Empower your workflow" | "Would a real engineer say this?" | Write domain-specific telemetry (AP-10) |
| Use `border-accent` on cards/panels | "Is this an expressive marketing showcase or a product/app/docs UI?" | Product/app/docs → use `border-hairline-strong` (AP-12) |
