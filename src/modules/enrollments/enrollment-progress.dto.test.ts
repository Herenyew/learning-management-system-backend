import { describe, expect, it } from "vitest";
import {
  endLearningSessionSchema,
  updateContentProgressSchema,
} from "./enrollment-progress.dto.js";

describe("enrollment progress DTOs", () => {
  it("accepts bounded content progress evidence", () => {
    expect(
      updateContentProgressSchema.parse({
        status: "IN_PROGRESS",
        watchPercentage: 42.5,
        lastPositionSeconds: 120,
        timeSpentMinutes: 3,
      }),
    ).toEqual({
      status: "IN_PROGRESS",
      watchPercentage: 42.5,
      lastPositionSeconds: 120,
      timeSpentMinutes: 3,
    });
  });

  it("rejects invalid percentages, negative time, and unknown completion controls", () => {
    expect(() =>
      updateContentProgressSchema.parse({ status: "COMPLETED", watchPercentage: 101 }),
    ).toThrow();
    expect(() =>
      updateContentProgressSchema.parse({ status: "IN_PROGRESS", timeSpentMinutes: -1 }),
    ).toThrow();
    expect(() =>
      updateContentProgressSchema.parse({ status: "COMPLETED", passed: true }),
    ).toThrow();
  });

  it("bounds reported session duration", () => {
    expect(endLearningSessionSchema.parse({ totalSeconds: 90 })).toEqual({ totalSeconds: 90 });
    expect(() => endLearningSessionSchema.parse({ totalSeconds: -1 })).toThrow();
  });
});
