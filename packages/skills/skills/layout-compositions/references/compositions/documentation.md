# Documentation compositions (D1–D4)

Docs layouts are for people who are working: finding, reading, copying. They optimise for scanning, stable navigation, and code. Decoration and motion stay minimal. Use `ruled` or `flat` treatments and keep the reading column disciplined even when code is wider.

Contents: D1 Docs Shell · D2 API Reference · D3 Changelog · D4 Docs Landing

---

### D1 · Docs Shell (Three-Pane)
```yaml
id: D1
name: Docs Shell
family: documentation
job: reference
density: high
styles: [documentation, hybrid]
treatments: [ruled, flat, carded]
media: [code, none]
items: sidebar ≤ 3 levels
slots: [header, sidebar, content, toc, pager, feedback]
motion: tier1
```
**Best for:** Product docs, guides, handbooks and API guides of any size.
**Avoid when:** The content is a single long article (use E1) or marketing copy.
**Grid:** `base`: header + a collapsible nav drawer; content full width; an "On this page" disclosure replaces the TOC. `lg`: sidebar ≈ 260px + content (prose ≤ 72ch; code may run wider). `xl`: add a sticky right TOC ≈ 220px.
```
┌───────────┬──────────────────────┬────────────┐
│ Sidebar   │ Breadcrumb / Title   │ TOC        │
│ ▸ Start   │ Prose (72ch) + code  │ · Intro    │
│ ▾ Guides  │ callouts, tables     │ · Setup    │
│ Current   │ ← Prev    Next →     │ · Usage    │
└───────────┴──────────────────────┴────────────┘
```
**Contract:** Sidebar tree ≤ 3 levels with the current page marked `aria-current`. Breadcrumb, previous/next pager, and an "Edit" or feedback link on every page. TOC built from `h2`/`h3` with scroll-spy (Tier 1).
**Watch:** Nested scroll containers break anchors and find-in-page: offset anchors with `scroll-margin-top`. A search shortcut (`/` or ⌘K) should exist. Code blocks: copy button, language label, horizontal scroll (not wrap), contrast ≥ 4.5:1. Callouts (note, warning) use icon + text label, never colour alone. Sticky sidebar height = `100svh` − header. Version switcher when docs are versioned.

### D2 · API Reference (Prose + Code Rail)
```yaml
id: D2
name: API Reference
family: documentation
job: reference
density: high
styles: [documentation]
treatments: [ruled, flat]
media: [code]
items: n endpoints
slots: [endpoint-header, params, examples, responses, errors]
motion: tier0
```
**Best for:** REST/GraphQL/SDK reference where description and example are read side by side.
**Avoid when:** The docs are conceptual guides (use D1 with prose).
**Grid:** `base`: stacked (description, parameters, then examples). `lg`: 2 columns (5:4): left = description + parameters table; right = sticky code panel with language tabs and a response sample.
```
┌─────────────────────────┬─────────────────────┐
│ POST /v1/items          │ curl · js · py      │
│ Auth: bearer token      │ curl -X POST ...    │
│ Parameters (table)      │                     │
│ name  type  required    │ Response 200        │
│ Errors                  │ { "id": "..." }     │
└─────────────────────────┴─────────────────────┘
```
**Contract:** Per endpoint: method + path, auth, parameters (name, type, required, description), example request and response, error codes.
**Watch:** A sticky code rail taller than the viewport must scroll internally. Nested-object parameters need collapsible rows. Left-to-right tab order must match reading order. Copy buttons on every code block. Never show real secrets in samples.

### D3 · Changelog (Dated Timeline)
```yaml
id: D3
name: Changelog
family: documentation
job: reference
density: medium
styles: [documentation, marketing, hybrid]
treatments: [ruled, open, flat]
media: [none, product-ui]
items: n releases
slots: [version, date, change-group, link]
motion: tier0
```
**Best for:** Release notes and product updates people scan for "what changed".
**Avoid when:** You publish rarely and want a story (use E1).
**Grid:** `base`: stacked entries. `md`: 12-col; version + date `col-span-3` (sticky), notes `col-span-9`, grouped under Added / Changed / Fixed / Removed / Security.
```
┌───────────────┬───────────────────────────────┐
│ v2.4.0        │ Added                         │
│ 12 Mar 2026   │ · New export option           │
│               │ Fixed                         │
│               │ · Layout shift in tables      │
├───────────────┼───────────────────────────────┤
│ v2.3.2        │ Fixed                         │
└───────────────┴───────────────────────────────┘
```
**Contract:** Each release is an `<article>` with the version and a `<time>` date. Breaking changes are flagged at the top with a link to the migration guide. One anchor per version.
**Watch:** Tag badges need a text label (not colour only). Offer a feed (RSS/Atom). Long histories paginate.

### D4 · Docs Landing (Search + Quickstart)
```yaml
id: D4
name: Docs Landing
family: documentation
job: orientation
density: medium
styles: [documentation, hybrid]
treatments: [ruled, flat, carded, open]
media: [none, illustration]
items: 3 paths + ≤ 12 topics
slots: [search, start-paths, topic-grid, popular]
motion: tier0
```
**Best for:** The front door of a documentation site.
**Avoid when:** It's turning into a marketing page: docs landings exist to get people to the right page fast.
**Grid:** Centred search field (≤ 640px) in the header block; a row of ≤ 3 "start here" paths (`base` 1 col, `md` 3); a browse-by-topic grid (`base` 1 · `sm` 2 · `lg` 3–4); a short "popular" list.
```
┌───────────────────────────────────────────────┐
│                 Documentation                 │
│       [ Search the docs…            ⌘K ]      │
├───────────────┬───────────────┬───────────────┤
│   Quickstart  │     Guides    │ API reference │
├───────────┬───┴───────┬───────┴───┬───────────┤
│   Topic   │   Topic   │   Topic   │   Topic   │
│   Topic   │   Topic   │   Topic   │   Topic   │
└───────────┴───────────┴───────────┴───────────┘
```
**Contract:** Search works and shows its shortcut. Exactly three primary paths. Topics ≤ 12, named in users' words rather than the system's.
**Watch:** Define the empty-results state and recent searches. If search needs JS, link to a full index for no-JS use.
