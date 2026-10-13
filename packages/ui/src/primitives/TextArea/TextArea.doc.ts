import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "TextArea",
  description: "Multi-line text input control with control radius (--radius-lg) and custom error state styling.",
  features: [
    "Default rows count: 4",
    "Invalid error state styling (invalid=true)",
    "Uses control radius --radius-lg for input consistency"
  ],
  accessibility: [
    "Native <textarea> element with standard focus ring and aria-invalid attributes",
    "Supports full keyboard navigation and multi-line text editing"
  ],
  keyboard: "Standard multi-line typing and Enter linebreaks",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use TextArea for multi-line inputs such as feedback forms, bio descriptions, and comment fields."
      },
      {
        guidance: false,
        description: "Do not use TextArea for single-line inputs — reach for TextField instead."
      }
    ]
  },
  examples: [
    {
      title: "Feedback TextArea",
      code: '<TextArea rows={4} placeholder="Describe your experience..." />'
    }
  ]
};
