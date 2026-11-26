import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "WiseOwlLogo",
  internal: true,
  description:
    "Internal: the logo of WiseOwl, the fictional finance product Shavin's examples and blocks are built around. WiseOwlLogo is the owl mark with the wordmark; WiseOwlMark is the owl on its own.",
  features: [
    "One currentColor path each, so the logo takes the theme colour; color: inherit (default), default, muted or brand (contrast-safe)",
    "WiseOwlLogo heights: sm 24px, md 32px (default), lg 56px",
    "WiseOwlMark sizes: xs 16px, sm 20px, md 24px (default), lg 32px, xl 48px",
    "Static copies for non-React use at shavin.cc/brand/wiseowl/ (wiseowl-logo.svg, wiseowl-mark.svg, wiseowl-app-icon-512.png)",
  ],
  notes: [
    "WiseOwl is sample branding. In your own product, replace it with your logo.",
    "Keep the full logo at least 20px high and the mark at least 16px; below that the wordmark and the owl's face blur.",
  ],
  accessibility: [
    "Renders role=\"img\" with aria-label=\"WiseOwl\" (change it with label)",
    "Pass decorative when the name is already written next to it; the SVG is then aria-hidden",
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use it wherever a WiseOwl example shows the brand: nav bars, sidebars, footers and auth screens.",
      },
      {
        guidance: false,
        description: "Do not recolour it with raw colours or add a second colour; pick a color token instead.",
      },
    ],
  },
  examples: [
    { title: "Nav brand", code: '<Link href="/" aria-label="WiseOwl home"><WiseOwlLogo size="sm" decorative /></Link>' },
    { title: "Sidebar mark", code: '<WiseOwlMark size="md" color="brand" />' },
  ],
};
