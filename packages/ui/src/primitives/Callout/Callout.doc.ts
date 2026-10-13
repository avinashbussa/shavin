import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Callout",
  description: "High-visibility information container panel built with panel radius (--radius-panel) and semantic colors.",
  features: [
    "Colors: neutral, accent, success, warning, danger",
    "Uses panel radius --radius-panel per AGENTS.md rule section 5",
    "Automatic default icons per semantic color variant (Info, CheckCircle, AlertTriangle, AlertCircle)"
  ],
  accessibility: [
    "Uses role='note' or role='alert' semantics for contextual warnings",
    "Includes semantic icon alongside text for visual accessibility"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Callout for important tips, warnings, or inline status updates."
      },
      {
        guidance: false,
        description: "Do not use Callout for temporary floating notifications — reach for Toast instead."
      }
    ]
  },
  examples: [
    {
      title: "Warning Callout",
      code: '<Callout color="warning" title="Action Required">Please verify your email address before continuing.</Callout>'
    }
  ]
};
