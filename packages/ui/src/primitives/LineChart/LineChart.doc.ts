import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "LineChart",
  description: "Line or area chart, one series or several: overlay several metrics, stack areas, smooth or straight curves, shared hover tooltip and legend. Axis ticks are always round numbers.",
  features: [
    "Multi-series: one record per x position, a numeric value per series key",
    "type line or area; stacked areas with stacked",
    "No series needed for a single trend: pass { label, value }",
    "curve smooth, linear or step (balances, plans, queue depth)",
    "yMax, tickCount, showYAxis, showXAxis, showGrid, padding, xLabelEvery / xLabelEveryMobile / xLabels",
    "yFormat (number | compact | currency | percent) with yPrefix/ySuffix",
    "Legend appears automatically for two or more series"
],
  accessibility: ["The chart has role=img with a label; keep the surrounding heading and values in text", "Colour is never the only signal: legends, labels and tooltips carry names and values"],
  keyboard: "Hover to inspect values.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Use LineChart for one or several metrics over time; use Sparkline for a tiny trend inside a card or table cell." },
      { guidance: false, description: "Do not pass pre-formatted strings as values; keep numbers raw and format with yFormat." }
    ]
  },
  examples: [
    {
      title: "Two lines",
      code: `<LineChart
  data={[
    { label: "Jan", web: 1200, ios: 640 },
    { label: "Feb", web: 1350, ios: 720 },
    { label: "Mar", web: 1280, ios: 810 },
    { label: "Apr", web: 1490, ios: 905 },
    { label: "May", web: 1620, ios: 980 },
    { label: "Jun", web: 1710, ios: 1100 },
  ]}
  series={[
    { key: "web", name: "Web" },
    { key: "ios", name: "iOS", tone: "success" },
  ]}
/>`,
    },
    {
      title: "Stacked area",
      code: `<LineChart
  type="area"
  stacked
  data={[
    { label: "Q1", web: 4200, ios: 2100, android: 1500 },
    { label: "Q2", web: 4600, ios: 2500, android: 1800 },
    { label: "Q3", web: 4900, ios: 2900, android: 2300 },
    { label: "Q4", web: 5400, ios: 3300, android: 2700 },
  ]}
  series={[
    { key: "web", name: "Web" },
    { key: "ios", name: "iOS" },
    { key: "android", name: "Android" },
  ]}
/>`,
    },
  ]
};
