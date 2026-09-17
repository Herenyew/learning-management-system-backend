import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { CompletionRewardsService } from "./completion-rewards.service.js";

const now = new Date("2027-07-01T00:00:00.000Z");

describe("CompletionRewardsService", () => {
  it("awards configured course-completion XP once and marks durable work processed", async () => {
    const outboxUpdate = vi.fn(async () => ({}));
    const xpCreate = vi.fn(async () => ({ id: 90 }));
    const tx = {
      completionOutbox: {
        findUnique: vi.fn(async () => ({
          id: 5,
          companyId: 7,
          eventKey: "course-completion:61",
          eventType: "COURSE_COMPLETED",
          courseCompletionId: 61,
          programCompletionId: null,
          status: "PENDING",
        })),
        update: outboxUpdate,
      },
      courseCompletion: {
        findFirstOrThrow: vi.fn(async () => ({
          id: 61,
          companyId: 7,
          passed: true,
          completedAt: now,
          enrollment: {
            employee: {
              id: "EMP-1",
              departmentId: null,
              jobTitleId: null,
              jobLevelId: null,
              employmentTypeId: null,
              startDate: null,
              appUsers: [{ id: 9, roleId: null, isActive: true }],
            },
            courseVersionId: 11,
            courseVersion: {
              certificateRequired: false,
              course: { title: "Safety" },
            },
          },
        })),
      },
      certificateTemplate: { findMany: vi.fn(async () => []) },
      xpRule: {
        findMany: vi.fn(async () => [
          {
            id: 12,
            xpAmount: 100,
            multiplier: 1.5,
            maximumAward: 1,
            conditionExpression: {
              all: [
                { field: "triggerSlug", op: "eq", value: "course_completed" },
                { field: "courseVersionId", op: "in", value: [11, 12] },
              ],
            },
            targetAudience: null,
          },
          {
            id: 13,
            xpAmount: 500,
            multiplier: 1,
            maximumAward: null,
            conditionExpression: { field: "employee.id", op: "eval", value: "true" },
            targetAudience: null,
          },
          {
            id: 14,
            xpAmount: 500,
            multiplier: 1,
            maximumAward: null,
            conditionExpression: { field: "companyId", op: "eq", value: 99 },
            targetAudience: null,
          },
        ]),
      },
      xpTransaction: {
        findFirst: vi.fn(async () => null),
        count: vi.fn(async () => 0),
        create: xpCreate,
      },
    };
    const prisma = {
      $transaction: vi.fn(async (work: (client: object) => Promise<unknown>) => work(tx)),
      completionOutbox: { updateMany: vi.fn() },
    } as unknown as PrismaClient;

    const result = await new CompletionRewardsService(prisma).processOne(5, now);

    expect(result.status).toBe("PROCESSED");
    expect(result.warnings).toEqual([
      expect.stringContaining("XP rule 13 skipped because conditionExpression is invalid"),
    ]);
    expect(xpCreate).toHaveBeenCalledTimes(1);
    expect(xpCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: 7,
        employeeId: "EMP-1",
        ruleId: 12,
        sourceType: "COURSE_COMPLETION",
        sourceId: 61,
        xpAwarded: 150,
      }),
    });
    expect(outboxUpdate).toHaveBeenLastCalledWith({
      where: { id: 5 },
      data: expect.objectContaining({ status: "PROCESSED", processedAt: now }),
    });
  });
});
