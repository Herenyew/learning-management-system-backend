import { describe, expect, it } from "vitest";
import {
  programTaskWaiverParamsSchema,
  waiveProgramTaskSchema,
} from "./program-task-waiver.dto.js";

describe("program task waiver validation", () => {
  it("trims and accepts a nonblank reason", () => {
    expect(waiveProgramTaskSchema.parse({ reason: "  Equivalent prior training  " })).toEqual({
      reason: "Equivalent prior training",
    });
  });

  it("rejects blank reasons and unknown fields", () => {
    expect(waiveProgramTaskSchema.safeParse({ reason: "   " }).success).toBe(false);
    expect(waiveProgramTaskSchema.safeParse({ reason: "Valid", waivedBy: 123 }).success).toBe(false);
  });

  it("coerces positive route identifiers", () => {
    expect(programTaskWaiverParamsSchema.parse({
      programId: "31",
      enrollmentId: "21",
      taskId: "41",
    })).toEqual({ programId: 31, enrollmentId: 21, taskId: 41 });
  });
});
