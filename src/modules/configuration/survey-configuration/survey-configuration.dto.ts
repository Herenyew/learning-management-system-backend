import { z } from 'zod';

export const CreateSurveyQuestionTypeSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  description: z.string().optional(),
  isSystem: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const UpdateSurveyQuestionTypeSchema = CreateSurveyQuestionTypeSchema.partial();

export const CreateSurveyTemplateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  defaultQuestions: z.array(z.any()).optional(),
  isActive: z.boolean().optional(),
});

export const UpdateSurveyTemplateSchema = CreateSurveyTemplateSchema.partial();

export const QueryListSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
  search: z.string().optional(),
  isActive: z.boolean().optional(),
});

export type CreateSurveyQuestionTypeDto = z.infer<typeof CreateSurveyQuestionTypeSchema>;
export type UpdateSurveyQuestionTypeDto = z.infer<typeof UpdateSurveyQuestionTypeSchema>;
export type CreateSurveyTemplateDto = z.infer<typeof CreateSurveyTemplateSchema>;
export type UpdateSurveyTemplateDto = z.infer<typeof UpdateSurveyTemplateSchema>;
