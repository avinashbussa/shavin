---
description: Audit an existing page or component against the layout-compositions library and report fixes
argument-hint: <file path, URL, or pasted markup to audit>
---

Audit this page against the `layout-compositions` library: $ARGUMENTS

If it is a file or directory, read it. If it is a URL, fetch it. Then:

1. **Identify** each section and the composition (by ID) it most resembles, or note "no match". Note the treatment in use and the motion tier.
2. **Check each section** against that composition's `Contract`, `Grid`, `Avoid when` and `Watch` lines.
3. **Check the page** against `foundations.md`: measure in `ch`, concentric radii, spacing rhythm (no three consecutive identical grids), responsive behaviour and reading order, accessibility baseline (headings, landmarks, focus, contrast, reduced motion, auto-moving content), performance (LCP media, CLS, lazy loading), stress tests.
4. **Check distinctiveness** with `distinctiveness.md`: the sameness test and the list of common tells.
5. **Report** as a table sorted by severity: location · issue · why it matters · concrete fix (with the composition ID or foundation rule that applies). Separate "must fix" (accessibility, broken layout, misleading proof) from "should improve" and "consider".
6. End with the three highest-impact changes. Don't rewrite the page unless I ask; offer to apply the fixes.
