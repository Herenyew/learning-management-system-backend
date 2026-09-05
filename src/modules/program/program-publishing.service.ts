import { notificationDispatcher } from "../notifications/index.js";
import { AppError, ErrorCode } from "../../common/errors/index.js";
import { programPublishingRepository } from "./program-publishing.repository.js";

export const programPublishingService = {
  /**
   * Creator submits a LearningProgram for review.
   * - Finds the default LEARNING_PROGRAM approval workflow.
   * - Creates an ApprovalWorkflowInstance with status PENDING.
   * - Sets LearningProgram.approvalStatus = PENDING.
   * - Notifies all users who hold the first-step approver role (or the
   *   specific approver employee) based on the created workflow steps.
   */
  async submitForReview(
    context: { companyId: number; userId: number },
    learningProgramId: number,
    comment?: string,
  ) {
    const result = await programPublishingRepository.transaction(async (tx) => {
      // 1. Validate LearningProgram exists and belongs to submitter's company
      const program = await programPublishingRepository.findLearningProgram(
        tx,
        context.companyId,
        learningProgramId,
      );
      if (!program) {
        throw new AppError("Learning program not found.", 404, ErrorCode.NOT_FOUND);
      }
      if (program.status === "ACTIVE" || program.status === "COMPLETED") {
        throw new AppError(
          "This learning program is already published.",
          409,
          ErrorCode.CONFLICT,
        );
      }

      // 2. Check there is no active pending instance already
      const existing = await programPublishingRepository.findExistingInstance(
        tx,
        context.companyId,
        learningProgramId,
      );
      if (existing) {
        throw new AppError(
          "A review is already in progress for this learning program.",
          409,
          ErrorCode.CONFLICT,
        );
      }

      // 3. Find default workflow for LEARNING_PROGRAM
      const workflow = await programPublishingRepository.findDefaultWorkflowForProgram(
        tx,
        context.companyId,
      );
      if (!workflow) {
        throw new AppError(
          "No default approval workflow is configured for program publishing. Please configure one in the Configuration Center.",
          422,
          ErrorCode.BUSINESS_RULE_VIOLATION,
        );
      }

      // 4. Create workflow instance
      const instance = await programPublishingRepository.createInstance(tx, {
        companyId: context.companyId,
        workflowId: workflow.id,
        learningProgramId,
        submittedBy: context.userId,
      });

      // 5. Set the program into review state (approvalStatus = PENDING)
      await programPublishingRepository.updateLearningProgramStatus(tx, learningProgramId, {
        approvalStatus: "PENDING",
        updatedBy: context.userId,
      });

      // 6. Resolve reviewers from the first workflow step
      let reviewerIds: number[] = [];
      const firstStep = workflow.steps[0];
      if (firstStep) {
        if (firstStep.approverRoleId) {
          const users = await programPublishingRepository.findUsersByRole(
            tx,
            context.companyId,
            firstStep.approverRoleId,
          );
          reviewerIds = users.map((u) => u.id);
        }
        if (firstStep.approverEmployeeId) {
          // Individual approver — find their appUser
          const user = await tx.appUser.findFirst({
            where: {
              companyId: context.companyId,
              employeeId: firstStep.approverEmployeeId,
              isActive: true,
            },
            select: { id: true },
          });
          if (user && !reviewerIds.includes(user.id)) {
            reviewerIds.push(user.id);
          }
        }
      }

      // Notify reviewers based on the created workflow steps
      const dispatch =
        reviewerIds.length > 0
          ? await notificationDispatcher.dispatch(tx, {
              companyId: context.companyId,
              eventCode: "PROGRAM_PUBLISHING_REVIEW_REQUESTED",
              recipientUserIds: reviewerIds,
              entityType: "LEARNING_PROGRAM",
              entityId: String(learningProgramId),
              occurrenceKey: `review-requested-${instance.id}`,
              actionUrl: `/?screen=hr-publishing&learningProgramId=${learningProgramId}`,
              variables: {
                programName: program.name,
                reviewDueText: comment ? ` Note: ${comment}` : "",
              },
            })
          : { emails: [], inAppCount: 0 };

      return { program, instance, dispatch };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);

    return {
      learningProgramId,
      instanceId: result.instance.id,
      status: result.instance.status,
      message: "Program submitted for review. Reviewers have been notified.",
    };
  },

  /**
   * Reviewer approves a program.
   * - Records the ApprovalDecision.
   * - Marks the instance APPROVED.
   * - Sets LearningProgram.status = ACTIVE, approvalStatus = APPROVED.
   * - Notifies the creator.
   */
  async approveProgram(
    context: { companyId: number; userId: number },
    instanceId: number,
    comment?: string,
  ) {
    const result = await programPublishingRepository.transaction(async (tx) => {
      const instance = await programPublishingRepository.findInstanceById(
        tx,
        context.companyId,
        instanceId,
      );
      if (!instance) {
        throw new AppError("Approval instance not found.", 404, ErrorCode.NOT_FOUND);
      }
      if (instance.status !== "PENDING" && instance.status !== "CHANGES_REQUESTED") {
        throw new AppError(
          `Cannot approve an instance with status "${instance.status}".`,
          409,
          ErrorCode.CONFLICT,
        );
      }

      const firstStep = instance.workflow.steps[0];
      if (!firstStep) {
        throw new AppError(
          "Approval workflow has no steps configured.",
          422,
          ErrorCode.BUSINESS_RULE_VIOLATION,
        );
      }

      // Record decision
      await programPublishingRepository.createDecision(tx, {
        companyId: context.companyId,
        instanceId,
        workflowStepId: firstStep.id,
        status: "APPROVED",
        decidedBy: context.userId,
        comment,
      });

      // Update instance
      await programPublishingRepository.updateInstanceStatus(tx, instanceId, "APPROVED", comment);

      // Activate the program
      await programPublishingRepository.updateLearningProgramStatus(
        tx,
        instance.learningProgramId!,
        {
          status: "ACTIVE",
          approvalStatus: "APPROVED",
          updatedBy: context.userId,
        },
      );

      // Notify the creator
      const creatorId = instance.learningProgram?.createdBy;
      const programName = instance.learningProgram?.name ?? "Program";
      const dispatch = creatorId
        ? await notificationDispatcher.dispatch(tx, {
            companyId: context.companyId,
            eventCode: "PROGRAM_PUBLISHED",
            recipientUserIds: [creatorId],
            entityType: "LEARNING_PROGRAM",
            entityId: String(instance.learningProgramId),
            occurrenceKey: `published-${instanceId}`,
            actionUrl: `/?screen=hr-programs&learningProgramId=${instance.learningProgramId}`,
            variables: {
              programName,
              reviewerNote: comment ? ` Reviewer note: ${comment}` : "",
            },
          })
        : { emails: [], inAppCount: 0 };

      return { programName, dispatch };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);

    return { instanceId, status: "APPROVED", message: "Program approved and activated." };
  },

  /**
   * Reviewer rejects a program.
   * - Records the ApprovalDecision.
   * - Marks instance REJECTED, LearningProgram.approvalStatus = REJECTED.
   * - Notifies the creator.
   */
  async rejectProgram(
    context: { companyId: number; userId: number },
    instanceId: number,
    comment: string,
  ) {
    const result = await programPublishingRepository.transaction(async (tx) => {
      const instance = await programPublishingRepository.findInstanceById(
        tx,
        context.companyId,
        instanceId,
      );
      if (!instance) {
        throw new AppError("Approval instance not found.", 404, ErrorCode.NOT_FOUND);
      }
      if (instance.status !== "PENDING" && instance.status !== "CHANGES_REQUESTED") {
        throw new AppError(
          `Cannot reject an instance with status "${instance.status}".`,
          409,
          ErrorCode.CONFLICT,
        );
      }

      const firstStep = instance.workflow.steps[0];
      if (!firstStep) {
        throw new AppError("Approval workflow has no steps configured.", 422, ErrorCode.BUSINESS_RULE_VIOLATION);
      }

      await programPublishingRepository.createDecision(tx, {
        companyId: context.companyId,
        instanceId,
        workflowStepId: firstStep.id,
        status: "REJECTED",
        decidedBy: context.userId,
        comment,
      });

      await programPublishingRepository.updateInstanceStatus(tx, instanceId, "REJECTED", comment);

      await programPublishingRepository.updateLearningProgramStatus(
        tx,
        instance.learningProgramId!,
        { approvalStatus: "REJECTED", updatedBy: context.userId },
      );

      const creatorId = instance.learningProgram?.createdBy;
      const programName = instance.learningProgram?.name ?? "Program";
      const dispatch = creatorId
        ? await notificationDispatcher.dispatch(tx, {
            companyId: context.companyId,
            eventCode: "PROGRAM_REJECTED",
            recipientUserIds: [creatorId],
            entityType: "LEARNING_PROGRAM",
            entityId: String(instance.learningProgramId),
            occurrenceKey: `rejected-${instanceId}`,
            actionUrl: `/?screen=hr-programs&learningProgramId=${instance.learningProgramId}`,
            variables: {
              programName,
              reviewerNote: comment ? ` Reason: ${comment}` : "",
            },
          })
        : { emails: [], inAppCount: 0 };

      return { programName, dispatch };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);

    return { instanceId, status: "REJECTED", message: "Program rejected." };
  },

  /**
   * Reviewer requests changes.
   * - Records decision.
   * - Instance status → CHANGES_REQUESTED.
   * - LearningProgram stays DRAFT, approvalStatus stays PENDING.
   * - Notifies the creator.
   */
  async requestChanges(
    context: { companyId: number; userId: number },
    instanceId: number,
    comment: string,
  ) {
    const result = await programPublishingRepository.transaction(async (tx) => {
      const instance = await programPublishingRepository.findInstanceById(
        tx,
        context.companyId,
        instanceId,
      );
      if (!instance) {
        throw new AppError("Approval instance not found.", 404, ErrorCode.NOT_FOUND);
      }
      if (instance.status !== "PENDING") {
        throw new AppError(
          `Cannot request changes on an instance with status "${instance.status}".`,
          409,
          ErrorCode.CONFLICT,
        );
      }

      const firstStep = instance.workflow.steps[0];
      if (!firstStep) {
        throw new AppError("Approval workflow has no steps configured.", 422, ErrorCode.BUSINESS_RULE_VIOLATION);
      }

      await programPublishingRepository.createDecision(tx, {
        companyId: context.companyId,
        instanceId,
        workflowStepId: firstStep.id,
        status: "CHANGES_REQUESTED",
        decidedBy: context.userId,
        comment,
      });

      await programPublishingRepository.updateInstanceStatus(
        tx,
        instanceId,
        "CHANGES_REQUESTED",
        comment,
      );

      const creatorId = instance.learningProgram?.createdBy;
      const programName = instance.learningProgram?.name ?? "Program";
      const dispatch = creatorId
        ? await notificationDispatcher.dispatch(tx, {
            companyId: context.companyId,
            eventCode: "PROGRAM_REVISION_REQUESTED",
            recipientUserIds: [creatorId],
            entityType: "LEARNING_PROGRAM",
            entityId: String(instance.learningProgramId),
            occurrenceKey: `revision-${instanceId}`,
            actionUrl: `/?screen=hr-programs&learningProgramId=${instance.learningProgramId}`,
            variables: {
              programName,
              reviewerNote: ` Requested changes: ${comment}`,
            },
          })
        : { emails: [], inAppCount: 0 };

      return { programName, dispatch };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);

    return { instanceId, status: "CHANGES_REQUESTED", message: "Changes requested. Creator has been notified." };
  },

  /**
   * List pending review instances for reviewers (admin/hr).
   */
  listPendingReviews(companyId: number) {
    return programPublishingRepository.transaction(async (tx) => {
      return tx.approvalWorkflowInstance.findMany({
        where: {
          companyId,
          entityType: "LEARNING_PROGRAM",
          status: { in: ["PENDING", "CHANGES_REQUESTED"] },
        },
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
            orderBy: { decidedAt: "desc" },
            take: 1,
            select: { status: true, comment: true, decidedAt: true },
          },
        },
        orderBy: { submittedAt: "asc" },
      });
    });
  },
};
