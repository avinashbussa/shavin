import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "SegmentedControl",
  description: "Exclusive single-select toggle group built on Radix ToggleGroup primitive supporting default, pill, subtle, expand, and icon variants, with an animated active indicator that slides between items.",
  features: [
    "Variants: default (solid accent pill), pill (rounded-full surface capsule), subtle (muted accent-tint active fill), expand (animated label expand), icon (icon-only mode)",
    "Animated sliding active indicator (default / pill / subtle / icon) — the active fill glides between items; respects reduced-motion. The expand rail keeps its per-item label-reveal animation instead",
    "Sizes: sm (32px) and md (40px)",
    "Supports concentric inner item radius math: calc(var(--radius-lg) - 4px)"
  ],
  accessibility: [
    "Built on Radix ToggleGroup primitive with role='radiogroup' / role='group'",
    "Arrow key navigation between items with active state announcement",
    "Supports disabled state per item"
  ],
  keyboard: "Left/Right arrow keys to navigate segments, Space/Enter to select",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use SegmentedControl for compact inline view switchers (e.g. List vs Grid)."
      },
      {
        guidance: false,
        description: "Do not use SegmentedControl for long multi-page tab routing — reach for Tabs instead."
      }
    ]
  },
  examples: [
    {
      title: "Default",
      description: "Accent active fill that slides between items.",
      code: `function ViewSwitch() {
  const [v, setV] = useState("list");
  return (
    <SegmentedControl value={v} onValueChange={(x) => x && setV(x)}>
      <SegmentedControlItem value="list">List</SegmentedControlItem>
      <SegmentedControlItem value="grid">Grid</SegmentedControlItem>
      <SegmentedControlItem value="board">Board</SegmentedControlItem>
    </SegmentedControl>
  );
}`,
    },
    {
      title: "Subtle",
      description: "Muted accent-tint active fill — for quiet inline switches like inspector/export controls (declare with variant=\"subtle\").",
      code: `function FilterSwitch() {
  const [v, setV] = useState("recent");
  return (
    <SegmentedControl variant="subtle" value={v} onValueChange={(x) => x && setV(x)}>
      <SegmentedControlItem value="recent">Recent</SegmentedControlItem>
      <SegmentedControlItem value="starred">Starred</SegmentedControlItem>
      <SegmentedControlItem value="trash">Trash</SegmentedControlItem>
    </SegmentedControl>
  );
}`,
    },
    {
      title: "Pill",
      description: "Rounded-full capsule with a sliding surface pill (variant=\"pill\").",
      code: `function RangeSwitch() {
  const [v, setV] = useState("week");
  return (
    <SegmentedControl variant="pill" value={v} onValueChange={(x) => x && setV(x)}>
      <SegmentedControlItem value="day">Day</SegmentedControlItem>
      <SegmentedControlItem value="week">Week</SegmentedControlItem>
      <SegmentedControlItem value="month">Month</SegmentedControlItem>
    </SegmentedControl>
  );
}`,
    },
  ]
};
