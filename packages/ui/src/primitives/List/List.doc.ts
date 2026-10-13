import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "List",
  group: "typography",
  description: "Semantic typography prose list component supporting bulleted, numbered, alpha, and roman numeral markers.",
  features: [
    "Markers: bullet (disc), number (decimal), lower-roman, upper-roman, lower-alpha, upper-alpha, none",
    "Auto-infers <ul> or <ol> tag based on marker choice",
    "Semantic <ul> / <ol> and <li> HTML structure"
  ],
  accessibility: [
    "Native HTML list accessibility tree representation",
    "High contrast marker styling (marker:text-fg-subtle)"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use List for prose bullet points, feature lists, and sequential steps."
      },
      {
        guidance: false,
        description: "Do not use List for clickable interactive item rows — reach for Card or DataList instead."
      }
    ]
  },
  examples: [
    {
      title: "Bulleted Prose List",
      code: '<List marker="bullet"><ListItem>First key feature point</ListItem><ListItem>Second key feature point</ListItem></List>'
    }
  ]
};
