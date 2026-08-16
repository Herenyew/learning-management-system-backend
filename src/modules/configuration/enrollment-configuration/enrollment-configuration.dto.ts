import { z } from "zod";
import { $Enums } from "@prisma/client";

// Param validation schema for numeric ID endpoints
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("ID must be a positive integer"),
});

export const EntityTypeEnum = z.nativeEnum($Enums.EnrollmentEntityType);
export type EntityType = $Enums.EnrollmentEntityType;

// ==========================================
// 1. EnrollmentRuleType Schemas
// ==========================================

export const createEnrollmentRuleTypeSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  slug: z.string().min(2).max(80).optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().default(true),
});

export const updateEnrollmentRuleTypeSchema = createEnrollmentRuleTypeSchema
  .partial();

export const enrollmentRuleTypeFilterSchema = z.object({
  search: z.string().optional(),
  isSystem: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateEnrollmentRuleTypeInputDto = z.infer<
  typeof createEnrollmentRuleTypeSchema
>;
export type UpdateEnrollmentRuleTypeInputDto = z.infer<
  typeof updateEnrollmentRuleTypeSchema
>;
export type EnrollmentRuleTypeFilterQueryDto = z.infer<
  typeof enrollmentRuleTypeFilterSchema
>;

// ==========================================
// 2. EnrollmentRule Schemas
// ==========================================

export const createEnrollmentRuleSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters").max(255),
    description: z.string().max(1000).optional(),
    entityType: EntityTypeEnum,
    courseVersionId: z.number().int().positive().nullable().optional(),
    programId: z.number().int().positive().nullable().optional(),
    ruleTypeId: z.number().int().positive("Rule Type ID is required"),
    priority: z.number().int().nonnegative().default(1),
    isActive: z.boolean().default(true),
    targetAudienceId: z.number().int().positive().nullable().optional(),
    conditionExpression: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.entityType === $Enums.EnrollmentEntityType.COURSE) {
        return !!data.courseVersionId && !data.programId;
      }
      if (data.entityType === $Enums.EnrollmentEntityType.PROGRAM) {
        return !!data.programId && !data.courseVersionId;
      }
      return false;
    },
    {
      message:
        "When entityType is COURSE_VERSION, courseVersionId is required and programId must be empty. When entityType is PROGRAM, programId is required and courseVersionId must be empty.",
      path: ["entityType"],
    }
  );

export const updateEnrollmentRuleSchema = z
  .object({
    name: z.string().min(2).max(255).optional(),
    description: z.string().max(1000).nullable().optional(),
    entityType: EntityTypeEnum.optional(),
    courseVersionId: z.number().int().positive().nullable().optional(),
    programId: z.number().int().positive().nullable().optional(),
    ruleTypeId: z.number().int().positive().optional(),
    priority: z.number().int().nonnegative().optional(),
    isActive: z.boolean().optional(),
    targetAudienceId: z.number().int().positive().nullable().optional(),
    conditionExpression: z.record(z.string(), z.unknown()).nullable().optional(),
  })
  .refine(
    (data) => {
      if (
        data.entityType === $Enums.EnrollmentEntityType.COURSE &&
        data.programId
      ) {
        return false;
      }
      if (
        data.entityType === $Enums.EnrollmentEntityType.PROGRAM &&
        data.courseVersionId
      ) {
        return false;
      }
      return true;
    },
    {
      message:
        "Cannot specify programId when entityType is COURSE_VERSION, or courseVersionId when entityType is PROGRAM.",
      path: ["entityType"],
    }
  );

export const enrollmentRuleFilterSchema = z.object({
  search: z.string().optional(),
  ruleTypeId: z.coerce.number().int().positive().optional(),
  entityType: EntityTypeEnum.optional(),
  courseVersionId: z.coerce.number().int().positive().optional(),
  programId: z.coerce.number().int().positive().optional(),
  targetAudienceId: z.coerce.number().int().positive().optional(),
  isActive: z
    .string()
    .transform((val) => val === "true")
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateEnrollmentRuleInputDto = z.infer<
  typeof createEnrollmentRuleSchema
>;
export type UpdateEnrollmentRuleInputDto = z.infer<
  typeof updateEnrollmentRuleSchema
>;
export type EnrollmentRuleFilterQueryDto = z.infer<
  typeof enrollmentRuleFilterSchema
>;