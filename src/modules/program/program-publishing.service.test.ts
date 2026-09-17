import { afterEach, describe, expect, it, vi } from "vitest";

import { notificationDispatcher } from "../notifications/index.js";
import { programPublishingRepository } from "./program-publishing.repository.js";
import { programPublishingService } from "./program-publishing.service.js";

const tx = {} as never;
const context = { companyId: 5, userId: 4, employeeId: "EMP-4", permissions: [] };

const step = (overrides: Record<string, unknown> = {}) => ({
  id: 11,
  approvalOrder: 1,
  approverRoleId: 7,
  approverEmployeeId: null,
  isRequired: true,
  autoApprove: false,
  timeoutDays: 3,
  approverRole: { id: 7, name: "HR Manager" },
  approver: null,
  ...overrides,
});

const program = {
  id: 9,
  companyId: 5,
  name: "Leadership Program",
  status: "DRAFT",
  approvalStatus: "PENDING",
  createdBy: 4,
  ownerEmployeeId: "EMP-4",
} as const;

const workflow = (steps = [step()]) => ({
  id: 21,
  companyId: 5,
  name: "Program Approval",
  entityType: "LEARNING_PROGRAM",
  description: null,
  isDefault: true,
  isSystem: false,
  isActive: true,
  createdBy: 4,
  updatedBy: null,
  createdAt: new Date("2026-08-01T00:00:00.000Z"),
  updatedAt: new Date("2026-08-01T00:00:00.000Z"),
  deletedAt: null,
  steps,
});

const instance = (overrides: Record<string, unknown> = {}) => ({
  id: 31,
  companyId: 5,
  workflowId: 21,
  entityType: "LEARNING_PROGRAM",
  courseVersionId: null,
  learningProgramId: 9,
  trainingNeedRequestId: null,
  status: "PENDING",
  submittedBy: 4,
  submittedAt: new Date("2026-09-01T10:00:00.000Z"),
  completedAt: null,
  latestComment: null,
  createdAt: new Date("2026-09-01T10:00:00.000Z"),
  updatedAt: new Date("2026-09-01T10:00:00.000Z"),
  workflow: workflow(),
  learningProgram: {
    id: 9,
    name: "Leadership Program",
    createdBy: 4,
    ownerEmployeeId: "EMP-4",
  },
  ...overrides,
});

const reviewer = {
  id: 12,
  email: "reviewer@example.com",
  employee: { fullName: "Program Reviewer" },
};

const ready = () => ({
  startDate: new Date(Date.now() + 86_400_000),
  endDate: new Date(Date.now() + 7 * 86_400_000),
  targetAudienceCount: 1,
  cohortCount: 1,
  requiredCourseCount: 1,
  requiredTaskCount: 0,
});

const mockTransaction = () =>
  vi.spyOn(programPublishingRepository, "transaction").mockImplementation(async (operation) =>
    operation(tx),
  );

const mockDispatch = () => {
  vi.spyOn(notificationDispatcher, "dispatch").mockResolvedValue({ emails: [], inAppCount: 1 });
  vi.spyOn(notificationDispatcher, "deliverAfterCommit").mockResolvedValue(undefined);
};

const mockWrites = () => {
  vi.spyOn(programPublishingRepository, "createDecision").mockResolvedValue({} as never);
  vi.spyOn(programPublishingRepository, "createAuditLog").mockResolvedValue({ id: "audit" } as never);
  vi.spyOn(programPublishingRepository, "updateInstanceStatus").mockResolvedValue({} as never);
  vi.spyOn(programPublishingRepository, "updateLearningProgramStatus").mockResolvedValue({} as never);
};

