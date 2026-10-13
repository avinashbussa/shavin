import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Emphasis",
  group: "typography",
  description: "Inline prose marks: Em for stress, Strong for importance and Quote for a short inline quotation with curly quotes.",
  features: [
    "Em: italic, text-fg",
    "Strong: semibold, text-fg",
    "Quote: italic with typographic quotation marks added by CSS",
  ],
  accessibility: [
    "Em and Strong render <em> and <strong>, which carry meaning for assistive tech; use them for stress and importance, not for styling alone",
  ],
  usage: {
    bestPractices: [
      { guidance: true, description: "Use Strong for the key fact in a sentence and Em for a word you would stress when reading aloud." },
      { guidance: false, description: "Do not make whole paragraphs bold or italic; it removes the emphasis." },
    ],
  },
  examples: [
    {
      title: "Inline marks",
      code: '<Text>Exports are <Strong>permanent</Strong>, so check the <Em>date range</Em> first. As the guide puts it, <Quote>measure twice</Quote>.</Text>',
    },
  ],
};
