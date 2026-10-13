import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "ToolCall",
  description: "One tool or function call by an assistant with its lifecycle and the permission request shown before it runs.",
  features: [
    "status: pending, running, needs-approval, done, error, denied",
    "needs-approval shows the input and Allow once, Always allow and Deny actions",
    "Result goes in children and shows when done or error"
],
  accessibility: [
    "Permission actions sit in a role=group labelled with the tool name",
    "Status is conveyed by text label as well as icon and colour"
],
  keyboard: "Tab to the approval buttons, Enter or Space to choose.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Ask before any tool that reads private data or changes something, and show the exact input." },
      { guidance: false, description: "Do not auto-approve in the component, the host app owns the decision and the stored Always preference." }
    ]
  },
  examples: [
    { title: "ToolCall example", code: "<ToolCall name=\"search_tickets\" status=\"needs-approval\" description=\"Search support tickets\" input=\"query: refund AND status:open\" onApprove={(scope) => allow(scope)} onDeny={() => deny()} />" }
  ]
};
