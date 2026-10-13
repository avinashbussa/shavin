import { z } from "zod";

export const BlockCategorySchema = z.enum([
  "hero",
  "features",
  "pricing",
  "auth",
  "metrics",
  "testimonials",
  "navigation",
  "footer",
  "cta",
  "content",
  "dashboard",
  "commerce",
]);

export const BlockTierSchema = z.enum(["system", "community", "pro"]);

export const BlockPropTypeSchema = z.enum([
  "string",
  "number",
  "boolean",
  "select",
  "color",
  "icon",
  "spacing",
  "radius",
]);

export const BlockPropDefinitionSchema = z.object({
  name: z.string().min(1),
  type: BlockPropTypeSchema,
  label: z.string().optional(),
  description: z.string().optional(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  options: z.union([z.array(z.string()), z.array(z.object({ label: z.string(), value: z.string() }))]).optional(),
  category: z.enum(["layout", "appearance", "typography", "content", "advanced"]).optional(),
});

export const BlockNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: z.string().min(1),
    type: z.string().min(1),
    props: z.record(z.union([z.string(), z.number(), z.boolean()])),
    children: z.array(BlockNodeSchema).optional(),
    parentId: z.string().nullable().optional(),
    text: z.string().optional(),
  })
);

export const SpatialBoundsSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number().positive(),
  height: z.number().positive(),
});

export const SpatialFrameSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  bounds: SpatialBoundsSchema,
  presetDevice: z.enum(["block", "desktop", "tablet", "mobile"]).optional(),
  rootNodes: z.array(BlockNodeSchema),
  themeScope: z
    .object({
      accentColor: z.string().optional(),
      grayColor: z.string().optional(),
      radius: z.string().optional(),
      scaling: z.number().optional(),
      panelBackground: z.enum(["solid", "translucent"]).optional(),
    })
    .optional(),
});

export const BlockTemplateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1),
  category: BlockCategorySchema,
  tier: BlockTierSchema.default("community"),
  dependencies: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  rawCode: z.string().min(1),
  tree: z.array(BlockNodeSchema).optional(),
  previewUrl: z.string().optional(),
  author: z.string().optional(),
  version: z.string().default("0.1.0"),
});

export const BlockProjectSchema = z.object({
  schemaVersion: z.number().int().min(1).default(1),
  id: z.string().min(1),
  name: z.string().min(1),
  frames: z.array(SpatialFrameSchema),
  viewport: z.object({
    x: z.number(),
    y: z.number(),
    zoom: z.number().positive(),
  }),
  updatedAt: z.string(),
});

/**
 * Validates a block template against the official schema.
 */
export function validateBlockTemplate(data: unknown) {
  return BlockTemplateSchema.parse(data);
}

/**
 * Safe parser for block template that returns success boolean and errors.
 */
export function safeValidateBlockTemplate(data: unknown) {
  return BlockTemplateSchema.safeParse(data);
}

/**
 * Validates a multi-frame project against the official schema.
 */
export function validateBlockProject(data: unknown) {
  return BlockProjectSchema.parse(data);
}
