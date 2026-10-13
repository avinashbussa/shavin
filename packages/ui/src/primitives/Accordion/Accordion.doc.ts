import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Accordion",
  description: "Collapsible disclosure panels built on Radix Accordion primitive with ChevronDown 180-degree rotation convention.",
  features: [
    "Variants: default (divided list), outline, ghost",
    "Supports type='single' and type='multiple' modes",
    "ChevronDown indicator rotates 180 degrees when open per AGENTS.md rule",
    "Uses panel radius --radius-panel for container geometry"
  ],
  accessibility: [
    "Built on WAI-ARIA Disclosure & Accordion pattern with role='region'",
    "Keyboard navigation via Arrow keys, Home, and End",
    "Space/Enter toggles expand/collapse state"
  ],
  keyboard: "Up/Down arrows to move focus, Space/Enter to expand panel",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Accordion for grouping secondary FAQs, settings sections, or dense collapsible details."
      },
      {
        guidance: false,
        description: "Do not use ChevronRight for accordion triggers — use ChevronDown with 180deg rotation per section 4 convention."
      }
    ]
  },
  examples: [
    {
      title: "Collapsible FAQ Accordion",
      code: '<Accordion type="single" collapsible><AccordionItem value="1"><AccordionTrigger>What is @shavin/ui?</AccordionTrigger><AccordionContent>Enterprise React design system engine.</AccordionContent></AccordionItem></Accordion>'
    }
  ]
};
