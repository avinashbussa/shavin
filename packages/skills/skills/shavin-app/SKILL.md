---
name: shavin-app
description: >
  Guides the architecture, layout partitioning, interaction patterns, state management,
  and implementation of SaaS web applications, dashboards, AI chat tools, admin consoles,
  and complex product interfaces using @shavin/ui as the base design system engine, powered by
  visual-language-skills cognitive design principles and Vercel Web Interface Guidelines.
sections:
  - id: philosophy
    description: "Applications as decision-support tools"
  - id: primitives
    description: "@shavin/ui application primitive hierarchy"
  - id: density
    description: "Product density standard (14px token base)"
  - id: state
    description: "4-states rule and interaction quality"
  - id: layouts
    description: "Standard application layout architectures"
  - id: copy
    description: "Anti-slop microcopy standards"
  - id: checklist
    description: "Pre-flight verification checklist"
---

- **Token-efficient usage:** This skill is ~3,300 tokens. For specific rules, call:
> - `get_skill({ name: "shavin-app", section: "density" })` — density standards
> - `get_skill({ name: "shavin-app", section: "state" })` — 4-states rule
> - `get_skill({ name: "shavin-app", section: "layouts" })` — layout patterns
>
> **Core rules (token compliance, radius, typography):** Auto-injected by MCP or see `core-rules.md`.

# shavin-app Skill

- 💡 **MCP Routing:** Call `get_skill({ name: "shavin-app", section: "<topic>" })` to fetch targeted rules on demand (e.g. `section: "density"`, `section: "layout"`, `section: "state"`, `section: "checklist"`). Call `get_tokens` or `get_components` via `shavin-mcp` for live DS specs.
- 💡 **No-MCP fallback:** Read this file's sections directly (`view skills/shavin-app/SKILL.md`) — identical content, no tool call needed. For token/color values, read `packages/ui/tokens.json` / `components.json` directly instead of `get_tokens`/`get_components`. For linting, run `node bin/lint-tokens.mjs <path>` instead of `validate_code`.

You are an **Application Product Architect & Engineer** using the **Shavin Design System (`@shavin/ui`)**. Your purpose is to architect, partition, and implement dense, reliable, highly interactive, and accessible SaaS web applications, AI chat tools, administrative consoles, and workspace dashboards.

This skill synthesizes **`@shavin/ui` application primitives** with the cognitive laws of **`visual-language-skills`** and **Vercel Web Interface Guidelines** to eliminate AI UI slop, guarantee 100% state coverage, and deliver product interfaces that feel fast, predictable, and human-considered.

---

## 1. Core Philosophy: Applications as Decision-Support Tools

> **Law 4:** Attention is finite. Every screen has a budget. If every metric is highlighted in bright colors, nothing is important.
> **Law 5:** Consistency enables prediction. The same action must always behave the same way.
> **Law 10:** Good design reduces interpretation. If users have to guess where they are or what a button does, the interface has failed.

Web applications are tools for decision-making and task execution. Every application screen must satisfy three fundamental user questions within 3 seconds:
1. **Where am I?** (Active navigation indicator, page breadcrumbs, clear header title)
2. **What is the primary action?** (Single dominant primary CTA)
3. **How do I undo / return?** (Clear back navigation, Escape key handlers, cancel affordances)

---

## 2. Base Engine: `@shavin/ui` Application Hierarchy

Always compose applications using native `@shavin/ui` application primitives:

| Category | `@shavin/ui` Primitives to Use |
|---|---|
| **App Chrome & Layout** | `<AppFrame>`, `<Sidebar>`, `<SidebarBody>`, `<SidebarFooter>`, `<SidebarSection>`, `<SidebarNavItem>`, `<SidebarTrigger>`, `<TopBar>`, `<ActionBar>`, `<BottomNav>`, `<Container>`, `<Grid>`, `<Flex>` |
| **Overlays & Modals** | `<Dialog>`, `<AlertDialog>`, `<Popover>`, `<ContextMenu>`, `<Menu>`, `<Tooltip>` |
| **Inputs & Form Controls** | `<TextField>`, `<TextArea>`, `<Select>`, `<Dropdown>`, `<Combobox>`, `<Checkbox>`, `<Switch>`, `<RadioGroup>`, `<Slider>`, `<ColorPicker>`, `<IconPicker>`, `<DatePicker>`, `<TimePicker>` |
| **Data & Workspaces** | `<Table>`, `<TableHeader>`, `<TableBody>`, `<TableRow>`, `<TableColumnHeaderCell>`, `<TableCell>`, `<DataList>`, `<DataListItem>`, `<StatCard>`, `<CardRow>`, `<Row>`, `<RowDragHandle>`, `<Stepper>`, `<Tabs>`, `<SegmentedControl>`, `<ChatBubble>`, `<Murmur>`, `<Reasoning>`, `<ToolCall>`, `<FileOutput>`, `<VoiceInput>`, `<Toast>`, `<Skeleton>`, `<Spinner>`, `<Progress>` |

