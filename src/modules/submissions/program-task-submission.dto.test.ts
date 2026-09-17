import { describe, expect, it } from "vitest";
import {
  peerReviewSchema,
  rejectSubmissionSchema,
  reviewSubmissionSchema,
  submitProgramTaskSchema,
} from "./program-task-submission.dto.js";

describe("Program task submission DTOs", () => {
  it("accepts strict text and HTTP link submissions", () => {
    expect(
      submitProgramTaskSchema.parse({ submissionType: "TEXT_INPUT", textAnswer: " Evidence " }),
    ).toEqual({ submissionType: "TEXT_INPUT", textAnswer: "Evidence" });
    expect(
      submitProgramTaskSchema.parse({ submissionType: "LINK", submissionUrl: "https://example.com/work" }),
    ).toMatchObject({ submissionType: "LINK" });
  });

  it("rejects unsupported, mixed, and unsafe submission payloads", () => {
    expect(() => submitProgramTaskSchema.parse({ submissionType: "FILE_UPLOAD" })).toThrow();
    expect(() =>
      submitProgramTaskSchema.parse({
        submissionType: "TEXT_INPUT",
        textAnswer: "work",
        submissionUrl: "https://example.com",
      }),
    ).toThrow();
    expect(() =>
      submitProgramTaskSchema.parse({ submissionType: "LINK", submissionUrl: "javascript:alert(1)" }),
    ).toThrow();
  });

  it("validates reviewer scores, rejection reasons, and peer reviews", () => {
    expect(reviewSubmissionSchema.parse({ score: "85", reviewComment: "Good" })).toEqual({
      score: 85,
      reviewComment: "Good",
    });
    expect(() => reviewSubmissionSchema.parse({ score: 101 })).toThrow();
    expect(() => rejectSubmissionSchema.parse({ reviewComment: " " })).toThrow();
    expect(peerReviewSchema.parse({ rating: 5 })).toEqual({ rating: 5 });
    expect(() => peerReviewSchema.parse({})).toThrow();
  });
});
