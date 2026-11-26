import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "EmptyState",
  description:
    "The one component for 'nothing is shown here yet': first-time, empty, no-results and success result screens. Icon, specific title, one-sentence description and the action that fixes the emptiness.",
  features: [
    "kind: first-time (inbox), empty (folder-open), no-results (search-x), success (circle-check); kind sets the default icon only",
    "size: sm (cards, popovers), md, lg (full page)",
    "layout: centered or inline (list footers, table rows)",
    "variant: plain (sits on the surface it replaces) or bordered (dashed hairline panel on --radius-panel for a region that must stay visible)",
    "action + secondaryAction slots (at most two buttons)",
  ],
  accessibility: [
    "The title is a real heading (titleAs, default h3); the icon and illustration are aria-hidden",
    "No live role: announce (default true for no-results) speaks the title once through the shared polite announcer when it replaces content (WCAG 4.1.3)",
    "focusOnMount moves focus to the title (use it for kind='success' result screens)",
  ],
  usage: {
    bestPractices: [
      { guidance: true, description: "Give one primary action that fixes the emptiness: 'Create your first project', 'Clear filters'." },
      { guidance: true, description: "Use no-results (clear the filter) separately from empty (create one): they have different fixes." },
      { guidance: false, description: "Do not write 'Nothing here' or 'No data': say what is missing and how to add it." },
      { guidance: false, description: "Do not wrap it in a Card or add badges: it sits on the surface it replaces (use variant='bordered' for a visible region)." },
    ],
  },
  structure: [
    "States: first-time → kind='first-time', empty → kind='empty', no filter match → kind='no-results', finished flow → kind='success'",
  ],
  examples: [
    {
      title: "First-time",
      code: `<EmptyState
  kind="first-time"
  title="No orders yet"
  description="Orders appear here as customers check out. Share your shop link to get the first one."
  action={<Button iconLeft={<Icon name="link" size="sm" />}>Copy shop link</Button>}
/>`,
    },
    {
      title: "No results",
      code: `<EmptyState
  kind="no-results"
  title="No orders match these filters"
  description="Status: Refunded. Try another status or clear the filters."
  action={<Button variant="outline">Clear filters</Button>}
/>`,
    },
    {
      title: "Empty, bordered region",
      code: `<EmptyState
  kind="empty"
  variant="bordered"
  size="sm"
  title="No files in this folder"
  description="Drop files here or upload them from your computer."
  action={<Button variant="outline" size="sm">Upload files</Button>}
/>`,
    },
    {
      title: "Success result screen",
      code: `<EmptyState
  kind="success"
  size="lg"
  focusOnMount
  title="Your workspace is ready"
  description="We set up three sample projects so you can look around."
  action={<Button>Open workspace</Button>}
/>`,
    },
    {
      title: "Inline",
      code: `<EmptyState layout="inline" size="sm" kind="empty" title="No comments yet" description="Start the discussion." action={<Button size="sm" variant="ghost">Add comment</Button>} />`,
    },
  ],
};
