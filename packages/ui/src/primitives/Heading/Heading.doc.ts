import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Heading",
  group: "typography",
  description: "Page, section and card titles on one type scale; the tag sets the document outline and picks the display or subheading font.",
  features: [
    "Sizes: sm 18px, md 20px, lg 24px (default) are fixed; xl 24→30px, 2xl 30→36px, 3xl 36→48px and the display sizes 4xl 36→60px and 5xl 36→72px are fluid: they grow smoothly with the nearest container (an AppFrame) or the window, no breakpoints",
    "Font role by tag: h1/h2 and display sizes use the display font, h3-h6 use --font-subheading (the body font unless ThemeProvider sets subheadingFont). An explicit font-* class wins",
    "weight (default semibold), tracking and truncate (three-line clamp); text-balance on every heading",
    "as renders any tag: h1-h6, div, span",
  ],
  accessibility: [
    "Pick `as` for the document outline (one h1 per page, no skipped levels) and `size` for the look; the two are independent",
    "Text colour is text-fg, which meets WCAG AAA contrast on every surface token",
  ],
  usage: {
    bestPractices: [
      { guidance: true, description: "Choose the heading level with `as` and the visual size with `size`." },
      { guidance: true, description: "Pair a heading with a muted Text line for page and section intros." },
      { guidance: false, description: "Do not add font-display or font-sans to an h3-h6 Heading — the tag already selects the subheading font." },
      { guidance: true, description: "Pick the size for the widest layout and let it scale: section titles 2xl or 3xl, heroes 4xl or 5xl. They shrink in a narrow column, card, app frame or phone without breakpoints." },
      { guidance: false, description: "Do not set text-2xl or similar size classes on headings, and do not add breakpoint size steps such as md:text-6xl; use the size prop. The one exception: a plain size class such as text-6xl pins a heading to a fixed size when it must not scale." },
    ],
  },
  examples: [
    {
      title: "Page header",
      code: `<div>
  <Heading as="h1" size="2xl">Dashboard overview</Heading>
  <Text size="sm" color="muted">System performance and active project metrics.</Text>
</div>`,
    },
    {
      title: "Display heading",
      description: "Fluid: 36px in a narrow container, up to 72px on a wide one.",
      code: '<Heading as="h1" size="5xl">Design that agents follow</Heading>',
    },
    {
      title: "Fixed display size",
      description: "A size class such as text-6xl in className replaces the fluid size; this heading is 60px everywhere.",
      code: '<Heading as="h1" size="5xl" className="text-6xl">Design that agents follow</Heading>',
    },
  ],
};
