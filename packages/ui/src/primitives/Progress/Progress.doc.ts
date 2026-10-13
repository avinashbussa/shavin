import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Progress",
  description: "Loading and task progress bar built on Radix Progress primitive supporting determinate percentages and indeterminate loading states.",
  features: [
    "Variants: bar (standard track) and top-bar (fixed top-of-viewport page loader)",
    "Sizes: sm (6px) and md (10px)",
    "Supports numeric percentage text indicators and custom valueFormat functions",
    "Label placement options: top header row or right side-by-side"
  ],
  accessibility: [
    "Built on native ARIA progressbar pattern (role='progressbar')",
    "Communicates aria-valuenow, aria-valuemin, and aria-valuemax to screen readers"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Progress for file upload progress, step wizard completion, or page loading bars."
      },
      {
        guidance: false,
        description: "Do not use Progress for interactive slider input controls — reach for Slider instead."
      }
    ]
  },
  examples: [
    {
      title: "File Upload Progress Bar",
      code: '<Progress value={65} showValue label="Uploading document..." labelPosition="top" />'
    }
  ]
};
