import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Box",
  group: "layout",
  description: "Generic div-based container primitive with translucent panel support and background media props. Useful for media-backed panels and callout boxes.",
  features: [
    "Translucent panel via translucent prop (backdrop-blur + data-panel)",
    "Surface contrast scope via surface prop for media backgrounds",
    "Background media: bgVideo, bgImage, bgOverlays (presets, hex, tokens, gradients via comma-separated shorthand), bgSize, bgVideoPaused",
    "Fx backdrops (needs @shavin/fx registered): bgOverlays=\"fx:dither-waves, gradient-bottom\"; params only when changed: fx:fluid-silk(speed=1.2); quote text values: fx:type-tiles(text='Plan money')"
  ],
  accessibility: [
    "Supports semantic HTML tags via polymorphic as prop"
  ],
  usage: {
    bestPractices: [
      { guidance: true, description: "Use Box as a generic container when Flex or Grid structure is not needed." },
      { guidance: true, description: "Use bgImage with gradient-bottom overlay for media panels with bottom-aligned text." },
      { guidance: false, description: "Do not nest <video> children manually — use bgVideo prop for automatic media layer rendering." }
    ]
  },
  examples: [
    {
      title: "Basic Box",
      code: '<Box className="p-4 border border-hairline rounded-[var(--radius-panel)] bg-surface">Content</Box>'
    },
    {
      title: "Box with Background Image + Gradient",
      description: "bgImage with gradient-bottom overlay for text legibility at the bottom",
      code: '<Box bgImage="https://..." bgOverlays="gradient-bottom" surface="dark-always" className="h-[280px] flex flex-col justify-end"><Heading size="lg">Media Panel</Heading></Box>'
    },
    {
      title: "Multi-Layer Overlay with Video",
      description: "bgVideo with vignette + dark-20 at 60% opacity",
      code: '<Box bgVideo="https://..." bgOverlays="vignette, dark-20/60" surface="dark-always" className="h-[260px]"><Heading size="xl">Video Panel</Heading></Box>'
    },
    {
      title: "Custom Solid + Gradient Overlay",
      description: "Custom hex solid and linear gradient — all in shorthand, no JSON",
      code: '<Box bgImage="https://..." bgOverlays="#0a0a1a/40, linear(90deg, #000/0%, #000/100%)/70" surface="dark-always" className="h-[260px]"><Heading size="lg">Custom</Heading></Box>'
    }
  ]
};
