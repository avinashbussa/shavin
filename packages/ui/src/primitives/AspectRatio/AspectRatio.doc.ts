import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "AspectRatio",
  group: "layout",
  description: "Ratio layout wrapper primitive built on Radix AspectRatio for reserving media element proportions.",
  features: [
    "Built on @radix-ui/react-aspect-ratio",
    "Prevents Cumulative Layout Shift (CLS) on dynamic image and video loads",
    "Configurable ratio prop (e.g. ratio={16 / 9}, ratio={4 / 3})"
  ],
  accessibility: [
    "Maintains DOM container space preserving page scroll position during asset load"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use AspectRatio around images, video embeds, and map containers."
      },
      {
        guidance: false,
        description: "Do not leave media elements without aspect ratio preservation — use AspectRatio to prevent layout shifts."
      }
    ]
  },
  examples: [
    {
      title: "16:9 Video Embed Wrapper",
      code: '<AspectRatio ratio={16 / 9}><Image src="cover.jpg" alt="Video thumbnail" fit="cover" /></AspectRatio>'
    }
  ]
};
