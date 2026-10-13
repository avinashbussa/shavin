import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Select",
  description: "Accessible dropdown select control built on Radix Select primitive with option grouping and viewport collision positioning.",
  features: [
    "Supports flat options and grouped options (OptionGroup)",
    "Sizes: sm (small trigger), md (standard trigger)",
    "Supports onItemHighlight callback for live preview hovering",
    "Controlled (value + onChange/onValueChange) or uncontrolled (defaultValue, optional onChange)",
    "Uses data-panel translucent floating surface styling"
  ],
  accessibility: [
    "Full keyboard navigation via Arrow keys, Home, End, Enter, and Escape",
    "Typeahead search support provided by Radix Select",
    "Never use empty string value='' for option sentinel (reserved by Radix)"
  ],
  keyboard: "Up/Down arrows to navigate options, Enter/Space to select, Escape to close dropdown",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Select for single-choice option picker with 5+ options."
      },
      {
        guidance: false,
        description: "Do not pass value='' inside option arrays — empty string sentinel is forbidden in Radix Select."
      }
    ]
  },
  examples: [
    {
      title: "Basic Select",
      code: '<Select value="grass" options={[{ value: "grass", label: "Grass" }, { value: "indigo", label: "Indigo" }]} onChange={() => {}} />'
    },
    {
      title: "Uncontrolled Select",
      code: '<Select defaultValue="viewer" ariaLabel="Role" options={[{ value: "admin", label: "Admin" }, { value: "viewer", label: "Viewer" }]} />'
    }
  ]
};
