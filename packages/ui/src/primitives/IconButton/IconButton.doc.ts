import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "IconButton",
  description: "Square icon-only action button primitive enforcing mandatory aria-label prop and control radius (--radius-lg).",
  features: [
    "Variants: solid, soft, outline, ghost",
    "Tones: accent and danger",
    "Sizes: sm (32px), md (40px), lg (48px)",
    "Always forwards ref to support Radix primitive asChild triggers"
  ],
  accessibility: [
    "Enforces mandatory aria-label string prop in TypeScript types for zero-accessibility-defect icon buttons",
    "Active scale micro-animation on press (active:scale-[0.97])"
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
      title: "Settings Icon Button",
      code: '<IconButton aria-label="Open settings" variant="ghost"><Settings className="h-5 w-5" /></IconButton>'
    }
  ]
};
