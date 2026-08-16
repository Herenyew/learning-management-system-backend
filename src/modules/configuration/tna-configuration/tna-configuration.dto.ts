import { z } from "zod";

// Helper function to turn strings into URL-safe slugs
export const slugify = (str: string): string =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

// ==========================================
// 1. TnaRequestTypeConfig Schemas & DTOs
// ==========================================

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const CreateTnaRequestTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateTnaRequestTypeDto = z.infer<typeof CreateTnaRequestTypeSchema>;

export const UpdateTnaRequestTypeSchema = CreateTnaRequestTypeSchema.partial();

export type UpdateTnaRequestTypeDto = z.infer<typeof UpdateTnaRequestTypeSchema>;

export const TnaRequestTypeFilterSchema = z.object({
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  page: z.string().transform(Number).optional().default(1),
  limit: z.string().transform(Number).optional().default(10),
});

export type TnaRequestTypeFilterDto = z.infer<typeof TnaRequestTypeFilterSchema>;

// ==========================================
// 2. FundingType Schemas & DTOs
// ==========================================

export const CreateFundingTypeSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().max(80).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateFundingTypeDto = z.infer<typeof CreateFundingTypeSchema>;

export const UpdateFundingTypeSchema = CreateFundingTypeSchema.partial();

export type UpdateFundingTypeDto = z.infer<typeof UpdateFundingTypeSchema>;

export const FundingTypeFilterSchema = z.object({
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  isSystem: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  page: z.string().transform(Number).optional().default(1),
  limit: z.string().transform(Number).optional().default(10),
});

export type FundingTypeFilterDto = z.infer<typeof FundingTypeFilterSchema>;

// ==========================================
// 3. TrainingFormat Schemas & DTOs
// ==========================================

export const CreateTrainingFormatSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().max(80).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export type CreateTrainingFormatDto = z.infer<typeof CreateTrainingFormatSchema>;

export const UpdateTrainingFormatSchema = CreateTrainingFormatSchema.partial();

export type UpdateTrainingFormatDto = z.infer<typeof UpdateTrainingFormatSchema>;

export const TrainingFormatFilterSchema = z.object({
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  isSystem: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  page: z.string().transform(Number).optional().default(1),
  limit: z.string().transform(Number).optional().default(10),
});

export type TrainingFormatFilterDto = z.infer<typeof TrainingFormatFilterSchema>;