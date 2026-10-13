import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Kbd",
  group: "typography",
  description: "A physical key, for keyboard shortcuts in menus, hints and docs.",
  features: ["Bordered key cap with a heavier bottom edge, mono font, muted text"],
  accessibility: ["Renders a native <kbd> element; write combinations as separate keys (⌘ then K) so each is announced"],
  usage: {
    bestPractices: [
      { guidance: true, description: "Use one Kbd per key in a combination." },
      { guidance: false, description: "Do not use Kbd for code or values; use Code." },
    ],
  },
  examples: [
    {
      title: "Shortcut hint",
      code: '<Text size="sm" color="muted">Press <Kbd>⌘</Kbd> <Kbd>K</Kbd> to search.</Text>',
    },
  ],
};
