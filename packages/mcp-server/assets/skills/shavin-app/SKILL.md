---
name: shavin-app
description: >
  Guides the architecture, layout partitioning, interaction patterns, state management,
  and implementation of SaaS web applications, dashboards, AI chat tools, admin consoles,
  and complex product interfaces using @shavin/ui as the base design system engine, powered by
  cognitive design principles and Vercel Web Interface Guidelines. Covers forms, settings, auth,
  onboarding, data tables and the six-state rule.
sections:
  - id: philosophy
    description: "Applications as decision-support tools"
  - id: primitives
    description: "@shavin/ui application primitive hierarchy"
  - id: density
    description: "Product density standard (14px token base)"
  - id: state
    description: "Six-state rule (first-time, empty, loading, error, success, disabled) and interaction quality"
  - id: layouts
    description: "Standard application layout architectures"
  - id: copy
    description: "Anti-slop microcopy standards"
  - id: patterns
    file: patterns.md
    description: "Worked patterns: data table, settings, auth, onboarding (~2K tokens)"
  - id: checklist
    description: "Pre-flight verification checklist"
---

# shavin-app Skill

- Targeted sections: `get_skill({ name: "shavin-app", section: "density" | "state" | "layouts" | "patterns" | "checklist" })`.
- Core rules (tokens, radius, typography, fg vs fg-subtle vs fg-muted) are in `.agents/skills/core-rules.md` and are not injected. Read it when you need the full detail.
- Live specs: `get_components({ name })` and `get_tokens()`. Without MCP, read `node_modules/@shavin/ui/components.json` and run `npx shavin-lint-tokens <path>` instead of `validate_code`.
- Every UI element is a `@shavin/ui` component (no raw `button`/`input`/`table`/`dialog`, no hand-styled div imitations, no other UI library). These rules apply on every UI-writing turn, including small follow-ups.

You are an **Application Product Architect & Engineer** using the **Shavin Design System (`@shavin/ui`)**. Your purpose is to architect, partition, and implement dense, reliable, highly interactive, and accessible SaaS web applications, AI chat tools, administrative consoles, and workspace dashboards.

This skill synthesizes **`@shavin/ui` application primitives** with cognitive design laws and **Vercel Web Interface Guidelines** to eliminate AI UI slop, guarantee six-state coverage, and deliver product interfaces that feel fast, predictable, and human-considered.

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

| Category | `@shavin/ui` primitives to use |
|---|---|
| **App chrome & layout** | `AppFrame`, `Sidebar`, `SidebarHeader`, `SidebarBody`, `SidebarFooter`, `SidebarSection`, `SidebarNavItem`, `SidebarTrigger`, `TopBar`, `ActionBar`, `BottomNav`, `Breadcrumbs`, `Container`, `Section`, `Grid`, `Flex`, `Box`, `Card`, `CardList`, `CardRow`, `Separator`, `ScrollArea` |
| **Overlays** | `Dialog`, `AlertDialog`, `Drawer`, `Popover`, `ContextMenu`, `Menu`, `MenuItem`, `Tooltip`, `HoverCard` |
| **Inputs & forms** | `TextField`, `TextArea`, `Select`, `Dropdown`, `Combobox`, `Checkbox`, `Switch`, `RadioGroup`, `Slider`, `ColorPicker`, `IconPicker`, `DatePicker`, `TimePicker`, `Button`, `IconButton` |
| **Data & workspaces** | `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableColumnHeaderCell`, `TableCell`, `Pagination`, `DataList`, `DataListItem`, `StatCard`, `Row`, `RowDragHandle`, `Stepper`, `Tabs`, `SegmentedControl`, `Badge`, `Avatar`, `Progress`, `LineChart`, `BarChart`, `Sparkline`, `DonutChart`, `Heatmap`, `FunnelChart` |
| **Feedback** | `Callout`, `Toast` (`ToastProvider` + `useToast()`), `Skeleton`, `SkeletonMimic`, `Spinner`, `Murmur` |
| **Content** | `Heading`, `Text`, `Icon`, `Link`, `CodeBlock`, `Kbd`, `Backdrop` |
| **AI surfaces** | `ChatBubble`, `Reasoning`, `ToolCall`, `FileOutput`, `VoiceInput`, `Murmur` |

Not in the library: `Header`, `Footer`, `DocSection`, a generic `Chart`. Compose from the primitives above; confirm any other name with `get_components`.

---|---|
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

- Font loading, typography hierarchy, concentric radius and token compliance: see `.agents/skills/core-rules.md` (not injected).

