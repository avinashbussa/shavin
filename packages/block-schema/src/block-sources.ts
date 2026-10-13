import type { BlockTemplate } from "./types";
import { orderBlocks, AUTHORED_SYSTEM_BLOCKS } from "./authored";

/**
 * The public block catalog: every non-pro authored Block TSX file
 * (packages/block-schema/blocks/**, compiled by `npm run blocks:build`).
 * Pro-tier blocks live in the private @shavin/blocks-pro package instead.
 */
export const SYSTEM_BLOCKS: BlockTemplate[] = orderBlocks(AUTHORED_SYSTEM_BLOCKS);

export const COMMUNITY_BLOCKS = SYSTEM_BLOCKS;
