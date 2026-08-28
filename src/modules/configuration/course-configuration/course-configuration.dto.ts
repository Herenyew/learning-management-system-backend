import { z } from "zod";

// ==========================================
// Common Helper Schemas
// ==========================================

export const paginationQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 1))
    .refine((val) => val > 0, { message: "Page must be greater than 0" }),
  pageSize: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val > 0 && val <= 100, {
      message: "Page size must be between 1 and 100",
    }),
  search: z.string().trim().optional(),
  isActive: z
    .string()
    .optional()
    .transform((val) => (val === undefined ? undefined : val === "true")),
});

// ==========================================
// 1. Course Category DTOs
// ==========================================

export const createCourseCategorySchema = z.object({
  name: z
    .string({ message: "Category name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  slug: z.string().trim().max(120).optional(),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional(),
  color: z.string().trim().max(20).optional(),
  icon: z.string().trim().optional(),
  displayOrder: z.number().int().min(0).default(0),
  parentId: z.number().int().positive().nullable().optional(),
  isActive: z.boolean().default(true),
  isVisible: z.boolean().default(true),
});

export const updateCourseCategorySchema = createCourseCategorySchema.partial();

export const courseCategoryFilterQuerySchema = paginationQuerySchema.extend({
  parentId: z
    .string()
    .optional()
    .transform((val) => (val === "null" ? null : val ? parseInt(val, 10) : undefined)),
});

// DTO schemas only — types moved to course-configuration.types.ts

// ==========================================
// 2. Difficulty Level DTOs
// ==========================================

export const createDifficultyLevelSchema = z.object({
  code: z
    .string({ message: "Code is required" })
    .trim()
    .min(2, "Code must be at least 2 characters")
    .max(50, "Code cannot exceed 50 characters")
    .toUpperCase(),
  name: z
    .string({ message: "Difficulty name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  description: z.string().trim().max(500).optional(),
  color: z.string().trim().max(20).optional(),
  icon: z.string().trim().max(100).optional(),
  displayOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});


export const updateDifficultyLevelSchema = createDifficultyLevelSchema.partial();

export const difficultyLevelFilterQuerySchema = paginationQuerySchema;

// DTO schemas only — types moved to course-configuration.types.ts

// ==========================================
// 3. Content Type DTOs (Global System Table)
// ==========================================

export const createContentTypeSchema = z.object({
  slug: z
    .string({ message: "Slug is required" })
    .trim()
    .min(2, "Slug must be at least 2 characters")
    .max(50, "Slug cannot exceed 50 characters")
    .toLowerCase(),
  name: z
    .string({ message: "Content type name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  category: z.string({ message: "Category is required" }).trim(),
  description: z.string().trim().max(500, "Description cannot exceed 500 characters").optional(),
  icon: z.string().trim().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateContentTypeSchema = createContentTypeSchema.partial();

export const contentTypeFilterQuerySchema = paginationQuerySchema;

// DTO schemas only — types moved to course-configuration.types.ts

// ==========================================
// 4. Content File Type DTOs (Global System Table)
// ==========================================

export const createContentFileTypeSchema = z.object({
  slug: z
    .string({ message: "Slug is required" })
    .trim()
    .min(1, "Slug is required")
    .toLowerCase(),
  name: z
    .string({ message: "File type name is required" })
    .trim()
    .min(1, "Name must be at least 1 character"),
  description: z.string().trim().optional(),
  icon: z.string().trim().optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const updateContentFileTypeSchema =
  createContentFileTypeSchema.partial().extend({
    // Allow enable/disable through the standard PATCH endpoint
    isActive: z.boolean().optional(),
  });

export const contentFileTypeFilterQuerySchema = paginationQuerySchema;

// DTO schemas only — types moved to course-configuration.types.ts

// ==========================================
// 5. Course Template DTOs
// ==========================================

export const createCourseTemplateSchema = z.object({
  name: z
    .string({ message: "Template name is required" })
    .trim()
    .min(3, "Template name must be at least 3 characters")
    .max(150, "Template name cannot exceed 150 characters"),
  description: z.string().trim().optional(),
  shortSummary: z.string().trim().max(300, "Short summary cannot exceed 300 characters").optional(),
  passingScore: z.number().min(0).max(100).default(0),
  completionThreshold: z.number().min(0).max(100).default(0),
  categoryId: z.number().int().positive({ message: "Category ID must be a valid integer" }),
  difficultyLevelId: z.number().int().positive({ message: "Difficulty Level ID must be a valid integer" }),
  targetAudienceIds: z.array(z.number().int().positive()).optional().default([]),
  isActive: z.boolean().default(true),
});

export const updateCourseTemplateSchema = createCourseTemplateSchema.partial();

export const courseTemplateFilterQuerySchema = paginationQuerySchema.extend({
  categoryId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
  difficultyLevelId: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : undefined)),
});

// DTO schemas only — types moved to course-configuration.types.ts