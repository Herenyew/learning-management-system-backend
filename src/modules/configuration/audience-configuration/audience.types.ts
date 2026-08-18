import type { Prisma, AudienceGroup, AudienceGroupRule } from "@prisma/client";
import { z } from "zod";
import {
  createAudienceGroupBodySchema,
  updateAudienceGroupBodySchema,
  audienceGroupParamsSchema,
  audienceGroupRuleParamsSchema,
  matchesEmployeeParamsSchema,
  listAudienceGroupsQuerySchema,
  resolveMembersQuerySchema,
  createAudienceGroupRuleBodySchema,
  updateAudienceGroupRuleBodySchema,
} from "./audience.dto.js";

// -----------------------------------------------------------------------------
// Inferred Input Types
// -----------------------------------------------------------------------------
export type CreateAudienceGroupInput = z.infer<typeof createAudienceGroupBodySchema>;
export type UpdateAudienceGroupInput = z.infer<typeof updateAudienceGroupBodySchema>;

export type AudienceGroupParamsInput = z.infer<typeof audienceGroupParamsSchema>;
export type AudienceGroupRuleParamsInput = z.infer<typeof audienceGroupRuleParamsSchema>;
export type MatchesEmployeeParamsInput = z.infer<typeof matchesEmployeeParamsSchema>;

export type ListAudienceGroupsQueryInput = z.infer<typeof listAudienceGroupsQuerySchema>;
export type ResolveMembersQueryInput = z.infer<typeof resolveMembersQuerySchema>;

export type CreateAudienceGroupRuleInput = z.infer<typeof createAudienceGroupRuleBodySchema>;
export type UpdateAudienceGroupRuleInput = z.infer<typeof updateAudienceGroupRuleBodySchema>;

// -----------------------------------------------------------------------------
// Explicit Filter & Rule Write Interfaces
// -----------------------------------------------------------------------------
export interface AudienceGroupFilterParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface ResolveMembersFilterParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface AudienceGroupRuleWriteData {
  departmentId?: number | null;
  jobTitleId?: number | null;
  jobLevelId?: number | null;
  appRoleId?: number | null;
  employmentTypeId?: number | null;
  hireWithinDays?: number | null;
  operator?: "AND" | "OR";
  isExclusion?: boolean;
}

// -----------------------------------------------------------------------------
// Prisma Compound Payload Types
// -----------------------------------------------------------------------------
export type AudienceGroupWithRules = Prisma.AudienceGroupGetPayload<{
  include: { rules: true };
}>;

// -----------------------------------------------------------------------------
// Repository Interface Contract
// -----------------------------------------------------------------------------
export interface IAudienceRepository {
  create(companyId: number, userId: number, data: CreateAudienceGroupInput): Promise<AudienceGroup>;
  findById(audienceGroupId: number, companyId: number): Promise<AudienceGroupWithRules | null>;
  findByName(companyId: number, name: string): Promise<AudienceGroup | null>;
  findMany(companyId: number, filter: AudienceGroupFilterParams): Promise<AudienceGroup[]>;
  countMany(companyId: number, filter: AudienceGroupFilterParams): Promise<number>;
  update(audienceGroupId: number, companyId: number, userId: number, data: UpdateAudienceGroupInput): Promise<AudienceGroup>;
  softDelete(audienceGroupId: number, companyId: number): Promise<AudienceGroup>;
  findTargetUsages(audienceGroupId: number, companyId: number): Promise<{ entityType: string; entityId: number }[]>;

  createRule(audienceGroupId: number, companyId: number, data: AudienceGroupRuleWriteData): Promise<AudienceGroupRule>;
  findRuleById(ruleId: number, companyId: number): Promise<AudienceGroupRule | null>;
  updateRule(ruleId: number, companyId: number, data: AudienceGroupRuleWriteData): Promise<AudienceGroupRule>;
  deleteRule(ruleId: number, companyId: number): Promise<AudienceGroupRule>;
  findRules(audienceGroupId: number, companyId: number): Promise<AudienceGroupRule[]>;
}