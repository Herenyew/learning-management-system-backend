import { describe, expect, it, vi } from "vitest";
import type { ProgramCohortRosterRepository } from "./program-cohort-roster.repository.js";
import { ProgramCohortWaitlistService } from "./program-cohort-waitlist.service.js";
import type { ProgramCohortRosterTransaction } from "./program-cohort-roster.types.js";

const now = new Date("2027-06-15T12:00:00.000Z");
const scope = {
  id: 4,
  name: "June cohort",
  capacity: 1,
  startDate: new Date("2027-06-01T00:00:00.000Z"),
  endDate: new Date("2027-07-31T23:59:59.999Z"),
  program: {
    id: 3,
    name: "Leadership",
    status: "ACTIVE" as const,
    approvalStatus: "APPROVED" as const,
    visibility: "COMPANY" as const,
    rollingEnrollment: false,
    maxEnrollments: 1,
    startDate: new Date("2027-01-01T00:00:00.000Z"),
    endDate: new Date("2027-12-31T23:59:59.999Z"),
    durationDays: null,
  },
};

const waitingEntry = {
  id: 21,
  companyId: 7,
  programId: 3,
  cohortId: 4,
  employeeId: "EMP-1",
  programEnrollmentId: null,
  position: 8,
  status: "WAITING" as const,
  offeredAt: null,
  offerExpiresAt: null,
  acceptedAt: null,
  expiredAt: null,
  cancelledAt: null,
  createdAt: now,
  updatedAt: now,
  employee: { id: "EMP-1", fullName: "Ada Learner", isActive: true },
};

const notifier = (): any => ({
  dispatch: vi.fn(async () => ({ emails: [], inAppCount: 1 })),
  deliverAfterCommit: vi.fn(async () => undefined),
});

const serviceWithTransaction = (tx: object) => {
  const repository = {
    transaction: vi.fn(async (work: (client: ProgramCohortRosterTransaction) => Promise<unknown>) =>
      work(tx as ProgramCohortRosterTransaction)),
    findScope: vi.fn(async () => scope),
    listWaitlist: vi.fn(),
  } as unknown as ProgramCohortRosterRepository;
  const notifications = notifier();
  return {
    service: new ProgramCohortWaitlistService(repository, notifications),
    repository,
    notifications,
  };
};

const baseTx = (): any => ({
  programCohort: { findFirst: vi.fn(async () => scope) },
  systemSetting: { findMany: vi.fn(async () => []) },
  employee: {
    findFirst: vi.fn(async () => ({
      id: "EMP-1",
      fullName: "Ada Learner",
      appUsers: [{ id: 77 }],
    })),
  },
  programEnrollment: {
    findFirst: vi.fn(async () => null),
    count: vi.fn(async () => 1),
    aggregate: vi.fn(async () => ({ _max: { enrollmentNo: 1 } })),
    create: vi.fn(async () => ({ id: 41 })),
    findUniqueOrThrow: vi.fn(async () => ({
      id: 41,
      employeeId: "EMP-1",
      programId: 3,
      cohortId: 4,
      enrollments: [{ id: 101 }],
    })),
  },
  programWaitlistEntry: {
    findMany: vi.fn(async () => []),
    findFirst: vi.fn(async () => null),
    findUniqueOrThrow: vi.fn(),
    count: vi.fn(async () => 0),
    aggregate: vi.fn(async () => ({ _max: { position: 7 } })),
    create: vi.fn(async () => waitingEntry),
    update: vi.fn(),
    updateMany: vi.fn(async () => ({ count: 1 })),
  },
  programCourse: { findMany: vi.fn(async () => []) },
  enrollment: {
    aggregate: vi.fn(async () => ({ _max: { enrollmentNo: null } })),
    create: vi.fn(),
  },
  enrollmentActivityLog: { create: vi.fn(async () => ({})) },
  auditLog: { create: vi.fn(async () => ({})) },
});

