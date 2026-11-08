---
name: shavin-core
description: >
  Decides which Shavin skill fires for a request, reads the SHAVIN.md site and
  mode defaults, explains how skills reference MCP tools with a no-MCP fallback, and lists
  every @shavin/mcp tool. Includes the anti-slop quick reference and token checklist.
sections:
  - id: skill-dispatch
    description: "Skill dispatcher table, SHAVIN.md static per-project defaults, and MCP/No-MCP tool reference"
  - id: shavin-template
    file: SHAVIN.template.md
    description: "Starter SHAVIN.md template with the Site & Mode Defaults section — copy to project root and fill in"
  - id: token-discipline
    description: "Strict two-tier token invariants"
  - id: anti-slop-invariants
    description: "Quick-reference table of named anti-patterns (AP-01–AP-13); full catalogue in visual-compositor/anti-patterns.md"
---

# shavin-core Skill — Skill Dispatch, Project Defaults & Tool Reference

Use this skill to decide which Shavin skill fires for a request, to read a project's per-repo defaults from `SHAVIN.md`, and to look up the real `@shavin/mcp` tools instead of guessing their names.

---

## 1. Skill Dispatch & Site Defaults

This section is the answer to two problems the skill package didn't previously solve on its own: **which skill fires** when a request could plausibly match more than one, and **what a project's default mode is** without re-guessing it from scratch on every prompt.

### 1a. Skill Dispatcher

Before loading a domain skill, check the request against this table top-to-bottom — first match wins:

| Signal | Skill |
|---|---|
| Explicit slash command (`/create-screen`, `/create-block`, `/create-primitive`) | Follow that command's own routing — see `commands/` |
| Request names a specific existing screen/route to preview, drag, or visually compose before merging | `shavin-ui-builder` |
| Request is to audit, lint, or fix token violations in existing code | `shavin-ui-qa-linter` |
| Project's `SHAVIN.md` declares `Site Type: DOCS`, or request mentions "docs portal", "API reference", "changelog" | `shavin-webpage` (loads `visual-compositor` in `DOCS` mode) |
| Project's `SHAVIN.md` declares `Site Type: MARKETING`/`EDITORIAL`, or request matches `shavin-webpage`'s marketing/landing triggers | `shavin-webpage` |
| Project's `SHAVIN.md` declares `Site Type: APP`, or request matches `shavin-app`'s dashboard/SaaS triggers | `shavin-app` |
| None of the above resolve it, and the request is spatial/visual in nature (padding, radius, typography, motion) with no clear domain | `visual-compositor` directly, mode per its own Activation Modes table |
| Still ambiguous (e.g. "marketing dashboard", "admin landing page") | Ask the user which domain they mean, or default to whichever domain the majority of the current codebase already uses (check `package.json` name / existing routes) |

This resolves the overlap between `shavin-app` and `shavin-webpage` that existed before this rebuild — previously nothing arbitrated between them and each session could pick differently for the same kind of request.

### 1b. SHAVIN.md — Per-Project Static Defaults

`SHAVIN.md` already exists as a real, shipped mechanism (`@shavin/mcp`'s `shavin_steer` tool's `init_brain` action creates it; `get_project_context` parses it via `parseShavinManifest`). Its current default schema (Product Name, Domain, Primary Accent, Neutral Scale, Theme Mode, Scaling/Density, Base Radius, Panel Background) has no field for **which site this is or what its default visual mode should be** — meaning every project re-infers mode from scratch on every single prompt. This rebuild adds one section to close that gap:

```md
## 3. Site & Mode Defaults
- **Site Type**: `MARKETING` | `APP` | `DOCS`
- **Default Visual Mode**: `STRUCTURAL` | `MARKETING` | `EDITORIAL` | `HYBRID` | `DOCS`
```

Example for `shavin.cc`:
```md
## 3. Site & Mode Defaults
- **Site Type**: `MARKETING`
- **Default Visual Mode**: `EDITORIAL`
```

Example for `docs.shavin.cc`:
```md
## 3. Site & Mode Defaults
- **Site Type**: `DOCS`
- **Default Visual Mode**: `DOCS`
```

Read `SHAVIN.md` directly (`view SHAVIN.md` or equivalent file read) before falling back to per-prompt keyword inference — this works identically whether or not `shavin-mcp` is connected, since it's a plain file in the repo root, not a tool call. A starter template is at `.agents/skills/shavin-core/SHAVIN.template.md`.

**Important — do not trust `get_skill_mode` or `synthesize_layout`'s mode guess over this file or over `visual-compositor/SKILL.md`'s own Activation Modes table.** The `@shavin/mcp` server as currently shipped contains three separate, mutually-disagreeing mode classifiers:
- `get_skill_mode(prompt)` — only returns `STRUCTURAL` (default)/`MARKETING`/`EDITORIAL`, never `HYBRID` or `DOCS`.
- `synthesize_layout`'s internal `determineActivationMode()` — different keywords, different priority order, defaults to `HYBRID`.
- `shavin_steer`'s internal `detectDomainIntent(code)` — operates on code, not prompts, and uses an entirely different label vocabulary (`"GEOMETRIC (Concentric Layout)"`, etc).

