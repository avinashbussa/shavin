import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "FormField",
  description:
    "Label, hint and error for any Shavin control that has none of its own: TextArea, Select, Combobox, DatePicker, TimePicker, Checkbox, Switch, RadioGroup, CheckboxGroup. TextField already has label/hint/errorMessage: use it alone.",
  features: [
    "Injects id, aria-describedby, aria-invalid, aria-required, required, disabled and readOnly into its single child",
    "fieldset + legend for RadioGroup and CheckboxGroup",
    "error replaces the hint, with an icon (never colour alone)",
    "status='success' shows a check icon and the hint in the success colour",
    "Optional fields are marked 'Optional'; required fields get no asterisk",
    "orientation='horizontal' for settings rows (label left, control right from md up)",
  ],
  accessibility: [
    "The label names the control (<label htmlFor>, aria-labelledby for Select, Combobox and pickers)",
    "Hint or error is linked with aria-describedby (WCAG 1.3.1, 3.3.1); aria-invalid when there is an error",
    "An error that appears from blur or change validation is announced once (polite); FormErrorSummary silences it after a failed submit",
    "Disabled fields say why in the hint",
  ],
  usage: {
    bestPractices: [
      { guidance: true, description: "Validate on blur the first time, then on change; on submit show FormErrorSummary and keep each field's error." },
      { guidance: true, description: "Put the reason for a disabled field in its hint ('Available on the Pro plan')." },
      { guidance: false, description: "Do not wrap a TextField in FormField: TextField has label, hint and errorMessage." },
      { guidance: false, description: "Do not set a FormField label around a Checkbox or Switch that has its own label: it is named twice." },
    ],
  },
  structure: [
    "<FormField label hint error><TextArea /></FormField> — exactly one control child",
    "Single Checkbox/Switch: <FormField hint error><Switch label=\"…\" /></FormField> (label on the control)",
  ],
  examples: [
    {
      title: "TextArea with hint",
      code: `<FormField label="Bio" hint="Shown on your public profile." required={false}>
  <TextArea rows={4} maxLength={280} />
</FormField>`,
    },
    {
      title: "Select with error",
      code: `<FormField label="Time zone" error="Choose a time zone.">
  <Select options={[{ value: "utc", label: "UTC" }, { value: "ist", label: "India (IST)" }]} />
</FormField>`,
    },
    {
      title: "Disabled with reason",
      code: `<FormField label="Custom domain" hint="Available on the Pro plan." disabled>
  <Select options={[{ value: "none", label: "None" }]} />
</FormField>`,
    },
    {
      title: "Settings row",
      code: `<FormField label="Weekly summary" orientation="horizontal" hint="Sent on Mondays.">
  <Switch aria-label="Weekly summary" />
</FormField>`,
    },
    {
      title: "Radio group",
      code: `<FormField label="Plan" hint="You can change this later.">
  <RadioGroup defaultValue="free">
    <Radio value="free" label="Free" />
    <Radio value="pro" label="Pro" />
  </RadioGroup>
</FormField>`,
    },
  ],
};
