import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Avatar",
  description: "User avatar image with automatic initial-letter fallback built on Radix Avatar primitive.",
  features: [
    "Sizes: sm (28px), md (36px), lg (56px), xl (96px)",
    "Supports radius escape hatch (radius='none|small|medium|large|full|inherit')",
    "Defaults to rounded-full shape per Radix Themes avatar design convention",
    "Flicker-free fallback delay handling via Radix Avatar",
    "Colour fallbacks for projects, workspaces and teams: color='accent|success|warning|danger' with variant='soft|solid', plus fallbackIcon"
  ],
  accessibility: [
    "Provides screen reader accessible alt text",
    "Displays initials or user icon fallback when image fails to load"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Always pass initials (e.g. fallback='JD') or an alt label for screen readers."
      },
      {
        guidance: false,
        description: "Do not force radius='none' globally on avatars unless rendering a square badge or logo tile."
      }
    ]
  },
  examples: [
    {
      title: "User Avatar with Initials Fallback",
      code: '<Avatar src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100" fallback="JD" size="md" />'
    },
    {
      title: "Icon avatar with a colour fill (projects, workspaces)",
      code: '<Flex gap="3"><Avatar radius="medium" color="accent" variant="solid" fallbackIcon={<Icon name="globe" size="sm" color="inherit" />} /><Avatar radius="medium" color="success" fallbackIcon={<Icon name="smartphone" size="sm" color="inherit" />} /><Avatar radius="medium" color="warning" fallback="DS" /></Flex>'
    }
  ]
};
