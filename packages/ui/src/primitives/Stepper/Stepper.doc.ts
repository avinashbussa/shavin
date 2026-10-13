import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Stepper",
  description: "Data-driven multi-step progress stepper component for checkout wizards, onboarding flows, dialog sequences, and status trackers.",
  features: [
    "Variants: 'default' (connected nodes), 'cards' (responsive multi-step wizard grid), 'pills' (compact inline)",
    "Orientations: horizontal and vertical layout with connecting progress line",
    "Interactive navigation: onStepClick callback with customizable clickable policy ('completed' | 'all')",
    "Step states: complete (check icon + accent), current (accent indicator), upcoming (subtle number)",
    "Sizes: sm (28px circle) and md (36px circle)",
    "Custom step icons and descriptive subheadings"
  ],
  accessibility: [
    "Native <nav aria-label='Progress'> and <ol> ordered list accessibility tree representation",
    "aria-current='step' for active step detection by assistive technologies",
    "Interactive step buttons with keyboard focus rings and disabled states"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use variant='cards' for multi-step modal headers and onboarding wizards where each step needs clear context."
      },
      {
        guidance: true,
        description: "Pass onStepClick to allow users to navigate back to completed steps."
      },
      {
        guidance: false,
        description: "Do not use Stepper for non-sequential, random-access tabs — reach for Tabs instead."
      }
    ]
  },
  examples: [
    {
      title: "Interactive Wizard Stepper (Cards Variant)",
      code: '<Stepper steps={[{ title: "Guidelines", description: "Read standards" }, { title: "Metadata", description: "Title & category" }, { title: "Preview", description: "Render test" }, { title: "Publish", description: "Review & deploy" }]} current={1} variant="cards" onStepClick={(i) => setCurrent(i)} />'
    },
    {
      title: "Horizontal Connected Stepper",
      code: '<Stepper steps={[{ title: "Account", description: "Personal details" }, { title: "Billing", description: "Payment info" }, { title: "Complete" }]} current={1} />'
    }
  ]
};
