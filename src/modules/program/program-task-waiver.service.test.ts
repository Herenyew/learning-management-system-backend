import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { ProgramTaskWaiverService } from "./program-task-waiver.service.js";

const context = { companyId: 7, userId: 9 };
const params = { programId: 31, enrollmentId: 21, taskId: 41 };
const now = new Date("2027-09-02T12:00:00.000Z");

const activeEnrollment = {
  id: 21,
  enrollmentStatus: "ACTIVE",
  completion: null,
};

const serviceWith = (tx: any, finalProgress: any = null) => {
  const prisma: any = {
    $transaction: vi.fn(async (work: (client: any) => Promise<unknown>) => work(tx)),
    programTaskProgress: { findFirst: vi.fn(async () => finalProgress) },
  };
  const evaluator = {
    reevaluateProgramScoped: vi.fn(async () => ({ progressPercentage: 50 })),
  };
  return {
    service: new ProgramTaskWaiverService(prisma as PrismaClient, evaluator),
    prisma,
    evaluator,
  };
};

describe("ProgramTaskWaiverService", () => {
  it("enforces tenant, program, enrollment, and task ownership before mutation or evaluation", async () => {
    const tx = {
      programEnrollment: { findFirst: vi.fn(async () => null) },
      programTask: { findFirst: vi.fn(async () => ({ id: 41 })) },
      programTaskProgress: { upsert: vi.fn() },
      auditLog: { create: vi.fn() },
    };
    const { service, evaluator } = serviceWith(tx);

    await expect(
      service.waive(context, params, { reason: "Equivalent prior training" }, now),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(tx.programEnrollment.findFirst).toHaveBeenCalledWith({
      where: { id: 21, companyId: 7, programId: 31, deletedAt: null },
      select: { id: true, enrollmentStatus: true, completion: { select: { id: true } } },
    });
    expect(tx.programTaskProgress.upsert).not.toHaveBeenCalled();
    expect(evaluator.reevaluateProgramScoped).not.toHaveBeenCalled();
  });

  it("waives only the exact attempt, audits it, and reevaluates after the waiver", async () => {
    const waived = {
      id: 51,
      companyId: 7,
      programTaskId: 41,
      programEnrollmentId: 21,
      status: "WAIVED",
      completedAt: null,
      waivedAt: now,
      waivedBy: 9,
      waiverReason: "Equivalent prior training",
      createdAt: now,
      updatedAt: now,
    };
    const tx = {
      programEnrollment: { findFirst: vi.fn(async () => activeEnrollment) },
      programTask: { findFirst: vi.fn(async () => ({ id: 41 })) },
      programTaskProgress: {
        findUnique: vi.fn(async () => ({ ...waived, status: "IN_PROGRESS", waivedAt: null, waivedBy: null, waiverReason: null })),
        upsert: vi.fn(async () => waived),
      },
      auditLog: { create: vi.fn(async () => ({})) },
    };
    const { service, evaluator } = serviceWith(tx, waived);

    const result = await service.waive(
      context,
      params,
      { reason: "Equivalent prior training" },
      now,
    );

    expect(tx.programTaskProgress.upsert).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        programTaskId_programEnrollmentId: { programTaskId: 41, programEnrollmentId: 21 },
      },
      update: expect.objectContaining({
        status: "WAIVED",
        waivedBy: 9,
        waiverReason: "Equivalent prior training",
      }),
    }));
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: 7,
        actorUserId: 9,
        entityType: "PROGRAM_TASK_PROGRESS",
        entityId: "51",
        action: "WAIVED",
      }),
    });
    expect(evaluator.reevaluateProgramScoped).toHaveBeenCalledOnce();
    expect(evaluator.reevaluateProgramScoped).toHaveBeenLastCalledWith(context, 21, now);
    expect(result.progress).toEqual(waived);
  });

  it("revokes the waiver, audits both states, and returns reevaluated progress", async () => {
    const waived = {
      id: 51,
      companyId: 7,
      programTaskId: 41,
      programEnrollmentId: 21,
      status: "WAIVED",
      completedAt: null,
      waivedAt: now,
      waivedBy: 9,
      waiverReason: "Equivalent prior training",
      createdAt: now,
      updatedAt: now,
    };
    const revoked = {
      ...waived,
      status: "NOT_STARTED",
      waivedAt: null,
      waivedBy: null,
      waiverReason: null,
    };
    const reevaluated = { ...revoked, status: "COMPLETED", completedAt: now };
    const tx = {
      programEnrollment: { findFirst: vi.fn(async () => activeEnrollment) },
      programTask: { findFirst: vi.fn(async () => ({ id: 41 })) },
      programTaskProgress: {
        findUnique: vi.fn(async () => waived),
        update: vi.fn(async () => revoked),
      },
      auditLog: { create: vi.fn(async () => ({})) },
    };
    const { service, evaluator } = serviceWith(tx, reevaluated);

    const result = await service.revoke(context, params, now);

    expect(tx.programTaskProgress.update).toHaveBeenCalledWith({
      where: { id: 51 },
      data: {
        status: "NOT_STARTED",
        completedAt: null,
        waivedAt: null,
        waivedBy: null,
        waiverReason: null,
      },
      select: expect.any(Object),
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "WAIVER_REVOKED", entityId: "51" }),
    });
    expect(evaluator.reevaluateProgramScoped).toHaveBeenCalledOnce();
    expect(evaluator.reevaluateProgramScoped).toHaveBeenCalledWith(context, 21, now);
    expect(result.progress).toEqual(reevaluated);
  });

  it("does not revoke a waiver after immutable program completion", async () => {
    const tx = {
      programEnrollment: {
        findFirst: vi.fn(async () => ({
          id: 21,
          enrollmentStatus: "COMPLETED",
          completion: { id: 61 },
        })),
      },
      programTask: { findFirst: vi.fn(async () => ({ id: 41 })) },
      programTaskProgress: { findUnique: vi.fn(), update: vi.fn() },
      auditLog: { create: vi.fn() },
    };
    const { service, evaluator } = serviceWith(tx);

    await expect(service.revoke(context, params, now)).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining("completion rewards"),
    });
    expect(tx.programTaskProgress.update).not.toHaveBeenCalled();
    expect(evaluator.reevaluateProgramScoped).not.toHaveBeenCalled();
  });
});
