import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Toast",
  description: "Non-blocking floating notification system with swipe-to-dismiss, hover expansion, and promise lifecycle helpers.",
  features: [
    "Types: default, success, error, warning, info, loading, custom",
    "Positions: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right",
    "Supports promise lifecycle (toast.promise)",
    "Swipe-to-dismiss drag gestures and hover stack expansion"
  ],
  accessibility: [
    "Uses role='status' and aria-live region announcements",
    "Auto-dismiss pauses on mouse hover to allow reading complex notifications",
    "Dismiss button provided for explicit manual dismissal"
  ],
  keyboard: "Hover or focus toaster container to expand card stack",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Wrap application root with <ToastProvider position='bottom-right'> and consume via useToast()."
      },
      {
        guidance: false,
        description: "Do not use Toast for critical modal confirmations — reach for AlertDialog instead."
      }
    ]
  },
  examples: [
    {
      title: "Success Toast Trigger",
      code: 'const { success } = useToast(); success("Changes saved successfully");'
    }
  ]
};
