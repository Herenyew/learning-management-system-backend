import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import type {
  ProgramTaskSubmissionRepository,
  ProgramTaskSubmissionTransaction,
} from "./program-task-submission.repository.js";
import { ProgramTaskSubmissionService } from "./program-task-submission.service.js";

const context = { companyId: 7, userId: 9 };
const now = new Date("2027-09-01T12:00:00.000Z");
const enrollment = {
  id: 21,
  programId: 31,
  employeeId: "EMP-1",
  enrollmentStatus: "ACTIVE",
  enrolledAt: new Date("2027-08-01T00:00:00.000Z"),
  startDate: null,
  dueDate: null,
};
const task = {
  id: 41,
  companyId: 7,
  programId: 31,
  taskType: { expectedSubmissionType: "TEXT_INPUT" },
  allowResubmission: true,
  maxSubmissions: 2,
  dueDate: null,
  dueOffsetDays: 10,
  requiresManagerApproval: true,
  peerReviewRequired: false,
};

const serviceWith = (tx: object) => {
  const repository = {
    transaction: vi.fn(async (work: (client: ProgramTaskSubmissionTransaction) => Promise<unknown>) =>
      work(tx as ProgramTaskSubmissionTransaction)),
  } as unknown as ProgramTaskSubmissionRepository;
  const progress = {
    reevaluateProgram: vi.fn(async () => ({ progressPercentage: 20 })),
    reevaluateProgramScoped: vi.fn(async () => ({ progressPercentage: 20 })),
  };
  return {
    service: new ProgramTaskSubmissionService(repository, {} as PrismaClient, progress),
    progress,
  };
};

describe("ProgramTaskSubmissionService", () => {
  it("creates an under-review submission with server-derived identity, number, and due date", async () => {
    const tx: any = {
      programEnrollment: { findFirst: vi.fn(async () => enrollment) },
      programTask: {
        findFirst: vi.fn(async () => task),
        findMany: vi.fn(async () => []),
      },
      programTaskProgress: { findUnique: vi.fn(async () => null) },
      submission: {
        findMany: vi.fn(async () => []),
        create: vi.fn(async ({ data }: any) => ({ id: 51, ...data, files: [], peerReviews: [] })),
        findUniqueOrThrow: vi.fn(async () => ({
          id: 51,
          companyId: 7,
          employeeId: "EMP-1",
          programEnrollmentId: 21,
          programTaskId: 41,
          submissionNo: 1,
          submissionType: "TEXT_INPUT",
          status: "UNDER_REVIEW",
          textAnswer: "My evidence",
          submissionUrl: null,
          dueDate: new Date("2027-08-11T00:00:00.000Z"),
          submittedAt: now,
          completedAt: null,
          files: [],
          peerReviews: [],
        })),
      },
      auditLog: { create: vi.fn(async () => ({})) },
    };
    const { service, progress } = serviceWith(tx);
    const result = await service.submit(
      context,
      21,
      41,
      { submissionType: "TEXT_INPUT", textAnswer: "My evidence" },
      now,
    );

    expect(result.submission).toMatchObject({
      id: 51,
      companyId: 7,
      programEnrollmentId: 21,
      employeeId: "EMP-1",
      submissionNo: 1,
      status: "UNDER_REVIEW",
      textAnswer: "My evidence",
    });
    expect(result.submission.dueDate?.toISOString()).toBe("2027-08-11T00:00:00.000Z");
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "SUBMITTED", entityId: "51", actorUserId: 9 }),
    });
    expect(progress.reevaluateProgram).toHaveBeenCalledWith(context, 21, now);
  });

  it("allows resubmission only after rejection and enforces the maximum", async () => {
    const tx: any = {
      programEnrollment: { findFirst: vi.fn(async () => enrollment) },
      programTask: {
        findFirst: vi.fn(async () => task),
        findMany: vi.fn(async () => []),
      },
      programTaskProgress: { findUnique: vi.fn(async () => null) },
      submission: {
        findMany: vi.fn(async () => [{ id: 50, submissionNo: 1, status: "UNDER_REVIEW" }]),
      },
    };
    const { service } = serviceWith(tx);
    await expect(
      service.submit(context, 21, 41, { submissionType: "TEXT_INPUT", textAnswer: "Again" }, now),
    ).rejects.toMatchObject({ statusCode: 422, message: expect.stringContaining("rejected") });

    tx.submission.findMany.mockResolvedValue([
      { id: 50, submissionNo: 2, status: "REJECTED" },
      { id: 49, submissionNo: 1, status: "REJECTED" },
    ]);
    await expect(
      service.submit(context, 21, 41, { submissionType: "TEXT_INPUT", textAnswer: "Again" }, now),
    ).rejects.toMatchObject({ statusCode: 422, message: expect.stringContaining("maximum") });
  });

  it("prevents self-review before changing submission state", async () => {
    const tx: any = {
      appUser: { findFirst: vi.fn(async () => ({ employeeId: "EMP-1" })) },
      programTaskProgress: { findUnique: vi.fn(async () => null) },
      submission: {
        findFirst: vi.fn(async () => ({
          id: 51,
          companyId: 7,
          employeeId: "EMP-1",
          programEnrollmentId: 21,
          status: "UNDER_REVIEW",
          score: null,
          reviewComment: null,
          programTask: { requiresManagerApproval: true },
        })),
        updateMany: vi.fn(),
      },
    };
    const { service } = serviceWith(tx);
    await expect(service.approve(context, 51, { score: 90 }, now)).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(tx.submission.updateMany).not.toHaveBeenCalled();
  });
});
