import { z } from 'zod';

// ─────────────────────────────────────────────────────────
// Audience Group
// ─────────────────────────────────────────────────────────

export const createAudienceGroupSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(100, 'Name must be 100 characters or fewer.'),
  description: z.string().max(2000).optional(),
});

export const updateAudienceGroupSchema = z.object({
  name: z.string().min(1, 'Name is required.').max(100).optional(),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().optional(),
});

export type CreateAudienceGroupDto = z.infer<typeof createAudienceGroupSchema>;
export type UpdateAudienceGroupDto = z.infer<typeof updateAudienceGroupSchema>;

// ─────────────────────────────────────────────────────────
// Audience Group Rule
//
// At least one matching condition must be provided — otherwise an
// empty rule ({}) would match every employee in the company. This
// mirrors the service-layer validateRule() check; enforcing it here
// too means a malformed request is rejected at the validation
// middleware stage (422, before it ever reaches the service), rather
// than only inside business logic.
// ─────────────────────────────────────────────────────────

const ruleConditionFields = {
  departmentId: z.number().int().positive().optional(),
  jobTitleId: z.number().int().positive().optional(),
  jobLevelId: z.number().int().positive().optional(),
  appRoleId: z.number().int().positive().optional(),
  employmentType: z.string().max(20).optional(),
  hireWithinDays: z.number().int().min(0).optional(),
};

function hasAtLeastOneCondition(data: Record<string, unknown>): boolean {
  return Object.values(data).some((value) => value !== undefined && value !== null);
}

export const createAudienceGroupRuleSchema = z
  .object(ruleConditionFields)
  .refine(hasAtLeastOneCondition, {
    message:
      'At least one of departmentId, jobTitleId, jobLevelId, appRoleId, employmentType, or hireWithinDays is required.',
  });

export const updateAudienceGroupRuleSchema = z
  .object(ruleConditionFields)
  .refine(hasAtLeastOneCondition, {
    message:
      'At least one of departmentId, jobTitleId, jobLevelId, appRoleId, employmentType, or hireWithinDays is required.',
  });

export type CreateAudienceGroupRuleDto = z.infer<typeof createAudienceGroupRuleSchema>;
export type UpdateAudienceGroupRuleDto = z.infer<typeof updateAudienceGroupRuleSchema>;