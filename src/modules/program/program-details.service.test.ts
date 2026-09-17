import { describe, expect, it, vi } from "vitest";
import { createProgramSchema } from "./program-details.dto.js";
import { ProgramDetailsService } from "./program-details.service.js";
import type {
  ProgramDetailsRepositoryPort,
  ProgramMutationState,
} from "./program-details.types.js";

const input = () =>
  createProgramSchema.parse({
    name: "Leadership Program",
    programTypeId: 1,
    ownerEmployeeId: "EMP-1",
    visibility: "COMPANY",
    startDate: new Date(Date.now() + 86_400_000).toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 4 * 86_400_000).toISOString().slice(0, 10),
  });

const mutationState = (overrides: Partial<ProgramMutationState> = {}): ProgramMutationState => ({
  id: 9,
  name: "Leadership Program",
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
  ...overrides,
});

const repository = (overrides: Partial<ProgramDetailsRepositoryPort> = {}): ProgramDetailsRepositoryPort => ({
  findByName: vi.fn(async () => null),
  findProgramType: vi.fn(async () => ({ id: 1, isActive: true })),
  findProgramCategory: vi.fn(async () => null),
  findOwner: vi.fn(async () => ({
    id: "EMP-1",
    fullName: "HR Owner",
    isActive: true,
    appUsers: [{
      email: "hr@example.com",
      role: { name: "HR Manager", isActive: true },
      primaryEmRole: null,
      roleAssignments: [],
    }],
  })),
  listOwners: vi.fn(async () => []),
  create: vi.fn(async (_companyId, _userId, _data, durationDays) => ({ durationDays })),
  list: vi.fn(async () => ({ items: [], total: 0 })),
  findById: vi.fn(async () => null),
  findMutationState: vi.fn(async () => mutationState()),
  hasPendingApproval: vi.fn(async () => false),
  countActiveEnrollments: vi.fn(async () => 0),
  update: vi.fn(async (_companyId, _userId, _id, data, durationDays) => ({ data, durationDays })),
  archive: vi.fn(async () => ({ status: "ARCHIVED" })),
  restore: vi.fn(async () => ({ status: "DRAFT" })),
  duplicate: vi.fn(async (_companyId, _userId, _id, name) => ({ name })),
  auditHistory: vi.fn(async () => ({ auditLogs: [], approvalInstances: [] })),
  ...overrides,
});

describe("ProgramDetailsService.listOwners", () => {
  it("returns only employees with active HR or administrator roles", async () => {
    const service = new ProgramDetailsService(repository({
      listOwners: vi.fn(async () => [
        {
          id: "EMP-HR",
          fullName: "HR Owner",
          isActive: true,
          appUsers: [{
            email: "hr@example.com",
            role: { name: "HR Manager", isActive: true },
            primaryEmRole: null,
            roleAssignments: [],
          }],
        },
        {
          id: "EMP-ADMIN",
          fullName: "Admin Owner",
          isActive: true,
          appUsers: [{
            email: "admin@example.com",
            role: null,
            primaryEmRole: { name: "Administrator", isActive: true },
            roleAssignments: [],
          }],
        },
        {
          id: "EMP-LEARNER",
          fullName: "Learner",
          isActive: true,
          appUsers: [{
            email: "learner@example.com",
            role: { name: "Learner", isActive: true },
            primaryEmRole: null,
            roleAssignments: [],
          }],
        },
        {
          id: "EMP-INACTIVE-HR",
          fullName: "Inactive HR",
          isActive: true,
          appUsers: [{
            email: "inactive-hr@example.com",
            role: { name: "HR Manager", isActive: false },
            primaryEmRole: null,
            roleAssignments: [],
          }],
        },
      ]),
    }));

    await expect(service.listOwners(7)).resolves.toEqual([
      { id: "EMP-HR", name: "HR Owner", email: "hr@example.com" },
      { id: "EMP-ADMIN", name: "Admin Owner", email: "admin@example.com" },
    ]);
  });
});

describe("ProgramDetailsService mutations", () => {
  it("updates draft metadata using the merged dates and excludes itself from name checks", async () => {
    const repo = repository({
      findMutationState: vi.fn(async () => mutationState({
        startDate: new Date("2030-01-01T00:00:00.000Z"),
      })),
    });
    const service = new ProgramDetailsService(repo);
    const endDate = new Date("2030-01-06T00:00:00.000Z");

    await expect(service.update(7, 42, 9, {
      name: "Updated Program",
      endDate,
    })).resolves.toMatchObject({ durationDays: 5 });
    expect(repo.findByName).toHaveBeenCalledWith(7, "Updated Program", 9);
    expect(repo.update).toHaveBeenCalledWith(
      7,
      42,
      9,
      expect.objectContaining({ name: "Updated Program", endDate }),
      5,
    );
  });

  it("blocks updates while a pending approval instance exists", async () => {
    const service = new ProgramDetailsService(repository({
      hasPendingApproval: vi.fn(async () => true),
    }));

    await expect(service.update(7, 42, 9, { description: "Changed" }))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  it("blocks archiving when active enrollments exist", async () => {
    const service = new ProgramDetailsService(repository({
      countActiveEnrollments: vi.fn(async () => 1),
    }));

    await expect(service.archive(7, 42, 9)).rejects.toMatchObject({
      statusCode: 409,
      message: "A learning program with active enrollments cannot be archived.",
    });
  });

  it("restores only archived programs", async () => {
    const repo = repository({
      findMutationState: vi.fn(async () => mutationState({ status: "ARCHIVED" })),
    });
    const service = new ProgramDetailsService(repo);

    await expect(service.restore(7, 42, 9)).resolves.toEqual({ status: "DRAFT" });
    expect(repo.restore).toHaveBeenCalledWith(7, 42, 9);
  });

  it("generates the next available duplicate name", async () => {
    const repo = repository({
      findByName: vi.fn(async (_companyId, name) =>
        name === "Leadership Program (Copy)" ? { id: 10 } : null),
    });
    const service = new ProgramDetailsService(repo);

    await expect(service.duplicate(7, 42, 9, {})).resolves.toEqual({
      name: "Leadership Program (Copy 2)",
    });
    expect(repo.duplicate).toHaveBeenCalledWith(7, 42, 9, "Leadership Program (Copy 2)");
  });
});

describe("ProgramDetailsService.create", () => {
  it("calculates duration and persists server-controlled context", async () => {
    const repo = repository();
    const service = new ProgramDetailsService(repo);

    await expect(service.create(7, 42, input())).resolves.toEqual({ durationDays: 3 });
    expect(repo.create).toHaveBeenCalledWith(7, 42, expect.any(Object), 3);
  });

  it("rejects a duplicate company program name", async () => {
    const service = new ProgramDetailsService(repository({
      findByName: vi.fn(async () => ({ id: 9 })),
    }));

    await expect(service.create(7, 42, input())).rejects.toMatchObject({ statusCode: 409 });
  });

  it("rejects an owner without an active HR or administrator role", async () => {
    const service = new ProgramDetailsService(repository({
      findOwner: vi.fn(async () => ({
        id: "EMP-1",
        fullName: "Learner Owner",
        isActive: true,
        appUsers: [{
          email: "learner@example.com",
          role: { name: "Learner", isActive: true },
          primaryEmRole: null,
          roleAssignments: [],
        }],
      })),
    }));

    await expect(service.create(7, 42, input())).rejects.toMatchObject({
      statusCode: 400,
      message: "Owner employee must have an active HR or administrator role.",
    });
  });
});
