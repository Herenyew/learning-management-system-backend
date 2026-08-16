import {
  PrismaClient,
  Prisma,
  ApprovalWorkflow,
  ApprovalWorkflowStep,
} from "@prisma/client";
import {
  CreateApprovalWorkflowDto,
  UpdateApprovalWorkflowDto,
  ApprovalWorkflowFilterDto,
  CreateApprovalWorkflowStepDto,
  UpdateApprovalWorkflowStepDto,
} from "./approval-workflows.dto.js";

export interface IApprovalWorkflowsRepository {
  // ApprovalWorkflow
  createWorkflow(
    companyId: number,
    userId: number,
    dto: CreateApprovalWorkflowDto
  ): Promise<ApprovalWorkflow>;
  findWorkflowById(
    companyId: number,
    id: number
  ): Promise<(ApprovalWorkflow & { steps: ApprovalWorkflowStep[] }) | null>;
  findWorkflowByName(
    companyId: number,
    name: string
  ): Promise<ApprovalWorkflow | null>;
  findWorkflows(
    companyId: number,
    filter: ApprovalWorkflowFilterDto
  ): Promise<ApprovalWorkflow[]>;
  countWorkflows(
    companyId: number,
    filter: ApprovalWorkflowFilterDto
  ): Promise<number>;
  updateWorkflow(
    companyId: number,
    id: number,
    userId: number,
    dto: UpdateApprovalWorkflowDto
  ): Promise<ApprovalWorkflow>;
  softDeleteWorkflow(
    companyId: number,
    id: number,
    userId: number
  ): Promise<ApprovalWorkflow>;
  countWorkflowUsages(companyId: number, id: number): Promise<number>;
  unsetPreviousDefaults(
    companyId: number,
    entityType: string,
    prismaTx?: Prisma.TransactionClient
  ): Promise<Prisma.BatchPayload>;

  // ApprovalWorkflowStep
  createWorkflowStep(
    companyId: number,
    workflowId: number,
    dto: CreateApprovalWorkflowStepDto
  ): Promise<ApprovalWorkflowStep>;
  findWorkflowStepById(
    companyId: number,
    id: number
  ): Promise<ApprovalWorkflowStep | null>;
  findWorkflowStepByOrder(
    workflowId: number,
    approvalOrder: number
  ): Promise<ApprovalWorkflowStep | null>;
  findWorkflowSteps(
    companyId: number,
    workflowId: number
  ): Promise<ApprovalWorkflowStep[]>;
  updateWorkflowStep(
    companyId: number,
    id: number,
    dto: UpdateApprovalWorkflowStepDto
  ): Promise<ApprovalWorkflowStep>;
  deleteWorkflowStep(
    companyId: number,
    id: number
  ): Promise<ApprovalWorkflowStep>;

  // External Verification Helpers
  findAppRole(companyId: number, roleId: number): Promise<boolean>;
  findEmployee(companyId: number, employeeId: string): Promise<boolean>;
}

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
    dto: CreateApprovalWorkflowDto
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
  ): Promise<(ApprovalWorkflow & { steps: ApprovalWorkflowStep[] }) | null> {
    return this.prisma.approvalWorkflow.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        steps: {
          orderBy: { approvalOrder: "asc" },
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
    filter: ApprovalWorkflowFilterDto
  ): Promise<ApprovalWorkflow[]> {
    const { search, entityType, isActive, isSystem, page, limit } = filter;
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
    });
  }

  async countWorkflows(
    companyId: number,
    filter: ApprovalWorkflowFilterDto
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
    dto: UpdateApprovalWorkflowDto
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
    dto: CreateApprovalWorkflowStepDto
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
    dto: UpdateApprovalWorkflowStepDto
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
}