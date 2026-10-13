import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "ActionBar",
  description: "Floating action bar pill for canvas tools, block insertion, and rich editor controls with searchable popovers.",
  features: [
    "Searchable action group popovers opening above the toolbar",
    "Keyword alias filtering per action item",
    "Uses panel radius --radius-panel for container bar geometry and control radius --radius-lg for action triggers",
    "Single active popover state handling"
  ],
  accessibility: [
    "Renders native <div role='toolbar'> container",
    "Auto-focuses search input when action group popover opens",
    "Enter key triggers top filtered action match; Escape dismisses popover"
  ],
  keyboard: "Type to search options, Enter to select top match, Escape to dismiss",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use ActionBar for canvas editing tools (e.g. Add Component, Theme Switcher, Zoom Controls)."
      },
      {
        guidance: false,
        description: "Do not use ActionBar for primary page navigation — reach for TopBar or Tabs instead."
      }
    ]
  },
  examples: [
    {
      title: "Canvas Action Bar",
      code: '<ActionBar groups={[{ key: "add", label: "Add Block", items: [{ value: "hero", label: "Hero Section" }, { value: "pricing", label: "Pricing Table" }] }]} onAction={() => {}} />'
    }
  ]
};
