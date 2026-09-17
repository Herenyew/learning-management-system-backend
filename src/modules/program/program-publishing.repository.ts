import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "../../config/database.js";

export type PublishingTransaction = Prisma.TransactionClient;

const reviewerSelect = {
  id: true,
  email: true,
  employee: { select: { fullName: true } },
} satisfies Prisma.AppUserSelect;

export type ProgramApprovalStep = {
  id: number;
  approvalOrder: number;
  approverRoleId: number | null;
  approverEmployeeId: string | null;
  isRequired: boolean;
  autoApprove: boolean;
};

const workflowStepSelect = {
  id: true,
  approvalOrder: true,
  approverRoleId: true,
  approverEmployeeId: true,
  isRequired: true,
  autoApprove: true,
  timeoutDays: true,
  approverRole: { select: { id: true, name: true } },
  approver: { select: { id: true, fullName: true } },
} satisfies Prisma.ApprovalWorkflowStepSelect;

export const programPublishingRepository = {
  transaction<T>(fn: (tx: PublishingTransaction) => Promise<T>) {
    return getPrismaClient().$transaction(fn);
  },

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
        ownerEmployeeId: true,
      },
    });
  },

  async findProgramReadiness(
    tx: PublishingTransaction,
    companyId: number,
    learningProgramId: number,
  ) {
    const [program, targetAudienceCount, cohortCount, requiredCourseCount, requiredTaskCount] =
      await Promise.all([
        tx.learningProgram.findFirst({
          where: { id: learningProgramId, companyId, deletedAt: null },
          select: { startDate: true, endDate: true },
        }),
        tx.targetAudience.count({
          where: { companyId, entityType: "LEARNING_PROGRAM", entityId: learningProgramId },
        }),
        tx.programCohort.count({ where: { companyId, programId: learningProgramId } }),
        tx.programCourse.count({
          where: { companyId, programId: learningProgramId, isRequired: true },
        }),
        tx.programTask.count({
          where: { companyId, programId: learningProgramId, isRequired: true },
        }),
      ]);

    return program
      ? {
        startDate: program.startDate,
        endDate: program.endDate,
        targetAudienceCount,
        cohortCount,
        requiredCourseCount,
        requiredTaskCount,
      }
      : null;
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
          select: workflowStepSelect,
        },
      },
    });
  },

  findExistingInstance(
    tx: PublishingTransaction,
    companyId: number,
    learningProgramId: number,
  ) {
    return tx.approvalWorkflowInstance.findFirst({
      where: {
        companyId,
        learningProgramId,
        status: { in: ["PENDING", "DRAFT"] },
      },
      select: { id: true, status: true, workflowId: true },
    });
  },

  findLatestInstance(
    tx: PublishingTransaction,
    companyId: number,
    learningProgramId: number,
  ) {
    return tx.approvalWorkflowInstance.findFirst({
      where: { companyId, learningProgramId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        status: true,
        submittedAt: true,
        completedAt: true,
        latestComment: true,
        decisions: {
          orderBy: { decidedAt: "asc" },
          select: {
            workflowStepId: true,
            status: true,
            comment: true,
            decidedBy: true,
            decidedAt: true,
          },
        },
      },
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
    status: "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "CANCELLED",
    comment?: string,
  ) {
    const terminal = ["APPROVED", "REJECTED", "CHANGES_REQUESTED", "CANCELLED"].includes(status);
    return tx.approvalWorkflowInstance.update({
      where: { id: instanceId },
      data: {
        status,
        completedAt: terminal ? new Date() : null,
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
    const decisionStatus = data.status === "CHANGES_REQUESTED" ? ("CANCELLED" as const) : data.status;

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

  findDecisions(tx: PublishingTransaction, instanceId: number) {
    return tx.approvalDecision.findMany({
      where: { instanceId },
      select: { workflowStepId: true, status: true },
    });
  },

  findUsersByRole(tx: PublishingTransaction, companyId: number, roleId: number) {
    return tx.appUser.findMany({
      where: {
        companyId,
        isActive: true,
        OR: [
          { roleId },
          {
            roleAssignments: {
              some: {
                appRoleId: roleId,
                isActive: true,
                OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
              },
            },
          },
        ],
      },
      select: reviewerSelect,
    });
  },

  async resolveStepReviewers(
    tx: PublishingTransaction,
    companyId: number,
    step: Pick<ProgramApprovalStep, "approverRoleId" | "approverEmployeeId" | "autoApprove"> | null,
  ) {
    if (!step || step.autoApprove) return [];

    const reviewers = step.approverRoleId
      ? await this.findUsersByRole(tx, companyId, step.approverRoleId)
      : [];

    if (step.approverEmployeeId) {
      const employeeReviewer = await tx.appUser.findFirst({
        where: {
          companyId,
          employeeId: step.approverEmployeeId,
          isActive: true,
        },
        select: reviewerSelect,
      });
      if (employeeReviewer && !reviewers.some((reviewer) => reviewer.id === employeeReviewer.id)) {
        reviewers.push(employeeReviewer);
      }
    }

    return reviewers;
  },

  async isUserAssignedToStep(
    tx: PublishingTransaction,
    companyId: number,
    userId: number,
    step: Pick<ProgramApprovalStep, "approverRoleId" | "approverEmployeeId" | "autoApprove">,
  ) {
    if (step.autoApprove) return false;

    const assignments: Prisma.AppUserWhereInput[] = [];
    if (step.approverEmployeeId) assignments.push({ employeeId: step.approverEmployeeId });
    if (step.approverRoleId) {
      assignments.push(
        { roleId: step.approverRoleId },
        {
          roleAssignments: {
            some: {
              appRoleId: step.approverRoleId,
              isActive: true,
              OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
            },
          },
        },
      );
    }
    if (assignments.length === 0) return false;

    return Boolean(
      await tx.appUser.findFirst({
        where: { id: userId, companyId, isActive: true, OR: assignments },
        select: { id: true },
      }),
    );
  },

  findInstanceById(tx: PublishingTransaction, companyId: number, instanceId: number) {
    return tx.approvalWorkflowInstance.findFirst({
      where: { id: instanceId, companyId },
      include: {
        workflow: {
          include: {
            steps: {
              orderBy: { approvalOrder: "asc" },
              select: workflowStepSelect,
            },
          },
        },
        learningProgram: {
          select: {
            id: true,
            name: true,
            createdBy: true,
            ownerEmployeeId: true,
          },
        },
      },
    });
  },

  listPendingInstances(tx: PublishingTransaction, companyId: number) {
    return tx.approvalWorkflowInstance.findMany({
      where: { companyId, entityType: "LEARNING_PROGRAM", status: "PENDING" },
      include: {
        learningProgram: {
          select: {
            id: true,
            name: true,
            status: true,
            approvalStatus: true,
            createdByUser: { select: { id: true, email: true } },
          },
        },
        submittedByUser: { select: { id: true, email: true } },
        decisions: {
          orderBy: { decidedAt: "asc" },
          select: { workflowStepId: true, status: true, comment: true, decidedAt: true },
        },
        workflow: {
          select: {
            name: true,
            steps: {
              orderBy: { approvalOrder: "asc" },
              select: workflowStepSelect,
            },
          },
        },
      },
      orderBy: { submittedAt: "asc" },
    });
  },

  createAuditLog(
    tx: PublishingTransaction,
    data: {
      companyId: number;
      actorUserId: number;
      entityId: string;
      action: string;
      beforeJson?: Prisma.InputJsonValue;
      afterJson?: Prisma.InputJsonValue;
    },
  ) {
    return tx.auditLog.create({
      data: {
        companyId: data.companyId,
        actorUserId: data.actorUserId,
        entityType: "LEARNING_PROGRAM",
        entityId: data.entityId,
        action: data.action,
        beforeJson: data.beforeJson,
        afterJson: data.afterJson,
      },
      select: { id: true },
    });
  },
};
