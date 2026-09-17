import { describe, expect, it } from "vitest";
import {
  bulkProgramCohortEnrollmentSchema,
  createProgramCohortEnrollmentSchema,
  programCohortEnrollmentParamsSchema,
  programCohortRosterParamsSchema,
  programCohortWaitlistEntryParamsSchema,
} from "./program-cohort-roster.dto.js";

describe("program cohort roster DTOs", () => {
  it("normalizes a single employee ID and rejects unknown fields", () => {
    expect(createProgramCohortEnrollmentSchema.parse({ employeeId: " EMP-1 " })).toEqual({
      employeeId: "EMP-1",
    });
    expect(
      createProgramCohortEnrollmentSchema.safeParse({ employeeId: "EMP-1", cohortId: 4 }).success,
    ).toBe(false);
  });

  it("requires a non-empty unique bulk employee list", () => {
    expect(bulkProgramCohortEnrollmentSchema.safeParse({ employeeIds: [] }).success).toBe(false);
    expect(
      bulkProgramCohortEnrollmentSchema.safeParse({ employeeIds: ["EMP-1", "EMP-1"] }).success,
    ).toBe(false);
    expect(
      bulkProgramCohortEnrollmentSchema.parse({ employeeIds: ["EMP-1", "EMP-2"] }),
    ).toEqual({ employeeIds: ["EMP-1", "EMP-2"] });
  });

  it("coerces positive route IDs", () => {
    expect(programCohortRosterParamsSchema.parse({ programId: "3", cohortId: "8" })).toEqual({
      programId: 3,
      cohortId: 8,
    });
    expect(
      programCohortEnrollmentParamsSchema.parse({
        programId: "3",
        cohortId: "8",
        enrollmentId: "13",
      }),
    ).toEqual({ programId: 3, cohortId: 8, enrollmentId: 13 });
    expect(
      programCohortWaitlistEntryParamsSchema.parse({
        programId: "3",
        cohortId: "8",
        entryId: "21",
      }),
    ).toEqual({ programId: 3, cohortId: 8, entryId: 21 });
  });
});
