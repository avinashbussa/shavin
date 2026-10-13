import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Grid",
  group: "layout",
  description: "CSS Grid container primitive supporting column/row counts, token gap scale, cross-axis alignment, and background media props (bgVideo, bgImage, bgOverlays, bgSize, bgVideoPaused).",
  features: [
    "Columns: 1 through 6 equal-width tracks, or \"auto\" for intrinsic tracks that wrap by themselves in any container (width from minWidth: xs 10rem, sm 14rem, md 18rem default, lg 24rem, xl 32rem); maxColumns (2-6) caps the track count so a wide container never adds extra columns",
    "Rows: 1 through 6 equal-height tracks",
    "Alignments: start, center, end, stretch",
    "Token gap scale: 0 through 7",
    "Responsive stack: auto (3+ cols → 2 on tablet → 1 on mobile; 2 cols → 1 on mobile), tablet, mobile, none (default)",
    "Surface contrast scope via surface prop",
    "Background media: bgVideo, bgImage, bgOverlays (presets, hex, tokens, gradients via comma-separated shorthand), bgSize, bgVideoPaused"
  ],
  accessibility: [
    "Supports semantic HTML tags via polymorphic as prop"
  ],
  usage: {
    bestPractices: [
      { guidance: true, description: "Use Grid for 2-dimensional layouts with equal-width columns and token gap spacing." },
      { guidance: true, description: "Set stack=\"auto\" on multi-column marketing grids so they collapse on tablet and mobile without hand-written breakpoint classes." },
      { guidance: true, description: "Prefer columns=\"auto\" for card, stat and feature grids: it adapts to the width of its container (sidebar, canvas, full page) with no stack or breakpoint props. Add maxColumns=\"3\" (or 4) when a section must never exceed that many columns on very wide containers. Use a fixed column count only when the design needs exactly N columns." },
      { guidance: false, description: "Do not use columns=\"auto\" for placed layouts: bento grids, feature-plus-list splits, or anything using col-span, row-span or col-start. Spans assume a fixed track count, so an auto grid gives the wrong shape. Use numeric columns (with stack) there." },
      { guidance: false, description: "columns=\"auto\" replaces stack: do not combine them, and do not add grid-cols-* classes to the same Grid." },
      { guidance: false, description: "Do not mix arbitrary grid-cols-* utilities when Grid primitive provides structured column props." },
      { guidance: true, description: "Use bgVideo / bgImage for shared media backdrops across grid items — the primitive renders the media layer behind all children." }
    ]
  },
  examples: [
    {
      title: "Intrinsic grid (adapts to its container)",
      code: '<Grid columns="auto" minWidth="sm" gap="4"><Card padding="md">One</Card><Card padding="md">Two</Card><Card padding="md">Three</Card><Card padding="md">Four</Card></Grid>'
    },
    {
      title: "3-Column Feature Grid",
      code: '<Grid columns="3" gap="5" stack="auto"><Card padding="md">Item 1</Card><Card padding="md">Item 2</Card><Card padding="md">Item 3</Card></Grid>'
    },
    {
      title: "Grid with Background Image + Vignette",
      description: "Grid with bgImage and vignette overlay; card items render above the media via z-10 wrapper",
      code: '<Grid columns="2" gap="4" bgImage="https://..." bgOverlays="vignette" surface="dark-always" className="h-[300px]"><Card padding="md">Feature 1</Card><Card padding="md">Feature 2</Card></Grid>'
    },
    {
      title: "Multi-Layer Overlay with Video",
      description: "bgVideo with dark-30 base + gradient-radial focus at 70% opacity",
      code: '<Grid columns="3" gap="3" bgVideo="https://..." bgOverlays="dark-30, gradient-radial/70" surface="dark-always"><Text>Item 1</Text></Grid>'
    },
    {
      title: "Custom Gradient + Token Overlay",
      description: "Custom linear gradient with hex stops + semantic accent token — no JSON needed",
      code: '<Grid columns="2" gap="3" bgImage="https://..." bgOverlays="linear(180deg, #1a1a2e/0%, #1a1a2e/100%)/60, (accent)/15" surface="dark-always"><Text>Custom</Text></Grid>'
    }
  ]
};
