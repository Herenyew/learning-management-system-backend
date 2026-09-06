import { z } from 'zod';

// ─── Shared: dynamic question-type configuration ───────────────────────────
// Used on SurveyQuestionType.configJson (describes builder form fields).
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
