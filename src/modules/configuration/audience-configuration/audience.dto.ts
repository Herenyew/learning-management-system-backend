import { z } from 'zod';

// ─────────────────────────────────────────────────────────
// Audience Group
// ─────────────────────────────────────────────────────────

export const createAudienceGroupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100, 'Name must be 100 characters or fewer.'),
  description: z.string().max(2000).optional(),
});

export const updateAudienceGroupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required.').max(100).optional(),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export type CreateAudienceGroupDto = z.infer<typeof createAudienceGroupSchema>;
export type UpdateAudienceGroupDto = z.infer<typeof updateAudienceGroupSchema>;

// ─────────────────────────────────────────────────────────
// Audience Group Rules
// ─────────────────────────────────────────────────────────

const ruleConditionFields = {
  departmentId: z.number().int().positive().optional(),
  jobTitleId: z.number().int().positive().optional(),
  jobLevelId: z.number().int().positive().optional(),
  appRoleId: z.number().int().positive().optional(),
  employmentTypeId: z.number().int().positive().optional(),
  hireWithinDays: z.number().int().min(0).optional(),
  
  // Rule Logic Control
  operator: z.enum(['AND', 'OR']).default('OR').optional(),
  isExclusion: z.boolean().default(false).optional(),
};

/**
 * Checks that at least one actual filtering condition is supplied,
 * ignoring control flags like operator or isExclusion.
 */
function hasAtLeastOneCondition(data: Record<string, unknown>): boolean {
  const { operator, isExclusion, ...conditions } = data;
  return Object.values(conditions).some((value) => value !== undefined && value !== null);
}

export const createAudienceGroupRuleSchema = z
  .object(ruleConditionFields)
  .refine(hasAtLeastOneCondition, {
    message:
      'At least one targeting condition (departmentId, jobTitleId, jobLevelId, appRoleId, employmentTypeId, or hireWithinDays) is required.',
  });

export const updateAudienceGroupRuleSchema = z
  .object(ruleConditionFields)
  .refine(hasAtLeastOneCondition, {
    message:
      'At least one targeting condition (departmentId, jobTitleId, jobLevelId, appRoleId, employmentTypeId, or hireWithinDays) is required.',
  });

export type CreateAudienceGroupRuleDto = z.infer<typeof createAudienceGroupRuleSchema>;
export type UpdateAudienceGroupRuleDto = z.infer<typeof updateAudienceGroupRuleSchema>;