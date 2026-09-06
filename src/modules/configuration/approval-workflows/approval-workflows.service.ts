import type { IApprovalWorkflowsRepository } from "./approval-workflows.types.js";
import {
  MIN_APPROVAL_STEPS,
  MAX_APPROVAL_STEPS,
} from "./approval-workflows.dto.js";
import type {
  CreateApprovalWorkflowInput,
  UpdateApprovalWorkflowInput,
  ApprovalWorkflowFilterInput,
  CreateApprovalWorkflowStepInput,
  UpdateApprovalWorkflowStepInput,
} from "./approval-workflows.types.js";
import {
  ConflictError,
  NotFoundError,
  ForbiddenError,
  ValidationError,
} from "../../../common/errors/http-errors.js";

export class ApprovalWorkflowsService {
  constructor(
    private repository: IApprovalWorkflowsRepository,
    private prismaInstance: any
  ) {}

  // ==========================================
  // 1. ApprovalWorkflow Services
  // ==========================================

  async createWorkflow(
    companyId: number,
    userId: number,
    dto: CreateApprovalWorkflowInput
  ) {
    const existing = await this.repository.findWorkflowByName(
      companyId,
      dto.name
    );
    if (existing) {
      throw new ConflictError(
        `Approval workflow with name "${dto.name}" already exists.`
      );
    }

    if (dto.steps && dto.steps.length > 0) {
      await this.validateStepApprovers(companyId, dto.steps);
    }

    if (dto.isDefault) {
      return this.prismaInstance.$transaction(async (tx: any) => {
        await this.repository.unsetPreviousDefaults(
          companyId,
          dto.entityType,
          tx
        );
        return this.repository.createWorkflowWithSteps(companyId, userId, dto, tx);
      });
    }

    return this.repository.createWorkflowWithSteps(companyId, userId, dto);
  }

