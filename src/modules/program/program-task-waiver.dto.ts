import { z } from "zod";

export const programTaskWaiverParamsSchema = z
  .object({
    programId: z.coerce.number().int().positive(),
    enrollmentId: z.coerce.number().int().positive(),
    taskId: z.coerce.number().int().positive(),
  })
  .strict();

export const waiveProgramTaskSchema = z
  .object({
    reason: z.string().trim().min(1).max(10_000),
  })
  .strict();

export type ProgramTaskWaiverParams = z.infer<typeof programTaskWaiverParamsSchema>;
export type WaiveProgramTaskInput = z.infer<typeof waiveProgramTaskSchema>;
