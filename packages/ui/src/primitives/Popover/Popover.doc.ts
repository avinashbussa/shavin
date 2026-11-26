import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Popover",
  description: "A panel that opens when the user clicks a trigger, for short forms or extra detail. It stays on screen near edges and closes on Escape or a click outside.",
  features: [
    "Components: Popover, PopoverTrigger, PopoverAnchor, PopoverContent",
    "Uses data-panel attribute for translucent surface styling",
    "Configurable align, sideOffset, collisionPadding, and avoidCollisions"
  ],
  accessibility: [
    "Focus trapped automatically inside popover content while open",
    "ESC key dismisses popover and returns focus to trigger",
    "Supports aria-haspopup and aria-expanded attributes"
  ],
  keyboard: "Escape to dismiss popover, Tab to cycle focusable items",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Set align='start' and collisionPadding=8 for standard floating popovers."
      },
      {
        guidance: false,
        description: "Do not use Popover for simple hover labels — reach for Tooltip instead."
      }
    ]
  },
  examples: [
    {
      title: "Basic Popover",
      code: '<Popover><PopoverTrigger asChild><Button>Open Popover</Button></PopoverTrigger><PopoverContent><Text>Popover Content</Text></PopoverContent></Popover>'
    }
  ]
};
