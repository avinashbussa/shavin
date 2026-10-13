import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "SegmentedControl",
  description: "Exclusive single-select toggle group built on Radix ToggleGroup primitive supporting default, pill, expand, and icon variants.",
  features: [
    "Variants: default, pill (rounded-full capsule), expand (animated label expand), icon (icon-only mode)",
    "Sizes: sm (32px) and md (40px)",
    "Supports concentric inner item radius math: calc(var(--radius-lg) - 4px)"
  ],
  accessibility: [
    "Built on Radix ToggleGroup primitive with role='radiogroup' / role='group'",
    "Arrow key navigation between items with active state announcement",
    "Supports disabled state per item"
  ],
  keyboard: "Left/Right arrow keys to navigate segments, Space/Enter to select",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use SegmentedControl for compact inline view switchers (e.g. List vs Grid)."
      },
      {
        guidance: false,
        description: "Do not use SegmentedControl for long multi-page tab routing — reach for Tabs instead."
      }
    ]
  },
  examples: [
    {
      title: "View Mode Switcher",
      code: '<SegmentedControl value="list" onValueChange={() => {}}><SegmentedControlItem value="list">List</SegmentedControlItem><SegmentedControlItem value="grid">Grid</SegmentedControlItem></SegmentedControl>'
    }
  ]
};
