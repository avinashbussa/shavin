import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "HoverCard",
  description: "Hover-triggered preview card panel built on Radix HoverCard primitive with open/close intent delays and collision detection.",
  features: [
    "Components: HoverCard, HoverCardTrigger, HoverCardContent",
    "Uses panel radius --radius-panel per AGENTS.md rule section 5",
    "Includes data-panel translucent backdrop attribute",
    "Configurable collisionPadding (default 8) and alignment"
  ],
  accessibility: [
    "Supports mouse hover with grace area navigation into popover content",
    "Restores focus and keyboard accessibility when trigger is activated"
  ],
  keyboard: "Hover trigger with mouse or press Tab to focus trigger link",
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use HoverCard for user profile popover previews when hovering @mentions or links."
      },
      {
        guidance: false,
        description: "Do not put essential user actions inside HoverCard — reach for Popover or Dialog instead."
      }
    ]
  },
  examples: [
    {
      title: "User Profile Preview Card",
      code: '<HoverCard><HoverCardTrigger asChild><a href="#">@alex</a></HoverCardTrigger><HoverCardContent><div>Alex Morgan</div></HoverCardContent></HoverCard>'
    }
  ]
};
