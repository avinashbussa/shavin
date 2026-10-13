import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Pagination",
  description: "Page navigation control across data tables, lists, and editorial documentation supporting numeric pages, simple compact status, and article card variants.",
  features: [
    "Variants: numeric (numbered pagination bar), simple ('Page X of Y'), cards (editorial Next/Previous cards)",
    "Sizes: sm, md, lg",
    "Supports auto-ellipsis calculation for large page counts (e.g. 1 2 3 ... 10)",
    "Supports link href mode (prevHref, nextHref) or client-side callback mode (onPageChange)"
  ],
  accessibility: [
    "Built with native <nav aria-label='Pagination'> element",
    "Applies aria-current='page' to active page number button",
    "Disables prev/next controls on first/last pages with disabled opacity"
  ],
  keyboard: "Tab to cycle through page buttons, Space/Enter to change page",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use variant='numeric' for data tables and search results; use variant='cards' for documentation portals."
      },
      {
        guidance: false,
        description: "Do not display pagination controls if totalPages === 1."
      }
    ]
  },
  examples: [
    {
      title: "Numeric Page Navigation",
      code: '<Pagination page={1} totalPages={10} onPageChange={() => {}} />'
    }
  ]
};
