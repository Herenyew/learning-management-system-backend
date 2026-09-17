import { describe, expect, it } from "vitest";
import {
  applyProgramTemplateSchema,
  programTemplateApplicationProgramParamsSchema,
  programTemplateDefaultCoursesSchema,
  programTemplateDefaultMilestonesSchema,
  programTemplateDefaultTasksSchema,
} from "./program-template-application.dto.js";

describe("program template application DTOs", () => {
  it("coerces route IDs and validates the requested route shape", () => {
    expect(programTemplateApplicationProgramParamsSchema.parse({ id: "12" })).toEqual({ id: 12 });
    expect(programTemplateApplicationProgramParamsSchema.safeParse({ programId: "12" }).success).toBe(false);
  });

  it("rejects an invalid application date range and unknown fields", () => {
    expect(applyProgramTemplateSchema.safeParse({
      name: "From template",
      startDate: "2030-02-02T00:00:00.000Z",
      endDate: "2030-02-01T00:00:00.000Z",
    }).success).toBe(false);
    expect(applyProgramTemplateSchema.safeParse({ name: "From template", companyId: 99 }).success).toBe(false);
  });

  it("rejects duplicate persisted composition keys", () => {
    expect(programTemplateDefaultCoursesSchema.safeParse([
      { courseVersionId: 3, displayOrder: 1 },
      { courseVersionId: 3, displayOrder: 2 },
    ]).success).toBe(false);
    expect(programTemplateDefaultTasksSchema.safeParse([
      { title: "One", taskTypeId: 1, displayOrder: 1 },
      { title: "Two", taskTypeId: 1, displayOrder: 1 },
    ]).success).toBe(false);
    expect(programTemplateDefaultMilestonesSchema.safeParse([
      { title: "Half", milestonePercentage: 50 },
      { title: "Also half", milestonePercentage: 50 },
    ]).success).toBe(false);
  });
});
