import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "IconButton",
  description: "A square button that shows only an icon. It needs a label for screen readers, and comes in solid, soft, outline and ghost styles.",
  features: [
    "Variants: solid, soft, outline, ghost",
    "Tones: brand and danger",
    "Sizes: sm (32px), md (40px), lg (48px)",
    "Always forwards ref to support Radix primitive asChild triggers",
    "loading (Spinner replaces the icon, progress cursor) and disabledReason (focusable, reason in a Tooltip), same as Button"
  ],
  accessibility: [
    "Enforces mandatory aria-label string prop in TypeScript types for zero-accessibility-defect icon buttons",
    "Active scale micro-animation on press (active:scale-[0.97]), suppressed while disabled or loading",
    "disabledReason renders aria-disabled (focusable) and is the button's accessible description; the most common place for an unexplained disabled state",
    "loading sets aria-busy; loadingLabel is announced once"
  ],
  keyboard: "Space or Enter to trigger action",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Always pass a descriptive aria-label (e.g. aria-label='Close dialog')."
      },
      {
        guidance: false,
        description: "Do not pass visible text children — reach for Button instead."
      }
    ]
  },
  examples: [
    {
      title: "Disabled with a reason",
      code: '<IconButton aria-label="Delete project" variant="ghost" tone="danger" disabledReason="Only owners can delete projects"><Icon name="trash-2" /></IconButton>'
    },
    {
      title: "Settings Icon Button",
      code: '<IconButton aria-label="Open settings" variant="ghost"><Settings className="h-5 w-5" /></IconButton>'
    }
  ]
};
