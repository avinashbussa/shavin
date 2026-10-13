import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Reasoning",
  description: "Collapsible disclosure for a model's reasoning: pulsing Thinking\u2026 while live, Thought for 4s when done.",
  features: [
    "status: thinking (open, pulsing mark) or done (collapsed summary)",
    "duration and label props, controlled or uncontrolled open state"
],
  accessibility: [
    "Trigger is a button with aria-expanded and aria-controls",
    "Pulse uses a CSS animation that respects reduced motion"
],
  keyboard: "Enter or Space toggles the disclosure.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Place Reasoning first inside an assistant ChatBubble, before the answer." },
      { guidance: false, description: "Do not show raw chain-of-thought you would not want users to read; summarise it." }
    ]
  },
  examples: [
    { title: "Reasoning example", code: "<Reasoning status=\"done\" duration=\"4s\">I compared the refund clause with the order date.</Reasoning>" }
  ]
};
