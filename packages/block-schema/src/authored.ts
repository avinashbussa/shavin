/**
 * Authored Block TSX → catalog bridge.
 *
 * Blocks authored as files in `packages/block-schema/blocks/<category>/<slug>.tsx`
 * are compiled by `npm run blocks:build` into `./generated/authored-blocks.ts`.
 * They are the whole public catalog. This module orders them and owns the rename map
 * so retired slugs keep resolving.
 */

import type { BlockTemplate } from "./types";
import { AUTHORED_BLOCKS, AUTHORED_RENAMES, AUTHORED_TREES } from "./generated/authored-blocks";

/**
 * Optional sidecar metadata: `blocks/<category>/<slug>.meta.ts`
 * (`export default { … } satisfies BlockMeta`). Every field is optional —
 * a bare `.tsx` builds with a title-cased name and category-derived tags.
 */
export interface BlockMeta {
  name?: string;
  description?: string;
  tags?: string[];
  /** Retired slug this block supersedes; the old slug redirects here. */
  replaces?: string;
  tier?: "system" | "community" | "pro";
  version?: string;
  /** Canvas framing hint (BlockLayout); default "plain". */
  layout?: "fullscreen" | "sidebar" | "sidebar-right" | "header" | "centered" | "plain" | "app-shell";
}

/** A catalog entry compiled from an authored file. */
export type AuthoredBlock = BlockTemplate & { replaces?: string; sourcePath: string };

/** Old slug → new slug for every authored block that `replaces` a legacy one. */
export const RENAMED_BLOCKS: Readonly<Record<string, string>> = AUTHORED_RENAMES;

/** Resolve a possibly-renamed slug to its current slug (follows chains). */
export function resolveBlockSlug(slug: string): string {
  let cur = slug;
  for (let i = 0; i < 8 && RENAMED_BLOCKS[cur]; i++) cur = RENAMED_BLOCKS[cur];
  return cur;
}

const strip = ({ replaces: _r, sourcePath: _s, ...b }: AuthoredBlock): BlockTemplate => b;

/**
 * Curated public catalog order — the order galleries list blocks in. (Pro
 * blocks keep their own order in the private @shavin/blocks-pro package.) A slug not listed here is placed after the last
 * block of its category, so new blocks need no entry to show up.
 */
export const BLOCK_ORDER: readonly string[] = [
  "hero-centered-media", "hero-split-media", "hero-video-statement", "features-bento-grid",
  "features-interactive-cards", "features-icon-matrix", "features-story-split",
  "pricing-three-tier", "pricing-comparison-matrix", "pricing-single-plan", "auth-signin",
  "auth-signup", "auth-forgot", "auth-verify", "auth-split-screen", "auth-sso-first",
  "auth-magic-link", "metrics-kpi-grid", "metrics-stats-bar", "metrics-trend-cards",
  "testimonials-review-grid", "testimonials-spotlight", "testimonials-logo-wall",
  "nav-header-mega-menu", "nav-sticky-appbar", "footer-columns", "footer-simple-centered",
  "footer-with-newsletter", "footer-sitemap", "footer-compact-single-row", "cta-mesh-band",
  "cta-card-subscribe", "cta-conversion-banner", "hero-mesh-type", "features-ruled-list",
  "faq-accordion-section", "testimonials-featured", "pricing-toggle", "app-shell",
  "sidebar-workspace", "sidebar-collapsible", "sidebar-standard", "sidebar-inspector",
  "sidebar-dual-resizable", "sidebar-floating", "card-feature-action", "card-article",
  "card-stat-kpi", "card-user-profile", "card-plan-inset", "settings-panel", "account-settings", "chat-ui",
  "onboarding-checklist", "sign-in-card", "commerce-product-grid", "commerce-product-detail",
];

/** Strip authoring-only fields and arrange blocks in `order` (default {@link BLOCK_ORDER}). */
export function orderBlocks(blocks: readonly AuthoredBlock[], order: readonly string[] = BLOCK_ORDER): BlockTemplate[] {
  const rank = new Map(order.map((s, i) => [s, i]));
  const out = blocks.filter((b) => rank.has(b.slug)).sort((a, b) => rank.get(a.slug)! - rank.get(b.slug)!).map(strip);
  for (const a of blocks) {
    if (rank.has(a.slug)) continue;
    let last = -1;
    out.forEach((b, i) => { if (b.category === a.category) last = i; });
    out.splice(last >= 0 ? last + 1 : out.length, 0, strip(a));
  }
  return out;
}

/**
 * Every block in this package is public (system tier). Pro-tier blocks are
 * proprietary and live in the private `@shavin/blocks-pro` package
 * (packages/blocks-pro) — `blocks:build` rejects `tier: "pro"` files here.
 */
export const AUTHORED_SYSTEM_BLOCKS: readonly AuthoredBlock[] = AUTHORED_BLOCKS;

export { AUTHORED_BLOCKS, AUTHORED_TREES };
