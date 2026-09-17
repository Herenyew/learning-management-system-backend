import { describe, expect, it, vi } from "vitest";
import { ProgramTemplateApplicationService } from "./program-template-application.service.js";
import type {
  ProgramTemplateApplicationRepositoryPort,
  ProgramTemplateApplicationTransaction,
} from "./program-template-application.types.js";

const context = { companyId: 7, userId: 42 };

const repositoryWith = (tx: object): ProgramTemplateApplicationRepositoryPort => ({
  transaction: vi.fn(async (work) => work(tx as ProgramTemplateApplicationTransaction)),
});

const activeOwner = {
  id: "EMP-1",
  isActive: true,
  appUsers: [{
    role: { name: "HR Manager", isActive: true },
    primaryEmRole: null,
    roleAssignments: [],
  }],
};

const template = {
  id: 4,
  companyId: 7,
  name: "Leadership template",
  description: "A reusable program",
  categoryId: 2,
  programTypeId: 3,
  durationWeeks: 2,
  visibility: "COMPANY",
  ownerEmployeeId: "EMP-1",
  isMandatory: false,
  autoEnroll: false,
  allowSelfEnrollment: true,
  rollingEnrollment: false,
  capacity: 50,
  certificateEnabled: true,
  xpEnabled: true,
  defaultCourses: [{ courseVersionId: 11, displayOrder: 1, isRequired: true }],
  defaultTasks: [{
    title: "Read module",
    taskTypeId: 8,
    courseVersionId: 11,
    displayOrder: 1,
    dueOffsetDays: 5,
  }],
  defaultMilestones: [{
    title: "Complete",
    milestonePercentage: 100,
    targetOffsetDays: 14,
  }],
  isActive: true,
  createdBy: 1,
  updatedBy: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
};

const applyTx = (overrides: Record<string, unknown> = {}) => ({
  programTemplate: { findFirst: vi.fn(async () => template) },
  learningProgram: {
    findFirst: vi.fn(async () => null),
    create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 20, ...data })),
  },
  programType: { findFirst: vi.fn(async () => ({ id: 3 })) },
  programCategory: { findFirst: vi.fn(async () => ({ id: 2 })) },
  employee: { findFirst: vi.fn(async () => activeOwner) },
  courseVersion: { findMany: vi.fn(async () => [{ id: 11 }]) },
  taskType: {
    findMany: vi.fn(async () => [{ id: 8, name: "Course", linkedEntity: "COURSE_VERSION" }]),
  },
  programCourse: { createMany: vi.fn(async () => ({ count: 1 })) },
  programTask: { createMany: vi.fn(async () => ({ count: 1 })) },
  programMilestone: { createMany: vi.fn(async () => ({ count: 1 })) },
  auditLog: { create: vi.fn(async () => ({ id: "audit" })) },
  ...overrides,
});

describe("ProgramTemplateApplicationService.apply", () => {
  it("materializes all defaults and derives an end date atomically", async () => {
    const tx = applyTx();
    const service = new ProgramTemplateApplicationService(repositoryWith(tx));
    const startDate = new Date("2030-01-01T00:00:00.000Z");

    const result = await service.apply(context, 4, {
      name: "Leadership 2030",
      startDate,
    });

    expect(result).toMatchObject({ id: 20, name: "Leadership 2030", durationDays: 14 });
    expect(tx.learningProgram.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        companyId: 7,
        endDate: new Date("2030-01-15T00:00:00.000Z"),
        status: "DRAFT",
      }),
    }));
    expect(tx.programCourse.createMany).toHaveBeenCalledOnce();
    expect(tx.programTask.createMany).toHaveBeenCalledOnce();
    expect(tx.programMilestone.createMany).toHaveBeenCalledOnce();
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "CREATED_FROM_TEMPLATE", companyId: 7 }),
    }));
  });

  it("does not expose a template belonging to another company", async () => {
    const tx = applyTx({
      programTemplate: { findFirst: vi.fn(async () => null) },
    });
    const service = new ProgramTemplateApplicationService(repositoryWith(tx));

    await expect(service.apply(context, 99, { name: "No access" }))
      .rejects.toMatchObject({ statusCode: 404 });
    expect(tx.learningProgram.create).not.toHaveBeenCalled();
  });

  it("rejects malformed stored defaults before creating a program", async () => {
    const tx = applyTx({
      programTemplate: {
        findFirst: vi.fn(async () => ({
          ...template,
          defaultCourses: [{ courseVersionId: 11, displayOrder: 1 }, { courseVersionId: 11, displayOrder: 2 }],
        })),
      },
    });
    const service = new ProgramTemplateApplicationService(repositoryWith(tx));

    await expect(service.apply(context, 4, { name: "Invalid defaults" }))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(tx.learningProgram.create).not.toHaveBeenCalled();
  });
});

describe("ProgramTemplateApplicationService.saveAsTemplate", () => {
  it("copies program composition and records template provenance", async () => {
    const source = {
      id: 20,
      description: "Source",
      programTypeId: 3,
      programCategoryId: 2,
      ownerEmployeeId: "EMP-1",
      visibility: "COMPANY",
      durationDays: 15,
      startDate: new Date("2030-01-01T00:00:00.000Z"),
      endDate: new Date("2030-01-16T00:00:00.000Z"),
      rollingEnrollment: true,
      maxEnrollments: 25,
      courses: [{ courseVersionId: 11, displayOrder: 1, isRequired: true }],
      tasks: [],
      milestones: [{
        title: "Done",
        milestonePercentage: { toString: () => "100" },
        targetDate: null,
        targetOffsetDays: 15,
        completionExpression: null,
        overdueAction: null,
        reminderOffsetsDays: [],
      }],
    };
    const tx = {
      learningProgram: { findFirst: vi.fn(async () => source) },
      programTemplate: {
        findFirst: vi.fn(async () => null),
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => ({ id: 31, ...data })),
      },
      programType: { findFirst: vi.fn(async () => ({ id: 3 })) },
      programCategory: { findFirst: vi.fn(async () => ({ id: 2 })) },
      employee: { findFirst: vi.fn(async () => activeOwner) },
      courseVersion: { findMany: vi.fn(async () => [{ id: 11 }]) },
      taskType: { findMany: vi.fn(async () => []) },
      auditLog: { create: vi.fn(async () => ({ id: "audit" })) },
    };
    const service = new ProgramTemplateApplicationService(repositoryWith(tx));

    const result = await service.saveAsTemplate(context, 20, { name: "Reusable leadership" });

    expect(result).toMatchObject({ id: 31, durationWeeks: 3, companyId: 7 });
    expect(tx.programTemplate.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        defaultCourses: [{ courseVersionId: 11, displayOrder: 1, phaseNumber: 1, isRequired: true }],
        durationWeeks: 3,
      }),
    }));
    expect(tx.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: "CREATED_FROM_PROGRAM", entityType: "PROGRAM_TEMPLATE" }),
    }));
  });

  it("rejects non-portable live-session tasks", async () => {
    const tx = {
      learningProgram: {
        findFirst: vi.fn(async () => ({
          id: 20,
          tasks: [{ liveSessionId: 5 }],
          courses: [],
          milestones: [],
        })),
      },
      programTemplate: { findFirst: vi.fn(async () => null), create: vi.fn() },
    };
    const service = new ProgramTemplateApplicationService(repositoryWith(tx));

    await expect(service.saveAsTemplate(context, 20, { name: "Invalid" }))
      .rejects.toMatchObject({ statusCode: 400, message: expect.stringContaining("live-session") });
    expect(tx.programTemplate.create).not.toHaveBeenCalled();
  });
});
