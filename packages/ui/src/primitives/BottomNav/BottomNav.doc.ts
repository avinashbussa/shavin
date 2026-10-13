import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "BottomNav",
  description: "Fixed full-width mobile navigation bar for primary viewport routing with active indicators and notification badges.",
  features: [
    "Fixed position pinned to bottom viewport (fixed bottom-0)",
    "Backdrop blur translucent glassmorphism surface (bg-surface/95 backdrop-blur-md)",
    "Active tab indicator pill bar",
    "Supports notification count badge overlay on icon slots"
  ],
  accessibility: [
    "Native <nav aria-label='Bottom navigation'> element",
    "Active tab item receives aria-current='page' semantics",
    "Enforces minimum touch target size for mobile viewports"
  ],
  keyboard: "Tab to cycle through navigation destination links, Enter to select",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use BottomNav for primary mobile application view navigation (3-5 top destinations)."
      },
      {
        guidance: false,
        description: "Do not use BottomNav on desktop viewports — hide on sm/md breakpoints via CSS."
      }
    ]
  },
  examples: [
    {
      title: "Mobile Bottom Navigation",
      code: '<BottomNav items={[{ href: "/", label: "Home", active: true }, { href: "/search", label: "Search" }, { href: "/profile", label: "Profile", badge: 3 }]} />'
    }
  ]
};
