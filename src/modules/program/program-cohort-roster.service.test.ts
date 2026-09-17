import { describe, expect, it, vi } from "vitest";
import { ConflictError } from "../../common/errors/http-errors.js";
import type { ProgramCohortRosterRepository } from "./program-cohort-roster.repository.js";
import { ProgramCohortRosterService } from "./program-cohort-roster.service.js";
import type { ProgramCohortRosterTransaction } from "./program-cohort-roster.types.js";

const now = new Date("2027-06-15T12:00:00.000Z");
const scope = {
  id: 4,
  name: "June cohort",
  capacity: 5,
  startDate: new Date("2027-06-01T00:00:00.000Z"),
  endDate: new Date("2027-07-31T23:59:59.999Z"),
  program: {
    id: 3,
    name: "Leadership",
    status: "ACTIVE" as const,
    approvalStatus: "APPROVED" as const,
    visibility: "COMPANY" as const,
    rollingEnrollment: false,
    maxEnrollments: 20,
    startDate: new Date("2027-01-01T00:00:00.000Z"),
    endDate: new Date("2027-12-31T23:59:59.999Z"),
    durationDays: null,
  },
};

const notifier = {
  dispatch: vi.fn(async () => ({ emails: [], inAppCount: 1 })),
  deliverAfterCommit: vi.fn(async () => undefined),
};

const serviceWithTransaction = (tx: object) => {
  const repository = {
    transaction: vi.fn(async (work: (client: ProgramCohortRosterTransaction) => Promise<unknown>) =>
      work(tx as ProgramCohortRosterTransaction)),
    findScope: vi.fn(async () => scope),
    listRoster: vi.fn(),
  } as unknown as ProgramCohortRosterRepository;
  return {
    service: new ProgramCohortRosterService(repository, notifier),
    repository,
  };
};

const enrollmentTx = (overrides: Record<string, unknown> = {}) => {
  const createCourseEnrollment = vi
    .fn()
    .mockResolvedValueOnce({ id: 101 })
    .mockResolvedValueOnce({ id: 102 });
  return {
    programCohort: { findFirst: vi.fn(async () => scope) },
    employee: {
      findFirst: vi.fn(async () => ({
        id: "EMP-1",
        fullName: "Ada Learner",
        appUsers: [{ id: 77 }],
      })),
    },
    programEnrollment: {
      findFirst: vi.fn(async () => null),
      count: vi.fn(async () => 0),
      aggregate: vi.fn(async () => ({ _max: { enrollmentNo: 1 } })),
      create: vi.fn(async () => ({ id: 41 })),
      findUniqueOrThrow: vi.fn(async () => ({
        id: 41,
        employeeId: "EMP-1",
        programId: 3,
        cohortId: 4,
        enrollments: [{ id: 101 }, { id: 102 }],
      })),
    },
    programWaitlistEntry: {
      findFirst: vi.fn(async () => null),
      count: vi.fn(async () => 0),
    },
    programCourse: {
      findMany: vi.fn(async () => [
        { courseVersionId: 11, isRequired: true },
        { courseVersionId: 12, isRequired: false },
      ]),
    },
    enrollment: {
      aggregate: vi.fn(async () => ({ _max: { enrollmentNo: null } })),
      create: createCourseEnrollment,
      update: vi.fn(),
    },
    enrollmentActivityLog: { create: vi.fn(async () => ({})) },
    auditLog: { create: vi.fn(async () => ({})) },
    ...overrides,
  };
};

