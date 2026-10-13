/**
 * Bidirectional block synchronization — runtime utilities.
 *
 * Each block template has an `origin` field declaring which half is canonical
 * (authored) and which is derived (auto-generated):
 *
 *  - `"rawCode"` — rawCode was hand-written; tree is derived by parsing it.
 *  - `"tree"`    — tree was authored in Studio; rawCode is derived by serializing it.
 *  - `"both"`    — both halves are reconciled; either can derive the other.
 *
 * These functions let consumers (Studio, CLI, MCP) derive the missing half
 * at runtime without importing the @shavin/block-renderer parser directly.
 */

import type { BlockTemplate, BlockNode } from "./types";

export type { BlockOrigin } from "./types";

/**
 * Derive the tree from a block's rawCode.
 * Returns `null` if the block has no rawCode or parsing fails.
 *
 * The caller is responsible for importing the parser from
 * the Studio-local engine module (`apps/studio/src/engine`, exported
 * via `@/engine/builder-core`) and passing it via the `parse` option.
 * This keeps `@shavin/block-schema` free of a runtime dependency on
 * the engine (the engine is Studio-private, not a package).
 */
export function deriveTree(
  block: Pick<BlockTemplate, "rawCode" | "origin">,
  parse: (src: string) => BlockNode[],
): BlockNode[] | null {
  if (!block.rawCode || !block.rawCode.trim()) return null;
  try {
    return parse(block.rawCode);
  } catch {
    return null;
  }
}

/**
 * Derive the rawCode from a block's tree.
 * Returns `null` if the block has no tree or serialization fails.
 *
 * The caller is responsible for importing the serializer from
 * the Studio-local engine module (`@/engine/builder-core`) and passing it via the `serialize` option.
 */
export function deriveRawCode(
  tree: BlockNode[] | undefined,
  serialize: (blocks: BlockNode[]) => string,
): string | null {
  if (!tree || tree.length === 0) return null;
  try {
    return serialize(tree);
  } catch {
    return null;
  }
}

/**
 * Collect all unknown component types from a parsed tree.
 * These are nodes emitted as `RawHTML` with `_unknown: "true"` — components
 * that aren't in the DS manifest and aren't HTML elements or known icons.
 *
 * Studio uses this to display a warning badge on blocks that contain
 * components not yet in the design system.
 */
export function collectUnknownComponents(tree: BlockNode[] | null | undefined): string[] {
  if (!tree) return [];
  const unknowns = new Set<string>();
  function walk(node: BlockNode): void {
    if (node.type === "RawHTML" && (node.props as Record<string, string>)?._unknown === "true") {
      unknowns.add((node.props as Record<string, string>).tag || "unknown");
    }
    if (node.children) for (const c of node.children) walk(c);
  }
  for (const root of tree) walk(root);
  return [...unknowns].sort();
}

/**
 * Determine whether a block needs reconciliation.
 *
 * Returns `"synced"` if both halves are present and structurally consistent,
 * `"needs-tree"` if the tree is missing and should be derived from rawCode,
 * `"needs-rawCode"` if rawCode is missing and should be derived from tree,
 * or `"needs-both"` if neither half is present (an error state).
 */
export function getSyncStatus(
  block: Pick<BlockTemplate, "origin" | "rawCode" | "tree">,
): "synced" | "needs-tree" | "needs-rawCode" | "needs-both" {
  const hasRaw = !!block.rawCode && block.rawCode.trim().length > 0;
  const hasTree = !!block.tree && block.tree.length > 0;

  if (hasRaw && hasTree) return "synced";
  if (hasRaw && !hasTree) return "needs-tree";
  if (!hasRaw && hasTree) return "needs-rawCode";
  return "needs-both";
}
