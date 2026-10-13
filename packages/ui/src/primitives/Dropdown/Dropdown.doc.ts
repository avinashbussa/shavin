import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Dropdown",
  description: "Simple select dropdown supporting both custom styled popup panel and native HTML <select> mobile rendering.",
  features: [
    "Variants: default (custom theme-styled popup) and native (<select> tag for mobile UX)",
    "Appearances: default (bordered field) and ghost (borderless filter style)",
    "Sizes: sm (32px) and md (40px)",
    "Controlled (value + onChange/onValueChange) or uncontrolled (defaultValue, optional onChange)"
  ],
  accessibility: [
    "Native variant leverages OS native picker accessibility and touch controls",
    "Custom variant uses button trigger with keyboard focus states"
  ],
  keyboard: "Space/Enter to open dropdown popup, Escape to dismiss",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use appearance='ghost' for inline toolbar filters."
      },
      {
        guidance: false,
        description: "Do not use Dropdown for complex multi-select or searchable items — use Combobox instead."
      }
    ]
  },
  examples: [
    {
      title: "Custom Theme Dropdown",
      code: '<Dropdown value="all" options={[{ value: "all", label: "All Items" }, { value: "active", label: "Active" }]} onChange={() => {}} />'
    },
    {
      title: "Uncontrolled Dropdown",
      code: '<Dropdown defaultValue="active" options={[{ value: "all", label: "All Items" }, { value: "active", label: "Active" }]} />'
    }
  ]
};
