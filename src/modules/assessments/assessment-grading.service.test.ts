import { describe, expect, it } from "vitest";
import { AssessmentGradingService } from "./assessment-grading.service.js";
import type {
  AttemptSnapshot,
  SnapshotQuestion,
  StoredAnswer,
} from "./assessment-attempt.types.js";

const service = new AssessmentGradingService();
const baseQuestion = (
  overrides: Partial<SnapshotQuestion> = {},
): SnapshotQuestion => ({
  questionId: 1,
  questionVersionId: 11,
  type: "multiple_choice",
  questionText: "Question",
  weight: "4",
  isRequired: true,
  options: [
    {
      id: 1,
      optionLabel: "A",
      optionText: "Wrong",
      blankIndex: null,
      isCorrect: false,
      caseSensitive: false,
      displayOrder: 1,
    },
    {
      id: 2,
      optionLabel: "B",
      optionText: "Correct",
      blankIndex: null,
      isCorrect: true,
      caseSensitive: false,
      displayOrder: 2,
    },
  ],
  pairs: [],
  ...overrides,
});
const answer = (overrides: Partial<StoredAnswer> = {}): StoredAnswer => ({
  questionVersionId: 11,
  answerText: null,
  selectedOptions: [],
  submittedMatches: [],
  ...overrides,
});
const snapshot = (
  questions: SnapshotQuestion[],
  overrides: Partial<AttemptSnapshot> = {},
): AttemptSnapshot => ({
  version: 1,
  title: "Assessment",
  passingScore: "70",
  totalMarks: questions.reduce((sum, item) => sum + Number(item.weight), 0).toString(),
  negativeMarking: "0.25",
  durationMinutes: null,
  allowQuestionReview: true,
  showResultImmediately: true,
  showCorrectAnswersAfterAllSubmit: false,
  autoSubmitOnTimeLimit: false,
  scoreMultiplier: "1",
  maxScore: null,
  questions,
  ...overrides,
});

describe("AssessmentGradingService", () => {
  it("grades single and multi-option questions as exact sets", () => {
    const question = baseQuestion();
    expect(
      service.gradeQuestion(
        question,
        answer({ selectedOptions: [{ questionOptionId: 2, blankIndex: null, typedText: null }] }),
        "0.25",
      ),
    ).toMatchObject({ isCorrect: true });
    expect(
      service
        .gradeQuestion(
          question,
          answer({ selectedOptions: [{ questionOptionId: 1, blankIndex: null, typedText: null }] }),
          "0.25",
        )
        .awardedMarks.toString(),
    ).toBe("-1");
  });

  it("does not penalize unanswered questions", () => {
    const grade = service.gradeQuestion(baseQuestion(), undefined, "0.5");
    expect(grade.awardedMarks.toString()).toBe("0");
  });

  it("grades fill blanks per component with whitespace and case rules", () => {
    const question = baseQuestion({
      type: "fill_blank",
      weight: "4",
      options: [
        { ...baseQuestion().options[0], id: 10, blankIndex: 0, optionText: "Paris", isCorrect: true },
        {
          ...baseQuestion().options[0],
          id: 11,
          blankIndex: 1,
          optionText: "LMS",
          isCorrect: true,
          caseSensitive: true,
        },
      ],
    });
    const grade = service.gradeQuestion(
      question,
      answer({
        selectedOptions: [
          { questionOptionId: null, blankIndex: 0, typedText: " paris " },
          { questionOptionId: null, blankIndex: 1, typedText: "lms" },
        ],
      }),
      "0.25",
    );
    expect(grade.isCorrect).toBe(false);
    expect(grade.awardedMarks.toString()).toBe("1.5");
  });

  it("grades matching by canonical pair and drag-drop by target value", () => {
    const pairs = [
      { id: 20, leftToken: 1, rightToken: 1000002, leftValue: "A", rightValue: "X", displayOrder: 1 },
      { id: 21, leftToken: 2, rightToken: 1000001, leftValue: "B", rightValue: "Y", displayOrder: 2 },
      { id: 22, leftToken: 3, rightToken: 1000003, leftValue: "C", rightValue: "Y", displayOrder: 3 },
    ];
    const submitted = answer({
      submittedMatches: [
        { leftPairId: 20, rightPairId: 20 },
        { leftPairId: 21, rightPairId: 22 },
        { leftPairId: 22, rightPairId: 21 },
      ],
    });
    expect(
      service.gradeQuestion(baseQuestion({ type: "matching", weight: "3", pairs, options: [] }), submitted, 0)
        .awardedMarks.toString(),
    ).toBe("1");
    expect(
      service.gradeQuestion(baseQuestion({ type: "drag_drop", weight: "3", pairs, options: [] }), submitted, 0)
        .awardedMarks.toString(),
    ).toBe("3");
  });

  it("keeps text responses pending manual review", () => {
    const grade = service.gradeQuestion(
      baseQuestion({ type: "essay", options: [] }),
      answer({ answerText: "Long response" }),
      0,
    );
    expect(grade).toMatchObject({ pendingReview: true, isCorrect: false });
  });

  it("applies attempt multipliers, caps, zero clamps, and pass threshold", () => {
    const question = baseQuestion({ weight: "10" });
    const result = service.finalize(
      snapshot([question], { scoreMultiplier: "0.8", maxScore: "7", passingScore: "70" }),
      [answer({ awardedMarks: "10", approvalStatus: "APPROVED" })],
    );
    expect(result.adjustedScore.toString()).toBe("7");
    expect(result.percentage.toString()).toBe("70");
    expect(result.passed).toBe(true);

    const clamped = service.finalize(
      snapshot([question]),
      [answer({ awardedMarks: "-5", approvalStatus: "APPROVED" })],
    );
    expect(clamped.adjustedScore.toString()).toBe("0");
  });
});
