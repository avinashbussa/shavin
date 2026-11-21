/** Every user-facing string of the inspector in one place. Self-contained: no links, commands are named in full. */

export const STR = {
  bridgeDown: "Agent not connected. Start the bridge with `npx @shavin/cli bridge`, then press Send again. Your comment is kept.",
  saveFailed: "Could not save the finding. Check the bridge terminal for the error, then press Send again.",
  tooLong: "Comment is too long. Keep it under 2,000 characters.",
  copied: "Copied. Paste it into your agent's chat.",
  waiting: "Sent. Waiting for the agent.",
  leased: "Agent is working on it.",
  backInQueue: "Back in the queue. The agent did not finish.",
  acked: "Agent marked it done. Rescanning…",
  resolved: "Resolved.",
  stillThere: "Agent marked it done, but the issue is still on the page.",
  noAgent: "Sent. No agent is waiting yet. Ask your agent to call `await_finding`, or use Copy as prompt.",
  emptyList: "No findings.",
  ignoredNote: "Ignored on this page. Not counted.",
  ignoredDone: "Ignored. It stays in the list in gray and is not counted.",
  toolbar: "Shavin inspector",
  expand: "Open the inspector bar",
  collapse: "Collapse the inspector bar",
  selectIdle: "Select, click an element",
  noElement: "This finding is about the whole page, so there is nothing to highlight.",
  gone: "That element is no longer on the page.",
} as const;

export const TOOLS = {
  select: { label: "Select", key: "V" },
  issues: { label: "Issues", key: "I" },
  theme: { label: "Theme", key: "T" },
  settings: { label: "Settings", key: "," },
} as const;

/** Short titles for the popover header, by rule id (the finding's `message` is the full sentence). */
const RULE_TITLES: Record<string, string> = {
  "overlap.text": "Text overlaps other text",
  "line-height.tight": "Line height is too tight",
  "contrast.text": "Text is hard to read",
  "contrast.unknown-backdrop": "Contrast cannot be judged here",
  "overflow.horizontal": "Content spills out of its box",
  "overflow.viewport": "Content runs past the screen edge",
  "overflow.container": "Content spills out of its box",
  "tap-target.min-24": "Tap target is too small",
  "console.error": "The page logged an error",
  "tokens.purity": "Style bypasses the design tokens",
  "tokens.semantic": "Style bypasses the design tokens",
  "tokens.radius": "Style bypasses the design tokens",
  "tokens.surface": "Style bypasses the design tokens",
  "tokens.type": "Style bypasses the design tokens",
};

export const ruleTitle = (rule: string, fallback: string): string => RULE_TITLES[rule] ?? fallback;

export const POPOVER = {
  notePlaceholder: "Add a note for the agent (optional)",
  noteLabel: "Note for the agent",
  send: "Send to agent",
  sending: "Sending…",
  sendAgain: "Send again",
  cancel: "Cancel",
  discard: "Discard?",
  ignore: "Ignore",
  restore: "Restore",
  ignored: "Ignored",
  copy: "Copy as prompt",
  close: "Close",
  dialogLabel: "Comment on selected element",
  scrollTo: "Scroll to element",
} as const;
