/**
 * BLOCK_TEMPLATES — the unified Shavin block catalog.
 *
 * Joins catalog metadata + rawCode (SYSTEM_BLOCKS) with the tree compiled from
 * each authored Block TSX file into one record per block, keyed by slug.
 * Authored trees are parse(rawCode) verbatim, so Studio exports them back unchanged.
 */

import { SYSTEM_BLOCKS } from "../block-sources";
import { AUTHORED_TREES } from "../generated/authored-blocks";
import type { StudioBlockTemplate } from "./types";

export type { BakedTree, BakedNode, StudioBlockTemplate, BlockLayout } from "./types";

export const BLOCK_TEMPLATES: Record<string, StudioBlockTemplate> = Object.fromEntries(
  SYSTEM_BLOCKS.filter((block) => AUTHORED_TREES[block.slug]).map((block) => {
    const { layout, tree } = AUTHORED_TREES[block.slug];
    return [block.slug, { ...block, key: block.slug, layout, tree }];
  })
);
