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

  // ── Draft creation (creator saves a new course from the builder) ─────────

  /**
   * Resolves a DifficultyLevel for a new course version. Prefers BEGINNER,
   * falls back to the first available level.
   */
  async resolveDifficultyLevelId(tx: PublishingTransaction): Promise<number | null> {
    const beginner = await tx.difficultyLevel.findFirst({
      where: { code: { equals: "BEGINNER", mode: "insensitive" } },
      select: { id: true },
    });
    if (beginner) return beginner.id;
    const any = await tx.difficultyLevel.findFirst({
      orderBy: { displayOrder: "asc" },
      select: { id: true },
    });
    return any?.id ?? null;
  },

  /**
   * Resolves a CourseCategory for a new course. Uses the company's first
   * category, creating a "General" fallback when none exists.
   */
  async resolveCategoryId(
    tx: PublishingTransaction,
    companyId: number,
  ): Promise<number> {
    const existing = await tx.courseCategory.findFirst({
      where: { companyId },
      orderBy: { displayOrder: "asc" },
      select: { id: true },
    });
    if (existing) return existing.id;
    const created = await tx.courseCategory.create({
      data: {
        companyId,
        name: "General",
        slug: `general-${companyId}`,
        description: "Default category created for courses saved without one.",
      },
      select: { id: true },
    });
    return created.id;
  },

  /**
   * Creates a minimal Course + initial CourseVersion (v1.0, DRAFT).
   * Used by the creator flow when a course is saved from the builder.
   */
  async createCourseDraft(
    tx: PublishingTransaction,
    data: {
      companyId: number;
      createdBy: number;
      title: string;
      description?: string;
      categoryId: number;
      difficultyLevelId: number;
    },
  ) {
    const course = await tx.course.create({
      data: {
        companyId: data.companyId,
        title: data.title,
        description: data.description ?? null,
        categoryId: data.categoryId,
        visibility: "COMPANY",
        enrollmentPolicy: "OPEN",
        status: "DRAFT",
        learningObjectives: [],
        keywords: [],
        createdBy: data.createdBy,
      },
      select: { id: true, title: true },
    });

    const version = await tx.courseVersion.create({
      data: {
        companyId: data.companyId,
        courseId: course.id,
        majorVersion: 1,
        minorVersion: 0,
        difficultyLevelId: data.difficultyLevelId,
        status: "DRAFT",
        approvalStatus: "PENDING",
        requiredAssessmentScore: 0,
        completionThreshold: 100,
        allowDownload: false,
        previewAvailable: false,
        isCurrent: true,
        createdBy: data.createdBy,
      },
      select: { id: true, status: true, approvalStatus: true },
    });

    return { course, version };
  },

  // ── ApprovalWorkflow ─────────────────────────────────────────────────────

  findDefaultWorkflowForCourse(tx: PublishingTransaction, companyId: number) {
    return tx.approvalWorkflow.findFirst({
      where: {
        companyId,
        entityType: { in: ["COURSE_VERSION", "COURSE"] },
        isActive: true,
        deletedAt: null,
      },
      orderBy: [
        { isDefault: "desc" },
        { createdAt: "desc" },
      ],
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

  /** Find a specific workflow by id — used when the creator picks one explicitly. */
  findWorkflowById(tx: PublishingTransaction, companyId: number, workflowId: number) {
    return tx.approvalWorkflow.findFirst({
      where: {
        id: workflowId,
        companyId,
        entityType: { in: ["COURSE_VERSION", "COURSE"] },
        isActive: true,
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

  /** List all active course-publishing workflows for the selector dropdown. */
  listCourseWorkflows(tx: PublishingTransaction, companyId: number) {
    return tx.approvalWorkflow.findMany({
      where: {
        companyId,
        entityType: { in: ["COURSE_VERSION", "COURSE"] },
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        description: true,
        isDefault: true,
        entityType: true,
        steps: {
          orderBy: { approvalOrder: "asc" },
          select: {
            id: true,
            approvalOrder: true,
            approverRole: { select: { name: true } },
            approverEmployeeId: true,
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
    status: "PENDING" | "APPROVED" | "REJECTED" | "CHANGES_REQUESTED" | "CANCELLED",
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

  /**
   * Resolves the concrete recipient users for a single workflow step, handling
   * both role-based and individual-employee approvers (or auto-approve).
   * Used to fan out notifications to the approvers of whichever step is
   * currently pending.
   */
  async resolveStepReviewers(
    tx: PublishingTransaction,
    companyId: number,
    step: { id: number; approverRoleId: number | null; approverEmployeeId: string | null; autoApprove: boolean } | null,
  ): Promise<number[]> {
    if (!step || step.autoApprove) return [];
    let reviewerIds: number[] = [];
    if (step.approverRoleId) {
      const users = await this.findUsersByRole(tx, companyId, step.approverRoleId);
      reviewerIds = users.map((u) => u.id);
    }
        if (step.approverEmployeeId) {
      const user = await tx.appUser.findFirst({
        where: {
          companyId,
          employeeId: step.approverEmployeeId,
          isActive: true,
        },
        select: { id: true },
      });
      if (user && !reviewerIds.includes(user.id)) reviewerIds.push(user.id);
    }
    return reviewerIds;
  },

  /** All decisions recorded against an instance (used to find the current step). */
  findDecisions(tx: PublishingTransaction, instanceId: number) {
    return tx.approvalDecision.findMany({
      where: { instanceId },
      select: { workflowStepId: true, status: true },
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
