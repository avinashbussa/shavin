import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Slider",
  description: "Range slider input primitive supporting standard track/thumb and tactile capsule pill variants, single or dual thumb values, auto/custom track marks, and radius customization.",
  features: [
    "Two visual variants: default (standard track/thumb) and capsule (tactile interactive pill with live active fill, embedded label, and unit formatters)",
    "Supports single value (scalar number 50 or [50]) or dual-thumb range values [20, 80]",
    "Automatic or custom stop mark ticks via marks=\"auto\" or marks={[0, 25, 50, 75, 100]}",
    "Radius escape hatch: none, small, medium, large, full, inherit",
    "Uses control radius --radius-lg by default"
  ],
  accessibility: [
    "Native ARIA slider accessibility implementation via Radix Slider and custom accessible pointer captures",
    "Supports keyboard Arrow key value increment/decrement and Home/End jump"
  ],
  keyboard: "Left/Right arrow keys adjust slider value, Home/End jump to min/max",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use variant='capsule' for dense toolbars, creative effect parameter controls, and media settings where spatial footprint and tactile feedback are critical."
      },
      {
        guidance: true,
        description: "Use variant='default' with dual thumbs for multi-point range filtering (e.g. price or date ranges)."
      },
      {
        guidance: false,
        description: "Do not use Slider for small discrete selection sets (<= 4 options) — reach for SegmentedControl instead."
      }
    ]
  },
  examples: [
    {
      title: "Capsule Pill Slider",
      code: '<Slider variant="capsule" label="Volume" value={65} min={0} max={100} step={5} formatValue={(v) => `${v}%`} />'
    },
    {
      title: "Standard Track Slider",
      code: '<Slider defaultValue={45} min={0} max={100} step={1} />'
    }
  ]
};

