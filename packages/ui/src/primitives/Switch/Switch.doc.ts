import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Switch",
  description: "Toggle switch control built on Radix Switch primitive with pill rounded-full track and animated sliding thumb handle.",
  features: [
    "Sizes: sm (20px track height) and md (24px track height)",
    "Pill-shaped rounded-full handle and track (allowed exception to container panel radius)",
    "Smooth sliding thumb transition between checked and unchecked states"
  ],
  accessibility: [
    "Uses role='switch' with aria-checked state handling",
    "Space/Enter toggles active state when focused",
    "Restores contrast across light and dark themes"
  ],
  keyboard: "Space or Enter to toggle switch on/off",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Switch for instant system setting toggles (e.g. Dark Mode, Notifications)."
      },
      {
        guidance: false,
        description: "Do not use Switch for form items requiring a manual Submit button — reach for Checkbox instead."
      }
    ]
  },
  examples: [
    {
      title: "Settings Toggle",
      code: '<Switch defaultChecked size="md" />'
    }
  ]
};
