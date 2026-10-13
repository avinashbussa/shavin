import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Code",
  group: "typography",
  description: "Inline code chip for identifiers, file names and short commands inside prose.",
  features: ["Mono font at 0.85em of the surrounding text, on a surface-hover chip"],
  accessibility: ["Renders a native <code> element, so assistive tech can announce it as code"],
  usage: {
    bestPractices: [
      { guidance: true, description: "Use Code for short inline references such as prop names or file paths." },
      { guidance: false, description: "Do not use Code for multi-line snippets; use CodeBlock." },
    ],
  },
  examples: [
    {
      title: "Inline code",
      code: '<Text>Set <Code>dismissible</Code> to <Code>false</Code> to keep the dialog open.</Text>',
    },
  ],
};