---

## 3. Product Density Standard (14px Token Base) & Font Protocol

Unlike marketing websites (which use 16px body text), `@shavin/ui` applications enforce an **application density baseline**:
- Default body font size: `0.875rem` (**14px**, `text-sm`) with `1.25rem` line-height.
- `<Text>` primitive defaults to `size="sm"` (`14px`).
- Form labels, table cells, sidebar links, and data rows default to `text-sm` density for maximum productivity without visual clutter.

> **Font loading, typography hierarchy, concentric radius, token compliance:** See `core-rules.md` (auto-injected).

---

## 4. Mandatory State & Interaction Quality Standards

### A. The 4-States Rule (100% State Coverage)
Every data surface, list, table, or dashboard MUST explicitly implement all 4 states:
1. **Loading State**: Use `<Skeleton>` loaders matching layout dimensions, or `<Spinner size="md" />` inside CTA buttons.
2. **Empty State**: Provide clear icon, explanation text (`<Text color="muted">`), and primary onboarding CTA. Never leave blank space.
3. **Error State**: Display `<Callout tone="danger">` with explicit "Retry" buttons; scroll and focus the first invalid field on form submit.
4. **Success State & Optimistic Feedback**: Trigger `<Toast>` notifications ("Changes saved") and use `<AlertDialog intent="danger">` for destructive actions (Cancel focused by default).

### B. Vercel Web Interface & Ergonomic Guidelines
1. **Hit Targets**: Minimum touch target $\ge 44\text{px}$ on mobile. Small icon buttons must expand hit area via padding or pseudo-elements.
2. **Form Ergonomics**:
   - Mobile input zoom is handled by the primitives: `TextField`, `TextArea`, `Select` and `Combobox` render 16px below `md` and 14px from `md` up. Do not add `text-base`/`text-sm` via `className` on them.
   - `Flex`, `Stack` style layout primitives default to `gap="3"` (12px), including `direction="column"`. A name + description pair (title over subtitle) must set `gap="0"` or `gap="1"` explicitly; otherwise the two lines float apart.
   - Controls that share a row or toolbar must use the same `size` (heights match Button: sm 32px, md 40px, lg 48px). Never size them with `className` (no `h-*`, `py-*` or text-size overrides). Example: `<TextField size="md" />` beside `<Select size="md" />` beside `<Button size="md">`.
   - Never block paste in `<input>` or `<textarea>` (allow 2FA codes & passwords).
   - `Enter` submits single inputs; `⌘/Ctrl+Enter` submits `<textarea>`.
   - Never disable buttons while filling form; keep submit enabled until request starts, then show `<Spinner>` while preserving button width.
3. **Concentric Radius:** See `core-rules.md` (auto-injected).
4. **Compositor Animation Rule**:
   - Animate compositor-only properties (`transform`, `opacity`); NEVER animate layout geometry (`width`, `height`, `top`, `left`).
   - Never use `transition: all` — list transition properties explicitly (`transition-colors`, `transition-transform`).
5. **URL & Navigation Synchronization**:
   - Active tabs, search filters, pagination steps, and drawer states MUST sync to URL search params (`useSearchParams`) to support deep-linking and browser back/forward history.
   - Navigation links must use `<a>` or `<Link>` (never `<div onClick>`).
6. **Overlay & Dialog Hygiene**:
   - Apply `overscroll-behavior: contain` on popovers/drawers to prevent canvas scroll bleed.
   - Use horizontal ellipsis (`…`) for menu actions opening follow-up dialogs ("Rename…", "Export…") and pending states ("Loading…").
   - **Modals are not all one shape.** Choose `<Dialog layout>` from the moment: `default` (title row + close, hairlines) for forms and settings; `centered` (centred title, no hairlines, centred footer; `footerAlign="stretch"` on mobile) for invites, success and short decisions; `bare` + `divided={false}` for pickers and composers that lead with their content. Never stack header/body/footer hairlines on every modal, and use `AlertDialog` for destructive confirms.

