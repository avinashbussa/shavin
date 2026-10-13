import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Tooltip",
  description: "Hover or focus label hint built on Radix Tooltip primitive with automatic positioning, arrow indicator, and theme tone overrides.",
  features: [
    "Supports tone: auto (semantic token), dark (high contrast dark), light (light background)",
    "Configurable placement side: top, right, bottom, left",
    "Uses control radius --radius-lg for compact label pill geometry",
    "Includes built-in TooltipProvider and animated entry transitions"
  ],
  accessibility: [
    "Triggers on keyboard focus as well as mouse hover",
    "ESC key dismisses tooltip without moving focus",
    "Exposes role='tooltip' automatically"
  ],
  keyboard: "Focus trigger element to reveal, Escape to dismiss",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Tooltip for short, non-interactive icon descriptions or action hints."
      },
      {
        guidance: false,
        description: "Do not place interactive buttons or links inside Tooltip content — use Popover instead."
      }
    ]
  },
  examples: [
    {
      title: "Action Hint Tooltip",
      code: '<Tooltip content="Save item to library"><Button iconLeft={<PlusIcon />}>Save</Button></Tooltip>'
    }
  ]
};
