import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Sidebar",
  group: "layout",
  description: "Comprehensive sidebar layout primitive supporting left/right docking, collapsible modes, resizability, and compound sub-components.",
  features: [
    "Components: Sidebar, SidebarTrigger, SidebarHeader, SidebarBody, SidebarFooter, SidebarSection, SidebarNavItem",
    "Dock sides: left (Sidenav) or right (Inspector/Configurator)",
    "Variants: fixed, collapsible, floating, inset",
    "Collapsible modes: icon (collapses to icon-only rail) or offcanvas (full hide)",
    "Interactive drag resizability with min/max width limits",
    "Automatic tooltip display on icon-only navigation items when collapsed"
  ],
  accessibility: [
    "Native <aside> landmark element with data-state and data-side attributes",
    "Screen reader aria-expanded attributes on toggle trigger buttons"
  ],
  keyboard: "Tab to browse navigation items and toggle trigger, Space/Enter to activate",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Sidebar for left navigation rails, right inspector panels, and dashboard control drawers."
      },
      {
        guidance: false,
        description: "Do not create ad-hoc sidebar panels using raw divs — use Sidebar with SidebarHeader, SidebarBody, and SidebarFooter for consistent layout rhythm."
      }
    ]
  },
  examples: [
    {
      title: "Collapsible Navigation Sidebar",
      code: '<Sidebar variant="collapsible"><SidebarHeader><SidebarTrigger /></SidebarHeader><SidebarBody><SidebarSection title="App"><SidebarNavItem label="Overview" active /></SidebarSection></SidebarBody></Sidebar>'
    }
  ]
};
