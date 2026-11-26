import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Button",
  description: "General-purpose trigger for in-page actions (toolbars, forms, cards, action bars).",
  features: [
    "Variants: solid, soft, outline, ghost",
    "Tones: brand, danger",
    "Sizes: sm (32px), md (40px), lg (48px)",
    "Supports Radix Slot via asChild prop",
    "Supports iconLeft and iconRight slots with automatic label truncation",
    "loading: Spinner replaces iconLeft (or covers the label), width kept, progress cursor; loadingLabel swaps and announces the text",
    "disabledReason: stays focusable (aria-disabled) and shows why in a Tooltip on hover, focus and tap"
  ],
  accessibility: [
    "Built with native <button> tag supporting full keyboard focus & activation (Enter/Space)",
    "disabled: native disabled, not-allowed cursor, skipped in the tab order, opacity reduction",
    "disabledReason: aria-disabled (not disabled) so it stays focusable; the reason is its accessible description and shows in a Tooltip; clicks and submit are blocked",
    "loading: aria-busy and aria-disabled, stays focusable, clicks ignored; the spinner is hidden from screen readers and loadingLabel is announced once (polite)",
    "Exposes standard aria-* attributes and role override via asChild",
    "Target size (WCAG 2.5.8): a 24px hit area at every pointer and 44px on touch (comfortable default, <ThemeProvider touchTargets=\"compact\"> turns the growth off); hitArea=\"none\" | \"default\" | \"touch\" overrides it per button"
  ],
  keyboard: "Space or Enter to activate button action",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use variant='solid' tone='brand' for primary action in a container or form."
      },
      {
        guidance: true,
        description: "Use variant='ghost' or variant='soft' for secondary/toolbar actions to preserve visual hierarchy."
      },
      {
        guidance: true,
        description: "Disable a submit only while its request runs (loading), not while the form is incomplete."
      },
      {
        guidance: true,
        description: "Use disabledReason for actions blocked by permission or plan ('Upgrade to Pro to export'); print long reasons as text next to the button too."
      },
      {
        guidance: false,
        description: "Do not use plain disabled without saying why: use disabledReason, or a hint next to it."
      },
      {
        guidance: false,
        description: "Do not place two solid brand buttons adjacent to each other in the same action bar."
      }
    ]
  },
  examples: [
    {
      title: "Primary Solid Brand",
      description: "Standard call-to-action button",
      code: '<Button variant="solid" tone="brand">Save Changes</Button>'
    },
    {
      title: "Soft Secondary Action",
      description: "Subtle background action",
      code: '<Button variant="soft" tone="brand">View Details</Button>'
    },
    {
      title: "Destructive Action",
      description: "Danger-toned action for deletion or destructive triggers",
      code: '<Button variant="solid" tone="danger">Delete Account</Button>'
    },
    {
      title: "Loading",
      description: "Pending while a request runs; the label is announced as Saving…",
      code: '<Button loading loadingLabel="Saving…">Save changes</Button>'
    },
    {
      title: "Disabled with a reason",
      description: "Focusable, with the reason in a Tooltip and as its description",
      code: '<Button variant="outline" disabledReason="Upgrade to Pro to export">Export CSV</Button>'
    }
  ]
};
