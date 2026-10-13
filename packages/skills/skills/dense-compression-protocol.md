---
name: dense-compression-protocol
description: Protocol for compressing @shavin/ui design system token & component guidance for high-speed, token-efficient AI agent prompt context.
---

# `@shavin/ui` Dense Agent Protocol

Apply this protocol when providing `@shavin/ui` token rules, component contracts, or layout specifications to LLM agents or subagents.

## Core Objective
Compress UI guidance prose by 50-60% while preserving 100% of technical rules, ARIA contracts, and token constraints.

## Compression Rules

### 1. Stripping Fluff
- Drop articles (`a`, `an`, `the`).
- Remove filler verbs (`is used for`, `provides support for`, `allows developers to`).
- Omit subject when context is clear.

### 2. Shorthand Notation
- `w/` = with
- `w/o` = without
- `+` = and
- `;` = clause separator
- `/` = inline options/variants

### 3. Hard Signal Words (MUST PRESERVE)
Never strip or abbreviate these behavioral signal words:
- `MUST` / `NEVER` / `ONLY`
- `CAPPED` / `PILL` / `SEMANTIC`

## `@shavin/ui` Compressed Ruleset Example

```markdown
# @shavin/ui Core Rules (Dense)
1. Tier-1 (`--n-*`) global.css ONLY. Tier-2 semantic vars (`bg-surface`, `text-fg`, `border-hairline`) EVERYWHERE ELSE. ZERO hex/rgb.
2. Controls (`Button`, `TextField`, `Badge`): `--radius-lg` (`rounded-[var(--radius-lg)]`). Capped pill preset.
3. Containers (`Card`, `Dialog`, `Menu`, `Popover`): `--radius-panel` (`rounded-[var(--radius-panel)]`). NEVER pill on containers.
4. Concentric nesting: R_inner = max(floor, R_outer - P), floor = min(radius-lg, radius-panel / 2). Use `rounded-panel-p3`, `rounded-panel-p5`.
5. Variant pattern: `cva()` + `cn()`. Import ONLY `@shavin/ui` root.
```
