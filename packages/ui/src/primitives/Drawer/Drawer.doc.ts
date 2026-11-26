import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Drawer",
  description:
    "A panel that slides in over the page from the left or right edge, with a title, body and footer. Use it for temporary tasks; unlike Sidebar, it covers the content and closes on a click outside.",
  features: [
    "Sides: left, right — directional slide-in/slide-out from the mounted edge",
    "Variants: floating (inset card with margin, radius, shadow — default), fixed (flush against edge)",
    "Sizes: sm (384px), md (448px), lg (512px), xl (672px)",
    "Dismissible toggle — backdrop click closes (default true) or explicit close-icon only",
    "Configurable overlay opacity (0–1) via overlayOpacity prop — tune backdrop intensity per context",
    "Radix Dialog focus trap, scroll lock, Escape key dismiss, ARIA title/description wiring",
    "Footer action slot for primary/secondary buttons",
    "Uncontrolled with a `trigger` element (closed until the trigger is activated, no state needed, so it works inside blocks), or controlled with `open` and `onClose`",
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
      title: "Trigger-opened menu drawer (no state)",
      code: '<Drawer side="left" size="sm" title="Menu" trigger={<IconButton aria-label="Open menu"><Icon name="menu" /></IconButton>}><Text>Links here</Text></Drawer>',
    },
    {
      title: "Fixed left drawer with footer",
      code: '<Drawer side="left" variant="fixed" title="Inspector" onClose={() => {}} footer={<Button tone="brand">Apply</Button>}><Text>Panel content</Text></Drawer>',
    },
  ],
};
