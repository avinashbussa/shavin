import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Video",
  description: "Plays a video at a set ratio and fit, with a poster image and a placeholder when the source is missing. By default it plays muted on a loop, unless the user prefers reduced motion, with a pause button.",
  features: [
    "Supports radius escape hatch (radius='none|small|medium|large|full|inherit|concentric')",
    "Defaults to panel radius --radius-panel per AGENTS.md rules",
    "Zero Layout Shift (CLS) via ratio prop (e.g. ratio='16/9')",
    "Autoplay defaults to true (with muted+loop for browser compliance)",
    "Graceful SVG placeholder when src is missing",
    "Poster image support for pre-load preview frame",
    "playsInline enforced for mobile autoplay support"
  ],
  accessibility: [
    "Applies role='img' and aria-label='Video placeholder' to missing-src states",
    "Supports native video controls via controls prop for keyboard-accessible playback",
    "Muted by default to comply with browser autoplay policies"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Always pass ratio='16/9' or explicit dimensions to reserve space and prevent layout shifts."
      },
      {
        guidance: true,
        description: "Provide a poster image for a professional pre-load frame before the video data arrives."
      },
      {
        guidance: false,
        description: "Do not use raw un-styled <video> tags — reach for Video primitive to handle placeholders and radius consistently."
      }
    ]
  },
  examples: [
    {
      title: "Autoplay Background Video",
      code: '<Video src="/hero.mp4" poster="/hero-poster.jpg" ratio="16/9" fit="cover" autoPlay loop muted />'
    },
    {
      title: "Controllable Video with Poster",
      code: '<Video src="/demo.mp4" poster="/demo.jpg" ratio="16/9" controls autoPlay={false} />'
    }
  ]
};