---

## 4. Mandatory State & Interaction Quality Standards

### A. The Six-State Rule

Every surface (list, table, form, settings page, auth screen, onboarding, chat, dialog) implements all six states, not only data surfaces. Build each branch, not just the happy path. **These are the default: build them without being asked.** A request such as "build a dashboard" or "add a settings page" already includes them; the user will not list them.

1. **First-time**: the user has never used it. `<EmptyState kind="first-time" title description action={<Button>…</Button>} />`: what it is and the first action. Onboarding flows use `Stepper`.
2. **Empty**: had items, none now: `EmptyState kind="empty"` with the `Button` that adds one. A filter or search matched nothing: `EmptyState kind="no-results"` echoing the filter, with "Clear filters". Never blank space, never "No data". `variant="bordered"` keeps a region (table body, drop zone) visible.
3. **Loading**: `Skeleton` / `SkeletonMimic` with the real layout's dimensions (a `loading.tsx` per data route in Next). Content is never a spinner. An action in progress: `<Button loading loadingLabel="Saving…">` (keeps its width, stays focusable). Long jobs: `useToast().promise`.
4. **Error**: page or region: `Callout color="danger"` with a title, what happened, and a retry `Button`. Field errors: `TextField errorMessage`, or `FormField error` around `TextArea` / `Select` / `Combobox` / pickers / groups. On a failed submit of 3+ fields: `FormErrorSummary errors={[{ id, message }]}` at the top (it takes focus and links to each field), and keep each field's error. Distinct messages per cause (wrong password vs unknown email vs network).
5. **Success**: `const { success } = useToast()` for "Changes saved" (`init` mounts `ToastProvider` inside `ThemeProvider`; `shavin doctor` checks it). A finished flow (onboarding, checkout): `EmptyState kind="success" focusOnMount`. An inline `Callout color="success"` when the user must keep reading it. A toast never carries the only copy of an error.
6. **Disabled**: `Button disabledReason="…"` / `IconButton disabledReason="…"` (stays focusable, reason in a Tooltip and as its description); a field: `FormField disabled hint="Available on the Pro plan"`. Never a silently dead control.

Submit buttons stay enabled until the request starts, then show `loading`. Other controls (cancel, siblings, steps not yet reachable) may be disabled with a reason.

**Site-level states (every app and site).** Next app router: `app/not-found.tsx` (404: `Heading`, one line of `Text`, a `Button` home) and `app/error.tsx` plus `app/global-error.tsx` (error boundary: `Callout color="danger"`, what happened, a retry `Button` calling `reset()`). Pages router: `pages/404.tsx` and `pages/_error.tsx`. Vite: a catch-all not-found route and an error boundary component around the app. `check_page` fails a project without them.

**Interaction states.** Hover, pressed, focus-visible and active come with the components (`Button`, `Link`, `Tabs`, `Menu`, `Checkbox`…): that is why nothing interactive is built by hand. Never remove a focus ring (`outline-none` without a `focus-visible` replacement), and give every custom `asChild` element the component's states.

### A2. Destructive Actions
Delete, revoke, leave and reset go through `<AlertDialog intent="danger" title description confirmLabel onConfirm open onOpenChange />` (Cancel focused by default). Name the object and the consequence in `description`.

### B. Vercel Web Interface & Ergonomic Guidelines
1. **Hit Targets**: Controls reach 44px on touch automatically (24px AA floor); `size` is visual only. Opt out: `touchTargets="compact"` or `hitArea`. Stand-alone links use `<Link standalone>`; no hand-rolled `min-h-11`.
2. **Form Ergonomics**:
   - Mobile input zoom is handled by the primitives: `TextField`, `TextArea`, `Select` and `Combobox` render 16px below `md` and 14px from `md` up. Do not add `text-base`/`text-sm` via `className` on them.
   - `Flex`, `Stack` style layout primitives default to `gap="3"` (12px), including `direction="column"`. A name + description pair (title over subtitle) must set `gap="0"` or `gap="1"` explicitly; otherwise the two lines float apart.
   - Controls that share a row or toolbar must use the same `size` (heights match Button: sm 32px, md 40px, lg 48px). Never size them with `className` (no `h-*`, `py-*` or text-size overrides). Example: `<TextField size="md" />` beside `<Select size="md" />` beside `<Button size="md">`.
   - Never block paste in `<input>` or `<textarea>` (allow 2FA codes & passwords).
   - `Enter` submits single inputs; `⌘/Ctrl+Enter` submits `<textarea>`.
   - Do not disable the submit button while the user fills the form; keep it enabled until the request starts, then show `<Spinner>` while preserving button width (see the six-state rule for other disabled controls).
