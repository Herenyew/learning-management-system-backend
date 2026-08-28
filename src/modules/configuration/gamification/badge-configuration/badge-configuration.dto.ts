import { z } from "zod";

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const createBadgeSchema = z.object({
  name: z.string().min(1).max(150), // matches schema VarChar(150)
  description: z.string().optional().nullable(),
  iconUrl: z.string().optional().nullable(),
  badgeCategoryId: z.number().int().positive(),
  isActive: z.boolean().default(true),
});

export const updateBadgeSchema = createBadgeSchema.partial();

export const badgeFilterSchema = z.object({
  search: z.string().optional(),
  badgeCategoryId: z.coerce.number().int().positive().optional(),
  isActive: z
    .string()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined))
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export const createBadgeRuleSchema = z.object({
  triggerEventId: z.number().int().positive().nullable().optional(),
  minimumXp: z.number().int().nonnegative().nullable().optional(),
  minimumCourses: z.number().int().nonnegative().nullable().optional(),
  minimumCertificates: z.number().int().nonnegative().nullable().optional(),
  minimumPrograms: z.number().int().nonnegative().nullable().optional(),
  targetAudienceId: z.number().int().positive().nullable().optional(),
  customExpression: z.record(z.string(), z.unknown()).nullable().optional(),
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
