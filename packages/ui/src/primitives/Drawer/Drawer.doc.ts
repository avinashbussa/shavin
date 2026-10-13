import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Drawer",
  description:
    "Edge-mounted overlay panel that slides in from left or right. Built on Radix Dialog with focus trapping, scroll lock, backdrop dismiss, and directional slide-in/slide-out animations. Use for temporary contextual panels — unlike Sidebar (in-flow layout), Drawer overlays content and dismisses on outside click.",
  features: [
    "Sides: left, right — directional slide-in/slide-out from the mounted edge",
    "Variants: floating (inset card with margin, radius, shadow — default), fixed (flush against edge)",
    "Sizes: sm (384px), md (448px), lg (512px), xl (672px)",
    "Dismissible toggle — backdrop click closes (default true) or explicit close-icon only",
    "Configurable overlay opacity (0–1) via overlayOpacity prop — tune backdrop intensity per context",
    "Radix Dialog focus trap, scroll lock, Escape key dismiss, ARIA title/description wiring",
    "Footer action slot for primary/secondary buttons",
  ],
  accessibility: [
    "Focus trapped automatically inside drawer while open",
    "Escape key triggers animated exit and unmount",
    "Restores focus to trigger element on dismiss",
    "ARIA title and description wired via Radix Dialog.Title / Dialog.Description",
  ],
  keyboard: "Escape to dismiss drawer",
  usage: {
    bestPractices: [
      { guidance: true, description: "Use Drawer for temporary contextual panels like filters, inspectors, quick settings, or mobile navigation that should overlay content and dismiss on outside interaction." },
      { guidance: false, description: "Do not use Drawer for persistent navigation or always-visible panels — use Sidebar (in-flow layout) instead. Drawer is for temporary, dismissible surfaces." },
    ],
  },
  examples: [
    {
      title: "Right-side filter drawer (floating default)",
      code: '<Drawer side="right" title="Filters" onClose={() => {}} dismissible>Filter controls here</Drawer>',
    },
    {
      title: "Fixed left drawer with footer",
      code: '<Drawer side="left" variant="fixed" title="Inspector" onClose={() => {}} footer={<Button tone="accent">Apply</Button>}><Text>Panel content</Text></Drawer>',
    },
  ],
};