describe("ProgramCohortWaitlistService join", () => {
  it("joins at the next stable historical position when enrollment is full", async () => {
    const tx = baseTx();
    const { service, notifications } = serviceWithTransaction(tx);

    const result = await service.join(
      { companyId: 7, userId: 9 },
      3,
      4,
      { employeeId: "EMP-1" },
      now,
    );

    expect(result.entry.position).toBe(8);
    expect(result.settings).toEqual({ waitlistSize: 20, responseHours: 48 });
    expect(tx.programWaitlistEntry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        employeeId: "EMP-1",
        position: 8,
        status: "WAITING",
        activeKey: "7:3:EMP-1",
      }),
      select: expect.any(Object),
    });
    expect(notifications.dispatch).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        eventCode: "PROGRAM_WAITLIST_JOINED",
        recipientUserIds: [77],
      }),
    );
  });

  it("uses configured limits and rejects a full waitlist", async () => {
    const tx = baseTx();
    tx.systemSetting.findMany.mockResolvedValue([
      { settingKey: "default_waitlist_size", settingValue: 2 },
      { settingKey: "default_waitlist_response_hours", settingValue: 12 },
    ]);
    tx.programWaitlistEntry.count.mockImplementation(async (args: any) =>
      args.where.status?.in ? 2 : 0,
    );
    const { service } = serviceWithTransaction(tx);

    await expect(
      service.join({ companyId: 7, userId: 9 }, 3, 4, { employeeId: "EMP-1" }, now),
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("maximum size") });
    expect(tx.programWaitlistEntry.create).not.toHaveBeenCalled();
  });

  it("does not create a waitlist entry while direct enrollment capacity exists", async () => {
    const tx = baseTx();
    tx.programEnrollment.count.mockResolvedValue(0);
    const { service } = serviceWithTransaction(tx);

    await expect(
      service.join({ companyId: 7, userId: 9 }, 3, 4, { employeeId: "EMP-1" }, now),
    ).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining("directly") });
    expect(tx.programWaitlistEntry.create).not.toHaveBeenCalled();
  });
});

describe("ProgramCohortWaitlistService processing", () => {
  it("expires overdue offers then offers the first waiting position", async () => {
    const tx = baseTx();
    tx.programEnrollment.count.mockResolvedValue(0);
    tx.programWaitlistEntry.findMany.mockResolvedValue([
      {
        id: 20,
        employeeId: "EMP-OLD",
        position: 2,
        employee: { appUsers: [{ id: 70 }] },
      },
    ]);
    tx.programWaitlistEntry.findFirst.mockResolvedValue({
      id: 21,
      employeeId: "EMP-1",
      position: 8,
      employee: { appUsers: [{ id: 77 }] },
    });
    const offered = {
      ...waitingEntry,
      status: "OFFERED" as const,
      offeredAt: now,
      offerExpiresAt: new Date("2027-06-17T12:00:00.000Z"),
    };
    tx.programWaitlistEntry.findUniqueOrThrow.mockResolvedValue(offered);
    const { service, notifications } = serviceWithTransaction(tx);

    const result = await service.process({ companyId: 7, userId: 9 }, 3, 4, now);

    expect(result.expired).toBe(1);
    expect(result.offered).toEqual(offered);
    expect(tx.programWaitlistEntry.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: [{ position: "asc" }, { id: "asc" }] }),
    );
    expect(tx.programWaitlistEntry.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ id: 21, status: "WAITING" }),
        data: expect.objectContaining({ status: "OFFERED" }),
      }),
    );
    expect(notifications.dispatch.mock.calls.map((call: any[]) => call[1].eventCode)).toEqual([
      "PROGRAM_WAITLIST_EXPIRED",
      "PROGRAM_WAITLIST_OFFERED",
    ]);
  });

  it("does not over-offer when existing offers reserve the last seat", async () => {
    const tx = baseTx();
    tx.programEnrollment.count.mockResolvedValue(0);
    tx.programWaitlistEntry.count.mockImplementation(async (args: any) =>
      args.where.status === "OFFERED" ? 1 : 0,
    );
    const { service } = serviceWithTransaction(tx);

    const result = await service.process({ companyId: 7, userId: 9 }, 3, 4, now);

    expect(result.offered).toBeNull();
    expect(tx.programWaitlistEntry.findFirst).not.toHaveBeenCalled();
  });
});

