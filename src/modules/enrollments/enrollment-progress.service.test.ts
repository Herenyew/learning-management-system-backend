import { describe, expect, it, vi } from "vitest";
import { EnrollmentProgressService } from "./enrollment-progress.service.js";
import type { EnrollmentProgressRepository } from "./enrollment-progress.repository.js";
import type { EnrollmentProgressTransaction } from "./enrollment-progress.repository.js";

const now = new Date("2027-07-01T12:00:00.000Z");
const context = { companyId: 7, userId: 9 };

const notifier = {
  dispatch: vi.fn(async () => ({ emails: [], inAppCount: 1 })),
  deliverAfterCommit: vi.fn(async () => undefined),
};
const rewards = { processIds: vi.fn(async () => []) };

const serviceWith = (tx: object) => {
  const repository = {
    transaction: vi.fn(async (work: (client: EnrollmentProgressTransaction) => Promise<unknown>) =>
      work(tx as EnrollmentProgressTransaction)),
    findOwnedEnrollment: vi.fn(),
    listOwnedEnrollments: vi.fn(),
  } as unknown as EnrollmentProgressRepository;
  return new EnrollmentProgressService(repository, notifier, rewards);
};

const scopedEnrollment = (overrides: Record<string, unknown> = {}) => ({
  id: 21,
  companyId: 7,
  employeeId: "EMP-1",
  courseVersionId: 11,
  programEnrollmentId: null,
  status: "ACTIVE",
  startedAt: null,
  employee: { id: "EMP-1", appUsers: [{ id: 9 }] },
  courseVersion: {
    id: 11,
    companyId: 7,
    status: "PUBLISHED",
    completionThreshold: 100,
    requiredAssessmentScore: 0,
    attendanceRequired: false,
    minimumAttendance: null,
    course: { id: 4, title: "Safety" },
  },
  completion: null,
  ...overrides,
});

const completionTx = (existingCompletion: object | null = null) => {
  const ownership = scopedEnrollment();
  const evaluation = scopedEnrollment({ completion: existingCompletion });
  return {
    enrollment: {
      findFirst: vi.fn(async () => ownership),
      findFirstOrThrow: vi.fn(async () => evaluation),
      update: vi.fn(async () => ({})),
    },
    courseContent: {
      findMany: vi.fn(async () => [
        {
          id: 31,
          completionThreshold: 80,
          minimumTimeMinutes: 2,
          lessonProgress: [
            {
              id: 41,
              status: "COMPLETED",
              watchPercentage: 100,
              timeSpentMinutes: 5,
            },
          ],
        },
      ]),
    },
    assessment: { findMany: vi.fn(async () => []) },
    learningProgress: {
      upsert: vi.fn(async ({ create }: { create: object }) => ({ id: 51, ...create })),
    },
    courseCompletion: {
      create: vi.fn(async ({ data }: { data: object }) => ({ id: 61, ...data })),
    },
    completionOutbox: {
      create: vi.fn(async () => ({ id: 71 })),
    },
    enrollmentActivityLog: { create: vi.fn(async () => ({})) },
    auditLog: { create: vi.fn(async () => ({})) },
  };
};

describe("EnrollmentProgressService", () => {
  it("enforces tenant and learner ownership before evaluation", async () => {
    const findFirst = vi.fn(async () => ({
      ...scopedEnrollment(),
      employee: { id: "EMP-1", appUsers: [] },
    }));
    const tx = { enrollment: { findFirst } };

    await expect(serviceWith(tx).reevaluate(context, 21, now)).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 21, companyId: 7, deletedAt: null }),
      }),
    );
  });

  it("creates a successful completion from persisted content evidence", async () => {
    notifier.dispatch.mockClear();
    notifier.deliverAfterCommit.mockClear();
    const tx = completionTx();

    const result = (await serviceWith(tx).reevaluate(context, 21, now)) as {
      evaluation: { eligible: boolean };
      completion: { id: number; passed: boolean };
    };

    expect(result.evaluation.eligible).toBe(true);
    expect(result.completion).toMatchObject({ id: 61, passed: true });
    expect(tx.courseCompletion.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: 7,
        enrollmentId: 21,
        finalScore: 100,
        passed: true,
      }),
    });
    expect(tx.enrollment.update).toHaveBeenCalledWith({
      where: { id: 21 },
      data: { status: "COMPLETED", completedAt: now },
    });
    expect(tx.enrollmentActivityLog.create).toHaveBeenCalledOnce();
    expect(tx.auditLog.create).toHaveBeenCalledOnce();
    expect(notifier.dispatch).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ eventCode: "COURSE_COMPLETED", recipientUserIds: [9] }),
    );
    expect(notifier.deliverAfterCommit).toHaveBeenCalledOnce();
  });

  it("returns an existing completion without issuing duplicate side effects", async () => {
    notifier.dispatch.mockClear();
    notifier.deliverAfterCommit.mockClear();
    const completion = { id: 61, enrollmentId: 21, passed: true };
    const tx = completionTx(completion);

    const result = (await serviceWith(tx).reevaluate(context, 21, now)) as {
      completion: { id: number };
    };

    expect(result.completion).toBe(completion);
    expect(tx.courseCompletion.create).not.toHaveBeenCalled();
    expect(tx.enrollmentActivityLog.create).not.toHaveBeenCalled();
    expect(tx.auditLog.create).not.toHaveBeenCalled();
    expect(notifier.dispatch).not.toHaveBeenCalled();
    expect(notifier.deliverAfterCommit).not.toHaveBeenCalled();
  });
});
