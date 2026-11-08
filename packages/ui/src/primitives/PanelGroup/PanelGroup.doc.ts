import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "PanelGroup",
  group: "layout",
  description: "Resizable split panes that trade space with each other (code / preview / terminal). Import from \"@shavin/ui/panels\", not the root. Built on react-resizable-panels. For one element that resizes itself, use the resizable prop on Box, Flex or Card.",
  features: [
    "PanelGroup, Panel and PanelHandle from \"@shavin/ui/panels\"",
    "orientation=\"horizontal\" (side by side) or \"vertical\" (stacked); groups nest",
    "Panel sizes in px (numbers) or %, rem, vh, vw (strings); minSize, maxSize, collapsible, collapsedSize",
    "persistKey remembers the layout in localStorage; pass storage for cookies or server sync",
    "PanelHandle looks: line (hairline divider), grip (pill), invisible; color: accent-subtle (default), accent, neutral; while dragging the grip follows the pointer along the divider and re-centres on release",
    "usePanelRef / useGroupRef for collapse(), expand(), resize() and setLayout()"
  ],
  accessibility: [
    "PanelHandle is a focusable role=\"separator\" with aria-valuenow, aria-valuemin, aria-valuemax and aria-controls",
    "Arrow keys resize, Home / End jump to the bounds, Enter toggles a collapsible panel",
    "Hit targets grow on touch screens"
  ],
  usage: {
    bestPractices: [
      { guidance: true, description: "Import from \"@shavin/ui/panels\" so apps that never split panes do not bundle the panel engine." },
      { guidance: true, description: "Give every Panel a stable id when using persistKey or the imperative refs." },
      { guidance: true, description: "Give the PanelGroup's parent a fixed height (h-full inside an app shell, or an explicit height)." },
      { guidance: false, description: "Do not use PanelGroup for a single sidebar next to flexible content; use Sidebar resizable or Box resizable." },
      { guidance: false, description: "Do not wrap PanelHandle in another element; it must be a direct child of PanelGroup." }
    ]
  },
  examples: [
    {
      title: "Editor split",
      description: "Three panes, the first collapsible, layout remembered",
      code: '<PanelGroup orientation="horizontal" persistKey="editor" className="h-96"><Panel id="files" defaultSize="20%" minSize={160} collapsible><Box className="h-full p-4">Files</Box></Panel><PanelHandle /><Panel id="code" minSize="30%"><Box className="h-full p-4">Code</Box></Panel><PanelHandle variant="grip" /><Panel id="preview" defaultSize="35%"><Box className="h-full p-4">Preview</Box></Panel></PanelGroup>'
    },
    {
      title: "Nested vertical split",
      code: '<PanelGroup className="h-96"><Panel id="main"><PanelGroup orientation="vertical"><Panel id="editor"><Box className="h-full p-4">Editor</Box></Panel><PanelHandle /><Panel id="terminal" defaultSize="30%" minSize={80}><Box className="h-full p-4">Terminal</Box></Panel></PanelGroup></Panel><PanelHandle /><Panel id="chat" defaultSize="30%"><Box className="h-full p-4">Chat</Box></Panel></PanelGroup>'
    }
  ]
};
