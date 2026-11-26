import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Separator",
  description: "A thin line between content, across or down. It comes in several thicknesses and colours.",
  features: [
    "Built on @radix-ui/react-separator",
    "Orientations: horizontal (h-px w-full) and vertical (h-full w-px)",
    "Uses bg-hairline token color for subtle section dividers",
    "Supports decorative accessibility mode"
  ],
  accessibility: [
    "Communicates separator role or aria-hidden for decorative dividers via Radix Separator"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Separator to separate distinct content sections or toolbar button groups."
      },
      {
        guidance: false,
        description: "Do not use literal <hr> elements — reach for Separator for accessible token-driven dividers."
      }
    ]
  },
  examples: [
    {
      title: "Horizontal Divider",
      code: '<div className="space-y-4"><div>Top Content</div><Separator /><div >Bottom Content</div></div>'
    }
  ]
};
