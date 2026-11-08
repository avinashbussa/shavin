import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Container",
  group: "layout",
  description: "Width-constrained content container with size presets (xs to full) and background media props. Useful for centered hero content with full-bleed media backdrops.",
  features: [
    "Size presets: xs (28rem), sm (42rem), md (56rem), lg (72rem), xl (88rem), full (no constraint)",
    "Surface contrast scope via surface prop for media backgrounds",
    "Background media: bgVideo, bgImage, bgOverlays (presets, hex, tokens, gradients via comma-separated shorthand), bgSize, bgVideoPaused",
    "Fx backdrops (needs @shavin/fx registered): bgOverlays=\"fx:dither-waves, gradient-bottom\"; params only when changed: fx:fluid-silk(speed=1.2); quote text values: fx:type-tiles(text='Plan money')"
  ],
  accessibility: [
    "Supports semantic HTML tags via polymorphic as prop"
  ],
  usage: {
    bestPractices: [
      { guidance: true, description: "Use Container inside Section to constrain content width within full-bleed sections." },
      { guidance: true, description: "Use bgImage with dark-50 overlay + surface=dark for centered hero content over media." },
      { guidance: false, description: "Do not wrap media in nested divs — pass bgVideo/bgImage directly to Container." }
    ]
  },
  examples: [
    {
      title: "Centered Content Container",
      code: '<Container size="md"><Heading size="xl">Title</Heading><Text>Content here.</Text></Container>'
    },
    {
      title: "Container with Background Image + Dark Overlay",
      description: "bgImage with dark-50 overlay and surface=dark for centered hero content",
      code: '<Container size="lg" bgImage="https://..." bgOverlays="dark-50" surface="dark-always" className="h-[300px] flex flex-col items-center justify-center"><Heading size="2xl">Centered Hero</Heading><Button size="lg">Learn More</Button></Container>'
    },
    {
      title: "Triple-Layer Overlay with Video",
      description: "bgVideo with three composited layers — dark-20 base, gradient-radial@60%, light-20@30%",
      code: '<Container size="md" bgVideo="https://..." bgOverlays="dark-20, gradient-radial/60, light-20/30" surface="dark-always"><Heading size="xl">Triple Layer</Heading></Container>'
    },
    {
      title: "Custom Gradient + Token Overlay",
      description: "Custom linear gradient with hex stops + semantic accent token — no JSON needed",
      code: '<Container size="md" bgVideo="https://..." bgOverlays="linear(180deg, #000/0%, #000/100%)/70, (accent)/15" surface="dark-always"><Heading size="2xl">Gradient + Accent</Heading><Button>Get Started</Button></Container>'
    }
  ]
};
