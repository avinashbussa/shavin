import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "ChatBubble",
  description: "One message in a conversation, human or AI. Handles who is speaking, bubble or flat layout, and the turn lifecycle (submitted, streaming, ready, stopped, error) so any AI chat framework can map its message parts and status onto it.",
  features: [
    "role: user, assistant, system. variant (incoming, outgoing, system) is the older spelling and still works",
    "layout: bubble (text on a surface) or flat (content flows as a document). role=assistant defaults to flat so Reasoning, ToolCall, CodeBlock and FileOutput are never squeezed into a bubble",
    "status: submitted (Murmur pending indicator), streaming (live caret, aria-live), ready, stopped, error with Retry. Names match the Vercel AI SDK chat status",
    "actions slot for copy / regenerate / feedback, hidden while submitted or streaming",
    "Children are the message parts in order. Part primitives: Reasoning (reasoning part), ToolCall (tool part with approval), CodeBlock (code), FileOutput (file part)",
    "Uses panel radius --radius-panel with a tail corner in bubble layout; avatar, author and timestamp slots"
  ],
  accessibility: [
    "Streaming turns are aria-live=polite and aria-busy; the pending indicator is a role=status",
    "Error row is role=alert",
    "Direction (user vs assistant) is conveyed by alignment and data-role, not colour alone"
  ],
  keyboard: "Tab to actions, Retry and any interactive parts inside the message.",
  usage: {
    bestPractices: [
      { guidance: true, description: "For AI chat use role=\"assistant\" (flat) for the model and role=\"user\" for the person, and put each message part inside as a child." },
      { guidance: true, description: "Map your framework's status straight onto the status prop and your parts onto the part primitives." },
      { guidance: false, description: "Do not put ToolCall, CodeBlock or FileOutput inside layout=\"bubble\", use flat." },
      { guidance: false, description: "Do not use ChatBubble for long editorial articles, reach for Section or Container." }
    ]
  },
  examples: [
    { title: "Assistant turn with parts", code: '<ChatBubble role="assistant" avatarFallback="AI" status="streaming"><Reasoning status="thinking">Checking the policy…</Reasoning>A refund is possible within 30 days</ChatBubble>' },
    { title: "User message", code: '<ChatBubble role="user" hideAvatar>Where is my order?</ChatBubble>' },
    { title: "Support chat bubble", code: '<ChatBubble variant="incoming" author="Studio AI" avatarFallback="AI" timestamp="Just now">How can I help?</ChatBubble>' }
  ]
};
