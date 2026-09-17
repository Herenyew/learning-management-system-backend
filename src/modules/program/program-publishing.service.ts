import { Permissions } from "../../common/constants/permission.constant.js";
import { AppError, ErrorCode } from "../../common/errors/index.js";
import { notificationDispatcher } from "../notifications/index.js";
import { programPublishingRepository } from "./program-publishing.repository.js";
import type {
  ProgramApprovalStep,
  PublishingTransaction,
} from "./program-publishing.repository.js";

type PublishingContext = {
  companyId: number;
  userId: number;
  employeeId?: string;
  permissions?: string[];
};

type DecisionSummary = { workflowStepId: number; status: string };
type Reviewer = Awaited<ReturnType<typeof programPublishingRepository.resolveStepReviewers>>[number];
type Dispatch = Awaited<ReturnType<typeof notificationDispatcher.dispatch>>;

const emptyDispatch = (): Dispatch => ({ emails: [], inAppCount: 0 });

const requiredSteps = <T extends ProgramApprovalStep>(steps: T[]): T[] =>
  steps.filter((step) => step.isRequired).sort((a, b) => a.approvalOrder - b.approvalOrder);

const currentRequiredStep = <T extends ProgramApprovalStep>(
  steps: T[],
  decisions: DecisionSummary[],
): T | null => {
  const approvedStepIds = new Set(
    decisions.filter((decision) => decision.status === "APPROVED").map((decision) => decision.workflowStepId),
  );
  return requiredSteps(steps).find((step) => !approvedStepIds.has(step.id)) ?? null;
};

const assertPending = (status: string, action: string) => {
  if (status !== "PENDING") {
    throw new AppError(
      `Cannot ${action} an instance with status "${status}".`,
      409,
      ErrorCode.CONFLICT,
    );
  }
};

const assertAssignedReviewer = async (
  tx: PublishingTransaction,
  context: PublishingContext,
  step: ProgramApprovalStep,
) => {
  const assigned = await programPublishingRepository.isUserAssignedToStep(
    tx,
    context.companyId,
    context.userId,
    step,
  );
  if (!assigned) {
    throw new AppError(
      "You are not assigned to approve the current workflow step.",
      403,
      ErrorCode.FORBIDDEN,
    );
  }
};

const assertWorkflowSteps = (steps: ProgramApprovalStep[]) => {
  if (steps.length === 0) {
    throw new AppError(
      "Approval workflow must contain at least one step.",
      422,
      ErrorCode.BUSINESS_RULE_VIOLATION,
      { issues: [{ field: "workflow.steps", message: "Add at least one approval step." }] },
    );
  }
};

const assertReadiness = async (
  tx: PublishingTransaction,
  context: PublishingContext,
  learningProgramId: number,
) => {
  const readiness = await programPublishingRepository.findProgramReadiness(
    tx,
    context.companyId,
    learningProgramId,
  );
  if (!readiness) {
    throw new AppError("Learning program not found.", 404, ErrorCode.NOT_FOUND);
  }

  const issues: Array<{ field: string; message: string }> = [];
  const today = new Date();
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());

  if (!readiness.startDate) {
    issues.push({ field: "startDate", message: "Set a program start date." });
  }
  if (!readiness.endDate) {
    issues.push({ field: "endDate", message: "Set a program end date." });
  }
  if (readiness.startDate && readiness.endDate && readiness.endDate <= readiness.startDate) {
    issues.push({ field: "endDate", message: "End date must be after the start date." });
  }
  if (readiness.endDate && readiness.endDate.getTime() < todayUtc) {
    issues.push({ field: "endDate", message: "End date must be today or in the future." });
  }
  if (readiness.targetAudienceCount === 0) {
    issues.push({ field: "targetAudiences", message: "Add at least one target audience." });
  }
  if (readiness.cohortCount === 0) {
    issues.push({ field: "cohorts", message: "Add at least one cohort." });
  }
  if (readiness.requiredCourseCount === 0 && readiness.requiredTaskCount === 0) {
    issues.push({
      field: "content",
      message: "Add at least one required course or one required task.",
    });
  }

  if (issues.length > 0) {
    throw new AppError(
      "Program is not ready to submit for approval.",
      422,
      ErrorCode.BUSINESS_RULE_VIOLATION,
      { issues },
    );
  }
};

