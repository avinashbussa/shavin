import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "ThemeProvider",
  description: "Global runtime design system theme provider mutating CSS variables on document root for brand accents, radius, and scaling.",
  features: [
    "Configures accent color palette, gray scale, radius preset, scaling, and fonts",
    "Applies CSS variable mutations globally on :root element",
    "Integrates preset themes (e.g. Editorial, Corporate, Modern)",
    "Can be used standalone or wrapping application root"
  ],
  accessibility: [
    "Enforces AAA WCAG compliant contrast ratios across dark and light themes"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Mount ThemeProvider once near application root to apply active theme presets."
      },
      {
        guidance: false,
        description: "Do not wrap individual small components in multiple nested ThemeProviders — tokens are global on document root."
      }
    ]
  },
  examples: [
    {
      title: "Root Theme Initialization",
      code: '<ThemeProvider accentColor="Grass" grayColor="Zinc" radius="large" scaling={95} panelBackground="solid" />'
    }
  ]
};
