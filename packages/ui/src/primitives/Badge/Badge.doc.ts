import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Badge",
  description: "Status indicator pill component supporting semantic color schemes and control radius (--radius-lg).",
  features: [
    "Colors: neutral, accent, success, warning, danger",
    "Sizes: sm, md, lg",
    "Supports radius escape hatch (radius='none|small|medium|large|full|inherit')",
    "Defaults radius to inherit control radius (--radius-lg) per AGENTS.md rule"
  ],
  accessibility: [
    "Inline text status element",
    "High contrast semantic background and border colors for accessibility"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Badge for status tags, metadata counts, and status indicators."
      },
      {
        guidance: false,
        description: "Do not use Badge as a clickable primary action button — reach for Button instead."
      }
    ]
  },
  examples: [
    {
      title: "Success Status Badge",
      code: '<Badge color="success">Active</Badge>'
    }
  ]
};