  async getWorkflows(companyId: number, filter: ApprovalWorkflowFilterInput) {
    const [data, total] = await Promise.all([
      this.repository.findWorkflows(companyId, filter),
      this.repository.countWorkflows(companyId, filter),
    ]);

    const { page, limit } = filter;

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getWorkflowById(companyId: number, id: number) {
    const workflow = await this.repository.findWorkflowById(companyId, id);
    if (!workflow) {
      throw new NotFoundError(`Approval workflow with ID ${id} not found.`);
    }
    return workflow;
  }

  async updateWorkflow(
    companyId: number,
    id: number,
    userId: number,
    dto: UpdateApprovalWorkflowInput
  ) {
    const existing = await this.getWorkflowById(companyId, id);

    if (existing.isSystem) {
      throw new ForbiddenError("System approval workflows cannot be modified.");
    }

    if (dto.name) {
      const existingName = await this.repository.findWorkflowByName(
        companyId,
        dto.name
      );
      if (existingName && existingName.id !== id) {
        throw new ConflictError(
          `Approval workflow with name "${dto.name}" already exists.`
        );
      }
    }

    const targetEntityType = dto.entityType || existing.entityType;

    const { steps, ...workflowDto } = dto;

    if (steps) {
      await this.validateStepApprovers(companyId, steps);
    }

    if (dto.isDefault === true || steps) {
      return this.prismaInstance.$transaction(async (tx: any) => {
        if (dto.isDefault === true) {
          await this.repository.unsetPreviousDefaults(
            companyId,
            targetEntityType,
            tx
          );
        }
        const updated = await this.repository.updateWorkflow(companyId, id, userId, workflowDto as UpdateApprovalWorkflowInput);
        if (steps) {
          await this.repository.replaceWorkflowSteps(companyId, id, steps, tx);
        }
        return updated;
      });
    }

    return this.repository.updateWorkflow(companyId, id, userId, workflowDto as UpdateApprovalWorkflowInput);
  }

  async deleteWorkflow(companyId: number, id: number, userId: number) {
    const existing = await this.getWorkflowById(companyId, id);

    if (existing.isSystem) {
      throw new ForbiddenError("System approval workflows cannot be deleted.");
    }

    const usages = await this.repository.countWorkflowUsages(companyId, id);
    if (usages > 0) {
      throw new ConflictError(
        "Cannot delete approval workflow because active or past instances are linked to it."
      );
    }

    return this.repository.softDeleteWorkflow(companyId, id, userId);
  }

  // ==========================================
  // 2. ApprovalWorkflowStep Services
  // ==========================================

  async createWorkflowStep(
    companyId: number,
    workflowId: number,
    dto: CreateApprovalWorkflowStepInput
  ) {
    const workflow = await this.getWorkflowById(companyId, workflowId);

    if (workflow.isSystem) {
      throw new ForbiddenError(
        "Steps cannot be added to system approval workflows."
      );
    }

    // Enforce the maximum number of approval steps per workflow.
    const existingSteps = await this.repository.findWorkflowSteps(
      companyId,
      workflowId
    );
    if (existingSteps.length >= MAX_APPROVAL_STEPS) {
      throw new ConflictError(
        `A workflow can have at most ${MAX_APPROVAL_STEPS} approval steps.`
      );
    }

    const existingOrder = await this.repository.findWorkflowStepByOrder(
      workflowId,
      dto.approvalOrder
    );
    if (existingOrder) {
      throw new ConflictError(
        `Step with approval order ${dto.approvalOrder} already exists in this workflow.`
      );
    }

    await this.validateApproverBelongsToCompany(
      companyId,
      dto.approverRoleId,
      dto.approverEmployeeId
    );

    return this.repository.createWorkflowStep(companyId, workflowId, dto);
  }

  async getWorkflowSteps(companyId: number, workflowId: number) {
    await this.getWorkflowById(companyId, workflowId);
    return this.repository.findWorkflowSteps(companyId, workflowId);
  }

  async updateWorkflowStep(
    companyId: number,
    workflowId: number,
    stepId: number,
    dto: UpdateApprovalWorkflowStepInput
  ) {
    const workflow = await this.getWorkflowById(companyId, workflowId);

    if (workflow.isSystem) {
      throw new ForbiddenError(
        "Steps in system approval workflows cannot be modified."
      );
    }

    const step = await this.repository.findWorkflowStepById(companyId, stepId);
    if (!step || step.workflowId !== workflowId) {
      throw new NotFoundError(
        `Workflow step with ID ${stepId} not found in this workflow.`
      );
    }

    if (dto.approvalOrder && dto.approvalOrder !== step.approvalOrder) {
      const existingOrder = await this.repository.findWorkflowStepByOrder(
        workflowId,
        dto.approvalOrder
      );
      if (existingOrder && existingOrder.id !== stepId) {
        throw new ConflictError(
          `Step with approval order ${dto.approvalOrder} already exists in this workflow.`
        );
      }
    }

    const targetRoleId =
      dto.approverRoleId !== undefined
        ? dto.approverRoleId
        : step.approverRoleId;
    const targetEmployeeId =
      dto.approverEmployeeId !== undefined
        ? dto.approverEmployeeId
        : step.approverEmployeeId;
    const targetAutoApprove =
      dto.autoApprove !== undefined ? dto.autoApprove : step.autoApprove;

    if (!targetAutoApprove && !targetRoleId && !targetEmployeeId) {
      throw new ValidationError(
        "Step must have an approver role or employee unless autoApprove is true."
      );
    }

    await this.validateApproverBelongsToCompany(
      companyId,
      dto.approverRoleId,
      dto.approverEmployeeId
    );

    return this.repository.updateWorkflowStep(companyId, stepId, dto);
  }

  async deleteWorkflowStep(
    companyId: number,
    workflowId: number,
    stepId: number
  ) {
    const workflow = await this.getWorkflowById(companyId, workflowId);

    if (workflow.isSystem) {
      throw new ForbiddenError(
        "Steps in system approval workflows cannot be deleted."
      );
    }

    const step = await this.repository.findWorkflowStepById(companyId, stepId);
    if (!step || step.workflowId !== workflowId) {
      throw new NotFoundError(
        `Workflow step with ID ${stepId} not found in this workflow.`
      );
    }

    // Enforce the minimum number of approval steps per workflow.
    const existingSteps = await this.repository.findWorkflowSteps(
      companyId,
      workflowId
    );
    if (existingSteps.length <= MIN_APPROVAL_STEPS) {
      throw new ConflictError(
        `A workflow needs at least ${MIN_APPROVAL_STEPS} approval step(s). It cannot be deleted.`
      );
    }

    // Guard: if any ApprovalDecision references this step, delete those
    // records first to satisfy the FK constraint.
    // The audit trail is preserved at the ApprovalWorkflowInstance level
    // (via latestComment and status), so clearing step-level decisions is safe.
    const decisionCount = await this.prismaInstance.approvalDecision.count({
      where: { workflowStepId: stepId },
    });
    if (decisionCount > 0) {
      await this.prismaInstance.approvalDecision.deleteMany({
        where: { workflowStepId: stepId },
      });
    }

    return this.repository.deleteWorkflowStep(companyId, stepId);
  }

  private async validateApproverBelongsToCompany(
    companyId: number,
    roleId?: number | null,
    employeeId?: string | null
  ) {
    if (roleId) {
      const exists = await this.repository.findAppRole(companyId, roleId);
      if (!exists) {
        throw new ValidationError(
          `Approver role ID ${roleId} does not exist in this company.`
        );
      }
    }

    if (employeeId) {
      const exists = await this.repository.findEmployee(companyId, employeeId);
      if (!exists) {
        throw new ValidationError(
          `Approver employee ID ${employeeId} does not exist in this company.`
        );
      }
    }
  }

  private async validateStepApprovers(
    companyId: number,
    steps: CreateApprovalWorkflowStepInput[]
  ) {
    for (const step of steps) {
      await this.validateApproverBelongsToCompany(
        companyId,
        step.approverRoleId,
        step.approverEmployeeId
      );
    }
  }

  // ==========================================
  // 3. Options Lookup Services (dropdowns for the step form)
  // ==========================================

  async getRoleOptions(companyId: number) {
    return this.repository.listRoleOptions(companyId);
  }

  async searchEmployees(
    companyId: number,
    q?: string,
    limit = 10
  ) {
    return this.repository.searchEmployees(companyId, q, limit);
  }
}
