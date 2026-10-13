import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Text",
  group: "typography",
  description: "Body copy, labels and captions with semantic colour, size and weight.",
  features: [
    "Sizes: xs, sm, md, lg, overline (uppercase, tracked); inherit by default",
    "Colours: default, muted, subtle, danger, link, accent — all semantic tokens",
    "weight, tracking and truncate (three-line clamp)",
    "as renders any tag: p (default), span, div, label",
  ],
  accessibility: [
    "Colour tokens meet WCAG AAA contrast on surface tokens; subtle is for de-emphasised supporting text only",
    "Use as=\"label\" with htmlFor when the text labels a control",
  ],
  usage: {
    bestPractices: [
      { guidance: true, description: "Use color=\"muted\" for supporting copy under a title, and color=\"subtle\" only for tertiary hints." },
      { guidance: true, description: "Use size=\"overline\" for small section labels above a group." },
      { guidance: false, description: "Do not use literal Tailwind size or colour classes (text-sm, text-gray-500) on text; use the props." },
    ],
  },
  examples: [
    {
      title: "Body and supporting text",
      code: `<div className="max-w-md space-y-2">
  <Text size="overline" color="muted">Billing</Text>
  <Text>Your plan renews on 1 November.</Text>
  <Text size="sm" color="muted">You can change or cancel it at any time.</Text>
</div>`,
    },
  ],
};
