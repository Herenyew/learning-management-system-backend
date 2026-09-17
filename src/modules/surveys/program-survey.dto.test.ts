import { describe, expect, it } from "vitest";
import { submitProgramSurveySchema } from "./program-survey.dto.js";

describe("Program survey DTO", () => {
  it("accepts one strongly typed value per unique question", () => {
    expect(submitProgramSurveySchema.parse({
      answers: [
        { questionId: 1, ratingValue: 5 },
        { questionId: 2, textAnswer: "Useful course" },
      ],
    }).answers).toHaveLength(2);
  });

  it("rejects duplicate questions and ambiguous answer values", () => {
    expect(() => submitProgramSurveySchema.parse({
      answers: [
        { questionId: 1, ratingValue: 5 },
        { questionId: 1, textAnswer: "duplicate" },
      ],
    })).toThrow();
    expect(() => submitProgramSurveySchema.parse({
      answers: [{ questionId: 1, ratingValue: 5, textAnswer: "both" }],
    })).toThrow();
  });
});
