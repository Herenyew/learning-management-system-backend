import { Prisma, type PrismaClient } from "@prisma/client";
import {
  BusinessRuleError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "../../common/errors/http-errors.js";
import { getPrismaClient } from "../../config/database.js";
import { enrollmentProgressService } from "../enrollments/enrollment-progress.service.js";
import type { GradeAnswerInput, SaveAnswerInput, StartAttemptInput } from "./assessment-attempt.dto.js";
import {
  AssessmentAttemptRepository,
  type AssessmentAttemptTransaction,
} from "./assessment-attempt.repository.js";
import {
  assessmentGradingService,
  type AssessmentGradingService,
} from "./assessment-grading.service.js";
import {
  SUPPORTED_QUESTION_TYPES,
  decimal,
  readAttemptSnapshot,
  toJson,
  type AttemptSnapshot,
  type SnapshotPair,
  type SnapshotQuestion,
  type StoredAnswer,
  type SupportedQuestionType,
} from "./assessment-attempt.types.js";

type LearnerContext = { companyId: number; userId: number };
type GraderContext = LearnerContext;
type ProgressEvaluator = Pick<typeof enrollmentProgressService, "reevaluate">;
type RandomSource = () => number;

const answerInclude = {
  selectedOptions: { orderBy: { id: "asc" as const } },
  submittedMatches: { orderBy: { id: "asc" as const } },
};

const attemptInclude = {
  answers: { include: answerInclude, orderBy: { id: "asc" as const } },
};

const unique = <T>(values: T[]) => new Set(values).size === values.length;
const rounded = (value: Prisma.Decimal) => value.toDecimalPlaces(2);

const shuffled = <T>(values: T[], random: RandomSource) => {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const target = Math.floor(random() * (index + 1));
    [result[index], result[target]] = [result[target], result[index]];
  }
  return result;
};

const snapshotOf = (value: unknown) => {
  try {
    return readAttemptSnapshot(value);
  } catch {
    throw new BusinessRuleError("The assessment attempt snapshot is invalid.");
  }
};

const isExpired = (snapshot: AttemptSnapshot, startedAt: Date, now: Date) =>
  snapshot.durationMinutes != null &&
  now.getTime() > startedAt.getTime() + snapshot.durationMinutes * 60_000;

const assertEnrollmentOwner = (enrollment: any) => {
  if (enrollment.employee.appUsers.length === 0) {
    throw new ForbiddenError("Enrollment does not belong to the current learner.");
  }
};

const publicQuestions = (snapshot: AttemptSnapshot) =>
  snapshot.questions.map((question) => ({
    questionId: question.questionId,
    questionVersionId: question.questionVersionId,
    type: question.type,
    questionText: question.questionText,
    weight: Number(question.weight),
    isRequired: question.isRequired,
    options: ["multiple_choice", "true_false", "multi_select"].includes(question.type)
      ? question.options.map(({ id, optionLabel, optionText }) => ({ id, optionLabel, optionText }))
      : [],
    blankIndexes:
      question.type === "fill_blank"
        ? [...new Set(question.options.map((option) => option.blankIndex))]
            .filter((index): index is number => index !== null)
            .sort((a, b) => a - b)
        : [],
    leftItems: ["matching", "drag_drop"].includes(question.type)
      ? [...question.pairs]
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((pair) => ({ id: pair.leftToken, value: pair.leftValue }))
      : [],
    rightItems: ["matching", "drag_drop"].includes(question.type)
      ? [...question.pairs]
          .sort((a, b) => a.rightToken - b.rightToken)
          .map((pair) => ({ id: pair.rightToken, value: pair.rightValue }))
      : [],
  }));