3. **Concentric Radius:** controls `--radius-lg`, containers `--radius-panel`; nested `R_inner = max(floor, R_outer - P)`, `floor = min(radius-lg, radius-panel / 2)` (use `rounded-panel-inner`).
4. **Compositor Animation Rule**:
   - Animate compositor-only properties (`transform`, `opacity`); do not hand-animate layout geometry (`width`, `height`, `top`, `left`). Height animation inside `Accordion` is fine: the component owns it.
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
    {status === "error" ? (
      <Callout color="danger" title="Could not load metrics">
        <Flex direction="column" gap="3">
          <Text>The metrics service timed out.</Text>
          <Button variant="outline" onClick={refetch}>Retry</Button>
        </Flex>
      </Callout>
    ) : status === "loading" ? (
      <Grid columns="auto" minWidth="sm" gap="4">
        <Skeleton className="h-24" /><Skeleton className="h-24" /><Skeleton className="h-24" />
      </Grid>
    ) : stats.length === 0 ? (
      <Flex direction="column" align="center" gap="3">
        <Icon name="chart-column" size="lg" color="subtle" />
        <Text color="subtle">No orders yet. Metrics appear after the first order.</Text>
        <Button onClick={openNewOrder}>Create order</Button>
      </Flex>
    ) : (
      <Grid columns="auto" minWidth="sm" gap="4">
        {stats.map((s) => <StatCard key={s.label} label={s.label} value={s.value} sub={s.sub} alert={s.alert} />)}
      </Grid>
    )}
  </Flex>
</AppFrame>
```
- Never hand-write `hidden md:block` / `md:hidden` sidebar wrappers, a hamburger `IconButton`, a `navOpen` state, or a second `Drawer` copy of the navigation. `AppFrame` + `SidebarTrigger` do it.
- Inside an `AppFrame`, show or hide a detail with the frame, not the window: `className="shavin-frame-compact-only"` (e.g. a TopBar logo while the nav is a drawer) or `"shavin-frame-wide-only"` (e.g. a breadcrumb parent).
- Pass `routeKey={usePathname()}` (or your router's equivalent) so the drawer closes after navigation.
- Content that sits in rows of cards or stats uses `Grid columns="auto" minWidth="..."` (wraps by itself, adapts when the sidebar opens or closes). Use a numeric `columns` only when the design needs exactly N columns.

### Pattern B: Settings & Configuration Panel
See section 6 (settings pattern).

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

## 6. Worked Patterns

Data table, settings, auth and onboarding patterns (components, key props and all six states each) live in `patterns.md`: `get_skill({ name: "shavin-app", section: "patterns" })`, or read `.agents/skills/shavin-app/patterns.md`. Load it for any screen of those kinds.

---

## 7. Anti-Copy Slop & Authentic Microcopy Standards

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

## 8. Pre-Flight Verification Checklist

Before releasing any application screen or feature component, verify:

- [ ] **Orientation:** Is the current location clear via active `SidebarNavItem` and `Breadcrumbs`?
- [ ] **Density Baseline:** Are body texts and data tables operating at 14px (`text-sm` / `size="sm"`)?
- [ ] **Content Realism:** Is copy free of AI marketing clichés and lazy placeholder text?
- [ ] **Six-State Coverage:** First-time, empty, loading, error, success and disabled all built on this surface (not only the happy path)?
- [ ] **Ergonomics & Zoom:** Mobile inputs 16px (primitives do this); custom: `hit-area-touch`?
- [ ] **Destructive Action Safety:** Do delete/destructive actions prompt with `<AlertDialog intent="danger">` (Cancel focused by default)?
- [ ] **Concentric Radius:** Do nested surfaces use `rounded-panel-inner` to satisfy $R_{\text{inner}} = \max(\text{floor}, R_{\text{outer}} - P)$ (floor = `min(radius-lg, radius-panel / 2)`)?
- [ ] **Compositor Animation:** Hand-written transitions limited to `transform` and `opacity`, no `transition: all`?
- [ ] **Token Compliance:** Are all colors (`text-fg`, `bg-surface`, `border-hairline`) using semantic Shavin tokens?
- [ ] **Validation:** `validate_code` / `check_page` run on every UI turn; typecheck and build pass with 0 errors?
