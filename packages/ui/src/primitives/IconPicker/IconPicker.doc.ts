import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "IconPicker",
  description: "Searchable icon selection popover grid supporting Lucide icons for builder, form customizers, and toolbar triggers.",
  features: [
    "Variants: 'default' (full input-like trigger) or 'icon' (compact square button)",
    "Sizes: sm, md, lg for seamless alignment with form controls and toolbars",
    "Custom Trigger: pass custom children to trigger popover from any custom element",
    "Search filter text input with instantaneous keyword matching",
    "Icon Library filtering tabs supporting Lucide, Radix, Phosphor",
    "Supports optional 'none' (Ø) selection via allowNone prop",
    "Exports ALL_ICONS dictionary of built-in Lucide icons"
  ],
  accessibility: [
    "Keyboard accessible icon button grid with focus rings",
    "Each icon option provides accessible title tooltip attribute",
    "Radix Popover focus trapping and ESC key dismissal"
  ],
  keyboard: "Type to filter icons, Tab to browse grid, Enter to select icon, Escape to close",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use variant='icon' inside toolbars, action bars, or compact property panels."
      },
      {
        guidance: true,
        description: "Use IconPicker in page builder tools or customization settings forms."
      },
      {
        guidance: false,
        description: "Do not use IconPicker for simple static navigation links — use Button or MenuItem instead."
      }
    ]
  },
  examples: [
    {
      title: "Input-Style Trigger",
      code: '<IconPicker value="sparkles" onChange={(v) => console.log(v)} allowNone />'
    },
    {
      title: "Compact Icon-Button Trigger",
      code: '<IconPicker variant="icon" size="sm" value="settings" onChange={(v) => console.log(v)} />'
    },
    {
      title: "Custom Button Trigger",
      code: '<IconPicker value="user" onChange={(v) => console.log(v)}><Button variant="outline">Change Icon</Button></IconPicker>'
    }
  ]
};

