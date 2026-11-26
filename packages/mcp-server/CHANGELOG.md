# Changelog

All notable changes to `@shavin/mcp` are recorded here. After 0.1.0, releases are versioned and described with [Changesets](https://github.com/changesets/changesets).

## 0.1.0 — first npm release

A Model Context Protocol server that grounds coding agents in the real @shavin/ui component APIs, tokens and rules.

### What's in it

- 36 tools: component and token lookup, guidelines, skills, `validate_code`, `audit_source`, `autofix_code`, page planning and checks, layout synthesis
- While a project's theme is still unconfirmed (`SHAVIN.md` says `UNSET`, or `.shavin/config.json` has `brandConfirmed: false`), `get_project_context` opens with a note, and `validate_code` and `check_page` repeat it once per session: pick colours and fonts from the brief, apply them with `shavin brand`, and tell the user what you chose after the first page. It is advice, never a failure
- `check_page` warns (never fails) when more than about a third of a project's body sections use `Container size="xl"` or `"full"`, with an exemption for the nav, the footer and containers that carry a background image, video or effect. The layout the synthesizer writes now uses `size="lg"`
- `validate_code` warns (never fails a file) when a layout paints a fixed-tone mesh or a custom gradient through `bgOverlays` with no `surface`: the text keeps the page colour and can be unreadable. Photos, video and `fx:` backdrops are not flagged because the layouts now default them to readable text.
- `plan_page` no longer pushes an overline above every heading: the plan template lists `none` first, and `check_page` warns (never fails) when more than about a third of a project's sections open with a label above the heading
- `plan_page` has a Storefront recipe: briefs that mention a shop, online store, e-commerce, boutique or merch no longer fall back to the SaaS launch recipe
- `plan_page` picks a default hero media from the brief (photo for shops, venues and causes, product UI for software, video for film and music) and prints an options table, so a hero is no longer always a product panel
- `check_page` warns when three or more grid sections in a row render with the same layout (heading alignment, eyebrow and column count), even when their composition IDs differ
- New composition G6 Product Grid (57 compositions); the Storefront recipe uses it for the products row
- Layout synthesis (`synthesize_layout`, `compose_to_canvas`) defaults the brand colour to `monochrome`, not `grass`: a default should not pick a colour for the project.
- A local bridge on `http://127.0.0.1:7036` with a live audit of your open tabs
- A developer can send a finding from the page to the agent: `await_finding` waits for the next one and leases it for two minutes (mark it done with `ack`), `list_findings` reads the queue, and `npx @shavin/cli findings` does the same from a shell for agents without MCP tools. Findings are kept in `.shavin/findings.jsonl` in the project (never in `node_modules`, owner-only permissions) and removed a day after they are done. Set `SHAVIN_STATE_DIR` to keep them elsewhere. Text from the page is always returned as labelled data, not instructions.
- `get_live_audit` also lists what the page inspector finds beyond token purity (text overlap, line height, contrast on a solid background, horizontal overflow, small tap targets, console errors), takes `includeIgnored`, and returns the same text as before when there is nothing new; `wait_for_live_clean` waits for those findings too
- The bridge limits request bodies, re-checks every finding it receives, and stages a block pushed from Studio under `.shavin/studio-pending` when it runs from an installed package
- The bridge only answers this machine: a request whose Host header is not `localhost`, `127.0.0.1`, `[::1]` or `*.localhost` is refused (DNS rebinding), and a browser request from another origin gets 403 with no CORS headers (it used to send `Access-Control-Allow-Origin: *`). Pages on `localhost`, `127.0.0.1`, `[::1]` or `*.localhost` on any port keep working; list more origins in `SHAVIN_BRIDGE_ALLOWED_ORIGINS` (comma separated) or the `allowedOrigins` option. Requests with no Origin (curl, the MCP tools) are unchanged.
- `validate_code` / `autofix_code` concentric radius rules: a control with the panel radius, a container with the control radius, or a nested element that does not fit its parent's padding is reported with the exact class to write (`rounded-panel-pN` from the padding). The autofix is role-aware (controls get `--radius-lg`, containers `--radius-panel`) and flags an ambiguous role instead of guessing
- `render_check`: loads a running local page headless at desktop and mobile width and reports what code cannot show (overlapping text, line-height under the font size, text contrast over the real photo, video or gradient backdrop, horizontal overflow, small tap targets, console errors) and saves screenshots for the agent to look at. Local URLs only; needs Playwright, reports "skipped" without it
- `render_check` also gives info-level notes (never a failure): largest type under 3x the body and an H1 under 48px on marketing pages at 1440, body sentences under 14px, a phone H1 under 28px, a first call to action below the phone fold, and text that moves on a loop that never ends (marquee or ticker: needs a pause control and a still version under reduced motion). App pages (sidebar, aside, app frame, or a table under a small title) skip the marketing type notes. It hides dev-server buttons that float over the page, waits for fades to finish and skips contrast on text still animating
- `plan_page` hero rows carry a `media` field (photo, video, mesh, product-ui or none). `check_page` warns when an H1 to H4 hero has no media, and reminds the agent to find a real photo or video itself and show no caption or note about it
- `check_page` warns about a logo strip right under the hero only when it is the page's only proof (no metrics S1 or S2, no quote T1 or T2). Before, any logo strip under a hero was flagged, though it is a common pattern
- `check_page` plan checks, warnings only: a SaaS or dev-tool plan shows no product in its first three sections; a SaaS plan has no quote section (an info note that allows clearly fictional placeholder quotes); a plan does not end with a footer (ST3 or ST4)
- Studio relay tools (`connect_studio` and friends) to drive Shavin Studio from an agent
- Runs over stdio with `npx -y @shavin/mcp`, or as a remote server
- The bundled skills and component manifest carry the latest `@shavin/skills` and `@shavin/ui` updates, so `get_components` and `get_skill` return them


### Also in this release

Anyone who copied Shavin from the public GitHub repository before this release should read the **Breaking** items.

- `get_setup_instructions` says Next.js and Vite (with React 19) are the supported frameworks and other frameworks come later; the Remix steps are removed. `inspect_environment` reports a failing `framework` check on an unsupported project.
- **Breaking**: tools and assets use the `brand` names (`get_tokens` category `brand`, regenerated `components.json` and skills). See the `@shavin/ui` entry.
- `@shavin/mcp` now depends on `@shavin/cli` (shared doctor).
- `validate_code` warns (does not fail) on `hitArea="none"` and the `hit-area-none` class: they can drop a control below the WCAG 2.2 AA 2.5.8 24px floor. The `WARN` line carries the trade-off and how to restore it (remove the prop, `hitArea="default"`, or a 24px target another way). New `hit-area-lint.mjs`.
- Studio relay: the `studio-session:<code>` Realtime channel is opened as a private channel, and joining checks the pairing code on the server.
- The remote server registers `plan_page` and `check_page`; `check_page` counts compositions passed through wrapper components; synthesized pages use one `@shavin/ui` import.
- The Smithery config lives at the repository root.
- `engines.node` is `>=22`.
- `get_components` lists `EmptyState`, `FormField` and `FormErrorSummary`, and adds traps for `ToastProvider`, `FormField` and `Button`. `check_page` state hints and `plan_page` state maps name the state components; state detection recognises `EmptyState`, `FormErrorSummary`, `FormField error`, `Button loading` and `disabledReason`.
