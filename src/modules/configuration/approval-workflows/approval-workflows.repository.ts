import type {
  PrismaClient,
  Prisma,
  ApprovalWorkflow,
  ApprovalWorkflowStep,
} from "@prisma/client";
import type {
  ApprovalWorkflowFilterParams,
  ApprovalWorkflowWithSteps,
  CreateApprovalWorkflowInput,
  UpdateApprovalWorkflowInput,
  CreateApprovalWorkflowStepInput,
  UpdateApprovalWorkflowStepInput,
} from "./approval-workflows.types.js";

import type { IApprovalWorkflowsRepository } from "./approval-workflows.types.js";

export class ApprovalWorkflowsRepository
  implements IApprovalWorkflowsRepository
{
  constructor(private prisma: PrismaClient) {}

  // ==========================================
  // 1. ApprovalWorkflow Methods
  // ==========================================

  async createWorkflow(
    companyId: number,
    userId: number,
    dto: CreateApprovalWorkflowInput
  ): Promise<ApprovalWorkflow> {
    return this.prisma.approvalWorkflow.create({
      data: {
        companyId,
        createdBy: userId,
        name: dto.name,
        entityType: dto.entityType,
        description: dto.description,
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
      },
    });
  }

  async findWorkflowById(
    companyId: number,
    id: number
  ): Promise<ApprovalWorkflowWithSteps | null> {
    return this.prisma.approvalWorkflow.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        steps: {
          orderBy: { approvalOrder: "asc" },
          include: {
            approverRole: { select: { name: true } },
            approver: { select: { fullName: true } },
          },
        },
      },
    });
  }

  async findWorkflowByName(
    companyId: number,
    name: string
  ): Promise<ApprovalWorkflow | null> {
    return this.prisma.approvalWorkflow.findFirst({
      where: {
        companyId,
        deletedAt: null,
        name: { equals: name, mode: "insensitive" },
      },
    });
  }

  async findWorkflows(
    companyId: number,
    filter: ApprovalWorkflowFilterParams
  ): Promise<ApprovalWorkflowWithSteps[]> {
    const { search, entityType, isActive, isSystem, page = 1, limit = 10 } = filter;
    const skip = (page - 1) * limit;

    const where: Prisma.ApprovalWorkflowWhereInput = {
      companyId,
      deletedAt: null,
      ...(entityType && { entityType }),
      ...(isActive !== undefined && { isActive }),
      ...(isSystem !== undefined && { isSystem }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    return this.prisma.approvalWorkflow.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        steps: {
          orderBy: { approvalOrder: "asc" },
          include: {
            approverRole: { select: { name: true } },
            approver: { select: { fullName: true } },
          },
        },
      },
    });
  }

  async countWorkflows(
    companyId: number,
    filter: ApprovalWorkflowFilterParams
  ): Promise<number> {
    const { search, entityType, isActive, isSystem } = filter;

    const where: Prisma.ApprovalWorkflowWhereInput = {
      companyId,
      deletedAt: null,
      ...(entityType && { entityType }),
      ...(isActive !== undefined && { isActive }),
      ...(isSystem !== undefined && { isSystem }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    return this.prisma.approvalWorkflow.count({ where });
  }

  async updateWorkflow(
    companyId: number,
    id: number,
    userId: number,
    dto: UpdateApprovalWorkflowInput
  ): Promise<ApprovalWorkflow> {
    return this.prisma.approvalWorkflow.update({
      where: { id },
      data: {
        updatedBy: userId,
        ...(dto.name && { name: dto.name }),
        ...(dto.entityType && { entityType: dto.entityType }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.isDefault !== undefined && { isDefault: dto.isDefault }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
  }

  async softDeleteWorkflow(
    companyId: number,
    id: number,
    userId: number
  ): Promise<ApprovalWorkflow> {
    return this.prisma.approvalWorkflow.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy: userId,
        isActive: false,
      },
    });
  }

  async countWorkflowUsages(companyId: number, id: number): Promise<number> {
    return this.prisma.approvalWorkflowInstance.count({
      where: { companyId, workflowId: id },
    });
  }

  async unsetPreviousDefaults(
    companyId: number,
    entityType: any,
    prismaTx?: Prisma.TransactionClient
  ): Promise<Prisma.BatchPayload> {
    const client = prismaTx || this.prisma;
    return client.approvalWorkflow.updateMany({
      where: { companyId, entityType, isDefault: true, deletedAt: null },
      data: { isDefault: false },
    });
  }

  // ==========================================
  // 2. ApprovalWorkflowStep Methods
  // ==========================================

  async createWorkflowStep(
    companyId: number,
    workflowId: number,
    dto: CreateApprovalWorkflowStepInput
  ): Promise<ApprovalWorkflowStep> {
    return this.prisma.approvalWorkflowStep.create({
      data: {
        companyId,
        workflowId,
        approvalOrder: dto.approvalOrder,
        approverRoleId: dto.approverRoleId,
        approverEmployeeId: dto.approverEmployeeId,
        isRequired: dto.isRequired ?? true,
        autoApprove: dto.autoApprove ?? false,
        timeoutDays: dto.timeoutDays,
      },
    });
  }

  async findWorkflowStepById(
    companyId: number,
    id: number
  ): Promise<ApprovalWorkflowStep | null> {
    return this.prisma.approvalWorkflowStep.findFirst({
      where: { id, companyId },
    });
  }

  async findWorkflowStepByOrder(
    workflowId: number,
    approvalOrder: number
  ): Promise<ApprovalWorkflowStep | null> {
    return this.prisma.approvalWorkflowStep.findFirst({
      where: { workflowId, approvalOrder },
    });
  }

  async findWorkflowSteps(
    companyId: number,
    workflowId: number
  ): Promise<ApprovalWorkflowStep[]> {
    return this.prisma.approvalWorkflowStep.findMany({
      where: { companyId, workflowId },
      orderBy: { approvalOrder: "asc" },
    });
  }

  async updateWorkflowStep(
    companyId: number,
    id: number,
    dto: UpdateApprovalWorkflowStepInput
  ): Promise<ApprovalWorkflowStep> {
    return this.prisma.approvalWorkflowStep.update({
      where: { id },
      data: {
        ...(dto.approvalOrder && { approvalOrder: dto.approvalOrder }),
        ...(dto.approverRoleId !== undefined && {
          approverRoleId: dto.approverRoleId,
        }),
        ...(dto.approverEmployeeId !== undefined && {
          approverEmployeeId: dto.approverEmployeeId,
        }),
        ...(dto.isRequired !== undefined && { isRequired: dto.isRequired }),
        ...(dto.autoApprove !== undefined && { autoApprove: dto.autoApprove }),
        ...(dto.timeoutDays !== undefined && { timeoutDays: dto.timeoutDays }),
      },
    });
  }

  async deleteWorkflowStep(
    companyId: number,
    id: number
  ): Promise<ApprovalWorkflowStep> {
    return this.prisma.approvalWorkflowStep.delete({
      where: { id },
    });
  }

  // ==========================================
  // 3. Foreign Key Checks
  // ==========================================

  async findAppRole(companyId: number, roleId: number): Promise<boolean> {
    const role = await this.prisma.appRole.findFirst({
      where: { id: roleId, companyId },
    });
    return !!role;
  }

  async findEmployee(companyId: number, employeeId: string): Promise<boolean> {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, companyId },
    });
    return !!employee;
  }

  // ==========================================
  // 4. Options Lookup (dropdowns for the step form)
  // ==========================================

  async listRoleOptions(
    companyId: number
  ): Promise<Array<{ id: number; name: string }>> {
    return this.prisma.appRole.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  async searchEmployees(
    companyId: number,
    q?: string,
    limit = 10
  ): Promise<Array<{ id: string; fullName: string; departmentName?: string | null }>> {
    const where: Prisma.EmployeeWhereInput = {
      companyId,
      isActive: true,
      ...(q && {
        OR: [
          { id: { contains: q, mode: "insensitive" } },
          { fullName: { contains: q, mode: "insensitive" } },
        ],
      }),
    };

    return this.prisma.employee.findMany({
      where,
      take: limit,
      orderBy: { fullName: "asc" },
      select: {
        id: true,
        fullName: true,
        department: { select: { name: true } },
      },
    }).then((rows) =>
      rows.map((r) => ({
        id: r.id,
        fullName: r.fullName,
        departmentName: r.department?.name ?? null,
      }))
    );
  }

  // ==========================================
  // 5. Transactional helpers (workflow + steps)
  // ==========================================

  async createWorkflowWithSteps(
    companyId: number,
    userId: number,
    dto: CreateApprovalWorkflowInput,
    prismaTx?: Prisma.TransactionClient
  ): Promise<ApprovalWorkflow> {
    const client = prismaTx || this.prisma;
    const workflow = await client.approvalWorkflow.create({
      data: {
        companyId,
        createdBy: userId,
        name: dto.name,
        entityType: dto.entityType,
        description: dto.description,
        isDefault: dto.isDefault ?? false,
        isActive: dto.isActive ?? true,
      },
    });

    if (dto.steps && dto.steps.length > 0) {
      await client.approvalWorkflowStep.createMany({
        data: dto.steps.map((step) => ({
          companyId,
          workflowId: workflow.id,
          approvalOrder: step.approvalOrder,
          approverRoleId: step.approverRoleId ?? null,
          approverEmployeeId: step.approverEmployeeId ?? null,
          isRequired: step.isRequired ?? true,
          autoApprove: step.autoApprove ?? false,
          timeoutDays: step.timeoutDays ?? null,
        })),
      });
    }

    return workflow;
  }

  async replaceWorkflowSteps(
    companyId: number,
    workflowId: number,
    steps: CreateApprovalWorkflowStepInput[],
    prismaTx?: Prisma.TransactionClient
  ): Promise<void> {
    const client = prismaTx || this.prisma;
    await client.approvalWorkflowStep.deleteMany({
      where: { workflowId, companyId },
    });
    if (steps.length > 0) {
      await client.approvalWorkflowStep.createMany({
        data: steps.map((step) => ({
          companyId,
          workflowId,
          approvalOrder: step.approvalOrder,
          approverRoleId: step.approverRoleId ?? null,
          approverEmployeeId: step.approverEmployeeId ?? null,
          isRequired: step.isRequired ?? true,
          autoApprove: step.autoApprove ?? false,
          timeoutDays: step.timeoutDays ?? null,
        })),
      });
    }
  }
}
