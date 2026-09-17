import { describe, expect, it } from "vitest";
import { aggregateAssessmentAttempts } from "./enrollment-progress.service.js";

const attempts = [
  { id: 1, attemptNo: 1, percentage: 60 },
  { id: 2, attemptNo: 2, percentage: 90 },
  { id: 3, attemptNo: 3, percentage: 75 },
];

describe("assessment attempt aggregation", () => {
  it("supports every configured grading method", () => {
    expect(aggregateAssessmentAttempts("highest_score", attempts)).toMatchObject({ score: 90, representative: { id: 2 } });
    expect(aggregateAssessmentAttempts("latest_attempt", attempts)).toMatchObject({ score: 75, representative: { id: 3 } });
    expect(aggregateAssessmentAttempts("first_attempt", attempts)).toMatchObject({ score: 60, representative: { id: 1 } });
    expect(aggregateAssessmentAttempts("average_score", attempts)).toMatchObject({ score: 75, representative: null, attemptIds: [1, 2, 3] });
  });

  it("fails closed when no graded score exists", () => {
    expect(aggregateAssessmentAttempts("highest_score", [])).toEqual({
      score: null,
      representative: null,
      attemptIds: [],
    });
  });
});