const mockSubmission = (configuredWorkflow = workflow()) => {
  mockTransaction();
  mockDispatch();
  mockWrites();
  vi.spyOn(programPublishingRepository, "findLearningProgram").mockResolvedValue(program as never);
  vi.spyOn(programPublishingRepository, "findExistingInstance").mockResolvedValue(null);
  vi.spyOn(programPublishingRepository, "findProgramReadiness").mockResolvedValue(ready());
  vi.spyOn(programPublishingRepository, "findDefaultWorkflowForProgram").mockResolvedValue(
    configuredWorkflow as never,
  );
  vi.spyOn(programPublishingRepository, "createInstance").mockResolvedValue({
    id: 31,
    status: "PENDING",
    workflowId: 21,
  });
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe("programPublishingService ordered approval", () => {
  it("approves only the current step and notifies only the next step reviewers", async () => {
    const steps = [step(), step({ id: 12, approvalOrder: 2, approverRoleId: 8 })];
    mockTransaction();
    mockDispatch();
    mockWrites();
    vi.spyOn(programPublishingRepository, "findInstanceById").mockResolvedValue(
      instance({ workflow: workflow(steps) }) as never,
    );
    vi.spyOn(programPublishingRepository, "findDecisions").mockResolvedValue([]);
    vi.spyOn(programPublishingRepository, "isUserAssignedToStep").mockResolvedValue(true);
    vi.spyOn(programPublishingRepository, "resolveStepReviewers").mockResolvedValue([reviewer]);

    await expect(programPublishingService.approveProgram(context, 31, "Looks good")).resolves.toMatchObject({
      status: "PENDING",
      currentStep: 2,
    });

    expect(programPublishingRepository.createDecision).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ workflowStepId: 11, status: "APPROVED" }),
    );
    expect(programPublishingRepository.updateLearningProgramStatus).not.toHaveBeenCalled();
    expect(programPublishingRepository.createAuditLog).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: "PROGRAM_APPROVAL_STEP_APPROVED" }),
    );
    expect(notificationDispatcher.dispatch).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        recipientUserIds: [12],
        occurrenceKey: "review-requested-31-step-12",
      }),
    );
  });

  it("activates the program only after the final required step", async () => {
    const steps = [step(), step({ id: 12, approvalOrder: 2, approverRoleId: 8 })];
    mockTransaction();
    mockDispatch();
    mockWrites();
    vi.spyOn(programPublishingRepository, "findInstanceById").mockResolvedValue(
      instance({ workflow: workflow(steps) }) as never,
    );
    vi.spyOn(programPublishingRepository, "findDecisions").mockResolvedValue([
      { workflowStepId: 11, status: "APPROVED" },
    ]);
    vi.spyOn(programPublishingRepository, "isUserAssignedToStep").mockResolvedValue(true);

    await expect(programPublishingService.approveProgram(context, 31)).resolves.toMatchObject({
      status: "APPROVED",
      currentStep: null,
    });

    expect(programPublishingRepository.createDecision).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ workflowStepId: 12 }),
    );
    expect(programPublishingRepository.updateLearningProgramStatus).toHaveBeenCalledWith(
      tx,
      9,
      expect.objectContaining({ status: "ACTIVE", approvalStatus: "APPROVED" }),
    );
    expect(programPublishingRepository.createAuditLog).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: "PROGRAM_PUBLISHED" }),
    );
  });

  it("processes auto-approve steps and notifies the first manual current step", async () => {
    const steps = [
      step({ autoApprove: true, approverRoleId: null }),
      step({ id: 12, approvalOrder: 2, approverRoleId: 8 }),
    ];
    mockSubmission(workflow(steps));
    vi.spyOn(programPublishingRepository, "resolveStepReviewers").mockResolvedValue([reviewer]);

    await expect(programPublishingService.submitForReview(context, 9)).resolves.toMatchObject({
      status: "PENDING",
      currentStep: 2,
    });

    expect(programPublishingRepository.createDecision).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ workflowStepId: 11, status: "APPROVED" }),
    );
    expect(programPublishingRepository.createAuditLog).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: "PROGRAM_APPROVAL_SUBMITTED" }),
    );
    expect(programPublishingRepository.createAuditLog).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        action: "PROGRAM_APPROVAL_STEP_APPROVED",
        afterJson: expect.objectContaining({ autoApproved: true }),
      }),
    );
    expect(notificationDispatcher.dispatch).toHaveBeenCalledTimes(1);
    expect(notificationDispatcher.dispatch).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ occurrenceKey: "review-requested-31-step-12" }),
    );
  });

  it("authorizes against the unresolved current step rather than the first step", async () => {
    const steps = [step(), step({ id: 12, approvalOrder: 2, approverRoleId: 8 })];
    mockTransaction();
    vi.spyOn(programPublishingRepository, "findInstanceById").mockResolvedValue(
      instance({ workflow: workflow(steps) }) as never,
    );
    vi.spyOn(programPublishingRepository, "findDecisions").mockResolvedValue([
      { workflowStepId: 11, status: "APPROVED" },
    ]);
    vi.spyOn(programPublishingRepository, "isUserAssignedToStep").mockResolvedValue(false);
    const createDecision = vi.spyOn(programPublishingRepository, "createDecision");

    await expect(programPublishingService.approveProgram({ ...context, userId: 99 }, 31)).rejects.toMatchObject({
      statusCode: 403,
      message: "You are not assigned to approve the current workflow step.",
    });
    expect(programPublishingRepository.isUserAssignedToStep).toHaveBeenCalledWith(
      tx,
      5,
      99,
      expect.objectContaining({ id: 12 }),
    );
    expect(createDecision).not.toHaveBeenCalled();
  });

  it.each([
    ["reject", () => programPublishingService.rejectProgram({ ...context, userId: 99 }, 31, "No")],
    ["request changes", () =>
      programPublishingService.requestChanges({ ...context, userId: 99 }, 31, "Revise")],
  ])("does not let an unassigned actor %s on the current step", async (_action, invoke) => {
    const steps = [step(), step({ id: 12, approvalOrder: 2, approverRoleId: 8 })];
    mockTransaction();
    vi.spyOn(programPublishingRepository, "findInstanceById").mockResolvedValue(
      instance({ workflow: workflow(steps) }) as never,
    );
    vi.spyOn(programPublishingRepository, "findDecisions").mockResolvedValue([
      { workflowStepId: 11, status: "APPROVED" },
    ]);
    vi.spyOn(programPublishingRepository, "isUserAssignedToStep").mockResolvedValue(false);
    const createDecision = vi.spyOn(programPublishingRepository, "createDecision");

    await expect(invoke()).rejects.toMatchObject({ statusCode: 403 });
    expect(createDecision).not.toHaveBeenCalled();
  });

  it.each(["approve", "reject"])("does not allow %s on a changes-requested cycle", async (action) => {
    mockTransaction();
    vi.spyOn(programPublishingRepository, "findInstanceById").mockResolvedValue(
      instance({ status: "CHANGES_REQUESTED" }) as never,
    );

    const invoke = action === "approve"
      ? programPublishingService.approveProgram(context, 31)
      : programPublishingService.rejectProgram(context, 31, "No");
    await expect(invoke).rejects.toMatchObject({ statusCode: 409 });
  });
});

