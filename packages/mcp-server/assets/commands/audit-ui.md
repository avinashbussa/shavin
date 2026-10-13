# Audit UI for `@shavin/ui` Compliance

Automated recipe to inspect existing code for token purity, accessibility, and concentric geometry compliance.

## Input Argument
$ARGUMENTS (Target File or Component Path, e.g., `src/components/Hero.tsx`, `src/app/page.tsx`, or `all`)

## Instructions

### 0. Read Project Context
- 💡 **If `shavin-mcp` is connected:** Call `get_project_context()` to confirm the project's theme configuration before auditing — this helps identify whether violations are caused by a mismatch between `SHAVIN.md`'s declared theme and the actual code.
- 💡 **Otherwise (No-MCP):** Read `SHAVIN.md` directly for the project's declared theme values. Compare against the code being audited.

- 💡 **MCP path:** If `shavin-mcp` is connected, prefer `shavin_steer({ action: "audit", code, filePath })` over manually re-deriving this checklist — it auto-detects domain intent, snapshots before `polish`, and returns dense pass/fail tuples. If a dev server is running and a browser tab is connected via the Bridge daemon, `get_live_audit` gives real rendered-DOM results instead of static-code analysis.
- 💡 **No-MCP path:** Run `node bin/lint-tokens.mjs $ARGUMENTS` — it implements the Token Purity checks below (§1) deterministically via the same regexes as `@shavin/mcp`'s `validate_code`, with `--fix` for autofixable cases (hex→token, literal radius→token; raw Tailwind color-scale utilities are flagged but not autofixed). Sections §2–§4 below (concentric nesting, typography hierarchy, icons/accessibility) require reading the code against `visual-compositor/concentric-laws.md`, `typography-rules.md`, and `core-rules.md` directly — `lint-tokens.mjs` only covers §1.

Inspect the specified code and report all violations using this checklist:

### 1. Token Purity Check (Zero Tolerance)
- [ ] No hardcoded hex values (`#ffffff`, `#09090b`, `#3b82f6`). Fix: replace with `bg-surface`, `text-fg`, `bg-accent`.
- [ ] No `rgb()` or `rgba()` literals. Fix: replace with semantic classes.
- [ ] No raw Tailwind color classes (`bg-blue-600`, `text-gray-500`, `border-slate-200`). Fix: replace with semantic equivalents (`bg-accent`, `text-fg-subtle`, `border-hairline`).
- [ ] No foundation variable references (`--n-*`). Fix: use semantic variables.

### 2. Concentric Radius Check
- [ ] No literal radius classes (`rounded-lg`, `rounded-xl`, `rounded-2xl`).
- [ ] Container surfaces (cards, dialogs, popovers) use `rounded-[var(--radius-panel)]`.
- [ ] Interactive controls (buttons, textfields, badges) use `rounded-[var(--radius-lg)]`.
- [ ] Concentric nested elements satisfy $R_{\text{inner}} = \max(\text{floor}, R_{\text{outer}} - P)$, floor = `min(radius-lg, radius-panel / 2)` (or use `rounded-panel-p3` / `rounded-panel-p5`).

### 3. Typography Hierarchy Check
- [ ] Headings use `text-fg`.
- [ ] Paired descriptions directly below titles use `text-fg-subtle` (`color="subtle"`), NEVER `text-fg-muted`.
- [ ] `font-mono` is restricted strictly to code snippets, API endpoints, tokens, and hashes (never on standard labels).

### 4. Icon & Accessibility Check
- [ ] No emoji characters in UI text.
- [ ] No handwritten inline `<svg><path .../></svg>` icons. All icons imported from `lucide-react`.
- [ ] Interactive icon buttons have explicit `aria-label` attributes.

### 5. Remediation
Output a concise before/after diff for each violation detected.
