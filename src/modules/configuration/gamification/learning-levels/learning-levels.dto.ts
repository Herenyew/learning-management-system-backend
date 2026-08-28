import { z } from "zod";

export const idParamSchema = z.object({ id: z.coerce.number().int().positive() });

// Field names mirror the LearningLevel Prisma model (minimumXp / maximumXp)
// so repository writes never diverge from the database columns.
export const createLearningLevelSchema = z.object({
  name: z.string().min(1).max(255),
  minimumXp: z.number().int().nonnegative(),
  maximumXp: z.number().int().nonnegative().nullable().optional(),
  badgeColor: z.string().max(30).nullable().optional(),
  displayOrder: z.number().int().positive().optional(),
});

export const updateLearningLevelSchema = createLearningLevelSchema.partial();

export const learningLevelFilterSchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});
