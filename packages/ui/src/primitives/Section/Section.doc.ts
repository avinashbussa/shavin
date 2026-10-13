import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Section",
  group: "layout",
  description: "Vertical-rhythm section primitive with padding presets (1-4), responsive role sizes (compact/strip/body/hero) and background media props. Ideal for full-bleed hero bands with bgVideo or bgImage.",
  features: [
    "Padding presets: 1 (py-6), 2 (py-10), 3 (py-16), 4 (py-24)",
    "Role sizes (responsive): compact (py-8 md:py-12, dashboards), strip (py-10 md:py-14, logo walls/stat bars), body (py-16 md:py-24, most sections), hero (py-24 md:py-32, heroes/closing CTAs)",
    "Polymorphic tag support via as prop",
    "Surface contrast scope via surface prop for media backgrounds",
    "Background media: bgVideo, bgImage, bgOverlays (presets, hex, tokens, gradients via comma-separated shorthand), bgSize, bgVideoPaused, bgPoster (video poster + reduced-motion fallback)",
    "Mesh backdrops: bgOverlays=\"mesh-lime\" | mesh-mint | mesh-peach | mesh-accent (append -animated for a slow drift); directional scrim-left and theme-aware fade-canvas; off-centre radial(at 20% 30%, ...)"
  ],
  accessibility: [
    "Supports semantic HTML tags via polymorphic as prop",
    "Use as=\"section\" for standalone content groupings"
  ],
  usage: {
    bestPractices: [
      { guidance: true, description: "Use Section for page-level vertical rhythm bands — combine with Container inside for content width constraint." },
      { guidance: true, description: "Use role sizes (size=\"hero\" / \"body\" / \"strip\") for marketing blocks so padding scales from mobile to desktop." },
      { guidance: true, description: "Use bgVideo + bgPoster + bgOverlays=\"dark-50\" + surface=\"dark-always\" for full-bleed hero sections — dark-always keeps on-media text light in both themes." },
      { guidance: false, description: "Do not manually position <video> elements with absolute utilities — use the bgVideo prop instead." }
    ]
  },
  examples: [
    {
      title: "Padded Section with Container",
      code: '<Section size="2"><Container size="md"><Heading size="xl">Section Title</Heading><Text>Content goes here.</Text></Container></Section>'
    },
    {
      title: "Full-Screen Hero with Background Video",
      description: "size-4 Section with bgVideo, dark-50 overlay, and surface=dark",
      code: '<Section size="4" bgVideo="https://..." bgOverlays="dark-50" surface="dark-always"><Container size="md"><Heading size="3xl">Build the Future</Heading><Button size="lg">Get Started</Button></Container></Section>'
    },
    {
      title: "Multi-Layer Overlay with Background Image",
      description: "bgImage with dark-30 base + scrim at 90% opacity for optimal text legibility",
      code: '<Section size="3" bgImage="https://..." bgOverlays="dark-30, scrim/90" surface="dark-always"><Container size="md"><Heading size="2xl">Title</Heading></Container></Section>'
    },
    {
      title: "Animated Mesh Backdrop Hero",
      description: "Overlay-only mesh (no image) with a slow drift; stops under reduced motion",
      code: '<Section size="hero" bgOverlays="mesh-lime-animated, dark-20" surface="dark-always"><Container size="md"><Heading size="5xl">Ship the first version this week</Heading></Container></Section>'
    },
    {
      title: "Custom Solid + Gradient + Token Overlays",
      description: "Hex solid + accent token + linear gradient — all in shorthand, no JSON",
      code: '<Section size="3" bgImage="https://..." bgOverlays="#1a1a2e/40, (accent)/20, linear(180deg, #000/0%, #000/100%)/60" surface="dark-always"><Container size="md"><Heading size="2xl">Custom Overlays</Heading></Container></Section>'
    }
  ]
};
