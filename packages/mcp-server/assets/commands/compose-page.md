---
description: Plan and build a page (or section) from the layout-compositions library — plan first, then code
argument-hint: <brief: what the page is for, style, and any content you already have>
---

Use the `layout-compositions` skill to design and build this page: $ARGUMENTS

Follow its workflow strictly:

1. **Frame the brief.** State the subject, audience, style (structural, marketing, editorial, hybrid, documentation, expressive), the page's job, and the real content available (item counts, copy, visuals, numbers, quotes, code). List anything missing and mark it as a placeholder. Do not invent proof.
2. **Show the plan before any code**, as a table: section → composition ID → treatment → motion tier → one-line reason. With the Shavin MCP, call `plan_page({ brief: "$ARGUMENTS" })` and fill its template; otherwise start from the closest recipe in `page-recipes.md` and choose compositions with `selection-guide.md`. Save the plan as `.shavin/plans/<page>.json` and run `check_page({ plan })`.
3. **Name the variation.** State the two or more knobs changed from the recipe and the single bold moment (see `distinctiveness.md`).
4. Ask me to confirm or adjust the plan only if a choice is genuinely ambiguous; otherwise continue.
5. **Build** using the `@shavin/ui` adapter (`references/adapters/shavin-ui.md`). Read only the composition entries you use (`get_skill({ name: "layout-compositions", section: "<family>" })`). Honour each Contract, Grid and Watch line, and the foundations. Every section is `<Section data-composition="<ID>">`.
6. **Motion:** default Tier 0. Add `layout-motion` presets only where they help. Use `layout-choreography` only if the brief asks for scroll-linked or pinned motion, and only after the static page is complete.
7. **Verify** with `validate_code` per file, `check_page({ targetDir })` for the project, and the checklist in the skill. Report any deviations from the plan.
