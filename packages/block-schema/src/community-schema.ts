import { z } from "zod";
import { BlockCategorySchema, BlockNodeSchema, BlockTierSchema } from "./schema";
import type { BlockNode } from "./types";

export const VerificationStatusSchema = z.enum([
  "official_verified",
  "community_creator",
  "enterprise_pro",
  "nominated_candidate",
]);
export type VerificationStatus = z.infer<typeof VerificationStatusSchema>;

export const AuthorBadgeSchema = z.enum([
  "core_maintainer",
  "top_contributor",
  "design_qa_expert",
  "verified_creator",
  "community_pioneer",
]);
export type AuthorBadge = z.infer<typeof AuthorBadgeSchema>;

export const AuthorProfileSchema = z.object({
  username: z.string().min(1),
  name: z.string().min(1),
  avatar: z.string().min(1),
  bio: z.string().optional(),
  website: z.string().optional(),
  github: z.string().optional(),
  badges: z.array(AuthorBadgeSchema).default([]),
  totalForks: z.number().int().nonnegative().default(0),
  totalUpvotes: z.number().int().nonnegative().default(0),
  publishedCount: z.number().int().nonnegative().default(0),
  joinedAt: z.string().default("2026-01-01"),
});
export type AuthorProfile = z.infer<typeof AuthorProfileSchema>;

export const QualityGateRuleResultSchema = z.object({
  id: z.string(),
  name: z.string(),
  category: z.enum(["token_purity", "accessibility", "concentric_geometry", "security_sandboxing"]),
  passed: z.boolean(),
  score: z.number().min(0).max(100),
  message: z.string(),
  details: z.array(z.string()).optional(),
});
export type QualityGateRuleResult = z.infer<typeof QualityGateRuleResultSchema>;

export const QualityGateReportSchema = z.object({
  passed: z.boolean(),
  overallScore: z.number().min(0).max(100),
  tokenPurityScore: z.number().min(0).max(100),
  a11yScore: z.number().min(0).max(100),
  geometryScore: z.number().min(0).max(100),
  securityScore: z.number().min(0).max(100),
  rules: z.array(QualityGateRuleResultSchema),
  evaluatedAt: z.string(),
  verifiedBadgeEligible: z.boolean(),
});
export type QualityGateReport = z.infer<typeof QualityGateReportSchema>;

export const CommunityBlockManifestSchema = z.object({
  $schema: z.string().default("https://shavin.cc/schema/v1/block.json"),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  description: z.string().min(1),
  category: BlockCategorySchema,
  tier: BlockTierSchema.default("community"),
  verificationStatus: VerificationStatusSchema.default("community_creator"),
  author: AuthorProfileSchema,
  version: z.string().default("1.0.0"),
  dependencies: z.array(z.string()).default([]),
  npmDependencies: z.record(z.string()).default({ "@phosphor-icons/react": "^2.1.7" }),
  tags: z.array(z.string()).default([]),
  upvotes: z.number().int().nonnegative().default(0),
  forks: z.number().int().nonnegative().default(0),
  views: z.number().int().nonnegative().default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
  rawCode: z.string().optional(),
  thumbnailUrl: z.string().optional(),
  tree: z.array(BlockNodeSchema).optional(),
  qualityGate: QualityGateReportSchema.optional(),
  files: z
    .array(
      z.object({
        name: z.string(),
        targetPath: z.string(),
        content: z.string(),
      })
    )
    .optional(),
});
export type CommunityBlockManifest = z.infer<typeof CommunityBlockManifestSchema>;

export const DiscussionCategorySchema = z.enum([
  "radix_a11y",
  "token_palettes",
  "builder_extensibility",
  "showcase_feedback",
  "general",
]);
export type DiscussionCategory = z.infer<typeof DiscussionCategorySchema>;

export const DiscussionReplySchema = z.object({
  id: z.string().min(1),
  author: AuthorProfileSchema,
  content: z.string().min(1),
  codeSnippet: z.string().optional(),
  upvotes: z.number().int().nonnegative().default(0),
  isAcceptedSolution: z.boolean().default(false),
  createdAt: z.string(),
});
export type DiscussionReply = z.infer<typeof DiscussionReplySchema>;

export const DiscussionThreadSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  slug: z.string().min(1),
  category: DiscussionCategorySchema,
  author: AuthorProfileSchema,
  content: z.string().min(1),
  codeSnippet: z.string().optional(),
  tags: z.array(z.string()).default([]),
  upvotes: z.number().int().nonnegative().default(0),
  views: z.number().int().nonnegative().default(0),
  replies: z.array(DiscussionReplySchema).default([]),
  resolved: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type DiscussionThread = z.infer<typeof DiscussionThreadSchema>;

/**
 * Migration transformer for older AST versions to current BlockNode spec.
 */
export function migrateBlockNode(node: any, fromVersion: number = 1, toVersion: number = 1): BlockNode {
  if (!node || typeof node !== "object") {
    return {
      id: `migrated-${Math.random().toString(36).slice(2, 9)}`,
      type: "div",
      props: {},
    };
  }

  const migrated: BlockNode = {
    id: node.id || `node-${Math.random().toString(36).slice(2, 9)}`,
    type: node.type || "div",
    props: typeof node.props === "object" && node.props !== null ? { ...node.props } : {},
  };

  if (node.text) migrated.text = String(node.text);
  if (node.parentId) migrated.parentId = String(node.parentId);

  if (Array.isArray(node.children)) {
    migrated.children = node.children.map((child: any) =>
      migrateBlockNode(child, fromVersion, toVersion)
    );
  }

  return migrated;
}
