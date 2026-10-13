# Selection guide

Choose by content signals, not by vibe. For each section: answer the questions, pick the composition, then check its `Avoid when:` line in the composition file. Every composition ID appears here at least once.

Contents: 0 How to decide · 1 Structural · 2 Hero · 3 Features · 4 Proof · 5 Conversion · 6 Gallery · 7 Editorial · 8 Documentation · 9 Expressive · 10 Style routing · 11 Overview table

---

## 0. How to decide

1. **What is this section's job?** attention · orientation · understanding · credibility · desire · action · reference. The job (in each composition's metadata) is the first filter.
2. **What real content exists?** Count items, measure copy length, list the real visuals (product UI, code, photo, data). A composition whose `Contract:` your content can't meet is the wrong composition.
3. **What does the reader do here?** Read, scan, compare, browse, decide, copy code.
4. **Tie-breakers, in order:** (a) fits the content contract → (b) matches the page's style and treatment → (c) differs from the neighbouring sections → (d) is simpler.

## 1. Structural

| Need | Use | Tie-breaker |
|---|---|---|
| Site navigation | ST1 | Always, unless the page is a one-action campaign |
| Time-bound message above the nav | ST2 | Only if it expires; else put it in a hero or C1 |
| Footer as second navigation | ST3 | ≥ 3 link groups |
| Footer as signature | ST4 | Few links; brand-led, editorial or portfolio |
| Page frame, landmarks, container widths | ST5 | Every page |
| Dashboard / admin / settings frame | ST6 | Persistent nav + working area |

## 2. Hero

| Content signal | Use | Tie-breaker |
|---|---|---|
| One promise, photo/mesh/video or product UI, ≤ 2-line sub | H1 | Sub > 2 lines → H2 |
| Product UI or code snippet, longer copy | H2 | Copy left-aligned; media 1:1 or 5:7 |
| One strong portrait/object image, editorial tone | H3 | Needs a real image; else H5 |
| Cinematic photo/video, mood over explanation | H4 | Needs a scrim plan and a poster; text stays short |
| Only words, strong voice, no product visual | H5 | 3–12 word headline |

## 3. Features

| Content signal | Use | Tie-breaker |
|---|---|---|
| 3, 4 or 6 parallel items | F1 | 5 or 7 items → fix count or F2 |
| 5–9 items of mixed priority | F2 | Fewer than 5 → F1 |
| 2–4 capabilities each with a big visual | F3 | 5+ → F6 |
| Browsable peers (studies, templates) | F4 | Content must be read → F1 or F5 |
| Personas / modes / languages | F5 | > 5 tabs → vertical list or F6 |
| Narrative, one visual updating with steps | F6 | Independent visuals → F3 |
| Real sequence (onboarding, phases, history) | F7 | Not ordered → F1 |
| Two-sided "old way vs. new way" with a figure each | F8 | More than 2 sides or row-level detail → P2 |
| "Connects to your stack" ambient icon scatter | F9 | Needs to be a clickable directory → T3 or G2 |

## 4. Proof

| Content signal | Use | Tie-breaker |
|---|---|---|
| 3–4 short KPIs under the hero | S1 | Needs explanation → S2 |
| 2 or 4 metrics with context/baseline | S2 | Three items → S1 |
| KPIs where one moment of motion helps | S3 | Never for years or versions |
| One strong named endorsement | T1 | Several voices → T2 |
| 3 or 6 varied voices | T2 | Very uneven lengths → trim or masonry |
| ≥ 6 recognisable logos, must be legible | T3 | |
| ≥ 8 logos, compact ambient strip | T4 | Fewer than 8 → T3 |

## 5. Conversion

| Content signal | Use | Tie-breaker |
|---|---|---|
| Closing ask, one action | C1 | Default closer |
| Developer install / copy-run | C2 | Non-technical audience → C1 |
| Emotional, brand-led ending | C3 | Hero uses the same glow → C1 |
| Enquiry / contact / intake | C4 | A single email link would do → C1 with mailto |
| Single-field email/newsletter capture | C5 | More than one field → C4 |
| 2–3 plans | P1 | Many differentiators → add P2 |
| Many features across plans | P2 | Phone-first audience → per-plan accordion |
| One plan | P3 | Pair with T1 or T2 |
| Short FAQ answers | Q2 | Default FAQ |
| Long or code-heavy FAQ answers | Q1 | Mostly phone traffic → Q2 |

## 6. Gallery

| Content signal | Use | Tie-breaker |
|---|---|---|
| Visual catalogue, order irrelevant | G1 | Order matters → grid with row spans |
| 12+ items in categories | G2 | Under ~12 → plain grid |
| Ambient ecosystem teaser | G3 | Always link on to G1 or G2 |
| Selected work with outcomes | G4 | No real outcome → G1 |
| People / team | G5 | Need consent for photos and names |

## 7. Editorial

| Content signal | Use | Tie-breaker |
|---|---|---|
| Article / essay / case-study body | E1 | Reference-style page → D1 |
| Long essay with asides and notes | E2 | Few notes → E1 with footnotes |
| Publication home with ranked stories | E3 | Equal-weight stories → E4 |
| Chronological or thematic index | E4 | Image-led → G4 |

## 8. Documentation

