import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Link",
  group: "typography",
  description: "Inline text link with underline and colour variants.",
  features: [
    "underline: hover (default), always, none",
    "color: default (text colour) or brand (link token)",
    "size: xs, sm, md, lg, or inherit from the surrounding text",
    "Renders a native <a>, so it works with any router through href",
    "standalone: a 24px hit area for a link that is not inside a sentence (navigation, footer, table of contents); no layout shift. On by default when underline is \"none\"; standalone={false} opts out",
  ],
  accessibility: [
    "Native anchor: focusable, announced as a link, activates with Enter",
    "Write link text that makes sense on its own (\"Read the billing guide\", not \"click here\")",
    "Target size (WCAG 2.5.8): links inside running text are exempt; give a stand-alone link standalone. hitArea=\"touch\" grows it to 44px on touch, hitArea=\"none\" opts out",
    "Add rel=\"noopener noreferrer\" with target=\"_blank\", and say the link opens a new tab",
  ],
  keyboard: "Tab to focus, Enter to follow.",
  usage: {
    bestPractices: [
      { guidance: true, description: "Use underline=\"always\" for links inside paragraphs so they are recognisable without colour." },
      { guidance: true, description: "Add standalone to links that stand on their own: nav, footer and table-of-contents links." },
      { guidance: false, description: "Do not use Link for actions that do not navigate; use Button with variant=\"ghost\"." },
    ],
  },
  examples: [
    {
      title: "Inline and brand links",
      code: `<Text>
  Read the <Link href="#" underline="always">billing guide</Link> or{" "}
  <Link href="#" color="brand">contact support</Link>.
</Text>`,
    },
    {
      title: "Stand-alone links",
      code: `<Flex direction="column" gap="1">
  <Link href="#" standalone>Pricing</Link>
  <Link href="#" standalone>Changelog</Link>
</Flex>`,
    },
  ],
};
