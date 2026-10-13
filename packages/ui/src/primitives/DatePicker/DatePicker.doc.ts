import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "DatePicker",
  description: "Standalone themeable date and time picker with portal popup calendar, editable text draft input, and customizable token styling.",
  features: [
    "Supports dateOnly mode or combined date and time selection",
    "Editable input field allows direct typing or popover selection",
    "Uses portal rendering to prevent container clipping",
    "Fully customizable DatePickerTokens prop interface"
  ],
  accessibility: [
    "Renders accessible calendar grid with month navigation controls",
    "Applies keyboard Enter commit handling on input draft field"
  ],
  keyboard: "Type date string in input, Enter to commit, Arrow buttons to switch month view",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use DatePicker for form date selection (e.g. Birthdays, Scheduling, Event dates)."
      },
      {
        guidance: false,
        description: "Do not use DatePicker for static inline event calendar displays — reach for Calendar primitive instead."
      }
    ]
  },
  examples: [
    {
      title: "Date & Time Input Field",
      code: '<DatePicker value={new Date()} onChange={() => {}} dateOnly={false} />'
    }
  ]
};
