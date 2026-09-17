import { Prisma } from "@prisma/client";

export const SUPPORTED_QUESTION_TYPES = [
  "multiple_choice",
  "true_false",
  "multi_select",
  "fill_blank",
  "matching",
  "drag_drop",
  "short_answer",
  "essay",
] as const;

export type SupportedQuestionType = (typeof SUPPORTED_QUESTION_TYPES)[number];

export interface SnapshotOption {
  id: number;
  optionLabel: string | null;
  optionText: string;
  blankIndex: number | null;
  isCorrect: boolean;
  caseSensitive: boolean;
  displayOrder: number;
}

export interface SnapshotPair {
  id: number;
  leftToken: number;
  rightToken: number;
  leftValue: string;
  rightValue: string;
  displayOrder: number;
}

export interface SnapshotQuestion {
  questionId: number;
  questionVersionId: number;
  type: SupportedQuestionType;
  questionText: string;
  weight: string;
  isRequired: boolean;
  options: SnapshotOption[];
  pairs: SnapshotPair[];
}

export interface AttemptSnapshot {
  version: 1;
  title: string;
  passingScore: string;
  totalMarks: string;
  negativeMarking: string;
  durationMinutes: number | null;
  allowQuestionReview: boolean;
  showResultImmediately: boolean;
  showCorrectAnswersAfterAllSubmit: boolean;
  autoSubmitOnTimeLimit: boolean;
  scoreMultiplier: string;
  maxScore: string | null;
  questions: SnapshotQuestion[];
}

export interface StoredAnswer {
  questionVersionId: number;
  answerText: string | null;
  awardedMarks?: Prisma.Decimal | number | string | null;
  approvalStatus?: string;
  selectedOptions: Array<{
    questionOptionId: number | null;
    blankIndex: number | null;
    typedText: string | null;
  }>;
  submittedMatches: Array<{ leftPairId: number; rightPairId: number }>;
}

export const decimal = (value: Prisma.Decimal.Value) => new Prisma.Decimal(value);

export const readAttemptSnapshot = (value: unknown): AttemptSnapshot => {
  if (!value || typeof value !== "object") throw new Error("Attempt snapshot is missing.");
  const snapshot = value as Partial<AttemptSnapshot>;
  if (snapshot.version !== 1 || !Array.isArray(snapshot.questions)) {
    throw new Error("Attempt snapshot version is unsupported.");
  }
  return snapshot as AttemptSnapshot;
};

export const toJson = (value: AttemptSnapshot): Prisma.InputJsonValue =>
  JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
