import { z } from "zod";
import { $Enums } from "@prisma/client";

// Param validation schema for numeric ID endpoints
export const idParamSchema = z.object({
  id: z.coerce.number().int().positive("ID must be a positive integer"),
});

export const EntityTypeEnum = z.nativeEnum($Enums.EnrollmentEntityType);

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

// DTO schemas only — types moved to enrollment-configuration.types.ts

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
        return !data.programId;
      }
      if (data.entityType === $Enums.EnrollmentEntityType.PROGRAM) {
        return !data.courseVersionId;
      }
      return false;
    },
    {
      message:
        "entityType must be COURSE or PROGRAM, and courseVersionId/programId cannot be mixed.",
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

// Query schema for the lightweight reference-option endpoints used to populate
// the Course Version / Learning Program dropdowns (search by display name).
export const enrollmentReferenceOptionsSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
});

// DTO schemas only — types moved to enrollment-configuration.types.ts