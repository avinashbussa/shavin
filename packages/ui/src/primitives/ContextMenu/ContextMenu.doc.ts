import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "ContextMenu",
  description: "Right-click context action menu built on Radix ContextMenu primitive with data-panel surface styling.",
  features: [
    "Components: ContextMenu and ContextMenuItem",
    "Supports CVA variant='default' and variant='danger' (destructive item)",
    "Right-click trigger zone binding",
    "Includes data-panel translucent backdrop attribute"
  ],
  accessibility: [
    "Keyboard item highlight and selection",
    "Applies role='menu' and role='menuitem' accessibility semantics"
  ],
  keyboard: "Up/Down arrows to navigate menu items, Enter to select item, Escape to dismiss",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use ContextMenu for desktop right-click power-user shortcuts (e.g. file row actions)."
      },
      {
        guidance: false,
        description: "Do not hide critical primary functionality exclusively behind right-click context menus."
      }
    ]
  },
  examples: [
    {
      title: "Right-Click Context Target",
      code: '<ContextMenu trigger={<div>Right click me</div>}><ContextMenuItem>Copy Link</ContextMenuItem><ContextMenuItem variant="danger">Delete</ContextMenuItem></ContextMenu>'
    }
  ]
};
