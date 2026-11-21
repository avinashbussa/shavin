# shavin-app: worked patterns

Each pattern implements all six states. Props below are verified; confirm others with `get_components`.

### Data table screen
- Shell: `Heading as="h1"` + toolbar `Flex` with `TextField type="search" leadingIcon` (debounced), `Select` filters, primary `Button` ("Invite teammate"). Search, filters, sort and page sync to URL search params.
- Table: `Table > TableHeader > TableRow > TableColumnHeaderCell` / `TableBody > TableRow > TableCell`. Sortable header: put a `Button variant="ghost"` inside `TableColumnHeaderCell` and set `aria-sort="ascending|descending|none"` on the cell (Table has no sort prop).
- Bulk select: `Checkbox` per row plus a header `Checkbox checked="indeterminate"` when partial; with a selection show a bulk bar (count `Text` + `Button tone="danger"` that opens `AlertDialog intent="danger"`).
- Row actions: `Menu trigger={<IconButton aria-label="Row actions" variant="ghost">...</IconButton>}` with `MenuItem` and `MenuItem variant="danger"`.
- Pagination: `<Pagination page totalPages onPageChange />` below the table.
- States: first-time = `EmptyState kind="first-time"` + primary `Button`; filters match nothing = `EmptyState kind="no-results"` + "Clear filters" `Button`; loading = 5 `Skeleton` rows with row height; error = `Callout color="danger"` + Retry; success = toast after a bulk action; disabled = bulk actions with `disabledReason="Select rows first"`.
- Mobile: below `md`, render rows as `Card`s in a `Flex direction="column" gap="3"` (name, status `Badge`, `Menu`) using `shavin-frame-compact-only` / `shavin-frame-wide-only` or `Table` inside its built-in horizontal scroll; never shrink columns to unreadable widths.

### Settings page
- `Container size="md"`, one `Section`/`Card` per group with `Heading as="h2" size="md"` + `Text color="subtle"` description. Fields in `Flex direction="column" gap="4"`: `TextField label hint`, `Select options`, `Switch label`, `RadioGroup`.
- One page-level Save: `Button` (not one per card). Track dirty state; when dirty show `ActionBar` or a sticky footer with Save + Discard, and warn on navigation (`beforeunload` plus a router guard `AlertDialog`).
- Saving: `<Button type="submit" loading={saving} loadingLabel="Saving…">`, then `success("Settings saved")`. Failure: `Callout color="danger"` at the top for a network error; field errors via `TextField errorMessage` / `FormField error` plus `FormErrorSummary` on submit.
- Danger zone last, in its own `Card` with `Heading` "Delete workspace", `Text color="subtle"` consequence, `Button tone="danger" variant="outline"` -> `AlertDialog intent="danger" confirmLabel="Delete workspace"`; optionally require typing the name in a `TextField`.
- States: first-time = defaults pre-filled with hints; loading = `Skeleton` per field row; disabled = read-only for non-admins: `disabled` fields + `Text` "Only org owners can change this".

### Auth (sign-in / sign-up)
- `data-composition="none"`. Single centred column: `Container size="xs"`, `Heading as="h1"`, `Text color="subtle"`, `Flex direction="column" gap="4"`: `TextField type="email" label autoComplete="email"`, `TextField type="password" label showHidePassword autoComplete="current-password"`, full-width `Button`.
- Never block paste. `Enter` submits. Optional `Backdrop variant="mesh"` in a `relative overflow-hidden` parent for a side panel.
- Errors distinct and specific: "No account for this email", "Password is incorrect", "Too many attempts, retry in 30s" via `errorMessage` on the right field; network failure as `Callout color="danger"` + retry. Focus the first invalid field.
- Submit: stays enabled until the request starts, then `Spinner` replaces the label inside the same `Button` so the width does not change.
- Success: redirect, no toast. Disabled: SSO or sign-up closed shows a `Text` reason. Secondary links with `Link` ("Forgot password?").

### Onboarding
- `Stepper steps current` (0-based; `variant="pills"` on mobile) above one step panel; `Button` Back / Continue (Continue primary, Back `variant="ghost"`).
- Validate per step before advancing: `TextField invalid errorMessage`, focus the first invalid field. Continue stays enabled; show errors on press.
- Skip: `Button variant="ghost"` "Skip for now" on optional steps; say what is lost in `Text color="subtle"`.
- Persist progress after each step (server or storage) and sync the step to the URL so refresh and Back work; resume where the user left.
- Done screen: `EmptyState kind="success" size="lg" focusOnMount` with one primary `Button` into the app. Saving a step shows `loading` on Continue; a failed save shows `Callout color="danger"` + retry.

---
