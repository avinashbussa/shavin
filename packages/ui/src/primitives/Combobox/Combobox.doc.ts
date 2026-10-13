import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Combobox",
  description: "Searchable autocomplete dropdown control combining text input typing with filtered Radix Popover item selection.",
  features: [
    "Real-time client-side option filtering as the user types",
    "Uses control radius --radius-lg for input and panel radius --radius-panel for popover list",
    "Supports custom label formatting function via prettyOptionLabel",
    "Matches popover panel width to the text input trigger width dynamically"
  ],
  accessibility: [
    "Supports keyboard typing, popover toggle, and focus restoration to input",
    "Uses aria-expanded and aria-controls attributes for popup menu"
  ],
  keyboard: "Type to filter options, Up/Down arrows to navigate popover list, Enter to select option, Escape to dismiss",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Combobox when selecting from large datasets (>10 items) where typing to filter enhances speed."
      },
      {
        guidance: false,
        description: "Do not use Combobox for small static option lists (<= 5 items) — reach for Select or RadioGroup instead."
      }
    ]
  },
  examples: [
    {
      title: "Searchable Country Combobox",
      code: '<Combobox value="United States" options={["Canada", "Mexico", "United Kingdom", "United States"]} onChange={() => {}} />'
    }
  ]
};
