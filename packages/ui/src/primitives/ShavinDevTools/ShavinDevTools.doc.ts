import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "ShavinDevTools",
  internal: true,
  description:
    "Internal: the Dev Inspector that ThemeProvider shows during development: a small control bar with Select, Issues, Theme and Settings tools, a design audit, the Bridge status and MCP setup.",
  features: [
    "Mounted automatically by ThemeProvider outside production; devTools={false} on ThemeProvider turns it off",
    "Control bar with the Shavin mark: drag it to one of eight spots, collapse it to a round tile; it remembers where it was",
    "Select and Issues tools show what is wrong on the page and send it to your agent; Theme opens a floating panel (brand, gray, radius, scaling, panel background, fonts, applied live); Settings holds the shortcuts, motion and colour options",
    "On a phone the bar becomes a bottom dock and the panels share one bottom sheet",
    "A Settings row opens the Bridge and MCP panel: DS Audit, MCP and Stream tabs",
    "position sets where the bar starts until it is moved",
    "Hidden in production unless forceShow is set",
  ],
  notes: [
    "Shavin tooling, not a building block for product UI. Documented for users at /start/dev-inspector on the docs site.",
  ],
  accessibility: [
    "The bar is a toolbar with one tab stop; arrow keys move between the mark and the tools, and every control is a native button, select or switch with a label",
    "Single-key shortcuts can be turned off in Settings, and no key typed in a text field reaches the inspector",
    "Closing the bar gives focus back to the page element it came from",
  ],
  keyboard: "Tab to the bar, arrow keys to move between tools, Enter or Space to press one. V, I, T and comma switch tools; Escape closes a panel, then the tool, then collapses the bar; Shift+arrow on the mark moves the bar; Alt+Shift+S hides or shows it.",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Leave it to ThemeProvider; mount <ShavinDevTools /> yourself only to change where the bar starts, with devTools={false} on the provider.",
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
