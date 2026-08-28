import { z } from "zod";
import {
  createEnrollmentRuleTypeSchema,
  updateEnrollmentRuleTypeSchema,
  enrollmentRuleTypeFilterSchema,
  createEnrollmentRuleSchema,
  updateEnrollmentRuleSchema,
  enrollmentRuleFilterSchema,
  enrollmentReferenceOptionsSchema,
} from "./enrollment-configuration.dto.js";

import { $Enums } from "@prisma/client";

export type EntityType = $Enums.EnrollmentEntityType;

export type EnrollmentReferenceOptions = Array<{ id: number; label: string }>;

export type CreateEnrollmentRuleTypeInput = z.infer<
  typeof createEnrollmentRuleTypeSchema
>;
export type UpdateEnrollmentRuleTypeInput = z.infer<
  typeof updateEnrollmentRuleTypeSchema
>;
export type EnrollmentRuleTypeFilterQueryInput = z.infer<
  typeof enrollmentRuleTypeFilterSchema
>;
export interface EnrollmentRuleTypeFilterParams {
  search?: string;
  isSystem?: boolean;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type CreateEnrollmentRuleInput = z.infer<
  typeof createEnrollmentRuleSchema
>;
export type UpdateEnrollmentRuleInput = z.infer<
  typeof updateEnrollmentRuleSchema
>;
export type EnrollmentRuleFilterQueryInput = z.infer<
  typeof enrollmentRuleFilterSchema
>;
export type EnrollmentReferenceOptionsQueryInput = z.infer<
  typeof enrollmentReferenceOptionsSchema
>;
export interface EnrollmentRuleFilterParams {
  search?: string;
  ruleTypeId?: number;
  entityType?: EntityType;
  courseVersionId?: number;
  programId?: number;
  targetAudienceId?: number;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

import type { Prisma, EnrollmentRuleType, EnrollmentRule } from "@prisma/client";

export type CourseVersion = Prisma.CourseVersionGetPayload<{}>;
export type LearningProgram = Prisma.LearningProgramGetPayload<{}>;
export type TargetAudience = Prisma.TargetAudienceGetPayload<{}>;

export interface IEnrollmentConfigurationRepository {
  createEnrollmentRuleType(companyId: number, data: CreateEnrollmentRuleTypeInput): Promise<EnrollmentRuleType>;
  findEnrollmentRuleTypeById(companyId: number, id: number): Promise<EnrollmentRuleType | null>;
  findEnrollmentRuleTypeByName(companyId: number, name: string): Promise<EnrollmentRuleType | null>;
  findEnrollmentRuleTypeBySlug(companyId: number, slug: string): Promise<EnrollmentRuleType | null>;
  findEnrollmentRuleTypes(companyId: number, query: EnrollmentRuleTypeFilterParams): Promise<{ data: EnrollmentRuleType[]; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  updateEnrollmentRuleType(companyId: number, id: number, data: UpdateEnrollmentRuleTypeInput): Promise<Prisma.BatchPayload>;
  softDeleteEnrollmentRuleType(companyId: number, id: number): Promise<Prisma.BatchPayload>;
  countEnrollmentRuleTypeUsages(companyId: number, id: number): Promise<number>;

  createEnrollmentRule(companyId: number, userId: number, data: CreateEnrollmentRuleInput): Promise<EnrollmentRule>;
  findEnrollmentRuleById(companyId: number, id: number): Promise<EnrollmentRule | null>;
  findEnrollmentRuleByName(companyId: number, name: string): Promise<EnrollmentRule | null>;
  findEnrollmentRules(companyId: number, query: EnrollmentRuleFilterParams): Promise<{ data: Array<EnrollmentRule & { ruleType: EnrollmentRuleType; targetAudience: TargetAudience | null }>; meta: { total: number; page: number; limit: number; totalPages: number } }>;
  updateEnrollmentRule(companyId: number, id: number, userId: number, data: UpdateEnrollmentRuleInput): Promise<Prisma.BatchPayload>;
  softDeleteEnrollmentRule(companyId: number, id: number): Promise<Prisma.BatchPayload>;
  countEnrollmentRuleUsages(companyId: number, id: number): Promise<number>;

  findCourseVersionById(companyId: number, id: number): Promise<CourseVersion | null>;
  findLearningProgramById(companyId: number, id: number): Promise<LearningProgram | null>;
  findTargetAudienceById(companyId: number, id: number): Promise<TargetAudience | null>;

  findCourseVersionOptions(companyId: number, query: { search?: string; limit?: number }): Promise<Array<{ id: number; label: string }>>;
  findLearningProgramOptions(companyId: number, query: { search?: string; limit?: number }): Promise<Array<{ id: number; label: string }>>;
}
