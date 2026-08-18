import { z } from "zod";

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const createBadgeSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  categoryId: z.number().int().positive().optional(),
  isActive: z.boolean().default(true),
});

export const updateBadgeSchema = createBadgeSchema.partial();

export const badgeFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  isActive: z
    .string()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined))
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createBadgeRuleSchema = z.object({
  code: z.string().min(1).max(100),
  description: z.string().optional(),
  condition: z.record(z.string(), z.any()),
  isActive: z.boolean().default(true),
});

export const updateBadgeRuleSchema = createBadgeRuleSchema.partial();

export const badgeRuleFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  isActive: z
    .string()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined))
    .optional(),
});
