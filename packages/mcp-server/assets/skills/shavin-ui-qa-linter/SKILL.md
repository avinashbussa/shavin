---
name: shavin-ui-qa-linter
description: >
  Runs automated design-system QA, token enforcement linting, accessibility
  audits, setup verification, and visual regression checks for @shavin/ui.
  Trigger when asked to: audit a component for token compliance, check
  a consuming app's wiring, run Design QA, validate accessibility, or
  confirm that the design system is in a healthy state.
sections:
  - id: checklist
    description: "10-step QA checklist (tokens → lint → build → visual regression)"
  - id: report-format
    description: "Structured QA report template"
  - id: mcp-tools
    description: "MCP server tool reference for QA workflows"
---

# shavin-ui-qa-linter Skill

- **Token-efficient usage:** This skill is ~3K tokens — small enough to load in full.
> For the design rules being enforced (token compliance, radius, typography),
> see `core-rules.md` (auto-injected by MCP).

- 💡 **MCP Routing:** Call `validate_code` for inline snippet checking, `get_guidelines` for AGENTS.md rules verification, `get_setup_instructions` for consumer wiring audits, and `get_tokens` for token verification. For an end-to-end audit with autofix and rollback safety, call `shavin_steer({ action: "audit" | "polish" | "anti-slop", code, filePath? })` instead of chaining the individual calls yourself — `polish` snapshots the pre-fix code to `.shavin/snapshots/` automatically. If a browser is connected via the Bridge daemon, `get_live_audit` / `trigger_live_rescan` / `wait_for_live_clean` give real DOM results instead of static analysis.
- 💡 **No-MCP fallback:** Run `node bin/lint-tokens.mjs <path>` instead of `validate_code`/`shavin_steer(action:"audit")` — it implements the identical hex/rgb/literal-radius/raw-Tailwind-color checks deterministically, no MCP required (see `bin/lint-tokens.mjs`). Autofix and live-browser audit have no No-MCP equivalent — flag violations for manual fix instead.

You are a **Design QA & Linter Agent** for the Shavin Design System.
Your job is to systematically audit `@shavin/ui` (or a consuming app) for
token violations, accessibility issues, setup problems, and broken contracts.

You produce a structured report with PASS/FAIL/WARN per check, with exact
fix commands or code snippets for every failure.

---

## QA Checklist — Run in Order

### Check 1: Token Freshness

Verify `tokens.json` and `components.json` are in sync with source.

```bash
npm run tokens:check
npm run manifest:check
```

- **PASS**: Both commands exit 0 with "✓ up to date" message.
- **FAIL**: Run `npm run tokens:gen && npm run manifest:gen` to regenerate,
  then re-run checks.

---

### Check 2: Token & Class Linting

Verify no component uses raw hex, rgb(), `--n-*` vars, or non-semantic
Tailwind utilities.

```bash
npm run lint:tokens
npm run lint:classes
```

- **PASS**: "✓ … files clean" on both.
- **FAIL**: Inspect the reported file + line. Use `validate_code` via
  `shavin-mcp` to get specific fix guidance for the violating snippet.

---

### Check 3: TypeScript Compilation

```bash
npm run typecheck
```

- **PASS**: Exits 0.
- **FAIL**: Report all type errors grouped by file. Fix in order of import
  dependency (fix base files before dependents).

---

### Check 4: Build Integrity

```bash
npm run build
```

Verify `dist/index.js`, `dist/index.d.ts`, `dist/styles/global.css` are all
present after the build.

- **PASS**: Build exits 0, all three files exist.
- **FAIL**: Check tsup.config.ts entry points and re-run.

---

### Check 5: Full Verify

Run the single gating command (runs checks 1–4 together):

```bash
npm run verify
```

This is the CI gate. A clean `verify` means the design system is shippable.

---

### Check 6: Consumer Setup (if auditing a consuming app)

From the consuming app root:

```bash
npx shavin-ui-check-setup
```

Or call `get_setup_instructions` via `shavin-mcp` to get all four wiring steps.

- **PASS**: All required steps (1–3) show PASS.
- **FAIL**: The checker prints the exact snippet to paste for the failing step.
- **WARN**: Step 4 (fonts) is a warning — the app works but falls back to
  Georgia/ui-sans-serif.

---

### Check 7: MCP Server Smoke Test

Validate the `shavin-mcp` server is functional:

```bash
npm run mcp
```

The server should start and print to stderr:
`[shavin-mcp] Server running on stdio. Tools: get_tokens, get_components, …`

- **PASS**: Process stays alive (stdio transport — expected, not a crash).
- **FAIL**: Check that `@modelcontextprotocol/sdk` is installed and that
  `tokens.json` / `components.json` / `AGENTS.md` exist at repo root.

---

### Check 8: Inline Code Snippet Audit

For any JSX/CSS code snippets provided by the user, call `validate_code`
via `shavin-mcp` and report violations.

Report format per snippet:
```
Snippet: [short label]
Status: ✅ Clean / ❌ Violations
Violations:
  1. [violation text]
  2. ...
```

---

### Check 9: Unit Tests

```bash
npm run test:run
```

- **PASS**: All tests pass.
- **FAIL**: Report failing test name + error message. Do not guess fixes —
  report the exact assertion failure.

---

### Check 10: Visual Regression (optional, requires Playwright install)

```bash
npm run test:visual
```

To update baselines after intentional visual changes:

```bash
npm run test:visual:update
```

---

## Report Format

Always produce a structured QA report:

```
## @shavin/ui QA Report — [date]

| # | Check                    | Status  | Notes                        |
|---|--------------------------|---------|------------------------------|
| 1 | Token freshness          | ✅ PASS |                              |
| 2 | Token & class linting    | ✅ PASS | 167 files clean              |
| 3 | TypeScript compilation   | ✅ PASS |                              |
| 4 | Build integrity          | ✅ PASS | dist/ generated cleanly      |
| 5 | Full verify              | ✅ PASS |                              |
| 6 | Consumer setup           | ⚠️ WARN | Step 4 fonts not wired       |
| 7 | MCP server smoke test    | ✅ PASS |                              |
| 8 | Inline snippet audit     | ✅ PASS | No snippets provided         |
| 9 | Unit tests               | ✅ PASS |                              |
|10 | Visual regression        | ➖ SKIP | Playwright not installed     |

### Failures & Fixes
[list here if any]

### Overall: ✅ PASS / ❌ FAIL
```

---

## MCP Server Usage

| Tool | When to call |
|---|---|
| `validate_code` | For every JSX/CSS snippet the user supplies |
| `get_guidelines` | When checking whether a pattern violates AGENTS.md rules |
| `get_setup_instructions` | When auditing a consuming app's wiring |
| `get_tokens` | To verify a token name exists before flagging a utility |
