import { z } from "zod";
import { WorkflowEntityType } from "@prisma/client";

// ──────────────────────────────────────────────────────────────
// 1. Approval Workflow Step Schemas (declared first — referenced
//    by the workflow schema below)
// ──────────────────────────────────────────────────────────────

export const createApprovalWorkflowStepSchema = z
  .object({
    approvalOrder: z.number().int().positive(),
    approverRoleId: z.number().int().positive().optional(),
    approverEmployeeId: z.string().trim().min(1).max(20).optional(),
    isRequired: z.boolean().default(true).optional(),
    autoApprove: z.boolean().default(false).optional(),
    timeoutDays: z.number().int().positive().optional(),
  })
  .refine(
    (data) => {
      // Step must define a valid approval mechanism unless autoApprove is true
      if (data.autoApprove) return true;
      return !!data.approverRoleId || !!data.approverEmployeeId;
    },
    {
      message:
        "Step must have an approverRoleId or approverEmployeeId unless autoApprove is true.",
    }
  );

export const updateApprovalWorkflowStepSchema = z
  .object({
    approvalOrder: z.number().int().positive().optional(),
    approverRoleId: z.number().int().positive().nullable().optional(),
    approverEmployeeId: z.string().trim().min(1).max(20).nullable().optional(),
    isRequired: z.boolean().optional(),
    autoApprove: z.boolean().optional(),
    timeoutDays: z.number().int().positive().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

// ──────────────────────────────────────────────────────────────
// 2. Approval Workflow Schemas
// ──────────────────────────────────────────────────────────────

// Approval step count limits (applies to create/update with steps and to
// individual step create/delete endpoints).
export const MIN_APPROVAL_STEPS = 1;
export const MAX_APPROVAL_STEPS = 10;

export const createApprovalWorkflowSchema = z.object({
  name: z.string().trim().min(1).max(255),
  entityType: z.nativeEnum(WorkflowEntityType),
  description: z.string().trim().optional(),
  isDefault: z.boolean().default(false).optional(),
  isActive: z.boolean().default(true).optional(),
  steps: z
    .array(createApprovalWorkflowStepSchema)
    .min(MIN_APPROVAL_STEPS, `A workflow needs at least ${MIN_APPROVAL_STEPS} approval step(s).`)
    .max(MAX_APPROVAL_STEPS, `A workflow can have at most ${MAX_APPROVAL_STEPS} approval steps.`)
    .optional(),
});

export const updateApprovalWorkflowSchema = z
  .object({
    name: z.string().trim().min(1).max(255).optional(),
    entityType: z.nativeEnum(WorkflowEntityType).optional(),
    description: z.string().trim().optional(),
    isDefault: z.boolean().optional(),
    isActive: z.boolean().optional(),
    steps: z
      .array(createApprovalWorkflowStepSchema)
      .min(MIN_APPROVAL_STEPS, `A workflow needs at least ${MIN_APPROVAL_STEPS} approval step(s).`)
      .max(MAX_APPROVAL_STEPS, `A workflow can have at most ${MAX_APPROVAL_STEPS} approval steps.`)
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required for update.",
  });

export const approvalWorkflowFilterSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
  search: z.string().trim().optional(),
  entityType: z.nativeEnum(WorkflowEntityType).optional(),
  isActive: z.coerce.boolean().optional(),
  isSystem: z.coerce.boolean().optional(),
});

// Options lookup query schemas (role / employee dropdowns)

export const employeeOptionsQuerySchema = z.object({
  q: z.string().trim().min(1).max(100).optional(),
  limit: z.coerce.number().int().positive().max(50).default(10),
});
