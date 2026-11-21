import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "ColorPicker",
  description: "Pick a colour from preset swatches or a colour area, or type a hex or RGB value. It can sit inline or open in a popover, and offers an eyedropper where the browser supports one.",
  features: [
    "Variants: default (panel popup with swatches grid/scroll) and field (compact field with leading swatch and trailing pipette)",
    "Supports grid vs scroll swatch layouts",
    "Integrates native HTML5 <input type='color'> eyedropper",
    "Uses panel radius --radius-panel for container and control radius --radius-lg for swatches"
  ],
  accessibility: [
    "Provides aria-label and aria-pressed attributes for color swatch buttons",
    "Provides screen reader labels for native eyedropper input trigger"
  ],
  keyboard: "Tab to browse swatches grid, Space/Enter to pick color, Type hex/RGB value in text box",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use ColorPicker in design system configurators, theme customizers, or canvas drawing tools."
      },
      {
        guidance: false,
        description: "Do not use ColorPicker when selecting from a tiny closed set (<= 3 choices) — reach for RadioGroup or Select instead."
      }
    ]
  },
  examples: [
    {
      title: "Brand Color Swatch Picker",
      // ds-lint-disable-next-line no-hex — example hex value
      code: '<ColorPicker value="#46a758" onChange={() => {}} variant="default" swatchLayout="grid" />'
    }
  ]
};