const auditStepApproval = (
  tx: PublishingTransaction,
  context: PublishingContext,
  learningProgramId: number,
  instanceId: number,
  step: ProgramApprovalStep,
  autoApproved: boolean,
  comment?: string,
) =>
  programPublishingRepository.createAuditLog(tx, {
    companyId: context.companyId,
    actorUserId: context.userId,
    entityId: String(learningProgramId),
    action: "PROGRAM_APPROVAL_STEP_APPROVED",
    beforeJson: { instanceId, stepId: step.id, approvalOrder: step.approvalOrder, status: "PENDING" },
    afterJson: {
      instanceId,
      stepId: step.id,
      approvalOrder: step.approvalOrder,
      status: "APPROVED",
      autoApproved,
      ...(comment ? { comment } : {}),
    },
  });

const processAutoApproveSteps = async (
  tx: PublishingTransaction,
  context: PublishingContext,
  learningProgramId: number,
  instanceId: number,
  steps: ProgramApprovalStep[],
  decisions: DecisionSummary[],
) => {
  const accumulated = [...decisions];
  let current = currentRequiredStep(steps, accumulated);

  while (current?.autoApprove) {
    await programPublishingRepository.createDecision(tx, {
      companyId: context.companyId,
      instanceId,
      workflowStepId: current.id,
      status: "APPROVED",
      decidedBy: context.userId,
      comment: "Automatically approved by workflow configuration.",
    });
    await auditStepApproval(tx, context, learningProgramId, instanceId, current, true);
    accumulated.push({ workflowStepId: current.id, status: "APPROVED" });
    current = currentRequiredStep(steps, accumulated);
  }

  return current;
};

const dispatchStepReview = async (
  tx: PublishingTransaction,
  context: PublishingContext,
  learningProgramId: number,
  instanceId: number,
  programName: string,
  step: ProgramApprovalStep,
  reviewers: Reviewer[],
  comment?: string,
) =>
  reviewers.length > 0
    ? notificationDispatcher.dispatch(tx, {
      companyId: context.companyId,
      eventCode: "PROGRAM_PUBLISHING_REVIEW_REQUESTED",
      recipientUserIds: reviewers.map((reviewer) => reviewer.id),
      entityType: "LEARNING_PROGRAM",
      entityId: String(learningProgramId),
      occurrenceKey: `review-requested-${instanceId}-step-${step.id}`,
      actionUrl: `/?screen=program-detail&programId=${learningProgramId}`,
      variables: {
        programName,
        reviewDueText: ` Step ${step.approvalOrder}.${comment ? ` Note: ${comment}` : ""}`,
      },
    })
    : emptyDispatch();

const publishProgram = async (
  tx: PublishingTransaction,
  context: PublishingContext,
  data: {
    learningProgramId: number;
    instanceId: number;
    programName: string;
    creatorId?: number | null;
    comment?: string;
  },
) => {
  await programPublishingRepository.updateInstanceStatus(tx, data.instanceId, "APPROVED", data.comment);
  await programPublishingRepository.updateLearningProgramStatus(tx, data.learningProgramId, {
    status: "ACTIVE",
    approvalStatus: "APPROVED",
    updatedBy: context.userId,
  });
  await programPublishingRepository.createAuditLog(tx, {
    companyId: context.companyId,
    actorUserId: context.userId,
    entityId: String(data.learningProgramId),
    action: "PROGRAM_PUBLISHED",
    beforeJson: { instanceId: data.instanceId, status: "DRAFT", approvalStatus: "PENDING" },
    afterJson: { instanceId: data.instanceId, status: "ACTIVE", approvalStatus: "APPROVED" },
  });

  return data.creatorId
    ? notificationDispatcher.dispatch(tx, {
      companyId: context.companyId,
      eventCode: "PROGRAM_PUBLISHED",
      recipientUserIds: [data.creatorId],
      entityType: "LEARNING_PROGRAM",
      entityId: String(data.learningProgramId),
      occurrenceKey: `published-${data.instanceId}`,
      actionUrl: `/?screen=program-detail&programId=${data.learningProgramId}`,
      variables: {
        programName: data.programName,
        reviewerNote: data.comment ? ` Reviewer note: ${data.comment}` : "",
      },
    })
    : emptyDispatch();
};

