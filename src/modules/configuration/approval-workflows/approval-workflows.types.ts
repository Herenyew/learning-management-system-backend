import { z } from "zod";
import {
  createApprovalWorkflowSchema,
  updateApprovalWorkflowSchema,
  approvalWorkflowFilterSchema,
  createApprovalWorkflowStepSchema,
  updateApprovalWorkflowStepSchema,
} from "./approval-workflows.dto.js";
import { WorkflowEntityType } from "@prisma/client";

export type CreateApprovalWorkflowInput = z.infer<typeof createApprovalWorkflowSchema>;
export type UpdateApprovalWorkflowInput = z.infer<typeof updateApprovalWorkflowSchema>;
export type ApprovalWorkflowFilterInput = z.infer<typeof approvalWorkflowFilterSchema>;

export interface ApprovalWorkflowFilterParams {
  search?: string;
  entityType?: WorkflowEntityType;
  isActive?: boolean;
  isSystem?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type CreateApprovalWorkflowStepInput = z.infer<typeof createApprovalWorkflowStepSchema>;
export type UpdateApprovalWorkflowStepInput = z.infer<typeof updateApprovalWorkflowStepSchema>;

import type { Prisma, ApprovalWorkflow, ApprovalWorkflowStep } from "@prisma/client";

export type ApprovalWorkflowWithSteps = Prisma.ApprovalWorkflowGetPayload<{
  include: { steps: true };
}>;

export interface IApprovalWorkflowsRepository {
  createWorkflow(companyId: number, userId: number, dto: CreateApprovalWorkflowInput): Promise<ApprovalWorkflow>;
  findWorkflowById(companyId: number, id: number): Promise<ApprovalWorkflowWithSteps | null>;
  findWorkflowByName(companyId: number, name: string): Promise<ApprovalWorkflow | null>;
  findWorkflows(companyId: number, filter: ApprovalWorkflowFilterParams): Promise<ApprovalWorkflow[]>;
  countWorkflows(companyId: number, filter: ApprovalWorkflowFilterParams): Promise<number>;
  updateWorkflow(companyId: number, id: number, userId: number, dto: UpdateApprovalWorkflowInput): Promise<ApprovalWorkflow>;
  softDeleteWorkflow(companyId: number, id: number, userId: number): Promise<ApprovalWorkflow>;
  countWorkflowUsages(companyId: number, id: number): Promise<number>;
  unsetPreviousDefaults(companyId: number, entityType: string, prismaTx?: Prisma.TransactionClient): Promise<Prisma.BatchPayload>;

  createWorkflowStep(companyId: number, workflowId: number, dto: CreateApprovalWorkflowStepInput): Promise<ApprovalWorkflowStep>;
  findWorkflowStepById(companyId: number, id: number): Promise<ApprovalWorkflowStep | null>;
  findWorkflowStepByOrder(workflowId: number, approvalOrder: number): Promise<ApprovalWorkflowStep | null>;
  findWorkflowSteps(companyId: number, workflowId: number): Promise<ApprovalWorkflowStep[]>;
  updateWorkflowStep(companyId: number, id: number, dto: UpdateApprovalWorkflowStepInput): Promise<ApprovalWorkflowStep>;
  deleteWorkflowStep(companyId: number, id: number): Promise<ApprovalWorkflowStep>;

  findAppRole(companyId: number, roleId: number): Promise<boolean>;
  findEmployee(companyId: number, employeeId: string): Promise<boolean>;
}
