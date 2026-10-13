import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "TopBar",
  group: "layout",
  description: "Header bar chrome component for page headers, breadcrumbs, search bars, and action toolbars.",
  features: [
    "Native HTML5 <header> semantic landmark wrapper",
    "Standardized border-b border-hairline bottom border separator",
    "Flex layout container for title, search, and action buttons"
  ],
  accessibility: [
    "Native <header> landmark element for page structure navigation"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use TopBar at the top of main content columns to host breadcrumbs, page titles, and action buttons."
      },
      {
        guidance: false,
        description: "Do not put primary application navigation inside TopBar — reach for Sidebar instead."
      }
    ]
  },
  examples: [
    {
      title: "Header Toolbar",
      code: '<TopBar><Breadcrumbs items={[{ label: "App" }, { label: "Settings" }]} /><Button size="sm" className="ml-auto">Save</Button></TopBar>'
    }
  ]
};
