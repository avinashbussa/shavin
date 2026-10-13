import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "TimePicker",
  description: "Time selection primitive supporting interval dropdown (TimePicker), segmented inputs (TimePickerInput), and analog clock face popover (TimePickerClock).",
  features: [
    "Components: TimePicker, TimePickerInput, TimePickerClock",
    "Configurable minute interval step (15, 30, 60 minutes)",
    "Analog clock face popover with hour and minute dial views",
    "Uses control radius --radius-lg for input segments and trigger buttons"
  ],
  accessibility: [
    "Screen reader aria-label descriptions for hours, minutes, and AM/PM toggle",
    "Tabular numbers (tabular-nums) for zero alignment jitter"
  ],
  keyboard: "Type numeric digits into HH/MM segments, Space/Enter to toggle AM/PM",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use TimePicker for appointment scheduling, meeting times, and reminders."
      },
      {
        guidance: false,
        description: "Do not use TimePicker for duration inputs (e.g. 2 hours 15 minutes) — reach for TextField or Select instead."
      }
    ]
  },
  examples: [
    {
      title: "Time Select Dropdown",
      code: '<TimePicker value={new Date()} onChange={() => {}} intervalMinutes={15} />'
    }
  ]
};
