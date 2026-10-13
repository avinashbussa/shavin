import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Button",
  description: "General-purpose trigger for in-page actions (toolbars, forms, cards, action bars).",
  features: [
    "Variants: solid, soft, outline, ghost",
    "Tones: accent, danger",
    "Sizes: sm (32px), md (40px), lg (48px)",
    "Supports Radix Slot via asChild prop",
    "Supports iconLeft and iconRight slots with automatic label truncation"
  ],
  accessibility: [
    "Built with native <button> tag supporting full keyboard focus & activation (Enter/Space)",
    "Supports disabled state with pointer-events-none and opacity reduction",
    "Exposes standard aria-* attributes and role override via asChild"
  ],
  keyboard: "Space or Enter to activate button action",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use variant='solid' tone='accent' for primary action in a container or form."
      },
      {
        guidance: true,
        description: "Use variant='ghost' or variant='soft' for secondary/toolbar actions to preserve visual hierarchy."
      },
      {
        guidance: false,
        description: "Do not place two solid accent buttons adjacent to each other in the same action bar."
      }
    ]
  },
  examples: [
    {
      title: "Primary Solid Accent",
      description: "Standard call-to-action button",
      code: '<Button variant="solid" tone="accent">Save Changes</Button>'
    },
    {
      title: "Soft Secondary Action",
      description: "Subtle background action",
      code: '<Button variant="soft" tone="accent">View Details</Button>'
    },
    {
      title: "Destructive Action",
      description: "Danger-toned action for deletion or destructive triggers",
      code: '<Button variant="solid" tone="danger">Delete Account</Button>'
    }
  ]
};
