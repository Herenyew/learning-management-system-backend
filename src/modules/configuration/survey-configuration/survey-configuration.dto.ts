import { z } from 'zod';
import { $Enums } from '@prisma/client';

// ─── Shared: dynamic question-type configuration ───────────────────────────
// Used both on SurveyQuestionType.configJson (describes builder form fields) and
// on SurveyTemplateQuestion.configJson (stores the admin answers to those fields).
// Extensible: new question types can declare arbitrary field schemas without
// per-type hardcoding in the backend.
export const ConfigJsonSchema = z.record(z.string(), z.unknown()).nullish();

// ─── Survey Question Types ──────────────────────────────────────────────────
export const CreateSurveyQuestionTypeSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).max(80),
  description: z.string().optional(),
  configJson: ConfigJsonSchema,
  isSystem: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateSurveyQuestionTypeSchema = CreateSurveyQuestionTypeSchema.partial();

// ─── Template Questions (Dynamic Question Builder) ─────────────────────────
export const CreateSurveyTemplateQuestionSchema = z.object({
  questionTypeId: z.number().int().positive(),
  questionText: z.string().min(1).max(5000),
  isRequired: z.boolean().optional(),
  configJson: ConfigJsonSchema,
  displayOrder: z.number().int().positive().optional(),
});

export const UpdateSurveyTemplateQuestionSchema = CreateSurveyTemplateQuestionSchema.partial();

export const ReorderSurveyTemplateQuestionsSchema = z.object({
  questions: z
    .array(
      z.object({
        id: z.number().int().positive(),
        displayOrder: z.number().int().positive(),
      }),
    )
    .min(1),
});

// Inline question payload used when a template and its questions are saved together
export const TemplateQuestionInputSchema = CreateSurveyTemplateQuestionSchema.omit({
  displayOrder: true,
});

// ─── Survey Templates ───────────────────────────────────────────────────────
export const CreateSurveyTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  surveyType: z.nativeEnum($Enums.SurveyType),
  kirkpatrickLevel: z.nativeEnum($Enums.KirkpatrickLevel),
  isAnonymous: z.boolean().optional(),
  availableDays: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
  questions: z.array(TemplateQuestionInputSchema).optional(),
});

export const UpdateSurveyTemplateSchema = CreateSurveyTemplateSchema.partial();

export const QueryListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((v) => (v === 'true' ? true : v === 'false' ? false : undefined))
    .optional(),
});

// DTO schemas only — types moved to survey-configuration.types.ts
