import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Calendar",
  description: "Full-featured schedule and event calendar primitive supporting full month grid and 1-day, 2-day, or 3-day time columns.",
  features: [
    "Views: full (month grid), 1day, 2days, 3days (time column schedule views)",
    "Renders event chips (CalendarEventChip) with tone status color accents",
    "Uses SegmentedControl view mode switcher",
    "Uses panel radius --radius-panel for container and control radius --radius-lg for day cells"
  ],
  accessibility: [
    "Today emphasis indicator with focus and active states",
    "Screen reader aria-label descriptions for navigation controls"
  ],
  keyboard: "Tab to browse view controls and date cells, Space/Enter to select date or event",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Calendar for dashboard scheduling views, event planners, and booking applications."
      },
      {
        guidance: false,
        description: "Do not use Calendar inside a compact dropdown field — reach for DatePicker instead."
      }
    ]
  },
  examples: [
    {
      title: "Full Month Event Calendar",
      code: '<Calendar view="full" events={[{ id: "1", title: "Team Sync", date: "2026-08-16", time: "10:00 AM", tone: "info" }]} />'
    }
  ]
};
