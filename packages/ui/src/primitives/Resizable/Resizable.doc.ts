import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "ResizeHandle",
  group: "layout",
  description: "Resize handle and the headless useResizable engine behind the resizable prop on Box, Flex, Card and Sidebar. The element owns its own size; for panes that trade space with neighbours use PanelGroup from @shavin/ui/panels.",
  features: [
    "resizable prop on Box, Flex and Card: one edge (\"right\"), an axis (\"x\", \"y\"), \"both\", true, or a list of edges and corners",
    "minWidth / maxWidth / minHeight / maxHeight bounds, snap grid, lockAspectRatio",
    "persistKey remembers the size in localStorage; double-click or Enter resets it",
    "Handle looks: line (line on hover), grip (always-visible pill), invisible",
    "resizeColor: accent-subtle (default, softer accent), accent or neutral (monochrome)",
    "While dragging, the grip slides along the edge with the pointer (clear of rounded corners) and re-centres on release",
    "Radius-aware: edge lines stop where rounded corners begin; corner handles sit on the curve",
    "Works inside scaled canvases; an overlay stops iframes swallowing the drag",
    "useResizable hook for custom handles; ResizeHandle / ResizeHandles for the Shavin look"
  ],
  accessibility: [
    "Each handle is a focusable role=\"separator\" with aria-orientation, aria-valuenow, aria-valuemin and aria-valuemax",
    "Arrow keys move the focused edge by resizeStep (Shift = 4x); Home / End jump to the bounds; Enter resets",
    "Touch screens get a 24px hit area"
  ],
  usage: {
    bestPractices: [
      { guidance: true, description: "Use the resizable prop when one element resizes against flexible space (a sidebar next to a flex-1 main area, an inspector, a chat input)." },
      { guidance: true, description: "Always set minWidth/maxWidth (or minHeight/maxHeight) so the element cannot be dragged to nothing or past its layout." },
      { guidance: true, description: "Use PanelGroup from @shavin/ui/panels when two or more panes must share a fixed space." },
      { guidance: false, description: "Do not put resizable on a flex-1 item: flex-grow overrides the dragged width." },
      { guidance: false, description: "Do not resize from left or top on an absolutely positioned element without moving it in onResize; it grows backwards." }
    ]
  },
  examples: [
    {
      title: "Resizable inspector",
      description: "Right-aligned panel resized from its left edge, remembered between visits",
      code: '<Flex className="h-80"><Box className="flex-1">Canvas</Box><Box resizable="left" minWidth={240} maxWidth={480} persistKey="inspector" className="w-72 border-l border-hairline bg-surface p-4">Inspector</Box></Flex>'
    },
    {
      title: "Resizable card",
      description: "Corner and edges, with an always-visible grip",
      code: '<Card resizable="both" resizeHandle="grip" minWidth={200} minHeight={120} padding="md" className="w-72 h-40"><Flex direction="column" gap="3"><Text weight="medium">Notes</Text><Text color="subtle">Drag the corner.</Text></Flex></Card>'
    },
    {
      title: "Headless hook",
      description: "Custom element with Shavin handles",
      code: 'const r = useResizable({ edges: "x", minWidth: 200 });\n<div ref={r.ref} style={r.style} className="relative"><ResizeHandles state={r} /></div>'
    }
  ]
};
