import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Breadcrumbs",
  description: "Hierarchical navigation tree bar with ChevronRight separators and automatic label truncation.",
  features: [
    "Uses ChevronRight separator icons for nav tree hierarchy per section 4 rules",
    "Automatic label truncation max-w-[140px] / max-w-[160px] to prevent wrap overflow",
    "Applies font-semibold to the current active page item"
  ],
  accessibility: [
    "Renders native <nav aria-label='Breadcrumb'> element",
    "Applies aria-current='page' contract semantics to current active location"
  ],
  keyboard: "Tab to cycle through hyperlinked parent breadcrumb paths",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Breadcrumbs at the top of detail pages to allow users to navigate up the page hierarchy."
      },
      {
        guidance: false,
        description: "Do not use Breadcrumbs on top-level root pages."
      }
    ]
  },
  examples: [
    {
      title: "Page Hierarchy Breadcrumbs",
      code: '<Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Components", href: "/components" }, { label: "Breadcrumbs" }]} />'
    }
  ]
};
