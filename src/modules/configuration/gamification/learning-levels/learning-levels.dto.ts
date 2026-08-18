import { z } from "zod";

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

export const createLearningLevelSchema = z.object({
  name: z.string().min(1).max(255),
  minXp: z.number().int().nonnegative(),
  maxXp: z.number().int().nonnegative().nullable().optional(),
  isActive: z.boolean().default(true),
});

export const updateLearningLevelSchema = createLearningLevelSchema.partial();

export const learningLevelFilterSchema = z.object({
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined))
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
