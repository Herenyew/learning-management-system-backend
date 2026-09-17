import { z } from "zod";

export const enrollmentIdSchema = z.coerce.number().int().positive();
export const contentIdSchema = z.coerce.number().int().positive();
export const sessionIdSchema = z.coerce.number().int().positive();

export const updateContentProgressSchema = z
  .object({
    status: z.enum(["NOT_STARTED", "IN_PROGRESS", "COMPLETED"]),
    watchPercentage: z.coerce.number().min(0).max(100).nullable().optional(),
    lastPositionSeconds: z.coerce.number().int().min(0).nullable().optional(),
    timeSpentMinutes: z.coerce.number().int().min(0).optional(),
  })
  .strict();

export const startLearningSessionSchema = z
  .object({
    deviceType: z.string().trim().min(1).max(30).optional(),
  })
  .strict();

export const endLearningSessionSchema = z
  .object({
    totalSeconds: z.coerce.number().int().min(0).optional(),
  })
  .strict();

export type UpdateContentProgressInput = z.infer<typeof updateContentProgressSchema>;
export type StartLearningSessionInput = z.infer<typeof startLearningSessionSchema>;
export type EndLearningSessionInput = z.infer<typeof endLearningSessionSchema>;
