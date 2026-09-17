import { describe, expect, it } from "vitest";
import {
  compositionOrderSchema,
  createProgramCohortSchema,
  createProgramMilestoneSchema,
  createProgramTaskSchema,
  replaceTargetAudiencesSchema,
  updateProgramTaskSchema,
} from "./program-composition.dto.js";

describe("program composition DTOs", () => {
  it("rejects duplicate target audience IDs", () => {
    expect(replaceTargetAudiencesSchema.safeParse({ audienceGroupIds: [1, 1] }).success).toBe(false);
  });

  it("allows clearing all target audiences", () => {
    expect(replaceTargetAudiencesSchema.parse({ audienceGroupIds: [] })).toEqual({ audienceGroupIds: [] });
  });

  it("requires positive cohort capacity and an increasing date range", () => {
    expect(createProgramCohortSchema.safeParse({ name: "A", capacity: 0 }).success).toBe(false);
    expect(createProgramCohortSchema.safeParse({
      name: "A",
      startDate: "2027-03-02T00:00:00.000Z",
      endDate: "2027-03-01T00:00:00.000Z",
    }).success).toBe(false);
  });

  it("rejects simultaneous task due date and due offset", () => {
    expect(createProgramTaskSchema.safeParse({
      title: "Complete module",
      taskTypeId: 2,
      dueDate: "2027-03-02T00:00:00.000Z",
      dueOffsetDays: 4,
    }).success).toBe(false);
  });

  it("allows a PATCH to explicitly clear one schedule before setting the other", () => {
    expect(updateProgramTaskSchema.parse({ dueDate: null, dueOffsetDays: 4 })).toEqual({
      dueDate: null,
      dueOffsetDays: 4,
    });
  });

  it("bounds milestone percentages from 1 through 100", () => {
    expect(createProgramMilestoneSchema.safeParse({ title: "Start", milestonePercentage: 0 }).success).toBe(false);
    expect(createProgramMilestoneSchema.safeParse({ title: "Done", milestonePercentage: 100 }).success).toBe(true);
    expect(createProgramMilestoneSchema.safeParse({ title: "Too far", milestonePercentage: 101 }).success).toBe(false);
  });

  it("requires ordering IDs to be positive and unique", () => {
    expect(compositionOrderSchema.safeParse({ orderedIds: [] }).success).toBe(false);
    expect(compositionOrderSchema.safeParse({ orderedIds: [3, 3] }).success).toBe(false);
    expect(compositionOrderSchema.parse({ orderedIds: [3, 1] })).toEqual({ orderedIds: [3, 1] });
  });
});
