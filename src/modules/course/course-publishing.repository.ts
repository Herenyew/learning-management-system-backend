import type { Prisma } from "@prisma/client";
import { getPrismaClient } from "../../config/database.js";

export type PublishingTransaction = Prisma.TransactionClient;

export const coursePublishingRepository = {
  transaction<T>(fn: (tx: PublishingTransaction) => Promise<T>) {
    return getPrismaClient().$transaction(fn);
  },

  // ── CourseVersion ────────────────────────────────────────────────────────

  findCourseVersion(
    tx: PublishingTransaction,
    companyId: number,
    courseVersionId: number,
  ) {
    return tx.courseVersion.findFirst({
      where: { id: courseVersionId, companyId, deletedAt: null },
      select: {
        id: true,
        companyId: true,
        courseId: true,
        status: true,
        approvalStatus: true,
        isCurrent: true,
        createdBy: true,
        course: { select: { id: true, title: true } },
      },
    });
  },

  updateCourseVersionStatus(
    tx: PublishingTransaction,
    courseVersionId: number,
    data: {
      status?: "DRAFT" | "PUBLISHED" | "ARCHIVED";
      approvalStatus?: "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
      publishedBy?: number;
      publishDate?: Date;
      approvedBy?: number;
      approvedAt?: Date;
      isCurrent?: boolean;
    },
  ) {
    return tx.courseVersion.update({
      where: { id: courseVersionId },
      data: { ...data, updatedAt: new Date() },
      select: { id: true, status: true, approvalStatus: true, isCurrent: true },
    });
  },

  // ── ApprovalWorkflow ─────────────────────────────────────────────────────

  findDefaultWorkflowForCourse(tx: PublishingTransaction, companyId: number) {
    return tx.approvalWorkflow.findFirst({
      where: {
        companyId,
        entityType: "COURSE_VERSION",
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
    courseVersionId: number,
  ) {
    return tx.approvalWorkflowInstance.findFirst({
      where: {
        companyId,
        courseVersionId,
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
      courseVersionId: number;
      submittedBy: number;
    },
  ) {
    return tx.approvalWorkflowInstance.create({
      data: {
        companyId: data.companyId,
        workflowId: data.workflowId,
        courseVersionId: data.courseVersionId,
        entityType: "COURSE_VERSION",
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
        courseVersionId: true,
        courseVersion: {
          select: { course: { select: { id: true, title: true } } },
        },
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

  findUsersByRole(tx: PublishingTransaction, companyId: number, roleId: number) {
    return tx.appUser.findMany({
      where: { companyId, roleId, isActive: true },
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
              // no deletedAt on steps
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
        courseVersion: {
          select: {
            id: true,
            createdBy: true,
            course: { select: { id: true, title: true } },
          },
        },
      },
    });
  },
};
