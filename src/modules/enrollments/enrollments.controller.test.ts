import { describe, expect, it, vi } from "vitest";
import { ProgramCohortRosterService } from "../program/program-cohort-roster.service.js";
import {
  enrollmentsController,
  programEnrollSchema,
} from "./enrollments.controller.js";

const response = () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { value: { status } as any, status, json };
};

describe("POST /enrollments/program contract", () => {
  it("requires both programId and cohortId", () => {
    expect(() => programEnrollSchema.parse({ programId: 3 })).toThrow();
    expect(programEnrollSchema.parse({ programId: "3", cohortId: "4" })).toEqual({
      programId: 3,
      cohortId: 4,
    });
  });

  it("delegates cohort-scoped writes to the authoritative transaction as API", async () => {
    const enrollment = {
      enrollment: { id: 41, enrollmentNo: 2, source: "API" },
      linkedCourseEnrollmentIds: [101],
    };
    const delegate = vi
      .spyOn(ProgramCohortRosterService.prototype, "enrollCurrentUser")
      .mockResolvedValue(enrollment as never);
    const req = {
      body: { programId: 3, cohortId: 4 },
      user: { companyId: 7, appUserId: 9 },
    } as any;
    const res = response();

    await enrollmentsController.enrollProgram(req, res.value);

    expect(delegate).toHaveBeenCalledWith(
      { companyId: 7, userId: 9 },
      3,
      4,
      "API",
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: enrollment });

    delegate.mockRestore();
  });
});
