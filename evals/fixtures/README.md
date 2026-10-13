# Eval Fixtures

This directory contains **real AI-generated TSX code snapshots** that the evaluation runner tests against.

## How It Works

The runner (`evals/src/runner.mjs`) loads each fixture file and runs it through the evaluator engine (`evals/src/evaluator.mjs`). Unlike the old tautological runner that generated its own clean code, this approach tests the evaluator against actual AI output patterns.

## Naming Convention

Fixture files are named by prompt ID:

```
prompt-1.tsx  →  evaluated against prompt-1 from benchmarks/prompts.json
prompt-2.tsx  →  evaluated against prompt-2
...
```

## Fixture Types

- **Clean fixtures**: Fully token-compliant code that should score 100/100 with zero violations. These verify the evaluator doesn't produce false positives.

- **Dirty fixtures**: Code with intentional violations (hex colors, raw HTML, glyphs, wrong prop names, etc.) that the evaluator should catch. These verify the evaluator catches real-world AI issues.

- **Mixed fixtures**: Partially compliant code with some violations. These test the scoring algorithm and partial credit behavior.

## Adding New Fixtures

1. Generate code using an AI agent (Claude, ChatGPT, etc.) with the prompt from `benchmarks/prompts.json`
2. Save the raw output as `prompt-N.tsx` in this directory
3. Run `npm run eval` to see how the evaluator scores it
4. Use `npm run eval -- --verbose` to see detailed violations
5. Use `npm run eval -- --autofix` to see if the autofix transformer can fix the issues

## Evaluating a Single File

```bash
npm run eval -- --file=path/to/code.tsx
npm run eval -- --file=path/to/code.tsx --autofix --verbose
```
