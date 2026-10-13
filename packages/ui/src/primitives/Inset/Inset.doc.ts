import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Inset",
  group: "layout",
  description: "Card layout helper component that bleeds content to container edges using negative margin scale math.",
  features: [
    "Sides: all (-m-4/-m-5), top (-mx-4 -mt-4), bottom (-mx-4 -mb-4), x (-mx-4)",
    "Padding scale: sm (p-4) and md (p-5) matching Card padding tokens",
    "Clip prop automatically rounds top/bottom corners to --radius-panel"
  ],
  accessibility: [
    "Structural container wrapper maintaining DOM layout hierarchy"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use Inset inside Card for edge-to-edge header images, full-bleed code blocks, or maps."
      },
      {
        guidance: false,
        description: "Do not manually write hardcoded negative margins like -mx-5 -mt-5 — use Inset p='md' side='top' instead."
      }
    ]
  },
  examples: [
    {
      title: "Card Top Image Bleed",
      code: '<Card p="sm"><Inset side="top" p="sm" clip><Image src="cover.jpg" ratio="16/9" /></Inset><div>Card Body Content</div></Card>'
    }
  ]
};
