export * from "./types";
export * from "./schema";
export * from "./community-schema";
export * from "./block-sources";
export * from "./templates";
export * from "./sync";
export * from "./assets";
export * from "./authored";

import { SYSTEM_BLOCKS, COMMUNITY_BLOCKS } from "./block-sources";

// Canonical exports
export const systemBlocks = SYSTEM_BLOCKS;
export const communityBlocks = COMMUNITY_BLOCKS;
// COMMUNITY_BLOCKS is currently an alias of SYSTEM_BLOCKS (community is seeded from the
// system catalog), so a plain spread listed every block twice. Union by slug instead.
export const allBlocks = [...new Map([...SYSTEM_BLOCKS, ...COMMUNITY_BLOCKS].map((b) => [b.slug, b])).values()];

// Compatibility aliases
export const ALL_BLOCKS = allBlocks;
