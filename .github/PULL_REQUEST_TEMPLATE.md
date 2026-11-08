## What and why

Describe the change and the problem it solves.

## Checklist

- [ ] Every commit is signed off — run `npm run setup:hooks` once (auto-signs), or use `git commit -s`. See [CONTRIBUTING.md](../CONTRIBUTING.md)
- [ ] Semantic tokens only (`bg-surface`, `text-fg`, `border-hairline`); no hex, `rgb()` or raw Tailwind colour scales
- [ ] Controls use `--radius-lg`, containers use `--radius-panel`; floating surfaces carry `data-panel`
- [ ] Variants use `cva()` and merge `className` with `cn()`; imports come from the `@shavin/ui` root
- [ ] `npm run verify` and `npm test` pass (and `npm run eval` if you changed rules, the validator, autofix or skills)
- [ ] New or changed behaviour has a test in `tests/`
- [ ] The primitive's page in `npm run playground` shows no checklist warnings and every example renders (attach a screenshot if visuals changed)

## How to test

Steps a reviewer can follow.
