import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "../../config/database.js";

export type PublishingTransaction = Prisma.TransactionClient;

export const programPublishingRepository = {
  transaction<T>(fn: (tx: PublishingTransaction) => Promise<T>) {
    return getPrismaClient().$transaction(fn);
  },

  // ── LearningProgram ──────────────────────────────────────────────────────

  findLearningProgram(
    tx: PublishingTransaction,
    companyId: number,
    learningProgramId: number,
  ) {
    return tx.learningProgram.findFirst({
      where: { id: learningProgramId, companyId, deletedAt: null },
      select: {
        id: true,
        companyId: true,
        name: true,
        status: true,
        approvalStatus: true,
        createdBy: true,
      },
    });
  },

  updateLearningProgramStatus(
    tx: PublishingTransaction,
    learningProgramId: number,
    data: {
      status?: "DRAFT" | "ACTIVE" | "COMPLETED" | "ARCHIVED";
      approvalStatus?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
      updatedBy?: number;
    },
  ) {
    return tx.learningProgram.update({
      where: { id: learningProgramId },
      data,
      select: { id: true, status: true, approvalStatus: true },
    });
  },

  // ── ApprovalWorkflow ─────────────────────────────────────────────────────

  findDefaultWorkflowForProgram(tx: PublishingTransaction, companyId: number) {
    return tx.approvalWorkflow.findFirst({
      where: {
        companyId,
        entityType: "LEARNING_PROGRAM",
        isActive: true,
        isDefault: true,
        deletedAt: null,
      },
      include: {
        steps: {
          orderBy: { approvalOrder: "asc" },
          select: {
            id: true,
            approvalOrder: true,
            approverRoleId: true,
            approverEmployeeId: true,
            autoApprove: true,
          },
        },
      },
    });
  },

  // ── ApprovalWorkflowInstance ─────────────────────────────────────────────

  findExistingInstance(
    tx: PublishingTransaction,
    companyId: number,
    learningProgramId: number,
  ) {
    return tx.approvalWorkflowInstance.findFirst({
      where: {
        companyId,
        learningProgramId,
        status: { in: ["PENDING", "DRAFT", "CHANGES_REQUESTED"] },
      },
      select: { id: true, status: true, workflowId: true },
    });
  },

  createInstance(
    tx: PublishingTransaction,
    data: {
      companyId: number;
      workflowId: number;
      learningProgramId: number;
      submittedBy: number;
    },
  ) {
    return tx.approvalWorkflowInstance.create({
      data: {
        companyId: data.companyId,
        workflowId: data.workflowId,
        learningProgramId: data.learningProgramId,
        entityType: "LEARNING_PROGRAM",
        status: "PENDING",
        submittedBy: data.submittedBy,
        submittedAt: new Date(),
      },
      select: { id: true, status: true, workflowId: true },
    });
  },

  updateInstanceStatus(
    tx: PublishingTransaction,
    instanceId: number,
    status: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "CANCELLED",
    comment?: string,
  ) {
    return tx.approvalWorkflowInstance.update({
      where: { id: instanceId },
      data: {
        status,
        completedAt: ["APPROVED", "REJECTED"].includes(status) ? new Date() : undefined,
        latestComment: comment ?? undefined,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        status: true,
        submittedBy: true,
        learningProgramId: true,
        learningProgram: { select: { name: true } },
      },
    });
  },

  createDecision(
    tx: PublishingTransaction,
    data: {
      companyId: number;
      instanceId: number;
      workflowStepId: number;
      status: "APPROVED" | "REJECTED" | "CHANGES_REQUESTED";
      decidedBy: number;
      comment?: string;
    },
  ) {
    // ApprovalDecision.status uses ApprovalStatus enum which has
    // PENDING / APPROVED / REJECTED / CANCELLED.
    // Map CHANGES_REQUESTED (a workflow-instance concept) → PENDING at decision level.
    const decisionStatus =
      data.status === "CHANGES_REQUESTED" ? ("PENDING" as const) : data.status;

    return tx.approvalDecision.upsert({
      where: {
        instanceId_workflowStepId: {
          instanceId: data.instanceId,
          workflowStepId: data.workflowStepId,
        },
      },
      update: {
        status: decisionStatus,
        comment: data.comment ?? null,
        decidedBy: data.decidedBy,
        decidedAt: new Date(),
      },
      create: {
        companyId: data.companyId,
        instanceId: data.instanceId,
        workflowStepId: data.workflowStepId,
        status: decisionStatus,
        comment: data.comment ?? null,
        decidedBy: data.decidedBy,
        decidedAt: new Date(),
      },
    });
  },

  // ── Reviewer resolution ──────────────────────────────────────────────────

  /**
   * Resolves every active AppUser that holds `roleId`, regardless of whether
   * the assignment lives on the legacy `AppUser.roleId` column or on the newer
   * `UserRoleAssignment` table (which the RBAC UI uses). Without this union,
   * approvers created via the role-assignment screen would silently resolve to
   * zero users and never receive a review notification.
   */
  findUsersByRole(tx: PublishingTransaction, companyId: number, roleId: number) {
    return tx.appUser.findMany({
      where: {
        companyId,
        isActive: true,
        OR: [
          // Legacy single-role column (still used by some seeded users).
          { roleId },
          // New multi-role assignment table.
          {
            roleAssignments: {
              some: {
                appRoleId: roleId,
                isActive: true,
                OR: [
                  { expiresAt: null },
                  { expiresAt: { gt: new Date() } },
                ],
              },
            },
          },
        ],
      },
      select: { id: true },
    });
  },

  findInstanceById(tx: PublishingTransaction, companyId: number, instanceId: number) {
    return tx.approvalWorkflowInstance.findFirst({
      where: { id: instanceId, companyId },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { approvalOrder: "asc" },
              select: {
                id: true,
                approvalOrder: true,
                approverRoleId: true,
                approverEmployeeId: true,
                autoApprove: true,
              },
            },
          },
        },
        learningProgram: {
          select: {
            id: true,
            name: true,
            createdBy: true,
          },
        },
      },
    });
  },
};
