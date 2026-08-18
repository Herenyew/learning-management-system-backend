import { z } from "zod";

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const createXpRuleSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  categoryId: z.number().int().positive(),
  triggerEventId: z.number().int().positive(),
  xpAmount: z.number().int().positive(),
  isActive: z.boolean().default(true),
});

export const updateXpRuleSchema = createXpRuleSchema.partial();

export const xpRuleFilterSchema = z.object({
  search: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  triggerEventId: z.coerce.number().int().positive().optional(),
  isActive: z
    .string()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined))
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

// Do not export inferred types here
