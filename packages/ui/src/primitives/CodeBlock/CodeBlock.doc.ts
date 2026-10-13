import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "CodeBlock",
  description: "Syntax-highlighted code block component with integrated copy button and standalone or attached card variants.",
  features: [
    "Built-in zero-dependency regex syntax highlighter (highlightCode)",
    "Variants: standalone (full rounded box) and attached (seamless bottom panel for live previews)",
    "Uses panel radius --radius-panel per AGENTS.md section 5 rules",
    "One-click clipboard copy button with feedback transition"
  ],
  accessibility: [
    "Native <pre> and <code> semantic structure for screen reader code blocks",
    "Accessible Copy button label state updates"
  ],
  keyboard: "Tab to Copy button, Space/Enter to copy code string",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use CodeBlock for documentation code snippets, API responses, and CLI commands."
      },
      {
        guidance: false,
        description: "Do not import massive heavy client-side syntax highlighter libraries — CodeBlock provides fast zero-dep highlighting."
      }
    ]
  },
  examples: [
    {
      title: "TypeScript Snippet",
      code: '<CodeBlock code={`import { Button } from "@shavin/ui";\\n\\nexport default function App() {\\n  return <Button>Click me</Button>;\\n}`} />'
    }
  ]
};
