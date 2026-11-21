import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Toast",
  description: "Brief notifications that don't block the page. They stack, expand on hover, swipe away, and can track a promise from loading to done.",
  features: [
    "Types: default, success, error, warning, info, loading, custom",
    "Positions: top-left, top-center, top-right, bottom-left, bottom-center, bottom-right",
    "Supports promise lifecycle (toast.promise)",
    "Swipe-to-dismiss drag gestures and hover stack expansion",
    "At most three toasts show at once; an identical message that is already showing is not repeated",
    "Plain error toasts stay 8s; a toast with an action stays until dismissed; loading has no auto-dismiss",
    "Below md the stack moves to bottom-centre, full width minus 16px, above the safe area"
  ],
  accessibility: [
    "Region aria-label='Notifications'; success, info and warning are announced polite, errors assertive, through persistent live regions",
    "Auto-dismiss pauses on hover and on keyboard focus inside the stack (WCAG 2.2.1)",
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
        guidance: true,
        description: "Use success() for small reversible confirmations ('Changes saved'), promise() for a save or job in progress."
      },
      {
        guidance: false,
        description: "Do not let a Toast carry the only copy of an error: persist it inline (Callout or field error) and use the toast only as an extra."
      },
      {
        guidance: false,
        description: "Do not use Toast for form validation or destructive confirmations: use field errors and AlertDialog."
      }
    ]
  },
  structure: [
    "shavin init mounts <ToastProvider> inside <ThemeProvider> in the root layout; add it there once if it is missing. useToast() throws outside it.",
    "Trigger from any client component: const { toast, success, error, warning, info, loading, custom, promise, dismiss } = useToast();",
  ],
  examples: [
    {
      title: "Save with success and retry",
      code: `const { success, error } = useToast();
async function onSave() {
  try { await save(values); success("Changes saved"); }
  catch { error("Couldn't save changes", { action: { label: "Retry", onClick: onSave } }); }
}`
    },
    {
      title: "Track a promise",
      code: 'const { promise } = useToast();\npromise(saveProfile(values), { loading: "Saving…", success: "Profile saved", error: "Couldn\'t save profile" });'
    },
    {
      title: "Undo after delete",
      code: 'success("Order deleted", { action: { label: "Undo", onClick: undo } });'
    }
  ]
};
