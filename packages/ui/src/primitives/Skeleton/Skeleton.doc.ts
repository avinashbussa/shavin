import type { ComponentDoc } from "../../authoring/types";

export const docs: ComponentDoc = {
  name: "Skeleton",
  description: "Pulsing content placeholder block and SkeletonMimic structural wrapper for zero-layout-shift loading states.",
  features: [
    "Components: Skeleton and SkeletonMimic",
    "SkeletonMimic paints loaded children structure as pulsing placeholders without duplicate markup",
    "Uses control radius --radius-lg by default (override with rounded-full for avatars)",
    "Pulsing animation using animate-pulse keyframe token"
  ],
  accessibility: [
    "Applies aria-hidden to SkeletonMimic container preventing screen reader confusion",
    "Provides visual loading feedback prior to async content load"
  ],
  usage: {
    bestPractices: [
      {
        guidance: true,
        description: "Use SkeletonMimic around card or table layouts to auto-generate loading skeletons directly from real JSX markup."
      },
      {
        guidance: false,
        description: "Do not hardcode pixel dimensions for every skeleton line if SkeletonMimic can mirror the exact component tree."
      }
    ]
  },
  structure: [
    "<Skeleton className=\"h-4 w-32\" /> is one pulsing block (size it with classes); <SkeletonMimic loading={isLoading}>real markup</SkeletonMimic> turns the real children into placeholders.",
  ],
  examples: [
    {
      title: "Pulsing Card Loading Skeleton",
      code: '<Flex gap="3" align="center"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-32" /></Flex>'
    }
  ]
};
