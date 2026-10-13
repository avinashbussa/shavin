import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "CheckboxCards",
  description: "Multi-select option cards grid combining custom card containers with built-in Radix Checkbox controls.",
  features: [
    "Components: CheckboxCards and CheckboxCardsItem",
    "Uses panel radius --radius-panel per AGENTS.md section 5 rules",
    "Card fill and border highlight when checked (border-accent bg-accent/5)"
  ],
  accessibility: [
    "Renders native <div role='group'> wrapper",
    "Label click toggles associated checkbox state automatically"
  ],
  keyboard: "Space to toggle checkbox card selection when focused",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use CheckboxCards when selecting multiple options that need rich visual titles, icons, or pricing details."
      },
      {
        guidance: false,
        description: "Do not use CheckboxCards for single-choice selection — reach for RadioGroup with variant='cards' instead."
      }
    ]
  },
  examples: [
    {
      title: "Feature Selection Cards",
      code: '<CheckboxCards><CheckboxCardsItem checked={true} onCheckedChange={() => {}}>Advanced Analytics</CheckboxCardsItem></CheckboxCards>'
    }
  ]
};