export const programPublishingService = {
  async getApprovalRequirements(context: PublishingContext, learningProgramId: number) {
    return programPublishingRepository.transaction(async (tx) => {
      const program = await programPublishingRepository.findLearningProgram(
        tx,
        context.companyId,
        learningProgramId,
      );
      if (!program) {
        throw new AppError("Learning program not found.", 404, ErrorCode.NOT_FOUND);
      }

      const [configuredWorkflow, activeInstance, latestInstance] = await Promise.all([
        programPublishingRepository.findDefaultWorkflowForProgram(tx, context.companyId),
        programPublishingRepository.findExistingInstance(tx, context.companyId, learningProgramId),
        programPublishingRepository.findLatestInstance(tx, context.companyId, learningProgramId),
      ]);
      const activeDetails = activeInstance
        ? await programPublishingRepository.findInstanceById(tx, context.companyId, activeInstance.id)
        : null;
      const workflow = activeDetails?.workflow ?? configuredWorkflow;
      const decisions = activeDetails
        ? await programPublishingRepository.findDecisions(tx, activeDetails.id)
        : [];
      const exposeCurrentStep = Boolean(activeDetails) || latestInstance === null;
      const currentStep = workflow && exposeCurrentStep
        ? currentRequiredStep(workflow.steps, decisions)
        : null;
      const reviewers = currentStep
        ? await programPublishingRepository.resolveStepReviewers(tx, context.companyId, currentStep)
        : [];
      const canReview = Boolean(
        activeDetails &&
        currentStep &&
        !currentStep.autoApprove &&
        (await programPublishingRepository.isUserAssignedToStep(
          tx,
          context.companyId,
          context.userId,
          currentStep,
        )),
      );

      return {
        program: {
          id: program.id,
          name: program.name,
          status: program.status,
          approvalStatus: program.approvalStatus,
        },
        workflow: workflow
          ? {
            id: workflow.id,
            name: workflow.name,
            steps: workflow.steps.map((step) => ({
              id: step.id,
              approvalOrder: step.approvalOrder,
              approverRoleName: step.approverRole?.name ?? null,
              approverEmployeeName: step.approver?.fullName ?? null,
              isRequired: step.isRequired,
              autoApprove: step.autoApprove,
            })),
            reviewers: reviewers.map((reviewer) => ({
              id: reviewer.id,
              email: reviewer.email,
              name: reviewer.employee?.fullName ?? reviewer.email,
            })),
          }
          : null,
        currentStep: currentStep?.approvalOrder ?? null,
        instance: latestInstance ?? {
          id: null,
          status: "NOT_SUBMITTED",
          submittedAt: null,
          completedAt: null,
          latestComment: null,
          decisions: [],
        },
        canReview,
        canSubmit: program.status === "DRAFT" && activeInstance === null,
      };
    });
  },

  async submitForReview(
    context: PublishingContext,
    learningProgramId: number,
    comment?: string,
  ) {
    const result = await programPublishingRepository.transaction(async (tx) => {
      const program = await programPublishingRepository.findLearningProgram(
        tx,
        context.companyId,
        learningProgramId,
      );
      if (!program) {
        throw new AppError("Learning program not found.", 404, ErrorCode.NOT_FOUND);
      }
      if (program.status !== "DRAFT") {
        throw new AppError(
          "Only a draft learning program can be submitted for review.",
          409,
          ErrorCode.CONFLICT,
        );
      }

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

      await assertReadiness(tx, context, learningProgramId);

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
      assertWorkflowSteps(workflow.steps);

      const reviewersByStep = new Map<number, Reviewer[]>();
      const reviewerlessSteps: number[] = [];
      for (const step of requiredSteps(workflow.steps)) {
        if (step.autoApprove) continue;
        const reviewers = await programPublishingRepository.resolveStepReviewers(
          tx,
          context.companyId,
          step,
        );
        reviewersByStep.set(step.id, reviewers);
        if (reviewers.length === 0) reviewerlessSteps.push(step.approvalOrder);
      }
      if (reviewerlessSteps.length > 0) {
        throw new AppError(
          "Approval workflow has required manual steps with no active reviewers.",
          422,
          ErrorCode.BUSINESS_RULE_VIOLATION,
          {
            issues: reviewerlessSteps.map((approvalOrder) => ({
              field: `workflow.steps.${approvalOrder}`,
              message: `Assign at least one active reviewer to required step ${approvalOrder}.`,
            })),
          },
        );
      }

      const instance = await programPublishingRepository.createInstance(tx, {
        companyId: context.companyId,
        workflowId: workflow.id,
        learningProgramId,
        submittedBy: context.userId,
      });
      await programPublishingRepository.updateLearningProgramStatus(tx, learningProgramId, {
        approvalStatus: "PENDING",
        updatedBy: context.userId,
      });
      await programPublishingRepository.createAuditLog(tx, {
        companyId: context.companyId,
        actorUserId: context.userId,
        entityId: String(learningProgramId),
        action: "PROGRAM_APPROVAL_SUBMITTED",
        beforeJson: { status: program.status, approvalStatus: program.approvalStatus },
        afterJson: {
          status: "DRAFT",
          approvalStatus: "PENDING",
          instanceId: instance.id,
          workflowId: workflow.id,
        },
      });

      const currentStep = await processAutoApproveSteps(
        tx,
        context,
        learningProgramId,
        instance.id,
        workflow.steps,
        [],
      );
      if (!currentStep) {
        const dispatch = await publishProgram(tx, context, {
          learningProgramId,
          instanceId: instance.id,
          programName: program.name,
          creatorId: program.createdBy,
          comment,
        });
        return { instance, status: "APPROVED" as const, currentStep: null, dispatch };
      }

      const dispatch = await dispatchStepReview(
        tx,
        context,
        learningProgramId,
        instance.id,
        program.name,
        currentStep,
        reviewersByStep.get(currentStep.id) ?? [],
        comment,
      );
      return {
        instance,
        status: "PENDING" as const,
        currentStep: currentStep.approvalOrder,
        dispatch,
      };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);
    return {
      learningProgramId,
      instanceId: result.instance.id,
      status: result.status,
      currentStep: result.currentStep,
      message:
        result.status === "APPROVED"
          ? "Program automatically approved and activated."
          : "Program submitted for review. Current-step reviewers have been notified.",
    };
  },

  async approveProgram(context: PublishingContext, instanceId: number, comment?: string) {
    const result = await programPublishingRepository.transaction(async (tx) => {
      const instance = await programPublishingRepository.findInstanceById(
        tx,
        context.companyId,
        instanceId,
      );
      if (!instance) {
        throw new AppError("Approval instance not found.", 404, ErrorCode.NOT_FOUND);
      }
      assertPending(instance.status, "approve");
      assertWorkflowSteps(instance.workflow.steps);

      const decisions = await programPublishingRepository.findDecisions(tx, instanceId);
      const currentStep = currentRequiredStep(instance.workflow.steps, decisions);
      if (!currentStep) {
        throw new AppError(
          "Cannot advance this request: all required approval steps are resolved.",
          409,
          ErrorCode.CONFLICT,
        );
      }
      if (currentStep.autoApprove) {
        throw new AppError(
          "The current workflow step is automatic and cannot be reviewed manually.",
          409,
          ErrorCode.CONFLICT,
        );
      }
      await assertAssignedReviewer(tx, context, currentStep);

      await programPublishingRepository.createDecision(tx, {
        companyId: context.companyId,
        instanceId,
        workflowStepId: currentStep.id,
        status: "APPROVED",
        decidedBy: context.userId,
        comment,
      });
      await auditStepApproval(
        tx,
        context,
        instance.learningProgramId!,
        instanceId,
        currentStep,
        false,
        comment,
      );

      const nextStep = await processAutoApproveSteps(
        tx,
        context,
        instance.learningProgramId!,
        instanceId,
        instance.workflow.steps,
        [...decisions, { workflowStepId: currentStep.id, status: "APPROVED" }],
      );
      const programName = instance.learningProgram?.name ?? "Program";
      if (!nextStep) {
        const dispatch = await publishProgram(tx, context, {
          learningProgramId: instance.learningProgramId!,
          instanceId,
          programName,
          creatorId: instance.learningProgram?.createdBy,
          comment,
        });
        return { status: "APPROVED" as const, currentStep: null, dispatch };
      }

      const reviewers = await programPublishingRepository.resolveStepReviewers(
        tx,
        context.companyId,
        nextStep,
      );
      if (reviewers.length === 0) {
        throw new AppError(
          `Required approval step ${nextStep.approvalOrder} has no active reviewers.`,
          422,
          ErrorCode.BUSINESS_RULE_VIOLATION,
          {
            issues: [{
              field: `workflow.steps.${nextStep.approvalOrder}`,
              message: "Assign at least one active reviewer before advancing this request.",
            }],
          },
        );
      }
      const dispatch = await dispatchStepReview(
        tx,
        context,
        instance.learningProgramId!,
        instanceId,
        programName,
        nextStep,
        reviewers,
        comment,
      );
      return { status: "PENDING" as const, currentStep: nextStep.approvalOrder, dispatch };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);
    return {
      instanceId,
      status: result.status,
      currentStep: result.currentStep,
      message:
        result.status === "APPROVED"
          ? "Program approved and activated."
          : `Step approved. Program advanced to step ${result.currentStep}.`,
    };
  },

  async rejectProgram(context: PublishingContext, instanceId: number, comment: string) {
    const result = await programPublishingRepository.transaction(async (tx) => {
      const instance = await programPublishingRepository.findInstanceById(
        tx,
        context.companyId,
        instanceId,
      );
      if (!instance) throw new AppError("Approval instance not found.", 404, ErrorCode.NOT_FOUND);
      assertPending(instance.status, "reject");
      assertWorkflowSteps(instance.workflow.steps);

      const decisions = await programPublishingRepository.findDecisions(tx, instanceId);
      const currentStep = currentRequiredStep(instance.workflow.steps, decisions);
      if (!currentStep || currentStep.autoApprove) {
        throw new AppError("There is no manual current step to reject.", 409, ErrorCode.CONFLICT);
      }
      await assertAssignedReviewer(tx, context, currentStep);
      await programPublishingRepository.createDecision(tx, {
        companyId: context.companyId,
        instanceId,
        workflowStepId: currentStep.id,
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
      await programPublishingRepository.createAuditLog(tx, {
        companyId: context.companyId,
        actorUserId: context.userId,
        entityId: String(instance.learningProgramId),
        action: "PROGRAM_APPROVAL_REJECTED",
        beforeJson: { instanceId, stepId: currentStep.id, status: "PENDING" },
        afterJson: { instanceId, stepId: currentStep.id, status: "REJECTED", comment },
      });

      const creatorId = instance.learningProgram?.createdBy;
      const dispatch = creatorId
        ? await notificationDispatcher.dispatch(tx, {
          companyId: context.companyId,
          eventCode: "PROGRAM_REJECTED",
          recipientUserIds: [creatorId],
          entityType: "LEARNING_PROGRAM",
          entityId: String(instance.learningProgramId),
          occurrenceKey: `rejected-${instanceId}-step-${currentStep.id}`,
          actionUrl: `/?screen=program-detail&programId=${instance.learningProgramId}`,
          variables: {
            programName: instance.learningProgram?.name ?? "Program",
            reviewerNote: ` Reason: ${comment}`,
          },
        })
        : emptyDispatch();
      return { dispatch };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);
    return { instanceId, status: "REJECTED", message: "Program rejected." };
  },

  async requestChanges(context: PublishingContext, instanceId: number, comment: string) {
    const result = await programPublishingRepository.transaction(async (tx) => {
      const instance = await programPublishingRepository.findInstanceById(
        tx,
        context.companyId,
        instanceId,
      );
      if (!instance) throw new AppError("Approval instance not found.", 404, ErrorCode.NOT_FOUND);
      assertPending(instance.status, "request changes on");
      assertWorkflowSteps(instance.workflow.steps);

      const decisions = await programPublishingRepository.findDecisions(tx, instanceId);
      const currentStep = currentRequiredStep(instance.workflow.steps, decisions);
      if (!currentStep || currentStep.autoApprove) {
        throw new AppError(
          "There is no manual current step on which to request changes.",
          409,
          ErrorCode.CONFLICT,
        );
      }
      await assertAssignedReviewer(tx, context, currentStep);
      await programPublishingRepository.createDecision(tx, {
        companyId: context.companyId,
        instanceId,
        workflowStepId: currentStep.id,
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
      await programPublishingRepository.updateLearningProgramStatus(
        tx,
        instance.learningProgramId!,
        { approvalStatus: "CANCELLED", updatedBy: context.userId },
      );
      await programPublishingRepository.createAuditLog(tx, {
        companyId: context.companyId,
        actorUserId: context.userId,
        entityId: String(instance.learningProgramId),
        action: "PROGRAM_CHANGES_REQUESTED",
        beforeJson: { instanceId, stepId: currentStep.id, status: "PENDING" },
        afterJson: {
          instanceId,
          stepId: currentStep.id,
          status: "CHANGES_REQUESTED",
          comment,
          cycleClosed: true,
        },
      });

      const creatorId = instance.learningProgram?.createdBy;
      const dispatch = creatorId
        ? await notificationDispatcher.dispatch(tx, {
          companyId: context.companyId,
          eventCode: "PROGRAM_REVISION_REQUESTED",
          recipientUserIds: [creatorId],
          entityType: "LEARNING_PROGRAM",
          entityId: String(instance.learningProgramId),
          occurrenceKey: `revision-${instanceId}-step-${currentStep.id}`,
          actionUrl: `/?screen=program-detail&programId=${instance.learningProgramId}`,
          variables: {
            programName: instance.learningProgram?.name ?? "Program",
            reviewerNote: ` Requested changes: ${comment}`,
          },
        })
        : emptyDispatch();
      return { dispatch };
    });

    await notificationDispatcher.deliverAfterCommit(result.dispatch);
    return {
      instanceId,
      status: "CHANGES_REQUESTED",
      message: "Changes requested. This review cycle is closed and the creator may resubmit.",
    };
  },

  async listPendingReviews(context: PublishingContext) {
    return programPublishingRepository.transaction(async (tx) => {
      const instances = await programPublishingRepository.listPendingInstances(tx, context.companyId);
      const scoped = [];
      for (const instance of instances) {
        const currentStep = currentRequiredStep(instance.workflow.steps, instance.decisions);
        if (
          !currentStep ||
          currentStep.autoApprove ||
          !(await programPublishingRepository.isUserAssignedToStep(
            tx,
            context.companyId,
            context.userId,
            currentStep,
          ))
        ) {
          continue;
        }
        scoped.push({ ...instance, currentStep: currentStep.approvalOrder });
      }
      return scoped;
    });
  },

  async withdraw(context: PublishingContext, instanceId: number, comment?: string) {
    return programPublishingRepository.transaction(async (tx) => {
      const instance = await programPublishingRepository.findInstanceById(
        tx,
        context.companyId,
        instanceId,
      );
      if (!instance) throw new AppError("Approval instance not found.", 404, ErrorCode.NOT_FOUND);
      assertPending(instance.status, "withdraw");

      const program = instance.learningProgram;
      const authorized =
        instance.submittedBy === context.userId ||
        program?.createdBy === context.userId ||
        (Boolean(context.employeeId) && program?.ownerEmployeeId === context.employeeId) ||
        context.permissions?.includes(Permissions.PROGRAM_PUBLISH);
      if (!authorized) {
        throw new AppError(
          "Only the submitter, program owner, or a program publisher can withdraw this review.",
          403,
          ErrorCode.FORBIDDEN,
        );
      }

      await programPublishingRepository.updateInstanceStatus(tx, instanceId, "CANCELLED", comment);
      await programPublishingRepository.updateLearningProgramStatus(
        tx,
        instance.learningProgramId!,
        { approvalStatus: "CANCELLED", updatedBy: context.userId },
      );
      await programPublishingRepository.createAuditLog(tx, {
        companyId: context.companyId,
        actorUserId: context.userId,
        entityId: String(instance.learningProgramId),
        action: "PROGRAM_APPROVAL_WITHDRAWN",
        beforeJson: { instanceId, status: "PENDING" },
        afterJson: { instanceId, status: "CANCELLED", ...(comment ? { comment } : {}) },
      });

      return { instanceId, status: "CANCELLED", message: "Program review withdrawn." };
    });
  },
};
