---
description: Add or revise a composition in the library, keeping metadata, wireframes and the selection guide consistent
argument-hint: <name and short description of the new composition>
---

Add or revise a composition in the `layout-compositions` skill: $ARGUMENTS

1. Read `references/metadata-schema.md` and one existing entry in the target family for tone and depth.
2. Decide the family (create a new family file only if none fits) and the next unused ID. Never reuse or renumber IDs.
3. Write the entry in the standard format: yaml metadata, Best for, Avoid when, Grid (with breakpoints and spans), a `wf` wireframe, Contract, Watch. Make the `Avoid when` line name the better alternative by ID.
4. Run `python scripts/render_wireframes.py references/compositions/<family>.md` to align the wireframe; fix any truncation warnings.
5. Register it: add the ID to the decision table and overview table in `references/selection-guide.md`, and to any relevant recipe in `references/page-recipes.md`. If it supports motion, add a row to `layout-motion/references/composition-motion-map.md`.
6. Run `python scripts/validate_library.py` and fix every error.
7. Summarise what changed and note any existing composition that this one overlaps with.
