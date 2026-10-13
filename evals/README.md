# @shavin/ui — AI Agent Evaluation Suite (`evals`)

A native, zero-hallucination benchmark and evaluation suite measuring how accurately AI models and sub-agents generate UI code using `@shavin/ui`.

---

## 1. Directory Structure

```
evals/
├── README.md                 Documentation & evaluation standards.
├── benchmarks/
│   └── prompts.json          20 standardized UI prompts with difficulty ratings.
├── fixtures/                 Real AI-generated TSX code snapshots for evaluation.
│   ├── README.md             How to create and use fixtures.
│   ├── prompt-1.tsx          Clean fixture (100/100 score expected).
│   ├── prompt-4.tsx          Dirty fixture (intentional violations).
│   └── prompt-5.tsx          Clean fixture.
├── personas/
│   ├── beginner.md           Plain-English user prompts without component terms.
│   ├── expert.md             Senior engineer prompts with exact prop signatures.
│   └── strict.md             Cross-framework / trick prompts requiring token enforcement.
└── src/
    ├── evaluator.mjs         8-dimension evaluator (tokens, radius, ARIA, primitives, props, imports, slop, coverage).
    ├── autofix.mjs           Automated code transformer (12+ transformations).
    └── runner.mjs            CLI evaluation runner (fixture-based, no tautology).
```

---

## 2. Running Evaluations

### Benchmark Runner (fixture-based)

```bash
# Evaluate all fixtures against prompts
npm run eval

# Evaluate with verbose violation details
npm run eval -- --verbose

# Evaluate with autofix transformer enabled
npm run eval -- --autofix

# Evaluate a single file
npm run eval -- --file=path/to/code.tsx

# Evaluate with a specific persona
npm run eval -- --persona=expert
```

### Unit Tests

```bash
# Run all unit tests (MCP server, evaluator, autofix, context engine)
npx vitest run tests/unit/

# Run specific test suite
npx vitest run tests/unit/mcp-server.test.ts
npx vitest run tests/unit/evaluator.test.ts
npx vitest run tests/unit/autofix.test.ts
npx vitest run tests/unit/context-engine.test.ts
```

---

## 3. Evaluator Dimensions

The evaluator checks code across 8 dimensions:

| # | Dimension | What It Detects | Score Impact |
|---|---|---|---|
| 1 | **Token & Color Compliance** | Hex colors, rgb/rgba, --n-* foundation vars, raw Tailwind color scales, hardcoded font sizes | -5 to -25 pts |
| 2 | **Radius & Spacing** | Literal rounded-* utilities, arbitrary pixel radius, ad-hoc calc() | -5 to -20 pts |
| 3 | **Accessibility** | Missing data-panel on overlay surfaces | -10 pts |
| 4 | **Component Coverage** | Missing expected components | -0.2 per missing % |
| 5 | **Anti-Copy Slop** | Binary contrast tropes, throat-clearing, buzzwords, lorem ipsum | -10 pts each |
| 6 | **Primitive Usage** | Raw HTML elements (div→Box, p→Text), unicode glyphs (✓→Icon), inline styles with visual properties | -3 to -20 pts |
| 7 | **Prop Compliance** | Wrong prop names (fontWeight→weight), invalid prop values (tone="neutral") | -3 to -15 pts |
| 8 | **Import Hygiene** | Deep imports (@shavin/ui/primitives/*), missing root import | -5 to -15 pts |

---

## 4. Autofix Transformations

The autofix transformer automatically converts non-compliant code:

| # | Transformation | Example |
|---|---|---|
| 1 | Literal radius → token radius | `rounded-lg` → `rounded-[var(--radius-sm)]` |
| 2 | Arbitrary pixel radius → token radius | `rounded-[8px]` → `rounded-[var(--radius-sm)]` |
| 3 | Ad-hoc calc() → concentric utility | `calc(var(--radius-panel) - 5px)` → `rounded-panel-p5` |
| 4 | Foundation vars → semantic tokens | `var(--n-0)` → `var(--bg-canvas)` |
| 5 | Missing data-panel | Adds `data-panel` to overlay surfaces |
| 6 | Hex colors → semantic tokens | `#fff` → `var(--bg-canvas)` (best-effort) |
| 7 | Raw Tailwind colors → semantic | `bg-slate-500` → `bg-surface` |
| 8 | Prop name aliases → correct | `fontWeight="bold"` → `weight="bold"` |
| 9 | Invalid prop values → corrected | `tone="neutral"` → `variant="ghost"` |
| 10 | Glyphs → Icon components | `✓` → `<Icon name="Check" />` |
| 11 | Deep imports → root import | `@shavin/ui/primitives/Button` → `@shavin/ui` |
| 12 | Icon prop → name prop | `icon="check"` → `name="check"` |

---

## 5. Fixtures

Fixtures are real AI-generated code snapshots stored in `evals/fixtures/`. The runner loads these and evaluates them — it does **not** generate its own code.

To add a fixture:
1. Generate code using an AI agent with a prompt from `benchmarks/prompts.json`
2. Save as `prompt-N.tsx` in `evals/fixtures/`
3. Run `npm run eval` to see the score

See `evals/fixtures/README.md` for details.

---

## 6. Personas

Personas modify how prompts are presented to AI agents:

- **beginner**: Plain-English prompts without component names
- **expert**: Exact prop signatures and component references
- **strict**: Cross-framework prompts with raw values that need neutralization

The persona is informational in the current runner — it's used to guide how you prompt your AI agent when generating fixtures.
