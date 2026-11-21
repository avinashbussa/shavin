import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Checkbox",
  description: "Turns an option on or off, with an optional label. It also has a mixed state for a parent of partly selected items.",
  features: [
    "Sizes: sm (16px) and md (20px)",
    "Supports optional label wrapper with click handling",
    "Uses brand token fill when checked (data-state=checked)"
  ],
  accessibility: [
    "Built on native ARIA checkbox pattern (role='checkbox')",
    "Space key toggles checked state when focused",
    "Communicates checked, unchecked, and indeterminate states to screen readers"
  ],
  keyboard: "Space to toggle checkbox state",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Checkbox for binary independent choices or terms acceptance."
      },
      {
        guidance: false,
        description: "Do not use Checkbox for mutually exclusive single choice selections — reach for RadioGroup or Switch instead."
      }
    ]
  },
  examples: [
    {
      title: "Labeled Checkbox",
      code: '<Checkbox label="Accept Terms and Conditions" defaultChecked />'
    }
  ]
};
