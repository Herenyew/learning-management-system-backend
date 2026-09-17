import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { Permissions } from "../../common/constants/permission.constant.js";
import type { AttendanceTransaction, LiveSessionAttendanceRepository } from "./live-session-attendance.repository.js";
import { LiveSessionAttendanceService } from "./live-session-attendance.service.js";

const now = new Date("2027-10-01T12:00:00.000Z");
const manager = {
  companyId: 7,
  userId: 9,
  employeeId: "MGR-1",
  permissions: [Permissions.ATTENDANCE_MANAGE],
};
const session = {
  id: 31,
  companyId: 7,
  courseVersionId: 11,
  status: "LIVE",
  startTime: new Date("2027-10-01T11:00:00.000Z"),
  endTime: new Date("2027-10-01T13:00:00.000Z"),
  instructors: [],
};

const serviceWith = (tx: object, prismaOverrides: object = {}) => {
  const repository = {
    transaction: vi.fn(async (work: (client: AttendanceTransaction) => Promise<unknown>) =>
      work(tx as AttendanceTransaction)),
  } as unknown as LiveSessionAttendanceRepository;
  const progress = { reevaluateScoped: vi.fn(async () => ({})) };
  const prisma = prismaOverrides as PrismaClient;
  return { service: new LiveSessionAttendanceService(repository, prisma, progress), progress };
};

describe("LiveSessionAttendanceService", () => {
  it("allows company attendance managers to create short-lived session-bound challenges", async () => {
    const { service } = serviceWith({}, {
      liveSession: { findFirst: vi.fn(async () => session) },
    });
    const result = await service.createChallenge(manager, 31);
    expect(result.challenge.length).toBeGreaterThan(20);
    expect(result.expiresInSeconds).toBe(300);
  });

  it("requires assigned-instructor scope for attendance finalizers", async () => {
    const instructor = {
      ...manager,
      permissions: [Permissions.ATTENDANCE_FINALIZE],
    };
    const { service } = serviceWith({}, {
      liveSession: { findFirst: vi.fn(async () => session) },
    });
    await expect(service.createChallenge(instructor, 31)).rejects.toMatchObject({ statusCode: 403 });
  });

  it("finalizes a complete roster, normalizes attendance, audits, and reevaluates each enrollment", async () => {
    const upsert = vi.fn(async ({ create, update }: any) => ({ id: create?.enrollmentId ?? 1, ...(create ?? update) }));
    const tx: any = {
      liveSession: {
        findFirst: vi.fn(async () => session),
        update: vi.fn(async () => ({ id: 31, status: "COMPLETED", courseVersionId: 11 })),
      },
      enrollment: { findMany: vi.fn(async () => [{ id: 1 }, { id: 2 }, { id: 3 }]) },
      liveSessionAttendance: { findMany: vi.fn(async () => []), upsert },
      auditLog: { create: vi.fn(async () => ({})) },
    };
    const { service, progress } = serviceWith(tx);
    const result = await service.finalize(
      manager,
      31,
      {
        records: [
          { enrollmentId: 1, attendanceStatus: "PRESENT" },
          { enrollmentId: 2, attendanceStatus: "NO_SHOW", attendancePercentage: 90 },
          { enrollmentId: 3, attendanceStatus: "PARTIAL", attendancePercentage: 60 },
        ],
      },
      now,
    );

    expect(result.session.status).toBe("COMPLETED");
    expect(upsert.mock.calls.map((call) => call[0].create.attendancePercentage)).toEqual([100, 0, 60]);
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "FINALIZED", actorUserId: 9, entityId: "31" }),
    });
    expect(progress.reevaluateScoped).toHaveBeenCalledTimes(3);
  });

  it("rejects partial finalization rosters", async () => {
    const tx: any = {
      liveSession: { findFirst: vi.fn(async () => session) },
      enrollment: { findMany: vi.fn(async () => [{ id: 1 }, { id: 2 }]) },
    };
    const { service } = serviceWith(tx);
    await expect(
      service.finalize(
        manager,
        31,
        { records: [{ enrollmentId: 1, attendanceStatus: "PRESENT" }] },
        now,
      ),
    ).rejects.toMatchObject({ statusCode: 422, message: expect.stringContaining("complete") });
  });
});
