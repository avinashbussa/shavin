import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "FunnelChart",
  description: "A conversion funnel in either direction, with step counts, share of the first step and drop-off between steps.",
  features: [
    "orientation horizontal (bar per step) or vertical (column per step)",
    "centered narrows the stack like a funnel (horizontal)",
    "Drop-off percentage between steps, toggle with showDropOff"
],
  accessibility: ["The chart has role=img with a label; keep the surrounding heading and values in text", "Colour is never the only signal: legends, labels and tooltips carry names and values"],
  keyboard: "Hover to inspect values.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Use vertical for short funnels (up to 6 steps) with long names elsewhere; horizontal reads best in narrow cards." },
      { guidance: false, description: "Do not pass pre-formatted strings as values; keep numbers raw and format with yFormat." }
    ]
  },
  examples: [
    {
      title: "Horizontal",
      code: `<FunnelChart
  steps={[
    { name: "Visited", value: 12400 },
    { name: "Signed up", value: 3100 },
    { name: "Activated", value: 1650 },
    { name: "Paid", value: 420 },
  ]}
/>`,
    },
    {
      title: "Vertical",
      code: `<FunnelChart
  orientation="vertical"
  steps={[
    { name: "Visited", value: 12400 },
    { name: "Signed up", value: 3100 },
    { name: "Activated", value: 1650 },
    { name: "Paid", value: 420 },
  ]}
/>`,
    },
  ]
};
