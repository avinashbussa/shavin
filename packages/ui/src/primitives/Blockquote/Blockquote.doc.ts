import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Blockquote",
  group: "typography",
  description: "A quoted passage set off with an accent rule, for testimonials and cited text.",
  features: ["Accent left rule, muted text, optional cite URL"],
  accessibility: ["Renders a native <blockquote>; pass cite for the source URL and name the source in visible text"],
  usage: {
    bestPractices: [
      { guidance: true, description: "Follow the quote with the speaker's name in a muted Text line." },
      { guidance: false, description: "Do not use Blockquote just to indent or highlight text; use Callout." },
    ],
  },
  examples: [
    {
      title: "Quote with attribution",
      code: `<div className="max-w-md space-y-2">
  <Blockquote>The handoff between design and code finally disappeared.</Blockquote>
  <Text size="sm" color="muted">Priya Nair, Head of Design</Text>
</div>`,
    },
  ],
};
