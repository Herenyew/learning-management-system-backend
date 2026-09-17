import { z } from "zod";

export const programSurveyParamsSchema = z.object({
  programEnrollmentId: z.coerce.number().int().positive(),
  surveyId: z.coerce.number().int().positive(),
}).strict();

const answerSchema = z.object({
  questionId: z.coerce.number().int().positive(),
  ratingValue: z.coerce.number().int().min(1).max(10).nullable().optional(),
  selectedOption: z.string().trim().min(1).max(500).nullable().optional(),
  textAnswer: z.string().trim().min(1).max(10000).nullable().optional(),
}).strict().superRefine((answer, ctx) => {
  const populated = [answer.ratingValue, answer.selectedOption, answer.textAnswer]
    .filter((value) => value !== undefined && value !== null).length;
  if (populated !== 1) {
    ctx.addIssue({
      code: "custom",
      message: "Each answer must provide exactly one response value.",
    });
  }
});

export const submitProgramSurveySchema = z.object({
  answers: z.array(answerSchema).min(1).max(200).superRefine((answers, ctx) => {
    if (new Set(answers.map((answer) => answer.questionId)).size !== answers.length) {
      ctx.addIssue({ code: "custom", message: "Each survey question may be answered once." });
    }
  }),
}).strict();

export type SubmitProgramSurveyInput = z.infer<typeof submitProgramSurveySchema>;
