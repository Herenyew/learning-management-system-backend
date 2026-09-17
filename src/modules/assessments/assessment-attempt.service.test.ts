import { describe, expect, it, vi } from "vitest";
import type { PrismaClient } from "@prisma/client";
import type { AssessmentAttemptRepository, AssessmentAttemptTransaction } from "./assessment-attempt.repository.js";
import { AssessmentAttemptService } from "./assessment-attempt.service.js";

const context = { companyId: 7, userId: 9 };
const now = new Date("2027-08-01T12:00:00.000Z");

const assessment = (type = "multiple_choice") => ({
  id: 31,
  companyId: 7,
  courseVersionId: 11,
  title: "Final assessment",
  passingScore: 70,
  maxAttempts: 2,
  durationMinutes: 30,
  negativeMarking: 0.25,
  allowQuestionReview: true,
  showResultImmediately: true,
  showCorrectAnswersAfterAllSubmit: false,
  autoSubmitOnTimeLimit: true,
  randomizeQuestions: false,
  randomizeOptions: false,
  questions: [
    {
      id: 41,
      companyId: 7,
      assessmentId: 31,
      questionId: 51,
      questionVersionId: 61,
      weight: 4,
      displayOrder: 1,
      isRequired: true,
      question: {
        id: 51,
        companyId: 7,
        status: "ACTIVE",
        deletedAt: null,
        questionType: { slug: type },
      },
      questionVersion: {
        id: 61,
        companyId: 7,
        questionId: 51,
        questionText: "Choose the answer",
        options:
          type === "multiple_choice"
            ? [
                { id: 71, optionLabel: "A", optionText: "Wrong", blankIndex: null, isCorrect: false, caseSensitive: null, displayOrder: 1 },
                { id: 72, optionLabel: "B", optionText: "Right", blankIndex: null, isCorrect: true, caseSensitive: null, displayOrder: 2 },
              ]
            : [],
        matchingPairs:
          type === "matching"
            ? [
                { id: 81, leftValue: "One", rightValue: "First", displayOrder: 1 },
                { id: 82, leftValue: "Two", rightValue: "Second", displayOrder: 2 },
              ]
            : [],
      },
    },
  ],
});

const enrollment = (owned = true) => ({
  id: 21,
  companyId: 7,
  courseVersionId: 11,
  status: "ACTIVE",
  employee: { appUsers: owned ? [{ id: 9 }] : [] },
});

const txForStart = (assessmentValue = assessment(), enrollmentValue = enrollment()) => {
  const tx: any = {
    assessment: { findFirst: vi.fn(async () => assessmentValue) },
    enrollment: { findFirst: vi.fn(async () => enrollmentValue) },
    assessmentAttempt: {
      findFirst: vi.fn(async () => null),
      count: vi.fn(async () => 0),
      aggregate: vi.fn(async () => ({ _max: { attemptNo: null } })),
      create: vi.fn(async ({ data }: any) => ({ id: 91, ...data, answers: [] })),
      update: vi.fn(),
    },
    assessmentAttemptRule: { findUnique: vi.fn(async () => null) },
  };
  return tx;
};

const serviceWith = (tx: object, random = () => 0.5) => {
  const repository = {
    transaction: vi.fn(async (work: (client: AssessmentAttemptTransaction) => Promise<unknown>) =>
      work(tx as AssessmentAttemptTransaction)),
  } as unknown as AssessmentAttemptRepository;
  const prisma = {} as PrismaClient;
  const progress = { reevaluate: vi.fn() };
  return new AssessmentAttemptService(repository, prisma, undefined, progress, random);
};

describe("AssessmentAttemptService", () => {
  it("creates a private grading snapshot but returns only sanitized question data", async () => {
    const tx = txForStart(assessment("matching"));
    const result = await serviceWith(tx, () => 0).start(context, 31, { enrollmentId: 21 }, now);

    expect(result).toMatchObject({ id: 91, assessmentId: 31, enrollmentId: 21, status: "IN_PROGRESS" });
    expect(result.questions[0]).toMatchObject({
      type: "matching",
      leftItems: [{ id: 1, value: "One" }, { id: 2, value: "Two" }],
    });
    expect(result.questions[0].rightItems.map((item: any) => item.id)).not.toContain(81);
    expect(JSON.stringify(result.questions)).not.toContain("isCorrect");
    expect(JSON.stringify(result.questions)).not.toContain('"pairs"');

    const createData = tx.assessmentAttempt.create.mock.calls[0][0].data;
    expect(createData.snapshot.questions[0].pairs).toHaveLength(2);
    expect(createData.snapshot.totalMarks).toBe("4");
  });

  it("enforces learner ownership before allocating an attempt", async () => {
    const tx = txForStart(assessment(), enrollment(false));
    await expect(serviceWith(tx).start(context, 31, { enrollmentId: 21 }, now)).rejects.toMatchObject({
      statusCode: 403,
    });
    expect(tx.assessmentAttempt.create).not.toHaveBeenCalled();
  });

  it("rejects ordering questions because submitted order is not persisted", async () => {
    const tx = txForStart(assessment("ordering"));
    await expect(serviceWith(tx).start(context, 31, { enrollmentId: 21 }, now)).rejects.toMatchObject({
      statusCode: 422,
      message: expect.stringContaining("Ordering questions"),
    });
    expect(tx.assessmentAttempt.create).not.toHaveBeenCalled();
  });

  it("resumes an existing active attempt without consuming another attempt", async () => {
    const tx = txForStart();
    const first = await serviceWith(tx).start(context, 31, { enrollmentId: 21 }, now);
    tx.assessmentAttempt.findFirst.mockResolvedValue({
      id: first.id,
      assessmentId: first.assessmentId,
      enrollmentId: first.enrollmentId,
      attemptNo: first.attemptNo,
      status: first.status,
      startedAt: first.startedAt,
      submittedAt: null,
      gradedAt: null,
      snapshot: tx.assessmentAttempt.create.mock.calls[0][0].data.snapshot,
      answers: [],
    });

    const resumed = await serviceWith(tx).start(context, 31, { enrollmentId: 21 }, now);
    expect(resumed.id).toBe(first.id);
    expect(tx.assessmentAttempt.create).toHaveBeenCalledTimes(1);
  });
});