describe("ProgramCohortRosterService enrollment", () => {
  it("creates a program enrollment and linked enrollments for every program course", async () => {
    notifier.dispatch.mockClear();
    notifier.deliverAfterCommit.mockClear();
    const tx = enrollmentTx();
    const { service } = serviceWithTransaction(tx);

    const result = await service.enrollEmployee(
      { companyId: 7, userId: 9 },
      3,
      4,
      { employeeId: "EMP-1" },
      now,
    );

    expect(result.linkedCourseEnrollmentIds).toEqual([101, 102]);
    expect(tx.programEnrollment.findFirst).toHaveBeenCalledWith({
      where: expect.objectContaining({
        companyId: 7,
        employeeId: "EMP-1",
        programId: 3,
        deletedAt: null,
        enrollmentStatus: { in: ["PENDING", "WAITLISTED", "ACTIVE"] },
      }),
      select: { id: true },
    });
    expect(tx.programEnrollment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ enrollmentNo: 2, source: "ADMIN_ASSIGNED" }),
      select: { id: true },
    });
    expect(tx.enrollment.create).toHaveBeenCalledTimes(2);
    expect(tx.enrollment.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          courseVersionId: 12,
          programEnrollmentId: 41,
          enrollmentSource: "ADMIN_ASSIGNED",
        }),
      }),
    );
    expect(tx.enrollmentActivityLog.create).toHaveBeenCalledTimes(2);
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "COHORT_ENROLLED", entityId: "41" }),
    });
    expect(notifier.dispatch).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ recipientUserIds: [77], eventCode: "PROGRAM_ENROLLMENT_CONFIRMED" }),
    );
    expect(notifier.deliverAfterCommit).toHaveBeenCalledTimes(1);
  });

  it("returns a capacity conflict before creating records", async () => {
    const tx = enrollmentTx();
    tx.programEnrollment.count
      .mockResolvedValueOnce(scope.program.maxEnrollments)
      .mockResolvedValueOnce(0);
    const { service } = serviceWithTransaction(tx);

    await expect(
      service.enrollEmployee(
        { companyId: 7, userId: 9 },
        3,
        4,
        { employeeId: "EMP-1" },
        now,
      ),
    ).rejects.toMatchObject({
      statusCode: 409,
      details: { outcome: "capacity" },
    });
    expect(tx.programEnrollment.create).not.toHaveBeenCalled();
  });

  it("rejects enrollment before a fixed cohort opens", async () => {
    const tx = enrollmentTx();
    const { service } = serviceWithTransaction(tx);

    await expect(
      service.enrollEmployee(
        { companyId: 7, userId: 9 },
        3,
        4,
        { employeeId: "EMP-1" },
        new Date("2027-05-31T23:59:59.999Z"),
      ),
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("not opened") });
    expect(tx.employee.findFirst).not.toHaveBeenCalled();
  });

  it("reports enrolled, conflict, and capacity outcomes in bulk order", async () => {
    const tx = enrollmentTx();
    const { service } = serviceWithTransaction(tx);
    vi.spyOn(service, "enrollEmployee")
      .mockResolvedValueOnce({
        enrollment: { id: 51 } as never,
        linkedCourseEnrollmentIds: [101],
      })
      .mockRejectedValueOnce(new ConflictError("Already enrolled"))
      .mockRejectedValueOnce(new ConflictError("Cohort full", { outcome: "capacity" }));

    const result = await service.bulkEnrollEmployees(
      { companyId: 7, userId: 9 },
      3,
      4,
      { employeeIds: ["EMP-1", "EMP-2", "EMP-3"] },
    );

    expect(result.outcomes.map((outcome) => outcome.status)).toEqual([
      "enrolled",
      "conflict",
      "capacity",
    ]);
    expect(result.summary).toEqual({ requested: 3, enrolled: 1, conflict: 1, capacity: 1 });
  });
});

describe("ProgramCohortRosterService removal", () => {
  it("guards a roster enrollment with a completed linked course", async () => {
    const update = vi.fn();
    const remove = vi.fn();
    const tx = {
      programCohort: { findFirst: vi.fn(async () => scope) },
      programEnrollment: {
        findFirst: vi.fn(async () => ({
          id: 41,
          employeeId: "EMP-1",
          enrollmentStatus: "ACTIVE",
          completedAt: null,
          completion: null,
          milestoneProgresses: [],
          enrollments: [{ id: 101, status: "COMPLETED", completion: { id: 81 } }],
        })),
        delete: remove,
      },
      enrollment: { update },
      enrollmentActivityLog: { create: vi.fn() },
      auditLog: { create: vi.fn() },
    };
    const { service } = serviceWithTransaction(tx);

    await expect(
      service.removeEnrollment({ companyId: 7, userId: 9 }, 3, 4, 41, now),
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("Completed") });
    expect(update).not.toHaveBeenCalled();
    expect(remove).not.toHaveBeenCalled();
  });

  it("cancels linked courses and triggers waitlist promotion after removing the roster row", async () => {
    const tx = {
      programCohort: { findFirst: vi.fn(async () => scope) },
      programEnrollment: {
        findFirst: vi.fn(async () => ({
          id: 41,
          employeeId: "EMP-1",
          enrollmentStatus: "ACTIVE",
          completedAt: null,
          completion: null,
          milestoneProgresses: [],
          enrollments: [{ id: 101, status: "ACTIVE", completion: null }],
        })),
        update: vi.fn(async () => ({})),
      },
      enrollment: { update: vi.fn(async () => ({})) },
      enrollmentActivityLog: { create: vi.fn(async () => ({})) },
      auditLog: { create: vi.fn(async () => ({})) },
    };
    const { service } = serviceWithTransaction(tx);
    const promote = vi.fn(async () => ({ offered: null }));
    service.setCapacityReleasedHandler(promote);

    await expect(
      service.removeEnrollment({ companyId: 7, userId: 9 }, 3, 4, 41, now),
    ).resolves.toEqual({
      id: 41,
      employeeId: "EMP-1",
      removed: true,
      cancelledCourseEnrollmentIds: [101],
    });
    expect(tx.enrollment.update).toHaveBeenCalledWith({
      where: { id: 101 },
      data: expect.objectContaining({
        status: "CANCELLED",
        deletedAt: now,
      }),
    });
    expect(tx.programEnrollment.update).toHaveBeenCalledWith({
      where: { id: 41 },
      data: { enrollmentStatus: "CANCELLED", deletedAt: now },
    });
    expect(promote).toHaveBeenCalledWith({ companyId: 7, userId: 9 }, 3, 4);
  });
});
