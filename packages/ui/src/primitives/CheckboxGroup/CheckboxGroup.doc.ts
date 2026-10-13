import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "CheckboxGroup",
  description: "Vertical multi-select list wrapper built with semantic role='group' accessibility container.",
  features: [
    "Components: CheckboxGroup and CheckboxGroupItem",
    "Provides standardized vertical spacing (space-y-2)",
    "Integrates directly with Checkbox primitive props"
  ],
  accessibility: [
    "Native <div role='group'> semantic container",
    "Screen readers announce group context for contained checkboxes"
  ],
  keyboard: "Tab to navigate checkboxes, Space to toggle checked state",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use CheckboxGroup for vertical lists of multi-select form fields."
      },
      {
        guidance: false,
        description: "Do not use CheckboxGroup for mutually exclusive options — reach for RadioGroup instead."
      }
    ]
  },
  examples: [
    {
      title: "Notification Preferences Group",
      code: '<CheckboxGroup><CheckboxGroupItem label="Email Alerts" checked={true} onCheckedChange={() => {}} /><CheckboxGroupItem label="SMS Notifications" checked={false} onCheckedChange={() => {}} /></CheckboxGroup>'
    }
  ]
};
