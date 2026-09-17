import { Prisma } from "@prisma/client";
import type {
  AttemptSnapshot,
  SnapshotQuestion,
  StoredAnswer,
} from "./assessment-attempt.types.js";
import { decimal } from "./assessment-attempt.types.js";

export interface QuestionGrade {
  awardedMarks: Prisma.Decimal;
  isCorrect: boolean;
  pendingReview: boolean;
}

export interface AttemptGrade {
  rawScore: Prisma.Decimal;
  adjustedScore: Prisma.Decimal;
  percentage: Prisma.Decimal;
  passed: boolean;
  pendingReview: boolean;
}

const normalized = (value: string, caseSensitive: boolean) => {
  const trimmed = value.trim();
  return caseSensitive ? trimmed : trimmed.toLocaleLowerCase();
};

const objectivePenalty = (
  componentWeight: Prisma.Decimal,
  negativeMarking: Prisma.Decimal,
) => componentWeight.mul(negativeMarking).negated();

const optionIds = (answer: StoredAnswer) =>
  answer.selectedOptions
    .map((item) => item.questionOptionId)
    .filter((id): id is number => id !== null)
    .sort((a, b) => a - b);

const sameSet = (left: number[], right: number[]) =>
  left.length === right.length && left.every((value, index) => value === right[index]);

export class AssessmentGradingService {
  gradeQuestion(
    question: SnapshotQuestion,
    answer: StoredAnswer | undefined,
    negativeMarkingValue: Prisma.Decimal.Value,
  ): QuestionGrade {
    const weight = decimal(question.weight);
    const negativeMarking = decimal(negativeMarkingValue);
    if (!answer) {
      return { awardedMarks: decimal(0), isCorrect: false, pendingReview: false };
    }

    if (question.type === "short_answer" || question.type === "essay") {
      return { awardedMarks: decimal(0), isCorrect: false, pendingReview: true };
    }

    if (["multiple_choice", "true_false", "multi_select"].includes(question.type)) {
      const selected = optionIds(answer);
      const correct = question.options
        .filter((option) => option.isCorrect)
        .map((option) => option.id)
        .sort((a, b) => a - b);
      const isCorrect = sameSet(selected, correct);
      return {
        awardedMarks: isCorrect ? weight : objectivePenalty(weight, negativeMarking),
        isCorrect,
        pendingReview: false,
      };
    }

    if (question.type === "fill_blank") {
      const blankIndexes = [...new Set(question.options.map((option) => option.blankIndex))]
        .filter((index): index is number => index !== null)
        .sort((a, b) => a - b);
      if (blankIndexes.length === 0) {
        return { awardedMarks: decimal(0), isCorrect: false, pendingReview: false };
      }
      const componentWeight = weight.div(blankIndexes.length);
      let awarded = decimal(0);
      let correctCount = 0;
      for (const blankIndex of blankIndexes) {
        const submitted = answer.selectedOptions.find((item) => item.blankIndex === blankIndex);
        if (!submitted) continue;
        const accepted = question.options.filter(
          (option) => option.blankIndex === blankIndex && option.isCorrect,
        );
        const isCorrect = accepted.some(
          (option) =>
            normalized(submitted.typedText ?? "", option.caseSensitive) ===
            normalized(option.optionText, option.caseSensitive),
        );
        if (isCorrect) {
          correctCount += 1;
          awarded = awarded.plus(componentWeight);
        } else {
          awarded = awarded.plus(objectivePenalty(componentWeight, negativeMarking));
        }
      }
      return {
        awardedMarks: awarded,
        isCorrect: correctCount === blankIndexes.length,
        pendingReview: false,
      };
    }

    const pairs = question.pairs;
    if (pairs.length === 0) {
      return { awardedMarks: decimal(0), isCorrect: false, pendingReview: false };
    }
    const componentWeight = weight.div(pairs.length);
    let awarded = decimal(0);
    let correctCount = 0;
    for (const expected of pairs) {
      const submitted = answer.submittedMatches.find((item) => item.leftPairId === expected.id);
      if (!submitted) continue;
      const target = pairs.find((pair) => pair.id === submitted.rightPairId);
      const isCorrect =
        question.type === "matching"
          ? submitted.rightPairId === expected.id
          : target?.rightValue === expected.rightValue;
      if (isCorrect) {
        correctCount += 1;
        awarded = awarded.plus(componentWeight);
      } else {
        awarded = awarded.plus(objectivePenalty(componentWeight, negativeMarking));
      }
    }
    return {
      awardedMarks: awarded,
      isCorrect: correctCount === pairs.length,
      pendingReview: false,
    };
  }

  finalize(snapshot: AttemptSnapshot, answers: StoredAnswer[]): AttemptGrade {
    const byQuestion = new Map(answers.map((answer) => [answer.questionVersionId, answer]));
    let rawScore = decimal(0);
    let pendingReview = false;
    for (const question of snapshot.questions) {
      const answer = byQuestion.get(question.questionVersionId);
      if (answer?.approvalStatus === "PENDING_REVIEW") pendingReview = true;
      rawScore = rawScore.plus(answer?.awardedMarks ?? 0);
    }

    const totalMarks = decimal(snapshot.totalMarks);
    const cap = snapshot.maxScore == null
      ? totalMarks
      : Prisma.Decimal.min(decimal(snapshot.maxScore), totalMarks);
    const adjustedScore = Prisma.Decimal.max(
      decimal(0),
      Prisma.Decimal.min(rawScore.mul(snapshot.scoreMultiplier), cap),
    );
    const percentage = totalMarks.isZero()
      ? decimal(0)
      : adjustedScore.div(totalMarks).mul(100);

    return {
      rawScore,
      adjustedScore,
      percentage,
      passed: percentage.greaterThanOrEqualTo(snapshot.passingScore),
      pendingReview,
    };
  }
}

export const assessmentGradingService = new AssessmentGradingService();
