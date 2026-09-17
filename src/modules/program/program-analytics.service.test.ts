import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import { ProgramAnalyticsService } from "./program-analytics.service.js";

const now = new Date("2027-06-20T00:00:00.000Z");

describe("ProgramAnalyticsService", () => {
  it("derives tenant-scoped enrollment, cohort, completion, and overdue metrics", async () => {
    const findMany = vi.fn(async () => [
      {
        id: 3,
        name: "Leadership",
        status: "ACTIVE",
        cohorts: [{ id: 4, name: "June" }],
        enrollments: [
          {
            id: 1,
            employeeId: "EMP-1",
            cohortId: 4,
            enrollmentStatus: "COMPLETED",
            progressPercentage: 100,
            enrolledAt: new Date("2027-06-01T00:00:00.000Z"),
            dueDate: now,
          },
          {
            id: 2,
            employeeId: "EMP-2",
            cohortId: 4,
            enrollmentStatus: "ACTIVE",
            progressPercentage: 50,
            enrolledAt: new Date("2027-06-01T00:00:00.000Z"),
            dueDate: new Date("2027-06-10T00:00:00.000Z"),
          },
        ],
        tasks: [
          {
            id: 8,
            dueDate: new Date("2027-06-15T00:00:00.000Z"),
            dueOffsetDays: null,
            progresses: [{ programEnrollmentId: 1 }],
          },
        ],
      },
    ]);
    const prisma = { learningProgram: { findMany } } as unknown as PrismaClient;

    const result = await new ProgramAnalyticsService(prisma).runtime(7, now);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { companyId: 7, deletedAt: null, status: "ACTIVE" } }),
    );
    expect(result.summary).toEqual({
      activePrograms: 1,
      totalEnrolled: 2,
      totalCompleted: 1,
      completionRate: 50,
      averageProgress: 75,
      overdueRequirements: 2,
    });
    expect(result.programs[0]).toMatchObject({
      enrolled: 2,
      completed: 1,
      progress: 75,
      overdue: 2,
      cohortPerformance: [{ name: "June", learners: 2, completed: 1, progress: 75 }],
    });
  });
});
