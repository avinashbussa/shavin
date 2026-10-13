import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Icon",
  description: "Universal vector icon renderer with strict size tokens (xs to 3xl), numeric pixel scaling, semantic color tokens, and open SVG component wrapping.",
  features: [
    "Sizes: xs (12px), sm (16px), md (20px), lg (24px), xl (32px), 2xl (40px), 3xl (48px), or custom numeric/px dimensions",
    "Colors: default, subtle, muted, accent, contrast, success, warning, danger, inherit, or custom hex/CSS color",
    "Dynamic Lucide icon resolution by name string (e.g. name='Sparkles' or name='sparkles')",
    "Open vector component passing via icon prop or direct SVG JSX element children",
    "Granular strokeWidth stepper (0.5 to 3.0 in 0.25 steps) and absoluteStrokeWidth toggle"
  ],
  accessibility: [
    "Supports accessible title and aria-label attributes",
    "Inherits parent text colors and high contrast WCAG ratios automatically via semantic color tokens"
  ],
  keyboard: "Static visual primitive; interactive instances should be wrapped in IconButton or Button.",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use size tokens (xs through 3xl) or multiples of 16 for sharp pixel-grid alignment."
      },
      {
        guidance: true,
        description: "Pass semantic color tokens (e.g. color='accent' or color='muted') to ensure dark mode parity."
      },
      {
        guidance: false,
        description: "Do not hardcode raw hex colors when a semantic color token exists."
      }
    ]
  },
  examples: [
    {
      title: "Name String Rendering",
      code: '<Icon name="Sparkles" size="lg" color="accent" />'
    },
    {
      title: "Direct Component Passing",
      code: '<Icon icon={Settings} size="md" color="muted" strokeWidth={1.5} />'
    },
    {
      title: "Custom SVG Node Wrapping",
      code: '<Icon size="2xl" color="contrast"><svg viewBox="0 0 24 24"><path d="..." /></svg></Icon>'
    }
  ]
};