None of these three currently read `SHAVIN.md`. Until the MCP server itself is patched to unify around this table, treat any of their outputs as a fast heuristic hint only, never as authoritative — the skill's own static Activation Modes table (`visual-compositor/SKILL.md`) plus `SHAVIN.md`'s `Default Visual Mode` are the source of truth.

### 1c. MCP vs. No-MCP: How Every Skill Should Reference Tools

`@shavin/skills` can be installed standalone (per its `package.json`, it has zero runtime dependencies on `@shavin/mcp`), so every "MCP Routing" callout in every skill must degrade gracefully when `shavin-mcp` isn't connected. Use this two-branch pattern everywhere a skill would otherwise say "call tool X":

```
- 💡 If `shavin-mcp` is connected: call `get_skill({ name, section })` / `get_tokens` / etc.
- 💡 Otherwise (No-MCP): read the file directly — `view skills/<name>/<file>.md` — same content, no MCP required. For token/color linting, run `node bin/lint-tokens.mjs <file>` (bundled with this package; mirrors `@shavin/mcp`'s `validate_code` exactly, see below).
```

Write MCP-routing tips (and any rule that must survive dense mode) as bullet list items (`- 💡 ...`) or tables, never as `>` blockquotes or bare paragraphs. Why: `get_skill` returns skills in a compressed dense form by default, and that form drops blockquotes; bullets and plain tables always survive.

**Full tool inventory** (`npm run agents:check` fails if a tool is missing here; reference this instead of guessing tool names):

| Tool | Use for |
|---|---|
| `plan_page(brief, page?, pageType?, style?)` | **Call before writing any page or section.** Recipe + per-section composition candidates + treatment/motion defaults + a plan template to fill. |
| `check_page(plan?, targetDir?)` | Check the filled plan, then the code: every `<Section data-composition="<ID>">` must match `.shavin/plans/*.json`. |
| `get_skill(name, section?, density?)` | Fetch skill markdown. Default `density: "dense"` — see the bullet rule above. |
| `get_skill_mode(prompt)` | Fast mode heuristic — advisory only, see 1b. |
| `list_skills()` | Enumerate all skills + their headings. |
| `get_tokens(category?, name?, density?)` | Query `tokens.json` semantic design tokens. |
| `get_components(name?, density?)` | Query `components.json` primitive specs/variants. |
| `get_builder_schema(category?)` | Block registry for canvas/builder synthesis. |
| `get_block_template(key)` | Full AST tree for one block key. |
| `synthesize_layout(prompt, category?, theme?)` | Generate a complete multi-section page from a prompt — referenced in `/create-screen` and `shavin-ui-builder`. |
| `validate_code(code, density?)` | Lint JSX/TSX for raw hex/rgb/literal-radius/raw-Tailwind-color violations. |
| `autofix_code(code)` | Auto-transpile legacy code to semantic tokens. |
| `shavin_steer(action, code?, filePath?, density?)` | Actions: `audit`, `polish`, `harden`, `typeset`, `anti-slop`, `rollback`, `init_brain`, `bolder`, `quieter`. Snapshot-backed (writes to `.shavin/snapshots/`). |
| `get_guidelines(section?)` | Query `AGENTS.md` sections. |
| `get_project_context(targetDir?, format?)` | Live manifest: theme, alignment score, `SHAVIN.md` state, prompt-injection block. |
| `get_setup_instructions(framework?)` | `@shavin/ui` install/wiring steps. |
| `inspect_environment(targetDir?)` | Setup compliance audit (Tailwind v3/v4 wiring, CSS, ThemeProvider, SHAVIN.md, AGENTS.md, `.agents/`, `.shavin/config.json`). |
| `install_skills(targetDir?)` | Copy `.agents/skills/` + `AGENTS.md` into a target project. |
| `get_live_audit(path?, tabId?, filter?, format?)` | Live DOM audit from a connected browser tab (Bridge daemon). |
| `trigger_live_rescan(path?, tabId?)` | Force a live rescan. |
| `wait_for_live_clean(path?, tabId?, timeoutMs?)` | Block until a live tab reaches 0 violations, or timeout. |
| `audit_source(targetDir?)` | Architectural compliance scan of `.tsx/.jsx` sources (raw HTML vs primitives, deep imports). Warnings only. |
| `list_commands()` | Enumerate slash commands in `.agents/commands/`. |
| `connect_studio(pairingCode)` | Pair with a live Studio session (6-char code from studio.shavin.cc → the Connect AI panel, star tab in the inspector). Required before the relay tools below. |
| `compose_to_canvas(prompt, frame?)` | Synthesize a layout and render it live on the Studio canvas. |
| `inject_blocks(blocks, mode?, frame?)` | Inject a raw `BlockNode[]` tree onto the canvas. |
| `get_studio_state(timeoutMs?)` | Read current canvas blocks + theme. |
| `set_studio_theme(accent, …)` | Change accent/gray/radius/mode/scaling/panel background live. |
| `clear_studio_canvas()` | Empty the canvas. |
| `disconnect_studio()` | End the Studio session. |

