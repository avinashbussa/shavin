import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Murmur",
  description: "A living dot-sphere that shows what an AI is doing: thinking, working, listening, idle. Free states ship here; Pro states and extra motion come from @shavin/fx.",
  features: [
    "States: idle, thinking, working, listening (level-reactive). Unknown names resolve to states added with registerMurmurState",
    "size, speed, dots and dotSize props tune the sphere; dotSize scales every dot (default 1)",
    "Canvas, no dependencies. Colour follows the text colour, accent by default",
    "Pauses off screen and stops animating under prefers-reduced-motion",
    "Used by ChatBubble (submitted), Reasoning, ToolCall and VoiceInput"
  ],
  accessibility: [
    "role=img with an accessible name from the state, or pass label=\"\" to hide it when visible text sits beside it",
    "Motion is decorative and respects prefers-reduced-motion"
  ],
  keyboard: "Not interactive.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Pair Murmur with a short visible label (Thinking, Searching) so the state is never conveyed by motion alone." },
      { guidance: false, description: "Do not use Murmur as a generic page loader, use Spinner or Skeleton for non-AI waiting." }
    ]
  },
  examples: [
    { title: "Thinking", code: '<Murmur state="thinking" size={32} />' },
    { title: "Fine dots", code: '<Murmur state="thinking" size={64} dots={160} dotSize={0.6} />' },
    { title: "Listening with level", code: '<Murmur state="listening" size={48} level={0.6} />' }
  ]
};
