import { z } from 'zod';

// ──────────────────────────────────────────────────────────────
//  Utility – at least one targeting condition exists
// ──────────────────────────────────────────────────────────────

function hasAtLeastOneCondition(data: Record<string, unknown>): boolean {
  const { operator, isExclusion, ...conditions } = data;
  return Object.values(conditions).some(
    (value) => value !== undefined && value !== null
  );
}

// ──────────────────────────────────────────────────────────────
//  AUDIENCE GROUP – BODY SCHEMAS
// ──────────────────────────────────────────────────────────────

export const createAudienceGroupBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100, 'Name must be 100 characters or fewer.'),
  description: z.string().max(2000).optional(),
});

export const updateAudienceGroupBodySchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100).optional(),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export type CreateAudienceGroupBodyDto = z.infer<typeof createAudienceGroupBodySchema>;
export type UpdateAudienceGroupBodyDto = z.infer<typeof updateAudienceGroupBodySchema>;

// ──────────────────────────────────────────────────────────────
//  AUDIENCE GROUP – PARAMS SCHEMAS
// ──────────────────────────────────────────────────────────────

export const audienceGroupParamsSchema = z.object({
  id: z.coerce.number().int().positive('Audience group ID must be a positive integer.'),
});

export const audienceGroupRuleParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  ruleId: z.coerce.number().int().positive(),
});

export const matchesEmployeeParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
  employeeId: z.string().min(1, 'Employee ID is required.'),
});

export type AudienceGroupParamsDto = z.infer<typeof audienceGroupParamsSchema>;
export type AudienceGroupRuleParamsDto = z.infer<typeof audienceGroupRuleParamsSchema>;
export type MatchesEmployeeParamsDto = z.infer<typeof matchesEmployeeParamsSchema>;

// ──────────────────────────────────────────────────────────────
//  AUDIENCE GROUP – QUERY SCHEMAS
// ──────────────────────────────────────────────────────────────

export const listAudienceGroupsQuerySchema = z.object({
  search: z.string().optional(),
  isActive: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const resolveMembersQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export type ListAudienceGroupsQueryDto = z.infer<typeof listAudienceGroupsQuerySchema>;
export type ResolveMembersQueryDto = z.infer<typeof resolveMembersQuerySchema>;

// ──────────────────────────────────────────────────────────────
//  RULES – BODY SCHEMAS
// ──────────────────────────────────────────────────────────────

const ruleConditionFields = {
  departmentId: z.number().int().positive().optional(),
  jobTitleId: z.number().int().positive().optional(),
  jobLevelId: z.number().int().positive().optional(),
  appRoleId: z.number().int().positive().optional(),
  employmentTypeId: z.number().int().positive().optional(),
  hireWithinDays: z.number().int().min(0).optional(),
  operator: z.enum(['AND', 'OR']).default('OR').optional(),
  isExclusion: z.boolean().default(false).optional(),
};

export const createAudienceGroupRuleBodySchema = z
  .object(ruleConditionFields)
  .refine(hasAtLeastOneCondition, {
    message:
      'At least one targeting condition (departmentId, jobTitleId, jobLevelId, appRoleId, employmentTypeId, or hireWithinDays) is required.',
  });

export const updateAudienceGroupRuleBodySchema = z
  .object(ruleConditionFields)
  .partial()
  .refine(hasAtLeastOneCondition, {
    message:
      'At least one targeting condition (departmentId, jobTitleId, jobLevelId, appRoleId, employmentTypeId, or hireWithinDays) is required for update.',
  });

export type CreateAudienceGroupRuleBodyDto = z.infer<typeof createAudienceGroupRuleBodySchema>;
export type UpdateAudienceGroupRuleBodyDto = z.infer<typeof updateAudienceGroupRuleBodySchema>;