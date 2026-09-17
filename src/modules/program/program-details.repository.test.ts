import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { createProgramSchema } from "./program-details.dto.js";
import { ProgramDetailsRepository } from "./program-details.repository.js";

const displayedProgram = {
  id: 20,
  companyId: 7,
  name: "Leadership Program (Copy)",
  description: null,
  programTypeId: 1,
  programCategoryId: null,
  ownerEmployeeId: "EMP-1",
  visibility: "COMPANY",
  status: "DRAFT",
  startDate: null,
  endDate: null,
  durationDays: null,
  rollingEnrollment: false,
  maxEnrollments: null,
  approvalStatus: "PENDING",
  createdBy: 42,
  updatedBy: null,
  createdAt: new Date("2030-01-01T00:00:00.000Z"),
  updatedAt: new Date("2030-01-01T00:00:00.000Z"),
  programType: { id: 1, name: "Standard" },
  programCategory: null,
  owner: { id: "EMP-1", fullName: "HR Owner" },
};

describe("ProgramDetailsRepository transactions", () => {
  it("creates the program and CREATED audit record on the same transaction client", async () => {
    const tx = {
      learningProgram: {
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => displayedProgram),
      },
      auditLog: { create: vi.fn(async () => ({ id: "audit-1" })) },
    };
    const prisma = {
      $transaction: vi.fn(async (operation: (client: typeof tx) => Promise<unknown>) => operation(tx)),
    } as unknown as PrismaClient;
    const repository = new ProgramDetailsRepository(prisma);
    const input = createProgramSchema.parse({
      name: "Leadership Program (Copy)",
      programTypeId: 1,
      ownerEmployeeId: "EMP-1",
      visibility: "COMPANY",
    });

    await expect(repository.create(7, 42, input, null)).resolves.toEqual(displayedProgram);
    expect(tx.learningProgram.create).toHaveBeenCalledOnce();
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: 7,
        actorUserId: 42,
        entityType: "LEARNING_PROGRAM",
        entityId: "20",
        action: "CREATED",
      }),
    });
    expect(tx.learningProgram.create.mock.invocationCallOrder[0])
      .toBeLessThan(tx.auditLog.create.mock.invocationCallOrder[0]!);
  });

  it("duplicates configuration relations, remaps audiences, and resets lifecycle fields", async () => {
    const source = {
      id: 9,
      name: "Leadership Program",
      description: "Description",
      programTypeId: 1,
      programCategoryId: 2,
      ownerEmployeeId: "EMP-1",
      visibility: "COMPANY",
      status: "ACTIVE",
      startDate: null,
      endDate: null,
      durationDays: null,
      rollingEnrollment: true,
      maxEnrollments: 50,
      approvalStatus: "APPROVED",
      courses: [{ courseVersionId: 3, displayOrder: 1, isRequired: true }],
      cohorts: [{ name: "Cohort A", capacity: 25, startDate: null, endDate: null }],
      milestones: [{
        title: "Halfway",
        milestonePercentage: 50,
        targetDate: null,
        targetOffsetDays: 10,
        completionExpression: null,
        overdueAction: null,
        reminderOffsetsDays: [2],
      }],
      tasks: [{
        title: "Task",
        description: null,
        taskTypeId: 4,
        courseVersionId: null,
        courseContentId: null,
        assessmentId: null,
        surveyId: null,
        maxSubmissions: 1,
        allowResubmission: false,
        isRequired: true,
        isBlocking: false,
        displayOrder: 1,
        phaseNumber: null,
        dueDate: null,
        dueOffsetDays: 5,
        minimumTimeMinutes: null,
        minimumScore: null,
        minimumAttendance: null,
        requiresManagerApproval: false,
        peerReviewRequired: false,
        requiredPeerReviewCount: 3,
        xpAward: 10,
      }],
      programTagMappings: [{ tagId: 6 }],
      enrollmentRules: [{
        name: "Auto enroll leaders",
        description: null,
        entityType: "PROGRAM",
        courseVersionId: null,
        ruleTypeId: 8,
        priority: 1,
        isActive: true,
        targetAudienceId: 11,
        conditionExpression: null,
      }],
      xpRules: [{
        name: "Program completion",
        categoryId: 12,
        triggerEventId: 13,
        xpAmount: 100,
        maximumAward: 1,
        multiplier: null,
        targetAudienceId: 11,
        conditionExpression: null,
        courseVersionId: null,
        isActive: true,
      }],
    };
    const tx = {
      learningProgram: {
        findFirst: vi.fn()
          .mockResolvedValueOnce(source)
          .mockResolvedValueOnce(null),
        create: vi.fn(async () => displayedProgram),
      },
      programCourse: { createMany: vi.fn(async () => ({ count: 1 })) },
      programCohort: { createMany: vi.fn(async () => ({ count: 1 })) },
      programMilestone: { createMany: vi.fn(async () => ({ count: 1 })) },
      programTask: { createMany: vi.fn(async () => ({ count: 1 })) },
      programTagMapping: { createMany: vi.fn(async () => ({ count: 1 })) },
      targetAudience: {
        findMany: vi.fn(async () => [{
          id: 11,
          audienceGroupId: 5,
          departmentId: null,
          appRoleId: null,
        }]),
        create: vi.fn(async () => ({ id: 21 })),
      },
      enrollmentRule: {
        findFirst: vi.fn(async () => null),
        create: vi.fn(async () => ({ id: 22 })),
      },
      xpRule: { createMany: vi.fn(async () => ({ count: 1 })) },
      auditLog: { create: vi.fn(async () => ({ id: "audit-2" })) },
    };
    const prisma = {
      $transaction: vi.fn(async (operation: (client: typeof tx) => Promise<unknown>) => operation(tx)),
    } as unknown as PrismaClient;
    const repository = new ProgramDetailsRepository(prisma);

    await expect(repository.duplicate(7, 42, 9, displayedProgram.name))
      .resolves.toEqual(displayedProgram);
    expect(tx.learningProgram.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ status: "DRAFT", approvalStatus: "PENDING" }),
    }));
    expect(tx.programCourse.createMany).toHaveBeenCalledOnce();
    expect(tx.programCohort.createMany).toHaveBeenCalledOnce();
    expect(tx.programMilestone.createMany).toHaveBeenCalledOnce();
    expect(tx.programTask.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ programId: 20, liveSessionId: null })],
    });
    expect(tx.programTagMapping.createMany).toHaveBeenCalledOnce();
    expect(tx.enrollmentRule.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        programId: 20,
        targetAudienceId: 21,
        createdBy: 42,
      }),
    });
    expect(tx.xpRule.createMany).toHaveBeenCalledWith({
      data: [expect.objectContaining({ programId: 20, targetAudienceId: 21, createdBy: 42 })],
    });
    expect(tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        entityType: "LEARNING_PROGRAM",
        entityId: "20",
        action: "DUPLICATED",
      }),
    });
  });
});