const publicAnswers = (snapshot: AttemptSnapshot, answers: any[]) =>
  answers.map((answer) => {
    const question = snapshot.questions.find(
      (item) => item.questionVersionId === answer.questionVersionId,
    );
    if (!question) throw new BusinessRuleError("An answer references an unknown snapshot question.");
    if (["short_answer", "essay"].includes(question.type)) {
      return {
        id: answer.id,
        questionVersionId: answer.questionVersionId,
        answerText: answer.answerText,
        reviewStatus: answer.approvalStatus,
      };
    }
    if (question.type === "fill_blank") {
      return {
        id: answer.id,
        questionVersionId: answer.questionVersionId,
        blanks: answer.selectedOptions.map((item: any) => ({
          blankIndex: item.blankIndex,
          typedText: item.typedText,
        })),
        reviewStatus: answer.approvalStatus,
      };
    }
    if (["matching", "drag_drop"].includes(question.type)) {
      return {
        id: answer.id,
        questionVersionId: answer.questionVersionId,
        matches: answer.submittedMatches.map((item: any) => ({
          leftPairId: question.pairs.find((pair) => pair.id === item.leftPairId)?.leftToken,
          rightPairId: question.pairs.find((pair) => pair.id === item.rightPairId)?.rightToken,
        })),
        reviewStatus: answer.approvalStatus,
      };
    }
    return {
      id: answer.id,
      questionVersionId: answer.questionVersionId,
      optionIds: answer.selectedOptions
        .map((item: any) => item.questionOptionId)
        .filter((id: number | null): id is number => id !== null),
      reviewStatus: answer.approvalStatus,
    };
  });

const presentAttempt = (attempt: any) => {
  const snapshot = snapshotOf(attempt.snapshot);
  return {
    id: attempt.id,
    assessmentId: attempt.assessmentId,
    enrollmentId: attempt.enrollmentId,
    attemptNo: attempt.attemptNo,
    status: attempt.status,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt,
    gradedAt: attempt.gradedAt,
    durationMinutes: snapshot.durationMinutes,
    title: snapshot.title,
    totalMarks: Number(snapshot.totalMarks),
    passingScore: Number(snapshot.passingScore),
    questions: publicQuestions(snapshot),
    answers: publicAnswers(snapshot, attempt.answers ?? []),
  };
};

const presentResult = (attempt: any) => {
  const snapshot = snapshotOf(attempt.snapshot);
  const graded = attempt.status === "GRADED";
  return {
    attemptId: attempt.id,
    assessmentId: attempt.assessmentId,
    enrollmentId: attempt.enrollmentId,
    attemptNo: attempt.attemptNo,
    status: attempt.status,
    submittedAt: attempt.submittedAt,
    gradedAt: attempt.gradedAt,
    pendingReview: attempt.status === "SUBMITTED",
    score: graded && attempt.score != null ? Number(attempt.score) : null,
    totalMarks: Number(snapshot.totalMarks),
    percentage: graded && attempt.percentage != null ? Number(attempt.percentage) : null,
    passed: graded ? attempt.passed : null,
  };
};

export class AssessmentAttemptService {
  constructor(
    private readonly repository: AssessmentAttemptRepository,
    private readonly prisma: PrismaClient,
    private readonly grading: AssessmentGradingService = assessmentGradingService,
    private readonly progress: ProgressEvaluator = enrollmentProgressService,
    private readonly random: RandomSource = Math.random,
  ) {}

