import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Heatmap",
  description: "A labelled grid of cells shaded by value: cohort retention, activity by day and hour, correlations.",
  features: [
    "values[row][column], null leaves a cell empty (cohort triangle)",
    "tone accent | success | warning | danger",
    "format number or percent; showValues toggles in-cell numbers",
    "Scrolls sideways instead of squashing columns"
],
  accessibility: ["The chart has role=img with a label; keep the surrounding heading and values in text", "Colour is never the only signal: legends, labels and tooltips carry names and values"],
  keyboard: "Hover to inspect values.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Use a Heatmap for two-dimensional patterns. Keep to one tone so intensity is the only signal." },
      { guidance: false, description: "Do not pass pre-formatted strings as values; keep numbers raw and format with yFormat." }
    ]
  },
  examples: [
    {
      title: "Activity by hour",
      code: `<Heatmap
  rows={["Mon", "Tue", "Wed"]}
  columns={["9am", "12pm", "3pm", "6pm"]}
  values={[
    [12, 40, 35, 8],
    [15, 44, 30, 10],
    [9, 38, 41, 12],
  ]}
/>`,
    },
    {
      title: "Retention",
      code: `<Heatmap
  rows={["Jan cohort", "Feb cohort", "Mar cohort"]}
  columns={["Week 0", "Week 1", "Week 2"]}
  values={[
    [1, 0.62, 0.48],
    [1, 0.58, null],
    [1, null, null],
  ]}
  format="percent"
  max={1}
/>`,
    },
  ]
};
