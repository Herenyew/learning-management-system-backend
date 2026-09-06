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
    workflowId?: number,
  ) {
    const result = await coursePublishingRepository.transaction(async (tx) => {
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

      // Use the caller-specified workflow if provided; fall back to default.
      let workflow;
      if (workflowId) {
        workflow = await coursePublishingRepository.findWorkflowById(
          tx,
          context.companyId,
          workflowId,
        );
        if (!workflow) {
          throw new AppError(
            "The selected approval workflow was not found or is not active.",
            404,
            ErrorCode.NOT_FOUND,
          );
        }
      } else {
        workflow = await coursePublishingRepository.findDefaultWorkflowForCourse(
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
      }

      const instance = await coursePublishingRepository.createInstance(tx, {
        companyId: context.companyId,
        workflowId: workflow.id,
        courseVersionId,
        submittedBy: context.userId,
      });

      const firstStep = workflow.steps[0] ?? null;
      const reviewerIds = await coursePublishingRepository.resolveStepReviewers(
        tx,
        context.companyId,
        firstStep ? {
          id: firstStep.id,
          approverRoleId: firstStep.approverRoleId,
          approverEmployeeId: firstStep.approverEmployeeId,
          autoApprove: firstStep.autoApprove,
        } : null,
      );

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

      return { version, instance, workflow, dispatch };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);

    return {
      courseVersionId,
      instanceId: result.instance.id,
      status: result.instance.status,
      workflowId: result.workflow.id,
      workflowName: result.workflow.name,
      message: `Course submitted for review via "${result.workflow.name}". Reviewers have been notified.`,
    };
  },

  /**
   * Creator saves a NEW course from the builder and it is immediately
   * submitted for review:
   * - Creates a minimal Course + initial CourseVersion (v1.0, DRAFT).
   * - Finds the default COURSE / COURSE_VERSION approval workflow.
   * - Creates an ApprovalWorkflowInstance with status PENDING.
   * - Notifies all users who hold the first-step approver role (or the
   *   specific approver employee) based on the created workflow steps.
   */
  async createAndSubmitDraft(
    context: { companyId: number; userId: number },
    input: { title: string; description?: string; workflowId?: number },
  ) {
    const result = await coursePublishingRepository.transaction(async (tx) => {
      const title = input.title.trim();
      if (!title) {
        throw new AppError("Course title is required.", 400, ErrorCode.VALIDATION_ERROR);
      }

      // 1. Resolve fallbacks for required reference fields
      const difficultyLevelId =
        await coursePublishingRepository.resolveDifficultyLevelId(tx);
      if (!difficultyLevelId) {
        throw new AppError(
          "No difficulty levels are configured. Please seed difficulty levels first.",
          422,
          ErrorCode.BUSINESS_RULE_VIOLATION,
        );
      }
      const categoryId = await coursePublishingRepository.resolveCategoryId(
        tx,
        context.companyId,
      );

      // 2. Create the course draft (Course + CourseVersion v1.0 DRAFT/PENDING)
      const { course, version } = await coursePublishingRepository.createCourseDraft(tx, {
        companyId: context.companyId,
        createdBy: context.userId,
        title,
        description: input.description,
        categoryId,
        difficultyLevelId,
      });

      // 3. Find the workflow — use caller-specified or fall back to default
      let workflow;
      if (input.workflowId) {
        workflow = await coursePublishingRepository.findWorkflowById(
          tx,
          context.companyId,
          input.workflowId,
        );
        if (!workflow) {
          throw new AppError(
            "The selected approval workflow was not found or is not active.",
            404,
            ErrorCode.NOT_FOUND,
          );
        }
      } else {
        workflow = await coursePublishingRepository.findDefaultWorkflowForCourse(
          tx,
          context.companyId,
        );
      }
      if (!workflow) {
        // The draft persists even without a workflow — no review is started.
        return { course, version, instance: null, dispatch: { emails: [], inAppCount: 0 }, reviewerIds: [] as number[] };
      }

      // 4. Create workflow instance
      const instance = await coursePublishingRepository.createInstance(tx, {
        companyId: context.companyId,
        workflowId: workflow.id,
        courseVersionId: version.id,
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

      // 6. Notify reviewers based on the created workflow steps
      const dispatch =
        reviewerIds.length > 0
          ? await notificationDispatcher.dispatch(tx, {
              companyId: context.companyId,
              eventCode: "COURSE_PUBLISHING_REVIEW_REQUESTED",
              recipientUserIds: reviewerIds,
              entityType: "COURSE_VERSION",
              entityId: String(version.id),
              occurrenceKey: `review-requested-${instance.id}`,
              actionUrl: `/?screen=hr-publishing&courseVersionId=${version.id}`,
              variables: {
                courseTitle: course.title,
                reviewDueText: "",
              },
            })
          : { emails: [], inAppCount: 0 };

      return { course, version, instance, dispatch, reviewerIds };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);

    return {
      courseId: result.course.id,
      courseVersionId: result.version.id,
      instanceId: result.instance?.id ?? null,
      notifiedReviewerCount: result.reviewerIds.length,
      workflowConfigured: result.instance != null,
      message: result.instance
        ? "Course created and submitted for review. Reviewers have been notified."
        : "Course created. No default approval workflow is configured, so no review was started.",
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

                  const workflowSteps = instance.workflow.steps;
      if (workflowSteps.length === 0) {
        throw new AppError(
          "Approval workflow has no steps configured.",
          422,
          ErrorCode.BUSINESS_RULE_VIOLATION,
        );
      }

      // Determine which step is currently pending a decision: the lowest-ordered
      // step that does not yet have an APPROVED decision recorded against it.
      const decisions = await coursePublishingRepository.findDecisions(tx, instanceId);
      const currentStep = workflowSteps.find(
        (s) => !decisions.some((d) => d.workflowStepId === s.id && d.status === "APPROVED"),
      );
      if (!currentStep) {
        throw new AppError(
          "Cannot advance this request: all approval steps already have a decision.",
          422,
          ErrorCode.BUSINESS_RULE_VIOLATION,
        );
      }

      // Record this approver's decision on the current step.
      await coursePublishingRepository.createDecision(tx, {
        companyId: context.companyId,
        instanceId,
        workflowStepId: currentStep.id,
        status: "APPROVED",
        decidedBy: context.userId,
        comment,
      });

      // Look for the next step in the workflow. If one exists, forward the
      // instance and notify ITS reviewers. Only when the final step is
      // approved do we publish.
      const nextStep =
        workflowSteps
          .filter((s) => s.approvalOrder > currentStep.approvalOrder)
          .sort((a, b) => a.approvalOrder - b.approvalOrder)[0] ?? null;

      if (nextStep) {
        const nextReviewers = await coursePublishingRepository.resolveStepReviewers(
          tx,
          context.companyId,
          nextStep,
        );
        // Instance remains PENDING — ownership passes to the next approver.
        await coursePublishingRepository.updateInstanceStatus(tx, instanceId, "PENDING", comment);
        const courseTitle = instance.courseVersion?.course.title ?? "Course";
        const dispatch =
          nextReviewers.length > 0
            ? await notificationDispatcher.dispatch(tx, {
                companyId: context.companyId,
                eventCode: "COURSE_PUBLISHING_REVIEW_REQUESTED",
                recipientUserIds: nextReviewers,
                entityType: "COURSE_VERSION",
                entityId: String(instance.courseVersionId),
                occurrenceKey: `review-forwarded-${instanceId}-step${nextStep.approvalOrder}`,
                actionUrl: `/?screen=hr-publishing&courseVersionId=${instance.courseVersionId}`,
                variables: {
                  courseTitle,
                  nextStepNote: `Forwarded to step ${nextStep.approvalOrder} of ${workflowSteps.length}. ${comment ? `Approver note: ${comment}` : ""}`,
                },
              })
            : { emails: [], inAppCount: 0 };
        return {
          instanceId,
          status: "PENDING",
          nextStep: nextStep.approvalOrder,
          message: `Step ${currentStep.approvalOrder} approved. Forwarding to step ${nextStep.approvalOrder}.`,
          dispatch,
        };
      }

      // Final step approved — complete the instance and publish the course.
      await coursePublishingRepository.updateInstanceStatus(tx, instanceId, "APPROVED", comment);
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

      return { instanceId, status: "APPROVED", message: "Course approved and published.", courseTitle, dispatch };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);

    return {
      instanceId,
      status: result.status,
      nextStep: (result as any).nextStep,
      message: result.message,
      courseTitle: (result as any).courseTitle,
    };
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
   * List all pending review instances for reviewers (admin/hr/manager).
   * Returns both PENDING and recently-APPROVED/REJECTED instances so the
   * reviewer can see the full history of what they actioned.
   */
  listPendingReviews(companyId: number) {
    return coursePublishingRepository.transaction(async (tx) => {
      return tx.approvalWorkflowInstance.findMany({
        where: {
          companyId,
          entityType: "COURSE_VERSION",
          // Show all non-cancelled instances so reviewers see history too
          status: { in: ["PENDING", "CHANGES_REQUESTED", "APPROVED", "REJECTED"] },
        },
        include: {
          courseVersion: {
            select: {
              id: true,
              // The current status of the CourseVersion itself — this is what
              // changes immediately when the final step approves.
              status: true,
              approvalStatus: true,
              course: { select: { id: true, title: true } },
              createdByUser: { select: { id: true, email: true } },
            },
          },
          submittedByUser: { select: { id: true, email: true } },
          decisions: {
            orderBy: { decidedAt: "desc" },
            take: 3,
            select: {
              status: true,
              comment: true,
              decidedAt: true,
              workflowStep: { select: { approvalOrder: true } },
            },
          },
          workflow: {
            select: {
              name: true,
              steps: {
                orderBy: { approvalOrder: "asc" },
                select: {
                  id: true,
                  approvalOrder: true,
                  approverRole: { select: { name: true } },
                },
              },
            },
          },
        },
        orderBy: { submittedAt: "desc" },
      });
    });
  },
};
