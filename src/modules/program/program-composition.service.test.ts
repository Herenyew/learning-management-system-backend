import { describe, expect, it, vi } from "vitest";
import type { ProgramCompositionRepository } from "./program-composition.repository.js";
import { ProgramCompositionService } from "./program-composition.service.js";
import type { CompositionTransaction } from "./program-composition.types.js";

const draftProgram = {
  id: 10,
  name: "Leadership",
  status: "DRAFT" as const,
  startDate: new Date("2027-01-01T00:00:00.000Z"),
  endDate: new Date("2027-12-31T23:59:59.999Z"),
};

const serviceWithTransaction = (tx: object) => {
  const repository = {
    transaction: vi.fn(async (work: (client: CompositionTransaction) => Promise<unknown>) =>
      work(tx as CompositionTransaction)),
    findProgram: vi.fn(async () => draftProgram),
    listTargetAudiences: vi.fn(),
    listCohorts: vi.fn(),
    listCourses: vi.fn(),
    listTasks: vi.fn(),
    listMilestones: vi.fn(),
  } as unknown as ProgramCompositionRepository;
  return { service: new ProgramCompositionService(repository), repository };
};

describe("ProgramCompositionService tenant and state guards", () => {
  it("does not expose composition for a program outside the company", async () => {
    const list = vi.fn();
    const repository = {
      findProgram: vi.fn(async () => null),
      listCohorts: list,
    } as unknown as ProgramCompositionRepository;
    const service = new ProgramCompositionService(repository);

    await expect(service.getCohorts(7, 10)).rejects.toMatchObject({ statusCode: 404 });
    expect(list).not.toHaveBeenCalled();
  });

  it("rejects writes to a non-draft program", async () => {
    const tx = {
      learningProgram: { findFirst: vi.fn(async () => ({ ...draftProgram, status: "ACTIVE" })) },
      approvalWorkflowInstance: { findFirst: vi.fn() },
    };
    const { service } = serviceWithTransaction(tx);

    await expect(service.deleteCohort({ companyId: 7, userId: 9 }, 10, 2)).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining("DRAFT"),
    });
    expect(tx.approvalWorkflowInstance.findFirst).not.toHaveBeenCalled();
  });

  it("rejects writes while a PENDING approval instance exists", async () => {
    const tx = {
      learningProgram: { findFirst: vi.fn(async () => draftProgram) },
      approvalWorkflowInstance: { findFirst: vi.fn(async () => ({ id: 22 })) },
      programCohort: { findFirst: vi.fn() },
    };
    const { service } = serviceWithTransaction(tx);

    await expect(service.deleteCohort({ companyId: 7, userId: 9 }, 10, 2)).rejects.toMatchObject({
      statusCode: 409,
      message: expect.stringContaining("approval is pending"),
    });
    expect(tx.programCohort.findFirst).not.toHaveBeenCalled();
  });
});

describe("ProgramCompositionService dependency guards", () => {
  it("blocks deleting a cohort with enrollments", async () => {
    const remove = vi.fn();
    const audit = vi.fn();
    const tx = {
      learningProgram: { findFirst: vi.fn(async () => draftProgram) },
      approvalWorkflowInstance: { findFirst: vi.fn(async () => null) },
      programCohort: {
        findFirst: vi.fn(async () => ({
          id: 2,
          programId: 10,
          name: "January",
          capacity: 20,
          startDate: null,
          endDate: null,
          _count: { enrollments: 1 },
        })),
        delete: remove,
      },
      auditLog: { create: audit },
    };
    const { service } = serviceWithTransaction(tx);

    await expect(service.deleteCohort({ companyId: 7, userId: 9 }, 10, 2)).rejects.toMatchObject({
      statusCode: 409,
      message: "Cannot delete a cohort that has enrollments.",
    });
    expect(remove).not.toHaveBeenCalled();
    expect(audit).not.toHaveBeenCalled();
  });

  it("rejects an offset beyond a fixed program's date bounds", async () => {
    const tx = {
      learningProgram: { findFirst: vi.fn(async () => draftProgram) },
      approvalWorkflowInstance: { findFirst: vi.fn(async () => null) },
      taskType: { findFirst: vi.fn() },
    };
    const { service } = serviceWithTransaction(tx);

    await expect(service.createTask(
      { companyId: 7, userId: 9 },
      10,
      {
        title: "Late task",
        taskTypeId: 1,
        dueOffsetDays: 500,
        maxSubmissions: 1,
        allowResubmission: false,
        isRequired: true,
        isBlocking: false,
        requiresManagerApproval: false,
        peerReviewRequired: false,
        requiredPeerReviewCount: 3,
      },
    )).rejects.toMatchObject({
      statusCode: 400,
      message: expect.stringContaining("program duration"),
    });
    expect(tx.taskType.findFirst).not.toHaveBeenCalled();
  });

  it("rejects adding an unpublished course version", async () => {
    const create = vi.fn();
    const tx = {
      learningProgram: { findFirst: vi.fn(async () => draftProgram) },
      approvalWorkflowInstance: { findFirst: vi.fn(async () => null) },
      courseVersion: { findFirst: vi.fn(async () => null) },
      programCourse: { create },
    };
    const { service } = serviceWithTransaction(tx);

    await expect(service.createCourse(
      { companyId: 7, userId: 9 },
      10,
      { courseVersionId: 5, phaseNumber: 1, isRequired: true },
    )).rejects.toMatchObject({ statusCode: 400 });
    expect(create).not.toHaveBeenCalled();
  });
});
