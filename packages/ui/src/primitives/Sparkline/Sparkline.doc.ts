import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Sparkline",
  description: "A tiny, axis-free trend (line, area or bars) for stat cards and table cells. It fills its container, so size it with className.",
  features: [
    "type line (default), area or bar; tone accent, success, warning, danger or neutral",
    "data is a list of numbers, or objects with a value and an optional per-bar tone",
    "No axes, grid or tooltip: pair it with a visible number, never use it as the only readout",
    "Resolves colours and radius from theme tokens"
  ],
  accessibility: ["Decorative (aria-hidden): the figure it summarises must be present as text beside it"],
  keyboard: "Not interactive.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Put the current value and the change as text next to the sparkline." },
      { guidance: false, description: "Do not use a Sparkline when the reader needs exact values: use LineChart or BarChart." }
    ]
  },
  examples: [
    { title: "Line", code: '<Sparkline data={[4, 7, 5, 9, 12, 10, 14]} className="h-10 w-32" />' },
    { title: "Bars", code: '<Sparkline type="bar" tone="success" data={[3, 5, 2, 8, 6, 9]} className="h-12 w-40" />' }
  ]
};
