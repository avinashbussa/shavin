import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "RadioGroup",
  description: "Single-choice radio selection group built on Radix RadioGroup primitive supporting radio buttons and selectable card grid layouts.",
  features: [
    "Variants: default (standard radio buttons) and cards (selectable card grid)",
    "Supports radius escape hatch (radius='none|small|medium|large|full|inherit')",
    "Defaults to rounded-full for radio buttons per AGENTS.md convention"
  ],
  accessibility: [
    "Built on native ARIA radio group pattern (role='radiogroup')",
    "Arrow keys navigate between radio choices within the group",
    "Space key selects focused radio option"
  ],
  keyboard: "Up/Down or Left/Right arrows to cycle options in group, Space to select",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use RadioGroup for mutually exclusive choices when all options should be visible at once."
      },
      {
        guidance: false,
        description: "Do not use RadioGroup if options exceed 6 — reach for Select instead."
      }
    ]
  },
  examples: [
    {
      title: "Radio Button Group",
      code: '<RadioGroup defaultValue="monthly"><Radio value="monthly" label="Monthly Billing" /><Radio value="annual" label="Annual Billing" /></RadioGroup>'
    }
  ]
};
