import { notificationDispatcher } from "../notifications/index.js";
import { AppError, ErrorCode } from "../../common/errors/index.js";
import { coursePublishingRepository } from "./course-publishing.repository.js";

export const coursePublishingService = {
  /**
   * Creator submits a CourseVersion for review.
   * - Finds the default COURSE_VERSION approval workflow.
   * - Creates an ApprovalWorkflowInstance with status PENDING.
   * - Sets CourseVersion.approvalStatus = PENDING (already is, but makes the intent explicit).
   * - Notifies all users who hold the first-step approver role.
   */
  async submitForReview(
    context: { companyId: number; userId: number },
    courseVersionId: number,
    comment?: string,
  ) {
    const result = await coursePublishingRepository.transaction(async (tx) => {
      // 1. Validate CourseVersion exists and belongs to submitter's company
      const version = await coursePublishingRepository.findCourseVersion(
        tx,
        context.companyId,
        courseVersionId,
      );
      if (!version) {
        throw new AppError("Course version not found.", 404, ErrorCode.NOT_FOUND);
      }
      if (version.status === "PUBLISHED") {
        throw new AppError(
          "This course version is already published.",
          409,
          ErrorCode.CONFLICT,
        );
      }

      // 2. Check there is no active pending instance already
      const existing = await coursePublishingRepository.findExistingInstance(
        tx,
        context.companyId,
        courseVersionId,
      );
      if (existing) {
        throw new AppError(
          "A review is already in progress for this course version.",
          409,
          ErrorCode.CONFLICT,
        );
      }

      // 3. Find default workflow for COURSE_VERSION
      const workflow = await coursePublishingRepository.findDefaultWorkflowForCourse(
        tx,
        context.companyId,
      );
      if (!workflow) {
        throw new AppError(
          "No default approval workflow is configured for course publishing. Please configure one in the Configuration Center.",
          422,
          ErrorCode.BUSINESS_RULE_VIOLATION,
        );
      }

      // 4. Create workflow instance
      const instance = await coursePublishingRepository.createInstance(tx, {
        companyId: context.companyId,
        workflowId: workflow.id,
        courseVersionId,
        submittedBy: context.userId,
      });

      // 5. Resolve reviewers from the first workflow step
      let reviewerIds: number[] = [];
      const firstStep = workflow.steps[0];
      if (firstStep) {
        if (firstStep.approverRoleId) {
          const users = await coursePublishingRepository.findUsersByRole(
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

      // Notify reviewers
      const dispatch =
        reviewerIds.length > 0
          ? await notificationDispatcher.dispatch(tx, {
              companyId: context.companyId,
              eventCode: "COURSE_PUBLISHING_REVIEW_REQUESTED",
              recipientUserIds: reviewerIds,
              entityType: "COURSE_VERSION",
              entityId: String(courseVersionId),
              occurrenceKey: `review-requested-${instance.id}`,
              actionUrl: `/?screen=hr-publishing&courseVersionId=${courseVersionId}`,
              variables: {
                courseTitle: version.course.title,
                reviewDueText: comment ? ` Note: ${comment}` : "",
              },
            })
          : { emails: [], inAppCount: 0 };

      return { version, instance, dispatch };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);

    return {
      courseVersionId,
      instanceId: result.instance.id,
      status: result.instance.status,
      message: "Course submitted for review. Reviewers have been notified.",
    };
  },

  /**
   * Reviewer approves a course.
   * - Records the ApprovalDecision.
   * - Marks the instance APPROVED.
   * - Sets CourseVersion.status = PUBLISHED, approvalStatus = APPROVED.
   * - Notifies the creator.
   */
  async approveCourse(
    context: { companyId: number; userId: number },
    instanceId: number,
    comment?: string,
  ) {
    const result = await coursePublishingRepository.transaction(async (tx) => {
      const instance = await coursePublishingRepository.findInstanceById(
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
      await coursePublishingRepository.createDecision(tx, {
        companyId: context.companyId,
        instanceId,
        workflowStepId: firstStep.id,
        status: "APPROVED",
        decidedBy: context.userId,
        comment,
      });

      // Update instance
      await coursePublishingRepository.updateInstanceStatus(
        tx,
        instanceId,
        "APPROVED",
        comment,
      );

      // Publish the course version
      const now = new Date();
      await coursePublishingRepository.updateCourseVersionStatus(
        tx,
        instance.courseVersionId!,
        {
          status: "PUBLISHED",
          approvalStatus: "APPROVED",
          isCurrent: true,
          publishedBy: context.userId,
          publishDate: now,
          approvedBy: context.userId,
          approvedAt: now,
        },
      );

      // Notify the creator
      const creatorId = instance.courseVersion?.createdBy;
      const courseTitle = instance.courseVersion?.course.title ?? "Course";
      const dispatch = creatorId
        ? await notificationDispatcher.dispatch(tx, {
            companyId: context.companyId,
            eventCode: "COURSE_PUBLISHED",
            recipientUserIds: [creatorId],
            entityType: "COURSE_VERSION",
            entityId: String(instance.courseVersionId),
            occurrenceKey: `published-${instanceId}`,
            actionUrl: `/?screen=my-courses-builder&courseVersionId=${instance.courseVersionId}`,
            variables: {
              courseTitle,
              reviewerNote: comment ? ` Reviewer note: ${comment}` : "",
            },
          })
        : { emails: [], inAppCount: 0 };

      return { courseTitle, dispatch };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);

    return { instanceId, status: "APPROVED", message: "Course approved and published." };
  },

  /**
   * Reviewer rejects a course.
   * - Records the ApprovalDecision.
   * - Marks instance REJECTED, CourseVersion.approvalStatus = REJECTED.
   * - Notifies the creator.
   */
  async rejectCourse(
    context: { companyId: number; userId: number },
    instanceId: number,
    comment: string,
  ) {
    const result = await coursePublishingRepository.transaction(async (tx) => {
      const instance = await coursePublishingRepository.findInstanceById(
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

      await coursePublishingRepository.createDecision(tx, {
        companyId: context.companyId,
        instanceId,
        workflowStepId: firstStep.id,
        status: "REJECTED",
        decidedBy: context.userId,
        comment,
      });

      await coursePublishingRepository.updateInstanceStatus(tx, instanceId, "REJECTED", comment);

      await coursePublishingRepository.updateCourseVersionStatus(
        tx,
        instance.courseVersionId!,
        { approvalStatus: "REJECTED" },
      );

      const creatorId = instance.courseVersion?.createdBy;
      const courseTitle = instance.courseVersion?.course.title ?? "Course";
      const dispatch = creatorId
        ? await notificationDispatcher.dispatch(tx, {
            companyId: context.companyId,
            eventCode: "COURSE_REJECTED",
            recipientUserIds: [creatorId],
            entityType: "COURSE_VERSION",
            entityId: String(instance.courseVersionId),
            occurrenceKey: `rejected-${instanceId}`,
            actionUrl: `/?screen=my-courses-builder&courseVersionId=${instance.courseVersionId}`,
            variables: {
              courseTitle,
              reviewerNote: comment ? ` Reason: ${comment}` : "",
            },
          })
        : { emails: [], inAppCount: 0 };

      return { courseTitle, dispatch };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);

    return { instanceId, status: "REJECTED", message: "Course rejected." };
  },

  /**
   * Reviewer requests changes.
   * - Records decision.
   * - Instance status → CHANGES_REQUESTED.
   * - CourseVersion stays DRAFT, approvalStatus stays PENDING.
   * - Notifies the creator.
   */
  async requestChanges(
    context: { companyId: number; userId: number },
    instanceId: number,
    comment: string,
  ) {
    const result = await coursePublishingRepository.transaction(async (tx) => {
      const instance = await coursePublishingRepository.findInstanceById(
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

      await coursePublishingRepository.createDecision(tx, {
        companyId: context.companyId,
        instanceId,
        workflowStepId: firstStep.id,
        status: "CHANGES_REQUESTED",
        decidedBy: context.userId,
        comment,
      });

      await coursePublishingRepository.updateInstanceStatus(
        tx,
        instanceId,
        "CHANGES_REQUESTED",
        comment,
      );

      const creatorId = instance.courseVersion?.createdBy;
      const courseTitle = instance.courseVersion?.course.title ?? "Course";
      const dispatch = creatorId
        ? await notificationDispatcher.dispatch(tx, {
            companyId: context.companyId,
            eventCode: "COURSE_REVISION_REQUESTED",
            recipientUserIds: [creatorId],
            entityType: "COURSE_VERSION",
            entityId: String(instance.courseVersionId),
            occurrenceKey: `revision-${instanceId}`,
            actionUrl: `/?screen=my-courses-builder&courseVersionId=${instance.courseVersionId}`,
            variables: {
              courseTitle,
              reviewerNote: ` Requested changes: ${comment}`,
            },
          })
        : { emails: [], inAppCount: 0 };

      return { courseTitle, dispatch };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);

    return { instanceId, status: "CHANGES_REQUESTED", message: "Changes requested. Creator has been notified." };
  },

  /**
   * List pending review instances for reviewers (admin/hr).
   */
  listPendingReviews(companyId: number) {
    return coursePublishingRepository.transaction(async (tx) => {
      return tx.approvalWorkflowInstance.findMany({
        where: {
          companyId,
          entityType: "COURSE_VERSION",
          status: { in: ["PENDING", "CHANGES_REQUESTED"] },
        },
        include: {
          courseVersion: {
            select: {
              id: true,
              status: true,
              approvalStatus: true,
              course: { select: { id: true, title: true } },
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
