import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Spinner",
  description: "Loading indicator supporting circular spin, pulsing wave dots, Claude-style cycling glyphs, and animated typing ellipsis.",
  features: [
    "Variants: spin (SVG arc rotation), dots (pulsing wave dots), glyph (cycling stars), ellipsis (animated dots)",
    "Sizes: sm (14px), md (16px), lg (28px)",
    "Inherits current text color (text-current)",
    "Custom glyph array and interval duration support"
  ],
  accessibility: [
    "Applies role='status' and aria-label='Loading' across all spinner variants",
    "Screen readers announce loading state when mounted"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Spinner inside Button loading states or section loading overlays."
      },
      {
        guidance: false,
        description: "Do not render full-page spinners without descriptive text explaining what is loading."
      }
    ]
  },
  examples: [
    {
      title: "Button Loading Spinner",
      code: '<Button disabled><Spinner size="sm" /> Loading...</Button>'
    }
  ]
};
