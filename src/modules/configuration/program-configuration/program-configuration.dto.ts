import { z } from "zod";
import { $Enums } from "@prisma/client";

// ==========================================
// Base & Utility Schemas
// ==========================================

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(10),
  search: z.string().optional(),
  isActive: z
    .string()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined))
    .optional(),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

// Re-using native Prisma enums via $Enums
export const TaskSubmissionTypeEnum = z.nativeEnum($Enums.TaskSubmissionType);
export const TaskLinkedEntityEnum = z.nativeEnum($Enums.TaskLinkedEntity);
export const VisibilityTypeEnum = z.nativeEnum($Enums.VisibilityType);

// ==========================================
// 1. ProgramType Schemas
// ==========================================

export const createProgramTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateProgramTypeSchema = createProgramTypeSchema.partial();

export const programTypeQuerySchema = paginationQuerySchema;

// ==========================================
// 2. ProgramCategory Schemas
// ==========================================

export const createProgramCategorySchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().optional().nullable(),
  color: z.string().max(20).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateProgramCategorySchema = createProgramCategorySchema.partial();

export const programCategoryQuerySchema = paginationQuerySchema;

// ==========================================
// 3. TaskType Schemas
// ==========================================

export const createTaskTypeSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  slug: z.string().max(80).optional(), // Auto-generated if omitted
  description: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
  expectedSubmissionType: TaskSubmissionTypeEnum,
  linkedEntity: TaskLinkedEntityEnum,
  isActive: z.boolean().optional().default(true),
});

export const updateTaskTypeSchema = createTaskTypeSchema.partial();

export const taskTypeQuerySchema = paginationQuerySchema.extend({
  isSystem: z
    .string()
    .transform((val) => (val === "true" ? true : val === "false" ? false : undefined))
    .optional(),
});

// ==========================================
// 4. ProgramTemplate Schemas
// ==========================================

export const createProgramTemplateSchema = z.object({
  name: z.string().min(1, "Name is required").max(255),
  description: z.string().optional().nullable(),
  categoryId: z.number().int().positive().optional().nullable(),
  programTypeId: z.number().int().positive().optional().nullable(),
  durationWeeks: z.number().int().nonnegative().optional().nullable(),
  visibility: VisibilityTypeEnum.optional().default($Enums.VisibilityType.COMPANY),
  isMandatory: z.boolean().optional().default(false),
  autoEnroll: z.boolean().optional().default(false),
  allowSelfEnrollment: z.boolean().optional().default(true),
  rollingEnrollment: z.boolean().optional().default(false),
  capacity: z.number().int().positive().optional().nullable(),
  certificateEnabled: z.boolean().optional().default(true),
  xpEnabled: z.boolean().optional().default(true),
  // Milestones represented as an array of free-form objects with string keys
  defaultMilestones: z.array(z.record(z.string(), z.unknown())).optional().nullable(),
  isActive: z.boolean().optional().default(true),
});

export const updateProgramTemplateSchema = createProgramTemplateSchema.partial();

export const programTemplateQuerySchema = paginationQuerySchema.extend({
  categoryId: z.coerce.number().int().positive().optional(),
  programTypeId: z.coerce.number().int().positive().optional(),
});

// ==========================================
// Infer TypeScript Types
// ==========================================

export type PaginationQueryInput = z.infer<typeof paginationQuerySchema>;

export type CreateProgramTypeInput = z.infer<typeof createProgramTypeSchema>;
export type UpdateProgramTypeInput = z.infer<typeof updateProgramTypeSchema>;
export type ProgramTypeQueryInput = z.infer<typeof programTypeQuerySchema>;

export type CreateProgramCategoryInput = z.infer<typeof createProgramCategorySchema>;
export type UpdateProgramCategoryInput = z.infer<typeof updateProgramCategorySchema>;
export type ProgramCategoryQueryInput = z.infer<typeof programCategoryQuerySchema>;

export type CreateTaskTypeInput = z.infer<typeof createTaskTypeSchema>;
export type UpdateTaskTypeInput = z.infer<typeof updateTaskTypeSchema>;
export type TaskTypeQueryInput = z.infer<typeof taskTypeQuerySchema>;

export type CreateProgramTemplateInput = z.infer<typeof createProgramTemplateSchema>;
export type UpdateProgramTemplateInput = z.infer<typeof updateProgramTemplateSchema>;
export type ProgramTemplateQueryInput = z.infer<typeof programTemplateQuerySchema>;