---

## 2. Anti-Slop Visual & Atmospheric Invariants

When composing blocks, pages, or screens, strictly avoid the causes of "AI slop" degradation. The full named catalogue with code examples, remediation, and a decision table lives in `visual-compositor/anti-patterns.md` (AP-01 through AP-13). The governing principle:

> **Prefer typographic hierarchy (size, weight, color, spacing) over decorative elements (badges, pills, chips, colored dividers) for structural/organizational labeling. Reserve decorative elements for stateful, interactive, or status-bearing information only.**

### Quick Reference (see anti-patterns.md for full detail)

| ID | Anti-Pattern | One-line rule |
|---|---|---|
| AP-01 | Defensive Minimalism | Token purity ≠ flat wireframes. Use layered atmospheric depth. |
| AP-02 | Ambient Accent Glow Balls | NEVER `bg-accent/20 blur-3xl` orbs — use diffuse pastel meshes. |
| AP-03 | Literal Stock Photos | NEVER cliché stock (laptops, handshakes, offices) or tiny screenshots — use Lummi/Unsplash photography, mesh gradients, or video backdrops behind a scrim. 3D = optional decoration only. |
| AP-04 | Badge Soup | Max 1 `<Badge>` per section (stateful only). Use overline text for labels. |
| AP-05 | Paragraph Walls | 1 paired description, 15–25 words max, `text-fg-subtle`. |
| AP-06 | Metric Clutter in Heroes | Move metrics to dedicated section below fold. |
| AP-07 | Kitchen-Sink Bento Grids | Max 3–4 cards with generous gaps. |
| AP-08 | Status-Chip Soup | Hierarchy before labels. Size/weight/contrast do 90% of the work. |
| AP-09 | Over-Containment | Proximity before containers. Don't wrap every item in a card. |
| AP-10 | Vacuous Copywriting | Domain-specific telemetry, not tech clichés. |
| AP-11 | Lazy Placeholder Content | Authentic microcopy, never "Card Title" / "Lorem ipsum". |
| AP-12 | Harsh Border Glare | In apps and docs use `border-hairline` / `border-hairline-strong`, not `border-accent`, on cards. |
| AP-13 | Sparkles Icon | No sparkles for "AI"; use a domain icon, or `<Murmur>` for AI activity. |

- 💡 If `shavin-mcp` is connected: call `get_skill({ name: "visual-compositor", section: "anti-patterns" })` for the full catalogue.
- 💡 Otherwise (No-MCP): read `skills/visual-compositor/anti-patterns.md` directly.

---

## 3. Token Invariants & Verification Checklist

- [ ] **Zero Color Literals**: No hex codes (`#fff`), no `rgb()`, no `--n-*` foundation scales outside `global.css`. Only semantic tokens (`bg-surface`, `bg-canvas`, `text-fg`, `text-fg-subtle`, `border-hairline`, `accent`).
- [ ] **Typography Hierarchy**: Primary title MUST use `text-fg`; paired description MUST use `text-fg-subtle` (`color="subtle"`), never `text-fg-muted` — except on dark media (`surface="dark-always"`), where subtitles use `text-fg-muted`.
- [ ] **Concentric Geometry**: Containers/panels use `rounded-[var(--radius-panel)]`; controls use `rounded-[var(--radius-lg)]`. Nested containers use `rounded-panel-p5` or $R_{\text{inner}} = \max(\text{floor}, R_{\text{outer}} - P)$ (floor = `min(radius-lg, radius-panel / 2)`).
- [ ] **Overlays**: Any floating panel/menu/modal MUST include `data-panel` attribute.
- [ ] **Atmospheric Depth**: Uses soft pastel mesh backgrounds and subtle scrims; zero `blur-3xl` saturated accent glow balls (AP-01, AP-02).
- [ ] **Asset Choice**: Uses curated Lummi/Unsplash/user photography, mesh gradients, or video backdrops (`bgImage` / `bgVideo` + `bgPoster` / `bgOverlays`) behind a scrim; 3D renders only as optional decoration; zero cliché stock or tiny screenshots (AP-03).
- [ ] **Layout Restraint**: Layout is airy and uncluttered; zero metric dumps or paragraph walls in hero (AP-04–AP-07).
- [ ] **Hierarchy before Labels**: Typographic hierarchy (size/weight/contrast) does 90% of the work; at most 1 badge per section, overline text for labels (AP-04, AP-08).
- [ ] **Verification**: Run `npm run tokens:check` and `npm run typecheck` before pushing.
