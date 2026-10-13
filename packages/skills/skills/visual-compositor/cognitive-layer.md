# Cognitive Layer

> **Load priority:** Loaded at the START of UI tasks, before implementation begins.
> **Token cost:** ~2K tokens.
> **Purpose:** Reason about perception and purpose before writing components.
> **Source:** Distilled from Visual Language Skills framework.

---

## Pre-Generation Checklist

**Complete before writing any component.**

### 1. Cognitive Goal
What must users understand within 3 seconds of seeing this screen?
- Write as one sentence
- If you cannot, the screen has no clear purpose
- Example: "Users must see their current balance and recent transactions"

### 2. Visual Hierarchy
What gets attention first? Second? Last?
- Exactly ONE primary focal point
- If multiple elements compete for primary attention, there is no hierarchy
- Use size, weight, color, and spacing to create clear order

### 3. Relationship Map
Which elements belong together conceptually?
- Proximity must reflect conceptual relationships, not grid columns
- Related items closer together, distinct items separated
- Use spacing to communicate structure (see `spacing-core.md`)

### 4. Available Actions
What can users do here?
- Each action must be visually signaled BEFORE users look for it
- Hidden actions are effectively absent actions
- Primary action must be unmistakable (see Action Hierarchy below)

### 5. All States
For every interactive element or data surface, define:
- **Loading** — skeleton, spinner, or progress bar
- **Empty** — onboarding message with next action, not blank space
- **Error** — explanation + recovery path, not just "Error occurred"
- **Success** — confirmation feedback (toast, inline message, state change)

Missing states are not acceptable. They are moments where the interface goes silent and users lose trust.

### 6. Orientation (multi-page systems)
- Can users tell where they are? (active nav state, page title, breadcrumb)
- Can they see where they can go? (visible navigation options)
- Can they get back to where they were? (back button, browser history, clear path)

---

## State Coverage Rules

### Loading States

**Acknowledge immediately.** Users must know their action was received.

**Match feedback to wait duration:**
- < 1 second: subtle button state change (disabled + cursor change)
- 1-3 seconds: spinner or skeleton
- 3-10 seconds: progress bar or percentage
- > 10 seconds: explanation + estimated time + option to cancel

**Preserve context.** Never reset scroll position, clear inputs, or remove existing content during loading.

**Show progress when possible.** "Uploading 68%" feels shorter than an infinite spinner.

### Empty States

**Explain before suggesting.** Answer "Why is this empty?" before "What should I do?"

**Different causes, different messages:**
- Nothing created yet → onboarding + first action
- No search results → "No matches for X" + suggestion to refine
- Access restricted → explanation + contact/upgrade path
- Temporary unavailability → "Try again" + refresh action

**Make next step obvious.** Every empty state should guide progress with a clear action.

**Clarity over decoration.** Illustrations add warmth but cannot replace explanation.

### Error States

**Explain what happened.** Not just "Error 500" but "We couldn't save your changes because the server is temporarily unavailable."

**Provide recovery path.** Not just what failed but what to do next:
- Retry button
- Alternative action
- Contact support link
- Undo option

**Match tone to severity.** Form validation = inline correction. Network failure = banner with retry. Critical error = modal with support contact.

---

## Affordance Rules

**Interactive elements must visually signal interactivity BEFORE hover.**

### Visual Signifiers

**Buttons:**
- Background color distinct from surrounding content
- Subtle shadow or border to suggest pressability
- Cursor change to pointer on hover

**Links:**
- Color distinct from body text
- Underline or clear visual treatment
- Hover state (color change, underline appears)

**Cards (if clickable):**
- Cursor change to pointer on hover
- Subtle elevation change or border highlight on hover
- Clear visual distinction from static content

**Input fields:**
- Border or background distinct from surrounding area
- Focus state (ring, border color change)
- Placeholder text suggests input type

### Anti-Patterns

```
✗ Relying on hover as the only affordance
✗ Cards that look clickable but are static
✗ Buttons that look like plain text
✗ Links that don't look like links
✗ Input fields with no visual boundary
✗ Interactive elements indistinguishable from static ones
```

**Why these fail:** Users scan before they interact. If they cannot predict what is interactive, they hesitate. Hidden actions are effectively absent actions.

