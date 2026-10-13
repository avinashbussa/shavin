import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Link",
  group: "typography",
  description: "Inline text link with underline and colour variants.",
  features: [
    "underline: hover (default), always, none",
    "color: default (text colour) or accent (link token)",
    "size: xs, sm, md, lg, or inherit from the surrounding text",
    "Renders a native <a>, so it works with any router through href",
  ],
  accessibility: [
    "Native anchor: focusable, announced as a link, activates with Enter",
    "Write link text that makes sense on its own (\"Read the billing guide\", not \"click here\")",
    "Add rel=\"noopener noreferrer\" with target=\"_blank\", and say the link opens a new tab",
  ],
  keyboard: "Tab to focus, Enter to follow.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Use underline=\"always\" for links inside paragraphs so they are recognisable without colour." },
      { guidance: false, description: "Do not use Link for actions that do not navigate; use Button with variant=\"ghost\"." },
    ],
  },
  examples: [
    {
      title: "Inline and accent links",
      code: `<Text>
  Read the <Link href="#" underline="always">billing guide</Link> or{" "}
  <Link href="#" color="accent">contact support</Link>.
</Text>`,
    },
  ],
};