  async start(
    context: LearnerContext,
    assessmentId: number,
    input: StartAttemptInput,
    now = new Date(),
  ) {
    try {
      const attempt = await this.repository.transaction(async (tx) => {
        const assessment = await tx.assessment.findFirst({
          where: {
            id: assessmentId,
            companyId: context.companyId,
            status: "PUBLISHED",
            deletedAt: null,
          },
          include: {
            questions: {
              include: {
                question: { include: { questionType: true } },
                questionVersion: { include: { options: true, matchingPairs: true } },
              },
              orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
            },
          },
        });
        if (!assessment) throw new NotFoundError("Published assessment");

        const enrollment = await tx.enrollment.findFirst({
          where: { id: input.enrollmentId, companyId: context.companyId, deletedAt: null },
          include: {
            employee: {
              select: {
                appUsers: {
                  where: { id: context.userId, companyId: context.companyId, isActive: true },
                  select: { id: true },
                },
              },
            },
          },
        });
        if (!enrollment) throw new NotFoundError("Enrollment");
        assertEnrollmentOwner(enrollment);
        if (enrollment.courseVersionId !== assessment.courseVersionId) {
          throw new BusinessRuleError("Assessment and enrollment must belong to the same course version.");
        }
        if (!enrollment.status || !["ACTIVE", "COMPLETED"].includes(enrollment.status)) {
          throw new BusinessRuleError("An active enrollment is required to start an assessment.");
        }
        if (enrollment.status === "COMPLETED") {
          throw new BusinessRuleError("A completed enrollment cannot start another assessment attempt.");
        }

        const active = await tx.assessmentAttempt.findFirst({
          where: {
            companyId: context.companyId,
            enrollmentId: input.enrollmentId,
            assessmentId,
            status: "IN_PROGRESS",
            deletedAt: null,
          },
          include: attemptInclude,
        });
        if (active) {
          const snapshot = snapshotOf(active.snapshot);
          if (!isExpired(snapshot, active.startedAt, now)) return active;
          await tx.assessmentAttempt.update({
            where: { id: active.id },
            data: { status: "EXPIRED", submittedAt: now },
          });
        }

        if (!Number.isInteger(assessment.maxAttempts) || assessment.maxAttempts <= 0) {
          throw new BusinessRuleError("Assessment max-attempt settings are invalid.");
        }
        const attemptCount = await tx.assessmentAttempt.count({
          where: { assessmentId, enrollmentId: input.enrollmentId, deletedAt: null },
        });
        if (attemptCount >= assessment.maxAttempts) {
          throw new BusinessRuleError("The maximum number of assessment attempts has been reached.");
        }
        const latest = await tx.assessmentAttempt.aggregate({
          where: { assessmentId, enrollmentId: input.enrollmentId },
          _max: { attemptNo: true },
        });
        const attemptNo = (latest._max.attemptNo ?? 0) + 1;
        const rule = await tx.assessmentAttemptRule.findUnique({
          where: { assessmentId_attemptNo: { assessmentId, attemptNo } },
        });
        const snapshot = this.buildSnapshot(assessment, rule);

        return tx.assessmentAttempt.create({
          data: {
            companyId: context.companyId,
            enrollmentId: input.enrollmentId,
            assessmentId,
            attemptNo,
            status: "IN_PROGRESS",
            startedAt: now,
            snapshot: toJson(snapshot),
          },
          include: attemptInclude,
        });
      });
      return presentAttempt(attempt);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const active = await this.prisma.assessmentAttempt.findFirst({
          where: {
            companyId: context.companyId,
            assessmentId,
            enrollmentId: input.enrollmentId,
            status: "IN_PROGRESS",
            deletedAt: null,
            enrollment: {
              employee: { appUsers: { some: { id: context.userId, companyId: context.companyId } } },
            },
          },
          include: attemptInclude,
        });
        if (active) return presentAttempt(active);
      }
      throw error;
    }
  }

  async get(context: LearnerContext, attemptId: number) {
    const attempt = await this.ownedAttempt(context, attemptId);
    return presentAttempt(attempt);
  }

  async saveAnswer(
    context: LearnerContext,
    attemptId: number,
    questionVersionId: number,
    input: SaveAnswerInput,
    now = new Date(),
  ) {
    const attempt = await this.repository.transaction(async (tx) => {
      const scoped = await this.ownedAttemptInTransaction(tx, context, attemptId);
      if (scoped.status !== "IN_PROGRESS") {
        throw new BusinessRuleError("Answers can only be changed while an attempt is in progress.");
      }
      const snapshot = snapshotOf(scoped.snapshot);
      if (isExpired(snapshot, scoped.startedAt, now)) {
        throw new BusinessRuleError("The assessment time limit has elapsed.");
      }
      const question = snapshot.questions.find(
        (item) => item.questionVersionId === questionVersionId,
      );
      if (!question) throw new ValidationError("Question is not part of this assessment attempt.");
      const normalizedInput = this.validateAnswer(question, input);

      const answer = await tx.assessmentAnswer.upsert({
        where: { attemptId_questionVersionId: { attemptId, questionVersionId } },
        create: {
          companyId: context.companyId,
          attemptId,
          questionVersionId,
          answerText: "answerText" in normalizedInput ? normalizedInput.answerText : null,
          approvalStatus: "DRAFT",
        },
        update: {
          answerText: "answerText" in normalizedInput ? normalizedInput.answerText : null,
          awardedMarks: null,
          isCorrect: null,
          approvalStatus: "DRAFT",
          approvedBy: null,
          approvedAt: null,
        },
      });
      await tx.assessmentAnswerOption.deleteMany({ where: { answerId: answer.id } });
      await tx.assessmentAnswerMatch.deleteMany({ where: { answerId: answer.id } });

      if ("optionIds" in normalizedInput) {
        await tx.assessmentAnswerOption.createMany({
          data: normalizedInput.optionIds.map((questionOptionId) => ({
            companyId: context.companyId,
            answerId: answer.id,
            questionOptionId,
          })),
        });
      } else if ("blanks" in normalizedInput) {
        await tx.assessmentAnswerOption.createMany({
          data: normalizedInput.blanks.map((blank) => ({
            companyId: context.companyId,
            answerId: answer.id,
            blankIndex: blank.blankIndex,
            typedText: blank.typedText,
          })),
        });
      } else if ("matches" in normalizedInput) {
        await tx.assessmentAnswerMatch.createMany({
          data: normalizedInput.matches.map((match) => ({
            companyId: context.companyId,
            answerId: answer.id,
            leftPairId: match.leftPairId,
            rightPairId: match.rightPairId,
          })),
        });
      }

      return tx.assessmentAttempt.findUniqueOrThrow({
        where: { id: attemptId },
        include: attemptInclude,
      });
    });
    return presentAttempt(attempt);
  }

  async submit(context: LearnerContext, attemptId: number, now = new Date()) {
    const outcome = await this.repository.transaction(async (tx) => {
      const attempt = await this.ownedAttemptInTransaction(tx, context, attemptId);
      if (["SUBMITTED", "GRADED", "EXPIRED"].includes(attempt.status)) {
        return { attempt, reevaluate: attempt.status === "GRADED" };
      }
      const snapshot = snapshotOf(attempt.snapshot);
      if (isExpired(snapshot, attempt.startedAt, now) && !snapshot.autoSubmitOnTimeLimit) {
        const expired = await tx.assessmentAttempt.update({
          where: { id: attempt.id },
          data: { status: "EXPIRED", submittedAt: now },
          include: attemptInclude,
        });
        return { attempt: expired, reevaluate: false };
      }

      const answersByQuestion = new Map(
        attempt.answers.map((answer: any) => [answer.questionVersionId, answer]),
      );
      const gradedAnswers: StoredAnswer[] = [];
      let pendingReview = false;
      for (const question of snapshot.questions) {
        const answer = answersByQuestion.get(question.questionVersionId) as any;
        if (!answer) continue;
        const grade = this.grading.gradeQuestion(question, answer, snapshot.negativeMarking);
        pendingReview ||= grade.pendingReview;
        const updated = await tx.assessmentAnswer.update({
          where: { id: answer.id },
          data: {
            awardedMarks: rounded(grade.awardedMarks),
            isCorrect: grade.pendingReview ? null : grade.isCorrect,
            approvalStatus: grade.pendingReview ? "PENDING_REVIEW" : "APPROVED",
            approvedAt: grade.pendingReview ? null : now,
            approvedBy: null,
          },
          include: answerInclude,
        });
        gradedAnswers.push(updated);
      }

      const grade = this.grading.finalize(snapshot, gradedAnswers);
      const status = pendingReview || grade.pendingReview ? "SUBMITTED" : "GRADED";
      const updatedAttempt = await tx.assessmentAttempt.update({
        where: { id: attempt.id },
        data: {
          status,
          submittedAt: attempt.submittedAt ?? now,
          gradedAt: status === "GRADED" ? now : null,
          score: status === "GRADED" ? rounded(grade.adjustedScore) : null,
          percentage: status === "GRADED" ? rounded(grade.percentage) : null,
          passed: status === "GRADED" ? grade.passed : null,
        },
        include: attemptInclude,
      });
      return { attempt: updatedAttempt, reevaluate: status === "GRADED" };
    });

    if (outcome.reevaluate) await this.progress.reevaluate(context, outcome.attempt.enrollmentId, now);
    return presentResult(outcome.attempt);
  }

  async result(context: LearnerContext, attemptId: number) {
    const attempt = await this.ownedAttempt(context, attemptId);
    if (attempt.status === "IN_PROGRESS") {
      throw new BusinessRuleError("Submit the assessment attempt before viewing its result.");
    }
    return presentResult(attempt);
  }

  async listSubmitted(
    context: GraderContext,
    assessmentId: number,
    page: number,
    pageSize: number,
  ) {
    const assessment = await this.prisma.assessment.findFirst({
      where: { id: assessmentId, companyId: context.companyId, deletedAt: null },
      select: { id: true },
    });
    if (!assessment) throw new NotFoundError("Assessment");
    const where = {
      companyId: context.companyId,
      assessmentId,
      status: "SUBMITTED" as const,
      deletedAt: null,
    };
    const [items, total] = await Promise.all([
      this.prisma.assessmentAttempt.findMany({
        where,
        select: {
          id: true,
          enrollmentId: true,
          attemptNo: true,
          status: true,
          startedAt: true,
          submittedAt: true,
          enrollment: { select: { employee: { select: { id: true, fullName: true } } } },
          answers: {
            where: { approvalStatus: "PENDING_REVIEW" },
            select: {
              id: true,
              questionVersionId: true,
              answerText: true,
              approvalStatus: true,
            },
          },
        },
        orderBy: [{ submittedAt: "asc" }, { id: "asc" }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      this.prisma.assessmentAttempt.count({ where }),
    ]);
    return { items, page, pageSize, total, totalPages: Math.ceil(total / pageSize) };
  }

  async gradeAnswer(
    context: GraderContext,
    attemptId: number,
    answerId: number,
    input: GradeAnswerInput,
    now = new Date(),
  ) {
    const outcome = await this.repository.transaction(async (tx) => {
      const attempt = await tx.assessmentAttempt.findFirst({
        where: { id: attemptId, companyId: context.companyId, deletedAt: null },
        include: {
          ...attemptInclude,
          enrollment: {
            select: {
              employee: {
                select: {
                  appUsers: {
                    where: { companyId: context.companyId, isActive: true },
                    select: { id: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      });
      if (!attempt) throw new NotFoundError("Assessment attempt");
      if (attempt.status !== "SUBMITTED") {
        throw new BusinessRuleError("Only submitted attempts awaiting review can be graded.");
      }
      const snapshot = snapshotOf(attempt.snapshot);
      const answer = attempt.answers.find((item: any) => item.id === answerId);
      if (!answer) throw new NotFoundError("Assessment answer");
      const question = snapshot.questions.find(
        (item) => item.questionVersionId === answer.questionVersionId,
      );
      if (!question || !["short_answer", "essay"].includes(question.type)) {
        throw new BusinessRuleError("Only manual-response answers can be graded manually.");
      }
      if (decimal(input.awardedMarks).greaterThan(question.weight)) {
        throw new ValidationError(`Awarded marks cannot exceed ${question.weight}.`);
      }

      await tx.assessmentAnswer.update({
        where: { id: answerId },
        data: {
          awardedMarks: rounded(decimal(input.awardedMarks)),
          isCorrect: decimal(input.awardedMarks).equals(question.weight),
          approvalStatus: "APPROVED",
          approvedBy: context.userId,
          approvedAt: now,
        },
      });
      const answers = await tx.assessmentAnswer.findMany({
        where: { attemptId },
        include: answerInclude,
      });
      const grade = this.grading.finalize(snapshot, answers);
      const completed = !grade.pendingReview;
      const updated = await tx.assessmentAttempt.update({
        where: { id: attemptId },
        data: completed
          ? {
              status: "GRADED",
              gradedAt: now,
              gradedBy: context.userId,
              score: rounded(grade.adjustedScore),
              percentage: rounded(grade.percentage),
              passed: grade.passed,
            }
          : {},
        include: attemptInclude,
      });
      return {
        attempt: updated,
        learnerUserId: attempt.enrollment.employee.appUsers[0]?.id as number | undefined,
        reevaluate: completed,
      };
    });

    if (outcome.reevaluate && outcome.learnerUserId) {
      await this.progress.reevaluate(
        { companyId: context.companyId, userId: outcome.learnerUserId },
        outcome.attempt.enrollmentId,
        now,
      );
    }
    return presentResult(outcome.attempt);
  }

  async processExpired(now = new Date()) {
    const active = await this.prisma.assessmentAttempt.findMany({
      where: { status: "IN_PROGRESS", deletedAt: null, snapshot: { not: Prisma.JsonNull } },
      select: {
        id: true,
        companyId: true,
        startedAt: true,
        snapshot: true,
        enrollment: {
          select: {
            employee: {
              select: {
                appUsers: {
                  where: { isActive: true },
                  select: { id: true, companyId: true },
                  take: 1,
                },
              },
            },
          },
        },
      },
    });
    const processed: Array<{ attemptId: number; status: string }> = [];
    for (const attempt of active) {
      const snapshot = snapshotOf(attempt.snapshot);
      if (!isExpired(snapshot, attempt.startedAt, now)) continue;
      const learner = attempt.enrollment.employee.appUsers.find(
        (user) => user.companyId === attempt.companyId,
      );
      if (snapshot.autoSubmitOnTimeLimit && learner) {
        const result = await this.submit(
          { companyId: attempt.companyId, userId: learner.id },
          attempt.id,
          now,
        );
        processed.push({ attemptId: attempt.id, status: result.status });
      } else {
        const updated = await this.prisma.assessmentAttempt.updateMany({
          where: { id: attempt.id, status: "IN_PROGRESS", deletedAt: null },
          data: { status: "EXPIRED", submittedAt: now },
        });
        if (updated.count > 0) processed.push({ attemptId: attempt.id, status: "EXPIRED" });
      }
    }
    return processed;
  }

  private async ownedAttempt(context: LearnerContext, attemptId: number) {
    const attempt = await this.prisma.assessmentAttempt.findFirst({
      where: {
        id: attemptId,
        companyId: context.companyId,
        deletedAt: null,
        enrollment: {
          deletedAt: null,
          employee: {
            appUsers: { some: { id: context.userId, companyId: context.companyId, isActive: true } },
          },
        },
      },
      include: attemptInclude,
    });
    if (!attempt) throw new NotFoundError("Assessment attempt");
    return attempt;
  }

  private async ownedAttemptInTransaction(
    tx: AssessmentAttemptTransaction,
    context: LearnerContext,
    attemptId: number,
  ) {
    const attempt = await tx.assessmentAttempt.findFirst({
      where: {
        id: attemptId,
        companyId: context.companyId,
        deletedAt: null,
        enrollment: {
          deletedAt: null,
          employee: {
            appUsers: { some: { id: context.userId, companyId: context.companyId, isActive: true } },
          },
        },
      },
      include: attemptInclude,
    });
    if (!attempt) throw new NotFoundError("Assessment attempt");
    return attempt;
  }

  private buildSnapshot(assessment: any, rule: any): AttemptSnapshot {
    const negativeMarking = decimal(assessment.negativeMarking ?? 0);
    if (negativeMarking.lessThan(0) || negativeMarking.greaterThan(1)) {
      throw new BusinessRuleError("Negative marking must be a fraction between 0 and 1.");
    }
    if (assessment.durationMinutes != null && assessment.durationMinutes <= 0) {
      throw new BusinessRuleError("Assessment duration must be positive.");
    }
    if (decimal(assessment.passingScore).lessThan(0) || decimal(assessment.passingScore).greaterThan(100)) {
      throw new BusinessRuleError("Assessment passing score must be between 0 and 100.");
    }

    let questions: SnapshotQuestion[] = assessment.questions.map((mapping: any) => {
      const type = mapping.question.questionType.slug as string;
      if (!SUPPORTED_QUESTION_TYPES.includes(type as SupportedQuestionType)) {
        const message = type === "ordering"
          ? "Ordering questions are not supported until submitted order can be persisted."
          : `Question type '${type}' is not supported for authoritative grading.`;
        throw new BusinessRuleError(message);
      }
      if (
        mapping.companyId !== assessment.companyId ||
        mapping.question.companyId !== assessment.companyId ||
        mapping.questionVersion.companyId !== assessment.companyId ||
        mapping.question.id !== mapping.questionId ||
        mapping.questionVersion.questionId !== mapping.questionId ||
        mapping.question.status !== "ACTIVE" ||
        mapping.question.deletedAt != null
      ) {
        throw new BusinessRuleError("Assessment question mappings are inconsistent or inactive.");
      }
      const weight = decimal(mapping.weight);
      if (weight.lessThanOrEqualTo(0)) {
        throw new BusinessRuleError("Every assessment question must have a positive weight.");
      }
      let options = mapping.questionVersion.options
        .map((option: any) => ({
          id: option.id,
          optionLabel: option.optionLabel,
          optionText: option.optionText,
          blankIndex: option.blankIndex,
          isCorrect: option.isCorrect,
          caseSensitive: option.caseSensitive ?? false,
          displayOrder: option.displayOrder,
        }))
        .sort((a: any, b: any) => a.displayOrder - b.displayOrder);
      if (assessment.randomizeOptions && type !== "fill_blank") {
        options = shuffled(options, this.random);
      }

      const rawPairs = [...mapping.questionVersion.matchingPairs].sort(
        (a: any, b: any) => a.displayOrder - b.displayOrder,
      );
      const rightOrder = shuffled(rawPairs, this.random);
      const rightTokens = new Map(
        rightOrder.map((pair: any, index: number) => [pair.id, 1_000_001 + index]),
      );
      const pairs: SnapshotPair[] = rawPairs.map((pair: any, index: number) => ({
        id: pair.id,
        leftToken: index + 1,
        rightToken: rightTokens.get(pair.id) as number,
        leftValue: pair.leftValue,
        rightValue: pair.rightValue,
        displayOrder: pair.displayOrder,
      }));
      this.validateQuestionRubric(type as SupportedQuestionType, options, pairs);
      return {
        questionId: mapping.questionId,
        questionVersionId: mapping.questionVersionId,
        type: type as SupportedQuestionType,
        questionText: mapping.questionVersion.questionText,
        weight: weight.toString(),
        isRequired: mapping.isRequired,
        options,
        pairs,
      };
    });
    if (questions.length === 0) {
      throw new BusinessRuleError("Assessment must contain at least one valid question.");
    }
    if (assessment.randomizeQuestions) questions = shuffled(questions, this.random);
    const totalMarks = questions.reduce(
      (total, question) => total.plus(question.weight),
      decimal(0),
    );
    const multiplier = decimal(rule?.scoreMultiplier ?? 1);
    const maxScore = rule?.maxScore == null ? null : decimal(rule.maxScore);
    if (multiplier.lessThanOrEqualTo(0) || (maxScore && maxScore.lessThanOrEqualTo(0))) {
      throw new BusinessRuleError("Assessment attempt scoring rules must be positive.");
    }
    return {
      version: 1,
      title: assessment.title,
      passingScore: decimal(assessment.passingScore).toString(),
      totalMarks: totalMarks.toString(),
      negativeMarking: negativeMarking.toString(),
      durationMinutes: assessment.durationMinutes,
      allowQuestionReview: assessment.allowQuestionReview,
      showResultImmediately: assessment.showResultImmediately,
      showCorrectAnswersAfterAllSubmit: assessment.showCorrectAnswersAfterAllSubmit,
      autoSubmitOnTimeLimit: assessment.autoSubmitOnTimeLimit,
      scoreMultiplier: multiplier.toString(),
      maxScore: maxScore?.toString() ?? null,
      questions,
    } as AttemptSnapshot;
  }

  private validateQuestionRubric(
    type: SupportedQuestionType,
    options: SnapshotQuestion["options"],
    pairs: SnapshotPair[],
  ) {
    if (["multiple_choice", "true_false"].includes(type)) {
      if (options.length < 2 || options.filter((option) => option.isCorrect).length !== 1) {
        throw new BusinessRuleError(`${type} questions require options and exactly one correct answer.`);
      }
    } else if (type === "multi_select") {
      if (options.length < 2 || options.filter((option) => option.isCorrect).length === 0) {
        throw new BusinessRuleError("Multi-select questions require options and a correct answer set.");
      }
    } else if (type === "fill_blank") {
      if (
        options.length === 0 ||
        options.some((option) => option.blankIndex == null) ||
        !options.some((option) => option.isCorrect)
      ) {
        throw new BusinessRuleError("Fill-blank questions require indexed accepted answers.");
      }
    } else if (["matching", "drag_drop"].includes(type) && pairs.length === 0) {
      throw new BusinessRuleError(`${type} questions require at least one matching pair.`);
    }
  }

  private validateAnswer(question: SnapshotQuestion, input: SaveAnswerInput): SaveAnswerInput {
    if (["multiple_choice", "true_false", "multi_select"].includes(question.type)) {
      if (!("optionIds" in input)) throw new ValidationError("This question requires optionIds.");
      if (!unique(input.optionIds)) throw new ValidationError("Option IDs must be unique.");
      if (question.type !== "multi_select" && input.optionIds.length !== 1) {
        throw new ValidationError("This question requires exactly one selected option.");
      }
      const allowed = new Set(question.options.map((option) => option.id));
      if (input.optionIds.some((id) => !allowed.has(id))) {
        throw new ValidationError("A selected option is not part of this question.");
      }
      return input;
    }
    if (question.type === "fill_blank") {
      if (!("blanks" in input)) throw new ValidationError("This question requires blanks.");
      if (!unique(input.blanks.map((blank) => blank.blankIndex))) {
        throw new ValidationError("Blank indexes must be unique.");
      }
      const allowed = new Set(
        question.options
          .map((option) => option.blankIndex)
          .filter((index): index is number => index !== null),
      );
      if (input.blanks.some((blank) => !allowed.has(blank.blankIndex))) {
        throw new ValidationError("A blank index is not part of this question.");
      }
      return input;
    }
    if (["matching", "drag_drop"].includes(question.type)) {
      if (!("matches" in input)) throw new ValidationError("This question requires matches.");
      if (!unique(input.matches.map((match) => match.leftPairId))) {
        throw new ValidationError("Each left item can only be matched once.");
      }
      const byLeftToken = new Map(question.pairs.map((pair) => [pair.leftToken, pair]));
      const byRightToken = new Map(question.pairs.map((pair) => [pair.rightToken, pair]));
      return {
        matches: input.matches.map((match) => {
          const left = byLeftToken.get(match.leftPairId);
          const right = byRightToken.get(match.rightPairId);
          if (!left || !right) throw new ValidationError("A matching token is invalid.");
          return { leftPairId: left.id, rightPairId: right.id };
        }),
      };
    }
    if (!("answerText" in input)) throw new ValidationError("This question requires answerText.");
    return input;
  }
}

const prisma = getPrismaClient();
export const assessmentAttemptService = new AssessmentAttemptService(
  new AssessmentAttemptRepository(prisma),
  prisma,
);
