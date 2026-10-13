import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "DonutChart",
  description: "A share-of-total ring with a centre readout and a legend with each slice's count and percentage.",
  features: [
    "Hover a slice or legend row to read its share in the centre",
    "size and thickness in px; centerLabel and centerValue",
    "Slice colours from tone or colour, otherwise a theme palette"
],
  accessibility: ["The chart has role=img with a label; keep the surrounding heading and values in text", "Colour is never the only signal: legends, labels and tooltips carry names and values"],
  keyboard: "Hover to inspect values.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Use a DonutChart for up to six parts of one whole. For more, use a horizontal BarChart." },
      { guidance: false, description: "Do not pass pre-formatted strings as values; keep numbers raw and format with yFormat." }
    ]
  },
  examples: [
    {
        "title": "Plan mix",
        "code": "<DonutChart centerLabel=\"Accounts\" data={[{ label: \"Free\", value: 640 }, { label: \"Team\", value: 210, tone: \"success\" }]} />"
    }
]
};
