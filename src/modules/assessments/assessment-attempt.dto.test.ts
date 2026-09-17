import { describe, expect, it } from "vitest";
import { gradeAnswerSchema, saveAnswerSchema, startAttemptSchema } from "./assessment-attempt.dto.js";

describe("assessment attempt DTOs", () => {
  it("accepts each supported answer shape", () => {
    expect(saveAnswerSchema.parse({ optionIds: [1, 2] })).toEqual({ optionIds: [1, 2] });
    expect(saveAnswerSchema.parse({ blanks: [{ blankIndex: 0, typedText: " value " }] })).toEqual({
      blanks: [{ blankIndex: 0, typedText: " value " }],
    });
    expect(
      saveAnswerSchema.parse({ matches: [{ leftPairId: 1, rightPairId: 1000001 }] }),
    ).toEqual({ matches: [{ leftPairId: 1, rightPairId: 1000001 }] });
    expect(saveAnswerSchema.parse({ answerText: "Response" })).toEqual({ answerText: "Response" });
  });

  it("rejects mixed, empty, and unknown answer payloads", () => {
    expect(() => saveAnswerSchema.parse({ optionIds: [], answerText: "mixed" })).toThrow();
    expect(() => saveAnswerSchema.parse({ optionIds: [], extra: true })).toThrow();
    expect(() => saveAnswerSchema.parse({})).toThrow();
  });

  it("coerces identifiers and marks while enforcing safe bounds", () => {
    expect(startAttemptSchema.parse({ enrollmentId: "12" })).toEqual({ enrollmentId: 12 });
    expect(gradeAnswerSchema.parse({ awardedMarks: "2.5" })).toEqual({ awardedMarks: 2.5 });
    expect(() => gradeAnswerSchema.parse({ awardedMarks: -1 })).toThrow();
  });
});