describe("programPublishingService submission lifecycle", () => {
  it("treats only PENDING and actual DRAFT instances as active", async () => {
    const findFirst = vi.fn().mockResolvedValue(null);
    await programPublishingRepository.findExistingInstance(
      { approvalWorkflowInstance: { findFirst } } as never,
      5,
      9,
    );

    expect(findFirst).toHaveBeenCalledWith({
      where: {
        companyId: 5,
        learningProgramId: 9,
        status: { in: ["PENDING", "DRAFT"] },
      },
      select: { id: true, status: true, workflowId: true },
    });
  });

  it("closes a change-request cycle and allows a new instance on resubmission", async () => {
    mockTransaction();
    mockDispatch();
    mockWrites();
    vi.spyOn(programPublishingRepository, "findInstanceById").mockResolvedValue(instance() as never);
    vi.spyOn(programPublishingRepository, "findDecisions").mockResolvedValue([]);
    vi.spyOn(programPublishingRepository, "isUserAssignedToStep").mockResolvedValue(true);

    await expect(programPublishingService.requestChanges(context, 31, "Add exercises")).resolves.toMatchObject({
      status: "CHANGES_REQUESTED",
    });
    expect(programPublishingRepository.updateInstanceStatus).toHaveBeenCalledWith(
      tx,
      31,
      "CHANGES_REQUESTED",
      "Add exercises",
    );
    expect(programPublishingRepository.updateLearningProgramStatus).toHaveBeenCalledWith(
      tx,
      9,
      expect.objectContaining({ approvalStatus: "CANCELLED" }),
    );
    expect(programPublishingRepository.createAuditLog).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: "PROGRAM_CHANGES_REQUESTED" }),
    );

    vi.restoreAllMocks();
    mockSubmission();
    vi.spyOn(programPublishingRepository, "resolveStepReviewers").mockResolvedValue([reviewer]);
    vi.spyOn(programPublishingRepository, "createInstance").mockResolvedValue({
      id: 32,
      status: "PENDING",
      workflowId: 21,
    });

    await expect(programPublishingService.submitForReview(context, 9)).resolves.toMatchObject({
      instanceId: 32,
      status: "PENDING",
    });
  });

  it("rejects a workflow whose required manual step has no active reviewer", async () => {
    mockSubmission();
    vi.spyOn(programPublishingRepository, "resolveStepReviewers").mockResolvedValue([]);

    await expect(programPublishingService.submitForReview(context, 9)).rejects.toMatchObject({
      statusCode: 422,
      details: {
        issues: [expect.objectContaining({ field: "workflow.steps.1" })],
      },
    });
    expect(programPublishingRepository.createInstance).not.toHaveBeenCalled();
  });

  it("returns actionable readiness details before creating an approval instance", async () => {
    mockSubmission();
    vi.spyOn(programPublishingRepository, "findProgramReadiness").mockResolvedValue({
      startDate: null,
      endDate: new Date("2020-01-01T00:00:00.000Z"),
      targetAudienceCount: 0,
      cohortCount: 0,
      requiredCourseCount: 0,
      requiredTaskCount: 0,
    });

    await expect(programPublishingService.submitForReview(context, 9)).rejects.toMatchObject({
      statusCode: 422,
      message: "Program is not ready to submit for approval.",
      details: {
        issues: expect.arrayContaining([
          expect.objectContaining({ field: "startDate" }),
          expect.objectContaining({ field: "endDate" }),
          expect.objectContaining({ field: "targetAudiences" }),
          expect.objectContaining({ field: "cohorts" }),
          expect.objectContaining({ field: "content" }),
        ]),
      },
    });
    expect(programPublishingRepository.createInstance).not.toHaveBeenCalled();
  });
});

