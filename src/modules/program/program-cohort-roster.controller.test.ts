import { describe, expect, it, vi } from "vitest";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import { ProgramCohortRosterController } from "./program-cohort-roster.controller.js";
import type { ProgramCohortRosterService } from "./program-cohort-roster.service.js";

const response = () => {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  return { value: { status } as any, status, json };
};

describe("ProgramCohortRosterController learner enrollment", () => {
  it("delegates the authenticated learner endpoint as SELF_SERVICE", async () => {
    const enrollCurrentUser = vi.fn(async () => ({
      enrollment: { id: 41, enrollmentNo: 2, source: "SELF_SERVICE" },
      linkedCourseEnrollmentIds: [101],
    }));
    const controller = new ProgramCohortRosterController({
      enrollCurrentUser,
    } as unknown as ProgramCohortRosterService);
    const req = {
      params: { programId: "3", cohortId: "4" },
      user: { companyId: 7, appUserId: 9 },
    } as unknown as AuthenticatedRequest;
    const res = response();
    const next = vi.fn();

    await controller.enrollMe(req, res.value, next);

    expect(enrollCurrentUser).toHaveBeenCalledWith(
      { companyId: 7, userId: 9 },
      3,
      4,
      "SELF_SERVICE",
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: {
        enrollment: { id: 41, enrollmentNo: 2, source: "SELF_SERVICE" },
        linkedCourseEnrollmentIds: [101],
      },
    });
    expect(next).not.toHaveBeenCalled();
  });
});
