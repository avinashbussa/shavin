import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Menu",
  description: "Floating action dropdown menu built on Radix DropdownMenu primitive with full keyboard navigation and nested sub-menu support.",
  features: [
    "Components: Menu, MenuTrigger, MenuItem, MenuSub, MenuSubTrigger, MenuSubContent",
    "Supports CVA variant='default' and variant='danger' (destructive item)",
    "Includes ChevronRight indicator for nested sub-menus per AGENTS.md convention",
    "Uses data-panel translucent surface styling"
  ],
  accessibility: [
    "Arrow key navigation between items with typeahead character matching",
    "Restores focus to trigger element on close",
    "Supports aria-expanded, aria-controls, and role='menu'"
  ],
  keyboard: "Up/Down arrows to navigate items, Right arrow to open sub-menu, Left arrow to close sub-menu, Enter to select, Escape to dismiss",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Menu for contextual action lists (e.g. ⋯ overflow triggers)."
      },
      {
        guidance: false,
        description: "Do not use Menu as a form select control — reach for Select instead."
      }
    ]
  },
  examples: [
    {
      title: "Context Action Menu",
      code: '<Menu trigger={<MenuTrigger />}><MenuItem>Edit</MenuItem><MenuItem variant="danger">Delete</MenuItem></Menu>'
    }
  ]
};