---

## Action Hierarchy

**Visual priority reflects decision priority.**

### Commitment Matches Consequence

**Low risk** (undoable, reversible):
- Like, save, bookmark
- Minimal visual weight, quick interaction
- No confirmation needed

**Medium risk** (harder to undo):
- Submit form, publish post, send message
- Primary button treatment
- Clear label describing outcome ("Send Message" not "Submit")

**High risk** (destructive, irreversible):
- Delete account, cancel subscription, remove data
- Red/danger color treatment
- Confirmation dialog or secondary action
- Clear explanation of consequence

### Label Rules

**Describe outcome, not implementation:**
- ✓ "Save Draft" (describes what happens)
- ✗ "Submit" (vague, implementation-focused)

**Be specific:**
- ✓ "Delete Project" (clear consequence)
- ✗ "Delete" (ambiguous)

### Placement

- Primary action: most prominent position, usually bottom-right or top-right
- Secondary actions: less prominent, adjacent to primary
- Destructive actions: separated from primary, often in different section
- Consistent placement across similar screens

---

## Navigation & Orientation

**Users must always know where they are, where they can go, and how to return.**

### Orientation Signals

**Active state:** Current page/section highlighted in navigation
**Page title:** Clear, descriptive, matches navigation label
**Breadcrumb:** Shows path from home to current location
**URL:** Reflects hierarchy (if applicable)

### Navigation Types

**Global navigation:**
- Major sections (Dashboard, Projects, Settings)
- Persistent across all pages
- Stable structure (don't move landmarks)

**Local navigation:**
- Tabs, subsections within one area
- Contextual to current section
- Clear relationship to global nav

### Anti-Patterns

```
✗ Navigation with no active/current state
✗ Icons without labels where ambiguity exists
✗ Changing menu structure frequently
✗ Hidden primary navigation
✗ Multiple navigation systems that contradict each other
✗ Users cannot answer "Where am I?"
```

---

## Progressive Disclosure

**Reveal complexity when it becomes useful, not all at once.**

### Principles

**Match information to immediate goal:**
- Show only what's needed for current task
- Defer advanced options until relevant
- Build confidence through small successes

**Disclosure exists at every scale:**
- **Content:** Summaries before details, expandable sections
- **Actions:** Primary visible, advanced available but less prominent
- **Navigation:** Frequent destinations immediate, rare accessible without competing
- **Configuration:** Basic settings first, advanced when needed

**Hidden does not mean lost:**
- Delay visibility, don't remove capability
- Power users should find advanced features without overwhelming beginners
- Progressive disclosure ≠ hiding critical functionality

### Anti-Patterns

```
✗ Showing all features during onboarding
✗ Hiding critical functionality
✗ Long forms asking for unnecessary information upfront
✗ Advanced settings visible by default
✗ Treating hidden features as afterthoughts
```

---

## Integration With Implementation Layer

This file provides the **why** (cognitive reasoning). Other files provide the **how** (implementation):

- `concentric-laws.md` — radius tokens and nesting rules
- `spacing-core.md` — spacing scale, section architecture, flex/grid rules
- `spacing-marketing.md` — hierarchy, visual weight, negative space (MARKETING/EDITORIAL)
- `spacing-dense.md` — density framework (STRUCTURAL/dashboards)
- `font-pairings.md` — typography and font loading rules
- `audit-checklist.md` — master anti-pattern table (spatial/layout violations)

**Workflow:**
1. Complete pre-generation checklist (this file)
2. Select mode (STRUCTURAL/MARKETING/EDITORIAL)
3. Apply implementation rules (other files)
4. Run post-generation audit (`audit-checklist.md`)

**The test:**
> Can you explain why every element on this screen exists — in terms of what the user needs to understand, not what component was available?

If you cannot, the UI is not ready.

---

## Quick Reference

**When to load this file:**
- Starting any UI task (always loaded)
- Reviewing whether a layout communicates structure
- Diagnosing why an interface feels confusing
- Building multi-step flows or complex screens

**Token cost:** ~2K tokens (always loaded)

**Related files:**
- `audit-checklist.md` — master anti-pattern table
- `spacing-core.md` — relationship through spacing
- `concentric-laws.md` — boundaries and containers
