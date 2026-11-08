import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Tabs",
  description: "Tabbed navigation and in-page state container built on Radix Tabs primitive supporting line, segmented, pills, and button variants.",
  features: [
    "Modes: as='states' (in-page panels) and as='navigation' (URL routing links)",
    "Variants: line (default active underline), segmented, pills (rounded-full), button",
    "Orientations: horizontal and vertical",
    "Data-driven items prop array or compound children pattern"
  ],
  accessibility: [
    "Arrow key navigation between tab triggers",
    "Automatic aria-selected and role='tablist' / role='tab' accessibility tree wiring",
    "Supports disabled tab state and keyboard focus indicator"
  ],
  keyboard: "Left/Right or Up/Down arrows to move focus between tab triggers, Space/Enter to activate",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use variant='line' for main page/section tabs and variant='segmented' for compact inline filters."
      },
      {
        guidance: false,
        description: "Do not mix as='states' and as='navigation' modes in the same tab strip."
      }
    ]
  },
  examples: [
    {
      title: "Line (default)",
      description: "Underline that slides to the active tab.",
      code: '<Tabs variant="line" items={[{ label: "Overview", content: "Overview content" }, { label: "Activity", content: "Activity content" }, { label: "Settings", content: "Settings content" }]} />'
    },
    {
      title: "Segmented",
      description: "Enclosed control; the accent pill glides between tabs (variant=\"segmented\").",
      code: '<Tabs variant="segmented" items={[{ label: "Day", content: "Day view" }, { label: "Week", content: "Week view" }, { label: "Month", content: "Month view" }]} />'
    },
    {
      title: "Pills",
      description: "Rounded capsule tabs (variant=\"pills\").",
      code: '<Tabs variant="pills" items={[{ label: "All", content: "All items" }, { label: "Active", content: "Active items" }, { label: "Archived", content: "Archived items" }]} />'
    },
    {
      title: "Button",
      description: "Toolbar-style button tabs (variant=\"button\").",
      code: '<Tabs variant="button" items={[{ label: "Edit", content: "Editing" }, { label: "Preview", content: "Previewing" }]} />'
    }
  ]
};
