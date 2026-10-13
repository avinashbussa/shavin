import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "ScrollArea",
  description: "Custom styled scrollbar viewport primitive built on Radix ScrollArea supporting vertical and horizontal scrolling.",
  features: [
    "Built on @radix-ui/react-scroll-area",
    "Custom rounded scrollbar thumbs styled with bg-hairline-strong",
    "Cross-browser consistent scrollbars across macOS, Windows, and Linux",
    "Supports vertical and horizontal scrollbars"
  ],
  accessibility: [
    "Native scroll accessibility interactions and keyboard arrow navigation"
  ],
  keyboard: "Up/Down and PageUp/PageDown keys scroll viewport content when focused",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use ScrollArea inside fixed-height dialogs, dropdowns, and sidebars."
      },
      {
        guidance: false,
        description: "Do not forget to set an explicit height (e.g. h-64 or max-h-80) on ScrollArea container."
      }
    ]
  },
  examples: [
    {
      title: "Fixed Height Scrollable List",
      code: '<ScrollArea className="h-48 border border-hairline p-3"><div className="space-y-4"><div>Item 1</div><div>Item 2</div><div>Item 3</div><div>Item 4</div></div></ScrollArea>'
    }
  ]
};