| Content signal | Use | Tie-breaker |
|---|---|---|
| Guides and handbook pages | D1 | Single article → E1 |
| Endpoint / SDK reference | D2 | Conceptual guides → D1 |
| Release notes | D3 | Rare releases with a story → E1 |
| Docs front door | D4 | Never a marketing page |

## 9. Expressive

| Content signal | Use | Tie-breaker |
|---|---|---|
| Strong assets, composition is the message | X1 | Sparse assets → H5 or X2 |
| Manifesto / statement, ≤ ~25 words | X2 | Longer copy → E1 |
| Story section, long scrolling side | X3 | Short scrolling side → F3 |
| Lateral browse of large images | X4 | Comparison needed → G1 or G2 |
| Project index, hover reveals image | X5 | Touch-first audience → needs the inline-thumbnail fallback |

## 10. Style routing

| Style | Default families | Default treatment | Default motion tier |
|---|---|---|---|
| Marketing (SaaS, product) | H1/H2, S1, F1–F5, T1–T4, P*, Q*, C* | carded, or flat for a softer look | Tier 1 |
| Editorial (publication, essay) | E1–E4, H3/H5, T1, ST4 | open or ruled | Tier 0, Tier 1 for reveals |
| Documentation | D1–D4, Q1, ST1, ST3 | ruled or flat | Tier 0 |
| Structural (app, dashboard) | ST5, ST6, ST1 | carded or ruled | Tier 0–1 |
| Hybrid (product + docs + blog) | Marketing home + D4/D1 + E1 | Pick one dominant treatment | Tier 1 |
| Expressive (awwwards-style) | H3/H4/H5, X1–X5, G4, ST4 | open or full-bleed | Tier 1, then choreography if requested |

Motion tier escalation: start at Tier 0. Go to Tier 1 (`layout-motion`) for reveals, hovers, count-ups and marquees. Go to Tier 2 (`layout-choreography`) only for pinned, scrubbed, timeline-driven or page-transition work, and only after the static layout is complete.

## 11. Overview table

| ID | Name | Job | Density | Media it needs |
|---|---|---|---|---|
| ST1 | Navigation Bar | orientation | low | none |
| ST2 | Announcement Bar | attention | low | none |
| ST3 | Sitemap Footer | orientation | high | none |
| ST4 | Statement Footer | desire | low | none |
| ST5 | Page Shell | orientation | low | none |
| ST6 | App Shell | orientation | high | none |
| H1 | Centered Statement Hero | attention | low | product UI |
| H2 | Split Hero | understanding | medium | product UI or code |
| H3 | Asymmetric Hero | desire | medium | photo / illustration |
| H4 | Full-Bleed Media Hero | attention | low | video / photo |
| H5 | Type-Led Statement Hero | attention | low | none |
| F1 | 3-Column Feature Grid | understanding | medium | optional |
| F2 | Bento Grid | desire | high | product UI / data |
| F3 | Alternating Z-Pattern | understanding | medium | large visuals |
| F4 | Card Rail | understanding | medium | thumbnails |
| F5 | Tabbed Feature Explorer | understanding | high | UI / code |
| F6 | Sticky Scroll Steps | understanding | medium | UI states |
| F7 | Process / Timeline | understanding | medium | optional |
| F8 | Comparison Split | understanding | medium | data / illustration |
| F9 | Ecosystem / Integration Diagram | understanding | low | illustration / logos |
| S1 | Horizontal Stat Bar | credibility | low | data |
| S2 | Large Number + Description | credibility | medium | data |
| S3 | Count-Up Row | attention | low | data |
| T1 | Single Large Quote | credibility | low | portrait |
| T2 | Testimonial Card Grid | credibility | medium | portraits |
| T3 | Logo Grid | credibility | low | logos |
| T4 | Marquee Logo Strip | credibility | low | logos |
| C1 | Centered CTA Banner | action | low | none |
| C2 | Split CTA (Text + Code) | action | medium | code |
| C3 | Full-Width Gradient CTA | action | low | none |
| C4 | Contact Split | action | medium | none |
| C5 | Newsletter Capture Banner | action | low | none |
| P1 | 3-Tier Pricing Table | action | high | none |
| P2 | Feature Comparison Matrix | understanding | high | data |
| P3 | Single Card Plan | action | low | none |
| Q1 | Two-Column FAQ | understanding | high | optional code |
| Q2 | Centered Accordion Stack | understanding | medium | none |
| G1 | Masonry Grid | desire | medium | images |
| G2 | Filterable Grid | reference | high | images |
| G3 | Marquee Rows | desire | medium | images |
| G4 | Case Study Index | credibility | medium | photo |
| G5 | People Grid | credibility | medium | portraits |
| E1 | Article Page | reference | medium | optional |
| E2 | Longform with Margin Notes | reference | high | optional |
| E3 | Magazine Front | orientation | high | photo |
| E4 | Archive List | reference | high | none |
| D1 | Docs Shell | reference | high | code |
| D2 | API Reference | reference | high | code |
| D3 | Changelog | reference | medium | none |
| D4 | Docs Landing | orientation | medium | none |
| X1 | Broken-Grid Collage | desire | medium | strong images |
| X2 | Oversized Type Wall | attention | low | none |
| X3 | Sticky Split | understanding | medium | images |
| X4 | Horizontal Track Gallery | desire | medium | large images |
| X5 | Index with Hover Preview | desire | medium | photo |
