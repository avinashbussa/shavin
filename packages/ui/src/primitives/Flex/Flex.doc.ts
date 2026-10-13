import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Flex",
  group: "layout",
  description: "Flexbox container primitive supporting token gap scale, direction, alignment, justification, polymorphic tag rendering, and background media props (bgVideo, bgImage, bgOverlays, bgSize, bgVideoPaused).",
  features: [
    "Directions: row, column, row-reverse, column-reverse",
    "Alignments: start, center, end, stretch, baseline",
    "Justification: start, center, end, between, around",
    "Token gap scale: 0 through 7 (gap-0 to gap-12)",
    "Polymorphic tag support via as prop",
    "Surface contrast scope via surface prop (\"dark\" / \"light\") for media backgrounds",
    "Background media: bgVideo, bgImage, bgOverlays (presets, hex, tokens, gradients via comma-separated shorthand), bgSize, bgVideoPaused"
  ],
  accessibility: [
    "Supports semantic HTML tags via polymorphic as prop"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Flex for 1-dimensional row or column item alignment with token-spaced gaps."
      },
      {
        guidance: false,
        description: "Do not write arbitrary inline flex utility strings when Flex primitive provides structured token props."
      },
      {
        guidance: true,
        description: "Use bgVideo / bgImage props for media backgrounds instead of hand-crafting <video> or <img> children with absolute positioning."
      }
    ]
  },
  examples: [
    {
      title: "Centered Row Toolbar",
      code: '<Flex align="center" justify="between" gap="4"><div>Title</div><Button size="sm">Action</Button></Flex>'
    },
    {
      title: "Background Video Hero",
      description: "Flex with bgVideo, dark-50 overlay, and surface=dark for text legibility",
      code: '<Flex direction="column" align="center" justify="center" gap="4" bgVideo="https://videos.pexels.com/..." bgOverlays="dark-50" surface="dark-always" className="h-[400px]"><Heading size="2xl">Build the Future</Heading><Button size="lg">Get Started</Button></Flex>'
    },
    {
      title: "Multi-Layer Overlay",
      description: "bgOverlays as comma-separated shorthand — dark-20 base + gradient-bottom at 80% opacity",
      code: '<Flex justify="end" bgImage="https://..." bgOverlays="dark-20, gradient-bottom/80" surface="dark-always"><Heading size="lg">Title</Heading></Flex>'
    },
    {
      title: "Custom Gradient + Token Overlay",
      description: "Linear gradient with hex stops + semantic accent token — no JSON needed",
      code: '<Flex direction="column" align="center" justify="center" bgVideo="https://..." bgOverlays="linear(180deg, #000/0%, #000/100%)/70, (accent)/15" surface="dark-always"><Heading size="2xl">Gradient + Accent</Heading><Button>Watch</Button></Flex>'
    }
  ]
};
