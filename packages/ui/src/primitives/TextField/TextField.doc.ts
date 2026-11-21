import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "TextField",
  description: "Single-line text input control with control radius (--radius-lg), leading/trailing icon slots, and optional label/hint wrapper.",
  features: [
    "Sizes: sm (32px) and md (40px)",
    "Invalid error state styling (invalid=true)",
    "Built-in leadingIcon and trailingIcon slots",
    "Built-in label and helper hint text layout wrapper"
  ],
  accessibility: [
    "Uses native <input> element supporting standard browser form handling and focus states",
    "Associates label with input for screen reader announcements",
    "Applies aria-invalid automatically when invalid=true or errorMessage is set",
    "errorMessage shows with an icon and is announced once (polite) when it first appears; announceError={false} turns that off (FormErrorSummary silences it after a failed submit)"
  ],
  keyboard: "Standard input typing, Tab to move focus, Escape/Enter in forms",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use TextField for single-line text inputs (names, emails, search queries)."
      },
      {
        guidance: false,
        description: "Do not use TextField for multi-line text input — reach for TextArea instead."
      }
    ]
  },
  structure: [
    "type=\"otp\" makes it a code-entry input; length, separator, separatorIndex, onComplete and slotClassName apply only then.",
  ],
  examples: [
    {
      title: "Standard Text Input",
      code: '<TextField label="Email Address" placeholder="alex@company.com" hint="We will never share your email." />'
    }
  ]
};
