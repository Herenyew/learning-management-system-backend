import { z } from "zod";

// Helper function to turn strings into URL-safe slugs
export const slugify = (str: string): string =>
  str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
    
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// ==========================================
// 1. TnaRequestTypeConfig Schemas & DTOs
// ==========================================

export const CreateTnaRequestTypeSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});

export const UpdateTnaRequestTypeSchema = CreateTnaRequestTypeSchema.partial();


export const TnaRequestTypeFilterSchema = z.object({
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

// DTO schemas only — types moved to tna-configuration.types.ts

// ==========================================
// 2. FundingType Schemas & DTOs
// ==========================================

export const CreateFundingTypeSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().max(80).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});


export const UpdateFundingTypeSchema = CreateFundingTypeSchema.partial();


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
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

// DTO schemas only — types moved to tna-configuration.types.ts

// ==========================================
// 3. TrainingFormat Schemas & DTOs
// ==========================================

export const CreateTrainingFormatSchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().max(80).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional().default(true),
});


export const UpdateTrainingFormatSchema = CreateTrainingFormatSchema.partial();


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
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(10),
});

// DTO schemas only — types moved to tna-configuration.types.ts
