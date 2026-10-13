import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Card",
  group: "layout",
  description: "Surface card primitive with padding presets (none to 3xl), interactive hover state, and background media props. Ideal for media-rich product cards and feature tiles.",
  features: [
    "Padding presets: none, xs (8px), sm (16px), md (20px), lg (24px), xl (32px), 2xl (40px), 3xl (48px)",
    "Interactive mode with hover elevation and cursor-pointer",
    "Surface contrast scope via surface prop for media backgrounds",
    "Background media: bgVideo, bgImage, bgOverlays (presets, hex, tokens, gradients via comma-separated shorthand), bgSize, bgVideoPaused"
  ],
  accessibility: [
    "Renders as <div> by default; use polymorphic as prop for semantic elements"
  ],
  usage: {
    bestPractices: [
      { guidance: true, description: "Use Card for grouped content blocks with consistent surface treatment and elevation." },
      { guidance: true, description: "Use bgImage with gradient-bottom overlay for media cards with bottom-aligned text." },
      { guidance: false, description: "Do not embed <video> elements as children — pass bgVideo prop and the card handles media layer rendering." }
    ]
  },
  examples: [
    {
      title: "Basic Card",
      code: '<Card padding="md">Card content</Card>'
    },
    {
      title: "Card with Background Image + Gradient",
      description: "bgImage with gradient-bottom overlay for text legibility at the bottom",
      code: '<Card padding="lg" bgImage="https://..." bgOverlays="gradient-bottom" surface="dark-always" className="h-[280px] flex flex-col justify-end"><Heading size="md">Feature Card</Heading></Card>'
    },
    {
      title: "Multi-Layer Overlay with Video",
      description: "bgVideo with dark-50 base + scrim at 70% opacity",
      code: '<Card padding="lg" bgVideo="https://..." bgOverlays="dark-50, scrim/70" surface="dark-always" className="h-[260px] flex flex-col justify-end"><Heading size="md">Video Card</Heading></Card>'
    },
    {
      title: "Custom Gradient + Token Overlay",
      description: "Custom hex solid + linear gradient + accent token — no JSON needed",
      code: '<Card padding="lg" bgImage="https://..." bgOverlays="#1a1a2e/30, linear(180deg, #000/0%, #000/100%)/60, (accent)/10" className="h-[260px] flex flex-col justify-end"><Heading size="md">Custom</Heading></Card>'
    }
  ]
};
