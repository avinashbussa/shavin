import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Carousel",
  description:
    "A responsive, accessible slider and scroll-track carousel supporting container alignment, edge gradient fades, and pagination.",
  features: [
    "Variants: cards (free-scrolling track of several items) and slider (one item per view, snap paging)",
    "alignToContainer lines the first and last items up with a Shavin container width",
    "fadeEdges softens the track edges; scrollStep sets how far Previous and Next travel",
    "Compound parts: Carousel.Track, Carousel.Item, Carousel.Controls, Carousel.Previous, Carousel.Next, Carousel.Dots",
  ],
  accessibility: [
    "The root is a region with aria-roledescription=\"carousel\"; each Carousel.Item is a group with aria-roledescription=\"slide\" (pass index for a \"Slide N\" label)",
    "Previous and Next are native buttons labelled \"Previous slide\" and \"Next slide\"",
    "Carousel.Dots renders a tablist of buttons labelled \"Go to slide N\" with aria-selected on the current one",
    "The track is focusable (tabIndex 0), so keyboard users can scroll it; give the carousel an aria-label that names its content",
  ],
  keyboard: "Tab to the track and use Left/Right arrows to scroll it; Tab to Previous, Next or a dot and press Enter or Space to move.",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Give the carousel an aria-label (e.g. \"Featured templates\") and keep visible Previous/Next controls so it is usable without a trackpad.",
      },
      {
        guidance: true,
        description: "Use variant=\"cards\" for browsable collections and variant=\"slider\" for one-at-a-time content such as testimonials.",
      },
      {
        guidance: false,
        description: "Do not rely on autoPlayInterval for content people must read: autoplay does not pause on hover or focus yet.",
      },
      {
        guidance: false,
        description: "Do not hide the only route to important content inside a carousel; most visitors never page past the first items.",
      },
    ],
  },
  examples: [
    {
      title: "Cards track with gutter alignment",
      code: `<Carousel variant="cards" alignToContainer="lg" fadeEdges aria-label="Featured items">
  <div className="mb-4 flex items-center justify-between">
    <Heading size="lg">Featured items</Heading>
    <Carousel.Controls>
      <Carousel.Previous />
      <Carousel.Next />
    </Carousel.Controls>
  </div>
  <Carousel.Track gap="5">
    {["Analytics", "Billing", "Teams", "Integrations", "Security", "Audit log"].map((title, index) => (
      <Carousel.Item key={title} index={index} className="w-[320px]">
        <Card>{title}</Card>
      </Carousel.Item>
    ))}
  </Carousel.Track>
</Carousel>`,
    },
  ],
};
