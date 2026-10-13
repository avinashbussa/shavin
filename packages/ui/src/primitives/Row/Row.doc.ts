import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Row",
  description: "Flexible interactive row primitive with leading slot, middle title, trailing actions, active state, and drag handle icon.",
  features: [
    "Polymorphic tag: as='button' (default for click row) or as='div' (when row contains nested sub-buttons)",
    "Slots: leading (icon, avatar, check) and trailing (badge, chevron, action button)",
    "Includes RowDragHandle icon component for sortable lists",
    "Uses control radius --radius-lg for row item pill hover states"
  ],
  accessibility: [
    "Supports button and div element rendering avoiding illegal nested button HTML",
    "Renders group class enabling CSS hover-reveal action buttons (group-hover:opacity-100)"
  ],
  keyboard: "Tab to row button, Space/Enter to activate",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Row for sidebar navigation items, list rows, setting items, and sortable cards."
      },
      {
        guidance: false,
        description: "Do not render interactive nested <button> elements inside a Row with as='button' — pass as='div' instead."
      }
    ]
  },
  examples: [
    {
      title: "Navigation Row with Trailing Badge",
      code: '<Row leading={<Folder />} trailing={<Badge>12</Badge>} active>Projects</Row>'
    }
  ]
};
