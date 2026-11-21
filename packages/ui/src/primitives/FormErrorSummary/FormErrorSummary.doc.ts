import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "FormErrorSummary",
  description:
    "Submit-time error list for forms of three or more fields (WCAG 3.3.1). A danger Callout whose heading takes focus after a failed submit, with a link per invalid field that focuses it.",
  features: [
    "errors: { id, message }[]; id is the field's id (TextField / FormField id)",
    "Default title 'Fix N fields to continue'",
    "Each item is a Link that scrolls to and focuses its field",
    "Renders nothing when errors is empty",
  ],
  accessibility: [
    "role='group' labelled by its heading (not 'alert'): the focus move to the heading is the single announcement",
    "Silences the per-field error announcements of the same render so nothing is read twice",
    "Heading has tabIndex=-1 and receives focus on mount (focusOnMount, default true)",
  ],
  usage: {
    bestPractices: [
      { guidance: true, description: "Keep the field-level error on every invalid field; the summary does not replace them." },
      { guidance: true, description: "Put it at the top of the form and give every field an id it can link to." },
      { guidance: false, description: "Do not use it for a server or network failure: use Callout color='danger' with a Retry Button." },
    ],
  },
  structure: [
    "<form noValidate>{errors.length > 0 && <FormErrorSummary errors={errors} />} …fields with the same ids… <Button type=\"submit\" loading={saving}>Save</Button></form>",
  ],
  examples: [
    {
      title: "After a failed submit",
      code: `<FormErrorSummary
  errors={[
    { id: "email", message: "Enter an email like name@company.com" },
    { id: "tz", message: "Choose a time zone" },
  ]}
/>`,
    },
  ],
};
