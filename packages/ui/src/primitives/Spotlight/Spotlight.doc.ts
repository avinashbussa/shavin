import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Spotlight",
  description: "Command palette modal overlay component featuring auto-focused search input, keyboard navigation shortcuts, and result list slot.",
  features: [
    "Built on Radix Dialog primitive with custom data-panel overlay styling",
    "Auto-focuses input upon opening",
    "Uses panel radius --radius-panel per AGENTS.md section 5 rules",
    "Footer keyboard shortcut hints legend bar"
  ],
  accessibility: [
    "Focus trap and Escape key dismiss handling via Radix Dialog",
    "Screen reader search input labeling and clear query button aria-label"
  ],
  keyboard: "Cmd+K / Ctrl+K to open, Up/Down arrows to navigate options, Enter to select option, Escape to close",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Spotlight for global search command palettes (Cmd+K) and quick navigation search dialogs."
      },
      {
        guidance: false,
        description: "Do not use Spotlight for simple single-field form inputs — reach for TextField instead."
      }
    ]
  },
  examples: [
    {
      title: "Global Command Palette (Cmd+K)",
      code: '<Spotlight open={true} onOpenChange={() => {}} query="" onQueryChange={() => {}}><div>Search Results List</div></Spotlight>'
    }
  ]
};
