/**
 * Baked block tree types — pure data representation.
 */

import type { BlockNode as SchemaBlockNode } from "../types";

/** Baked tree node — same as BlockNode but children is always present. */
export interface BakedNode {
  id: string;
  type: string;
  props: Record<string, string>;
  children: BakedNode[];
}

/** Canvas layout hint for preview framing. */
export type BlockLayout =
  | "fullscreen"
  | "sidebar"
  | "sidebar-right"
  | "header"
  | "centered"
  | "plain"
  | "app-shell";

/** A baked tree literal: the AST + canvas layout hint. Metadata lives in the catalog. */
export interface BakedTree {
  key: string;
  layout: BlockLayout;
  tree: BakedNode;
}

/**
 * A fully joined block template — catalog metadata + baked tree.
 * This is what Studio, Docs, and MCP consume as BLOCK_TEMPLATES.
 */
export type StudioBlockTemplate = Omit<
  import("../types").BlockTemplate,
  "tree"
> & {
  /** Alias of slug — kept for Studio/Docs compatibility. */
  key: string;
  layout: BlockLayout;
  /** Single-root AST (the canvas representation). */
  tree: BakedNode;
};

// BakedNode is structurally assignable to SchemaBlockNode (children: [] is
// valid where children?: BlockNode[] is expected), so no adapter is needed.
export type { SchemaBlockNode as BlockNode };
