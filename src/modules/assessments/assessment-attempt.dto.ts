import { z } from "zod";

export const assessmentIdSchema = z.coerce.number().int().positive();
export const attemptIdSchema = z.coerce.number().int().positive();
export const questionVersionIdSchema = z.coerce.number().int().positive();
export const answerIdSchema = z.coerce.number().int().positive();

export const startAttemptSchema = z
  .object({ enrollmentId: z.coerce.number().int().positive() })
  .strict();

const optionAnswerSchema = z
  .object({ optionIds: z.array(z.coerce.number().int().positive()).min(1) })
  .strict();
const blankAnswerSchema = z
  .object({
    blanks: z
      .array(
        z
          .object({
            blankIndex: z.coerce.number().int().min(0),
            typedText: z.string().max(10_000),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
const matchAnswerSchema = z
  .object({
    matches: z
      .array(
        z
          .object({
            leftPairId: z.coerce.number().int().positive(),
            rightPairId: z.coerce.number().int().positive(),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();
const textAnswerSchema = z
  .object({ answerText: z.string().trim().min(1).max(100_000) })
  .strict();

export const saveAnswerSchema = z.union([
  optionAnswerSchema,
  blankAnswerSchema,
  matchAnswerSchema,
  textAnswerSchema,
]);

export const submitAttemptSchema = z.object({}).strict();

export const listSubmittedAttemptsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
  })
  .strict();

export const gradeAnswerSchema = z
  .object({
    awardedMarks: z.coerce.number().min(0),
  })
  .strict();

export type StartAttemptInput = z.infer<typeof startAttemptSchema>;
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;
export type GradeAnswerInput = z.infer<typeof gradeAnswerSchema>;
