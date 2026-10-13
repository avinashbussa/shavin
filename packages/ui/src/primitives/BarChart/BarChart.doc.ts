import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "BarChart",
  description: "Vertical or horizontal bars: single, grouped (two or more bars per category for comparison) or stacked.",
  features: [
    "orientation vertical or horizontal (long labels, rankings)",
    "mode grouped for comparisons, stacked for composition",
    "Round-number axis ticks and a shared hover tooltip",
    "Legend for two or more series",
    "No series needed for a single set of values: pass { label, value } and optionally a per-bar tone or color",
    "Negative values (vertical), yMax, tickCount, yFormat, showYAxis, showXAxis, showGrid, padding",
    "xLabelEvery / xLabelEveryMobile / xLabels thin the axis labels; barRadius (none, sm, lg, floor), barGap, maxBarWidth"
  ],
  accessibility: ["The chart has role=img with a label; keep the surrounding heading and values in text", "Colour is never the only signal: legends, labels and tooltips carry names and values"],
  keyboard: "Hover to inspect values.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Use grouped bars to compare periods or segments side by side; use horizontal for ranked lists." },
      { guidance: false, description: "Do not pass pre-formatted strings as values; keep numbers raw and format with yFormat." }
    ]
  },
  examples: [
    {
      title: "Single series",
      code: `<BarChart data={[{ label: "Mon", value: 12 }, { label: "Tue", value: 18 }, { label: "Wed", value: 9 }]} yFormat="compact" />`,
    },
    {
      title: "Compare two periods",
      code: `<BarChart
  data={[
    { label: "Mon", thisWeek: 120, lastWeek: 98 },
    { label: "Tue", thisWeek: 132, lastWeek: 110 },
    { label: "Wed", thisWeek: 101, lastWeek: 121 },
    { label: "Thu", thisWeek: 134, lastWeek: 104 },
    { label: "Fri", thisWeek: 90, lastWeek: 88 },
  ]}
  series={[
    { key: "thisWeek", name: "This week" },
    { key: "lastWeek", name: "Last week", tone: "neutral" },
  ]}
/>`,
    },
    {
      title: "Ranking",
      code: `<BarChart
  orientation="horizontal"
  data={[
    { label: "/pricing", visitors: 4200 },
    { label: "/docs/getting-started", visitors: 3100 },
    { label: "/blog/launch", visitors: 1800 },
    { label: "/changelog", visitors: 950 },
  ]}
  series={[{ key: "visitors", name: "Visitors" }]}
/>`,
    },
  ]
};