describe("ProgramCohortWaitlistService acceptance and cancellation", () => {
  it("accepts an offered entry and provisions the shared roster enrollment", async () => {
    const tx = baseTx();
    tx.programEnrollment.count.mockResolvedValue(0);
    tx.programWaitlistEntry.count.mockResolvedValue(0);
    tx.programWaitlistEntry.findFirst.mockResolvedValue({
      id: 21,
      employeeId: "EMP-1",
      position: 8,
      status: "OFFERED",
      offeredAt: now,
      offerExpiresAt: new Date("2027-06-16T12:00:00.000Z"),
      programEnrollmentId: null,
      employee: { appUsers: [{ id: 77 }] },
    });
    tx.programCourse.findMany.mockResolvedValue([
      { courseVersionId: 11, isRequired: true },
    ]);
    tx.enrollment.create.mockResolvedValue({ id: 101 });
    tx.programWaitlistEntry.update.mockResolvedValue({
      ...waitingEntry,
      status: "ACCEPTED",
      acceptedAt: now,
    });
    const { service, notifications } = serviceWithTransaction(tx);

    const result = await service.accept({ companyId: 7, userId: 9 }, 3, 4, 21, now);

    expect(result.idempotent).toBe(false);
    expect(result.enrollment.id).toBe(41);
    expect(result.linkedCourseEnrollmentIds).toEqual([101]);
    expect(tx.programEnrollment.create).toHaveBeenCalledTimes(1);
    expect(tx.enrollment.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ programEnrollmentId: 41, courseVersionId: 11 }),
      select: { id: true },
    });
    expect(tx.programWaitlistEntry.update).toHaveBeenCalledWith({
      where: { id: 21 },
      data: {
        status: "ACCEPTED",
        activeKey: null,
        acceptedAt: now,
        programEnrollmentId: 41,
      },
      select: expect.any(Object),
    });
    expect(notifications.dispatch).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({ eventCode: "PROGRAM_WAITLIST_ACCEPTED" }),
    );
  });

  it("returns the existing enrollment for a repeated acceptance", async () => {
    const tx = baseTx();
    tx.programWaitlistEntry.findFirst.mockResolvedValue({
      id: 21,
      employeeId: "EMP-1",
      position: 8,
      status: "ACCEPTED",
      offeredAt: now,
      offerExpiresAt: new Date("2027-06-16T12:00:00.000Z"),
      programEnrollmentId: 41,
      employee: { appUsers: [{ id: 77 }] },
    });
    tx.programEnrollment.findFirst.mockResolvedValue({
      id: 41,
      employeeId: "EMP-1",
      programId: 3,
      cohortId: 4,
      enrollments: [{ id: 101 }],
    });
    const { service } = serviceWithTransaction(tx);

    const result = await service.accept({ companyId: 7, userId: 9 }, 3, 4, 21, now);

    expect(result.idempotent).toBe(true);
    expect(result.linkedCourseEnrollmentIds).toEqual([101]);
    expect(tx.programEnrollment.create).not.toHaveBeenCalled();
  });

  it("cancels an active entry, clears its active key, and processes the next entry", async () => {
    const tx = baseTx();
    tx.programWaitlistEntry.findFirst.mockResolvedValue({
      ...waitingEntry,
      employee: {
        id: "EMP-1",
        fullName: "Ada Learner",
        isActive: true,
        appUsers: [{ id: 77 }],
      },
    });
    const cancelled = { ...waitingEntry, status: "CANCELLED" as const, cancelledAt: now };
    tx.programWaitlistEntry.update.mockResolvedValue(cancelled);
    const { service } = serviceWithTransaction(tx);
    const process = vi.spyOn(service, "process").mockResolvedValue({ expired: 0, offered: null });

    await expect(
      service.cancel({ companyId: 7, userId: 9 }, 3, 4, 21, now),
    ).resolves.toEqual(cancelled);
    expect(tx.programWaitlistEntry.update).toHaveBeenCalledWith({
      where: { id: 21 },
      data: { status: "CANCELLED", activeKey: null, cancelledAt: now },
      select: expect.any(Object),
    });
    expect(process).toHaveBeenCalledWith({ companyId: 7, userId: 9 }, 3, 4, now);
  });
});