describe("programPublishingService approval requirements and queues", () => {
  it("returns full steps, current-step reviewers, current order, and actor capabilities", async () => {
    const steps = [step(), step({ id: 12, approvalOrder: 2, approverRoleId: 8 })];
    mockTransaction();
    vi.spyOn(programPublishingRepository, "findLearningProgram").mockResolvedValue(program as never);
    vi.spyOn(programPublishingRepository, "findDefaultWorkflowForProgram").mockResolvedValue(
      workflow(steps) as never,
    );
    vi.spyOn(programPublishingRepository, "findExistingInstance").mockResolvedValue({
      id: 31,
      status: "PENDING",
      workflowId: 21,
    });
    vi.spyOn(programPublishingRepository, "findLatestInstance").mockResolvedValue({
      id: 31,
      status: "PENDING",
      submittedAt: new Date(),
      completedAt: null,
      latestComment: null,
      decisions: [],
    });
    vi.spyOn(programPublishingRepository, "findInstanceById").mockResolvedValue(
      instance({ workflow: workflow(steps) }) as never,
    );
    vi.spyOn(programPublishingRepository, "findDecisions").mockResolvedValue([
      { workflowStepId: 11, status: "APPROVED" },
    ]);
    vi.spyOn(programPublishingRepository, "resolveStepReviewers").mockResolvedValue([reviewer]);
    vi.spyOn(programPublishingRepository, "isUserAssignedToStep").mockResolvedValue(true);

    await expect(programPublishingService.getApprovalRequirements(context, 9)).resolves.toMatchObject({
      workflow: {
        steps: [{ approvalOrder: 1 }, { approvalOrder: 2 }],
        reviewers: [{ id: 12, name: "Program Reviewer" }],
      },
      currentStep: 2,
      instance: { id: 31, status: "PENDING" },
      canReview: true,
      canSubmit: false,
    });
  });

  it("distinguishes a never-submitted draft and permits submission", async () => {
    mockTransaction();
    vi.spyOn(programPublishingRepository, "findLearningProgram").mockResolvedValue(program as never);
    vi.spyOn(programPublishingRepository, "findDefaultWorkflowForProgram").mockResolvedValue(workflow() as never);
    vi.spyOn(programPublishingRepository, "findExistingInstance").mockResolvedValue(null);
    vi.spyOn(programPublishingRepository, "findLatestInstance").mockResolvedValue(null);
    vi.spyOn(programPublishingRepository, "resolveStepReviewers").mockResolvedValue([reviewer]);

    await expect(programPublishingService.getApprovalRequirements(context, 9)).resolves.toMatchObject({
      instance: { id: null, status: "NOT_SUBMITTED" },
      currentStep: 1,
      canReview: false,
      canSubmit: true,
    });
  });

  it("returns only pending instances assigned to the actor's current step", async () => {
    const steps = [step(), step({ id: 12, approvalOrder: 2, approverRoleId: 8 })];
    mockTransaction();
    vi.spyOn(programPublishingRepository, "listPendingInstances").mockResolvedValue([
      {
        ...instance({ workflow: { name: "Program Approval", steps } }),
        decisions: [{ workflowStepId: 11, status: "APPROVED", comment: null, decidedAt: new Date() }],
      },
      {
        ...instance({ id: 32, workflow: { name: "Program Approval", steps } }),
        decisions: [],
      },
    ] as never);
    vi.spyOn(programPublishingRepository, "isUserAssignedToStep").mockImplementation(
      async (_tx, _companyId, _userId, current) => current.approverRoleId === 8,
    );

    const result = await programPublishingService.listPendingReviews(context);
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({ id: 31, currentStep: 2 });
  });

  it("allows a program owner to withdraw a pending cycle", async () => {
    mockTransaction();
    mockWrites();
    vi.spyOn(programPublishingRepository, "findInstanceById").mockResolvedValue(instance() as never);

    await expect(programPublishingService.withdraw(context, 31, "Not ready")).resolves.toMatchObject({
      status: "CANCELLED",
    });
    expect(programPublishingRepository.updateInstanceStatus).toHaveBeenCalledWith(
      tx,
      31,
      "CANCELLED",
      "Not ready",
    );
    expect(programPublishingRepository.createAuditLog).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ action: "PROGRAM_APPROVAL_WITHDRAWN" }),
    );
  });
});
