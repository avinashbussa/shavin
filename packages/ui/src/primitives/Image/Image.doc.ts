import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Image",
  description: "Image primitive with automatic broken-link placeholder fallback, aspect-ratio preservation, and object-fit scaling.",
  features: [
    "Supports radius escape hatch (radius='none|small|medium|large|full|inherit')",
    "Defaults to panel radius --radius-panel per AGENTS.md rules",
    "Zero Layout Shift (CLS) via ratio prop (e.g. ratio='16/9')",
    "Graceful fallback box when src is missing or fails to load"
  ],
  accessibility: [
    "Enforces alt text prop for screen reader image descriptions",
    "Applies role='img' and aria-label to broken placeholder states"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Always pass ratio='16/9' or explicit dimensions to reserve space and prevent layout shifts."
      },
      {
        guidance: false,
        description: "Do not use raw un-styled <img> tags — reach for Image primitive to handle load failures gracefully."
      }
    ]
  },
  examples: [
    {
      title: "Hero Feature Image",
      code: '<Image src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800" alt="Abstract shapes" ratio="16/9" fit="cover" />'
    }
  ]
};
