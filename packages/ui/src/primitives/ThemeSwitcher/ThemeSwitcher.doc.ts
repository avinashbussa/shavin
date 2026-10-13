import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "ThemeSwitcher",
  description:
    "Appearance mode controller providing zero-layout-shift switching between light, dark, and system color schemes, complete with a FOUC-prevention hydration script and useTheme hook.",
  features: [
    "Variants: icon-button (default cycle), segmented (3-way selector), menu (Radix dropdown), and switch (binary toggle)",
    "Includes <ThemeScript /> to inject into <head> for zero-flicker server-rendered hydration",
    "useTheme() hook with cross-tab localStorage synchronization and system prefers-color-scheme listener",
    "Strictly manages appearance color scheme (light/dark/system), decoupled from accent palette configuration"
  ],
  accessibility: [
    "Uses semantic radio / switch ARIA attributes and labels",
    "Full keyboard navigation: Enter/Space to toggle, arrow keys inside segmented and menu modes",
    "WCAG 2.1 AAA contrast compliance across all themes"
  ],
  keyboard: "Space / Enter to toggle theme mode, Arrow keys to navigate menu or segmented options",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Place <ThemeScript /> in your root layout <head> to eliminate any white/dark flash during initial page load."
      },
      {
        guidance: false,
        description: "Do not use ThemeSwitcher to configure accent colors — use ThemeProvider or Configurator for branding palette customizations."
      }
    ]
  },
  examples: [
    {
      title: "Icon Button (Default)",
      code: '<ThemeSwitcher variant="icon-button" />'
    },
    {
      title: "Segmented Control",
      code: '<ThemeSwitcher variant="segmented" showLabels />'
    },
    {
      title: "Dropdown Menu",
      code: '<ThemeSwitcher variant="menu" />'
    },
    {
      title: "Binary Switch",
      code: '<ThemeSwitcher variant="switch" />'
    }
  ]
};
