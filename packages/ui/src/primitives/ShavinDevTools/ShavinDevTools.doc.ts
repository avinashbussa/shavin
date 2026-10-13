import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "ShavinDevTools",
  internal: true,
  description:
    "Internal: the floating Dev Inspector that ThemeProvider shows during development, with live theme controls, a design audit, the Bridge status and MCP setup.",
  features: [
    "Mounted automatically by ThemeProvider outside production; devTools={false} on ThemeProvider turns it off",
    "Theme tab: accent, gray, radius, scaling, panel background and fonts, applied live",
    "Audit tab: scans the page for design-rule violations; Bridge and MCP tabs show agent connection and setup commands",
    "Draggable trigger that snaps to a corner; position sets the starting corner",
    "Hidden in production unless forceShow is set",
  ],
  notes: [
    "Shavin tooling, not a building block for product UI. Documented for users at /start/dev-inspector on the docs site.",
  ],
  accessibility: [
    "The trigger and every control are native buttons, selects and switches with labels",
    "The panel opens in a Popover, so focus moves into it and returns to the trigger on close",
  ],
  keyboard: "Tab to the trigger and press Enter or Space to open; Escape closes the panel.",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Leave it to ThemeProvider; mount <ShavinDevTools /> yourself only to change its corner, with devTools={false} on the provider.",
      },
      {
        guidance: false,
        description: "Do not ship forceShow to production; keep it for QA and staging.",
      },
    ],
  },
  examples: [
    {
      title: "Custom corner",
      code: '<ShavinDevTools position="bottom-left" />',
    },
  ],
};