---

## 5. Standard Application Layout Architectures

### Pattern A: Workspace Dashboard Shell
`AppFrame` is the responsive shell. It measures its own width: wide, the `Sidebar` sits in flow; below 768px the same `Sidebar` becomes a slide-in drawer and `<SidebarTrigger />` in the `TopBar` appears by itself. Write the navigation once.

```tsx
<AppFrame
  routeKey={pathname}
  sidebar={
    <Sidebar width="w-60">
      <SidebarHeader><Heading as="p" size="sm" tracking="tight">Acme</Heading></SidebarHeader>
      <SidebarBody>
        <SidebarSection title="Workspace">
          <SidebarNavItem icon={<Icon name="layout-dashboard" size="sm" />} label="Overview" active />
          <SidebarNavItem icon={<Icon name="table" size="sm" />} label="Data Grid" />
        </SidebarSection>
      </SidebarBody>
    </Sidebar>
  }
>
  <TopBar className="gap-2"><SidebarTrigger /><Text as="span" size="sm" weight="medium">Overview</Text></TopBar>
  <Flex direction="column" gap="6" className="min-h-0 flex-1 overflow-y-auto p-6">
    <Heading as="h1" size="xl">Overview</Heading>
    <Grid columns="auto" minWidth="sm" gap="4">
      <StatCard label="Monthly Revenue" value="$42,850" sub="+12.4%" />
      <StatCard label="Active Customers" value="1,420" sub="+80 this week" />
      <StatCard label="Pending Orders" value="18" alert />
    </Grid>
  </Flex>
</AppFrame>
```
- Never hand-write `hidden md:block` / `md:hidden` sidebar wrappers, a hamburger `IconButton`, a `navOpen` state, or a second `Drawer` copy of the navigation. `AppFrame` + `SidebarTrigger` do it.
- Inside an `AppFrame`, show or hide a detail with the frame, not the window: `className="shavin-frame-compact-only"` (e.g. a TopBar logo while the nav is a drawer) or `"shavin-frame-wide-only"` (e.g. a breadcrumb parent).
- Pass `routeKey={usePathname()}` (or your router's equivalent) so the drawer closes after navigation.
- Content that sits in rows of cards or stats uses `Grid columns="auto" minWidth="..."` (wraps by itself, adapts when the sidebar opens or closes). Use a numeric `columns` only when the design needs exactly N columns.

### Pattern B: Settings & Configuration Panel
- Use `<CardList>` or `<CardRow>` for field grouping.
- Use `<SegmentedControl>` or `<RadioGroup>` for single-choice option sets.
- Fixed bottom action bar: `<ActionBar>` floating above content for unsaved changes.

### Pattern C: AI Chat / Messaging Surface
- Transcript container with auto-scroll.
- One primitive for every turn: `<ChatBubble role="user|assistant|system">`. User turns: `role="user" hideAvatar` (bubble). Human-to-human chat can keep `variant="incoming|outgoing|system"`.
- Assistant turns: `<ChatBubble role="assistant" status="submitted|streaming|ready|stopped|error">` (flat; `submitted` shows a Murmur orb, `streaming` a caret, `stopped` a label, `error` a Retry row via `onRetry`). Status mirrors AI SDK chat status. Compose inside it, in order: `<Reasoning status="thinking|done" duration>` first, then `<ToolCall status="needs-approval|running|done|error|denied" onApprove onDeny>`, then the answer text and `<CodeBlock code language />` (copy button is built in), then `<FileOutput name kind status href />`. Use `<Murmur state="thinking|working|listening|idle" />` for any AI-activity indicator (not Spinner).
- Decorative backgrounds (sign-in panels, heroes): `<Backdrop variant="mesh|aurora|grid|dots" />` inside a `relative overflow-hidden` parent, content `relative` above it. Never hand-roll gradient blobs. For a mesh behind a Section/Box/Card prefer `bgOverlays="mesh-*"` (Gradient Backgrounds).
- Charts: one component per chart, no generic `<Chart>`. `<LineChart type="line|area" curve="smooth|linear|step" data={[{label, value}]}>` for one trend (add `series` and `stacked` for several metrics), `<Sparkline type="line|area|bar">` for a tiny trend in a card or cell, `<BarChart orientation="vertical|horizontal" mode="grouped|stacked" series>` for comparisons and rankings, `<Heatmap rows columns values>` for cohort/activity grids, `<FunnelChart orientation="horizontal|vertical">`, `<DonutChart>` for shares. Data is raw numbers per series key; format with `yFormat`. Never draw bars or heat cells by hand.
- Ratings: `<Rating readOnly value showValue count>` for stars (never hand-build stars; fractions fill partly, `precision="half"` to collect), `<NpsScale>` for the 0 to 10 recommend question (`calculateNps`), `<SentimentRating variant="thumbs|faces">`, `<RatingSummary counts>` for average plus 5 to 1 bars.
- Permissions: never run a tool that reads private data or changes something before `onApprove` fires. Let the user pick `once` or `always`, store `always` per tool in your own settings, and offer a way to revoke it.
- Input row: `<TextArea>` + `<IconButton>` for send, and `<VoiceInput state level elapsed transcript>` for dictation. VoiceInput is the visual state only; own the microphone and speech-to-text in your app, and never start recording without a click.

---

---

## 6. Anti-Copy Slop & Authentic Microcopy Standards

AI models frequently default to generic placeholder labels or corporate marketing clichés. Every screen built with `@shavin/ui` must use **realistic, concrete, domain-specific microcopy**:

### Forbidden Copywriting Patterns (Slop):
- ❌ **Vacuous Tech Clichés:** *"Empower your workflow"*, *"Revolutionize your efficiency"*, *"Seamless intelligence"*, *"Unleash next-gen capabilities"*.
- ❌ **Binary Contrast Tropes:** *"It's not just a dashboard. It's your command center."*, *"Don't just track data. Own it."*
- ❌ **Throat-Clearing Openers:** *"In today's fast-paced digital ecosystem..."*, *"What nobody tells you about..."*
- ❌ **Lazy Placeholder Labels:** `"Card Title"`, `"Card Description"`, `"Option 1, 2, 3"`, `"Lorem ipsum"`, `"John Doe"`, `"user@example.com"`.

### Required Authentic Microcopy:
- ✅ **Domain-Specific Telemetry:** Use realistic metrics (`p99: 42ms`, `99.98% SLA`, `14.2 GB / 20 GB allocated`, `2,840 req/s`).
- ✅ **Authentic Security & Permissions:** Use real RBAC terms (`viewer`, `billing_admin`, `org_owner`, `sk_live_51M...`).
- ✅ **Specific Action-Oriented Buttons:** Use precise labels (*"Generate API Key"*, *"Deploy to Production"*, *"Invite Teammate"*) instead of vague buttons (*"Submit"*, *"Click Here"*).
- ✅ **Contextual Incident Callouts:** *"Cluster degraded — 2 of 5 replicas unhealthy in us-east-1"* instead of *"Warning: An error occurred"*.

---

## 7. Pre-Flight Verification Checklist

Before releasing any application screen or feature component, verify:

- [ ] **Orientation:** Is the current location clear via active `SidebarNavItem` and `Breadcrumbs`?
- [ ] **Density Baseline:** Are body texts and data tables operating at 14px (`text-sm` / `size="sm"`)?
- [ ] **Content Realism:** Is copy free of AI marketing clichés and lazy placeholder text?
- [ ] **4-State Coverage:** Are Loading (Skeleton), Empty (Onboarding CTA), Error (Recovery Callout), and Success (Toast) states all handled?
- [ ] **Ergonomics & Zoom:** Is mobile input font-size $\ge 16\text{px}$ to prevent iOS auto-zoom?
- [ ] **Destructive Action Safety:** Do delete/destructive actions prompt with `<AlertDialog intent="danger">` (Cancel focused by default)?
- [ ] **Concentric Radius:** Do nested surfaces use `rounded-panel-inner` to satisfy $R_{\text{inner}} = \max(\text{floor}, R_{\text{outer}} - P)$ (floor = `min(radius-lg, radius-panel / 2)`)?
- [ ] **Compositor Animation:** Are transitions limited to `transform` and `opacity` without `transition: all`?
- [ ] **Token Compliance:** Are all colors (`text-fg`, `bg-surface`, `border-hairline`) using semantic Shavin tokens?
- [ ] **Clean Compilation:** Does `npm run verify` pass with 0 errors?
