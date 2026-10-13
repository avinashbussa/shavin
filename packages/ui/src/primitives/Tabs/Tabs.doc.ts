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
      title: "Data-Driven Stateful Tabs",
      code: '<Tabs variant="line" items={[{ label: "Overview", content: "Overview Content" }, { label: "Settings", content: "Settings Content" }]} />'
    }
  ]
};
