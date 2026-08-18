import { z } from 'zod';
import { $Enums } from '@prisma/client';

export const CreateSurveyQuestionTypeSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).max(80),
  description: z.string().optional(),
  isSystem: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateSurveyQuestionTypeSchema = CreateSurveyQuestionTypeSchema.partial();

export const CreateSurveyTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  surveyType: z.nativeEnum($Enums.SurveyType),
  kirkpatrickLevel: z.nativeEnum($Enums.KirkpatrickLevel),
  isAnonymous: z.boolean().optional(),
  availableDays: z.number().int().positive().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateSurveyTemplateSchema = CreateSurveyTemplateSchema.partial();

export const QueryListSchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined))
    .optional(),
});

// DTO schemas only — types moved to survey-configuration.types.ts
