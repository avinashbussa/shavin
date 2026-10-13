import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "BlockPreview",
  internal: true,
  description:
    "Internal: the frame Shavin's own sites use to show a block, with device widths, a code view, the CLI install command and an Open in Studio link.",
  features: [
    "Desktop, tablet and mobile widths; children read the current one from DeviceContext",
    "Code view of the block source with copy, plus a copyable `npx @shavin/cli add` command",
    "Open in Studio link built from builderKey (or builderUrl)",
    "MiniBlockPreview and MiniPreviewFrame: scaled thumbnails for galleries, with an error boundary (SafeMiniPreview)",
  ],
  notes: [
    "Used by the docs, website, community and Studio apps. It links to studio.shavin.cc and Shavin's CLI, so it is not meant for customer apps.",
    "Previews render inline in the host page: a block's links and fixed or absolutely positioned elements can affect the page around it. Community blocks should move to a sandboxed iframe before this is trusted with third-party code.",
  ],
  accessibility: [
    "Toolbar controls are native buttons; the code view's close button is labelled \"Close\"",
    "The live preview is the block itself, so its accessibility is the block's own",
  ],
  keyboard: "Tab through the toolbar (device widths, code, copy, Studio link) and activate with Enter or Space.",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use it only inside Shavin's own apps to present blocks from the catalogue.",
      },
      {
        guidance: false,
        description: "Do not use BlockPreview in product UI or render untrusted community code in it; it does not isolate the preview from the page.",
      },
    ],
  },
  examples: [
    {
      title: "Block in a preview frame",
      code: `<BlockPreview
  title="Pricing card"
  command="npx @shavin/cli add pricing-card"
  code={'<Card><Heading size="md">Pro</Heading><Text color="muted">$24 per month</Text></Card>'}
  layout="centered"
>
  <Card className="w-72">
    <Heading size="md">Pro</Heading>
    <Text color="muted">$24 per month</Text>
  </Card>
</BlockPreview>`,
    },
  ],
};
