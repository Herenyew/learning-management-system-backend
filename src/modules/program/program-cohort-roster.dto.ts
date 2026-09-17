import { z } from "zod";

const employeeIdSchema = z.string().trim().min(1, "employeeId is required.").max(20);

export const programCohortRosterParamsSchema = z.object({
  programId: z.coerce.number().int().positive(),
  cohortId: z.coerce.number().int().positive(),
});

export const programCohortEnrollmentParamsSchema = programCohortRosterParamsSchema.extend({
  enrollmentId: z.coerce.number().int().positive(),
});

export const createProgramCohortEnrollmentSchema = z
  .object({ employeeId: employeeIdSchema })
  .strict();

export const joinProgramCohortWaitlistSchema = createProgramCohortEnrollmentSchema;

export const programCohortWaitlistEntryParamsSchema =
  programCohortRosterParamsSchema.extend({
    entryId: z.coerce.number().int().positive(),
  });

export const bulkProgramCohortEnrollmentSchema = z
  .object({
    employeeIds: z
      .array(employeeIdSchema)
      .min(1, "At least one employeeId is required.")
      .max(500, "At most 500 employees can be enrolled in one request.")
      .refine((ids) => new Set(ids).size === ids.length, {
        message: "employeeIds must be unique.",
      }),
  })
  .strict();
