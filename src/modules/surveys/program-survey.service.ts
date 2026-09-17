import { Prisma, type PrismaClient } from "@prisma/client";
import {
  BusinessRuleError,
  ConflictError,
  NotFoundError,
} from "../../common/errors/http-errors.js";
import { getPrismaClient } from "../../config/database.js";
import { enrollmentProgressService } from "../enrollments/enrollment-progress.service.js";
import type { SubmitProgramSurveyInput } from "./program-survey.dto.js";

type Context = { companyId: number; userId: number };

const responseSelect = {
  id: true,
  surveyId: true,
  programEnrollmentId: true,
  employeeId: true,
  submittedAt: true,
  answers: {
    select: {
      id: true,
      questionId: true,
      ratingValue: true,
      selectedOption: true,
      textAnswer: true,
    },
    orderBy: { questionId: "asc" as const },
  },
};

export class ProgramSurveyService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly evaluator: Pick<typeof enrollmentProgressService, "reevaluateProgram"> = enrollmentProgressService,
  ) {}

  async get(context: Context, programEnrollmentId: number, surveyId: number) {
    const enrollment = await this.ownedEnrollment(context, programEnrollmentId);
    const survey = await this.prisma.survey.findFirst({
      where: {
        id: surveyId,
        companyId: context.companyId,
        deletedAt: null,
        programTasks: {
          some: { programId: enrollment.programId, companyId: context.companyId, deletedAt: null },
        },
      },
      select: {
        id: true,
        title: true,
        description: true,
        surveyType: true,
        kirkpatrickLevel: true,
        isAnonymous: true,
        status: true,
        availableFrom: true,
        availableUntil: true,
        questions: {
          select: {
            id: true,
            questionText: true,
            displayOrder: true,
            isRequired: true,
            questionType: { select: { name: true, slug: true, configJson: true } },
          },
          orderBy: { displayOrder: "asc" },
        },
        responses: {
          where: { companyId: context.companyId, programEnrollmentId },
          select: responseSelect,
          take: 1,
        },
      },
    });
    if (!survey) throw new NotFoundError("Program survey");
    const { responses, ...details } = survey;
    return { ...details, response: responses[0] ?? null };
  }

  async submit(
    context: Context,
    programEnrollmentId: number,
    surveyId: number,
    input: SubmitProgramSurveyInput,
    now = new Date(),
  ) {
    const response = await this.prisma.$transaction(async (tx) => {
      const enrollment = await this.ownedEnrollmentInTransaction(tx, context, programEnrollmentId);
      if (enrollment.enrollmentStatus !== "ACTIVE") {
        throw new BusinessRuleError("Surveys can only be submitted for an active program attempt.");
      }
      const task = await tx.programTask.findFirst({
        where: {
          companyId: context.companyId,
          programId: enrollment.programId,
          surveyId,
          deletedAt: null,
          taskType: { linkedEntity: "SURVEY" },
        },
        select: { id: true, phaseNumber: true },
      });
      if (!task) throw new NotFoundError("Program survey task");

      const taskPhase = task.phaseNumber ?? 1;
      const blockers = await tx.programTask.findMany({
        where: {
          companyId: context.companyId,
          programId: enrollment.programId,
          deletedAt: null,
          isBlocking: true,
          OR: taskPhase > 1
            ? [{ phaseNumber: null }, { phaseNumber: { lt: taskPhase } }]
            : [{ phaseNumber: { lt: 1 } }],
        },
        select: {
          progresses: {
            where: { companyId: context.companyId, programEnrollmentId },
            select: { status: true },
            take: 1,
          },
        },
      });
      if (blockers.some((blocker) => !["COMPLETED", "WAIVED"].includes(blocker.progresses[0]?.status ?? ""))) {
        throw new BusinessRuleError("Complete or waive the blocking tasks in earlier phases first.");
      }

      const survey = await tx.survey.findFirst({
        where: { id: surveyId, companyId: context.companyId, deletedAt: null },
        select: {
          id: true,
          status: true,
          isAnonymous: true,
          availableFrom: true,
          availableUntil: true,
          questions: {
            select: { id: true, isRequired: true },
            orderBy: { displayOrder: "asc" },
          },
        },
      });
      if (!survey) throw new NotFoundError("Survey");
      if (survey.status !== "ACTIVE") throw new BusinessRuleError("This survey is not active.");
      if (survey.availableFrom && now < survey.availableFrom) {
        throw new BusinessRuleError("This survey is not available yet.");
      }
      if (survey.availableUntil && now > survey.availableUntil) {
        throw new BusinessRuleError("This survey is closed.");
      }

      const questionIds = new Set(survey.questions.map((question) => question.id));
      if (input.answers.some((answer) => !questionIds.has(answer.questionId))) {
        throw new BusinessRuleError("Every answer must belong to this survey.");
      }
      const answeredIds = new Set(input.answers.map((answer) => answer.questionId));
      if (survey.questions.some((question) => question.isRequired && !answeredIds.has(question.id))) {
        throw new BusinessRuleError("Every required survey question must be answered.");
      }
      const existing = await tx.surveyResponse.findUnique({
        where: { surveyId_programEnrollmentId: { surveyId, programEnrollmentId } },
        select: { id: true },
      });
      if (existing) throw new ConflictError("This survey was already submitted for the program attempt.");

      const created = await tx.surveyResponse.create({
        data: {
          companyId: context.companyId,
          surveyId,
          programEnrollmentId,
          completionId: null,
          employeeId: survey.isAnonymous ? null : enrollment.employeeId,
          submittedAt: now,
          answers: {
            create: input.answers.map((answer) => ({
              companyId: context.companyId,
              questionId: answer.questionId,
              ratingValue: answer.ratingValue ?? null,
              selectedOption: answer.selectedOption ?? null,
              textAnswer: answer.textAnswer ?? null,
            })),
          },
        },
        select: responseSelect,
      });
      await tx.auditLog.create({
        data: {
          companyId: context.companyId,
          actorUserId: context.userId,
          entityType: "PROGRAM_SURVEY_RESPONSE",
          entityId: String(created.id),
          action: "SUBMITTED",
          afterJson: JSON.parse(JSON.stringify({ programEnrollmentId, surveyId, responseId: created.id })) as Prisma.InputJsonValue,
        },
      });
      return created;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

    const programProgress = await this.evaluator.reevaluateProgram(context, programEnrollmentId, now);
    return { response, programProgress };
  }

  private ownedEnrollment(context: Context, programEnrollmentId: number) {
    return this.prisma.programEnrollment.findFirst({
      where: {
        id: programEnrollmentId,
        companyId: context.companyId,
        deletedAt: null,
        employee: { appUsers: { some: { id: context.userId, companyId: context.companyId, isActive: true } } },
      },
      select: { id: true, programId: true, employeeId: true, enrollmentStatus: true },
    }).then((enrollment) => {
      if (!enrollment) throw new NotFoundError("Program enrollment");
      return enrollment;
    });
  }

  private async ownedEnrollmentInTransaction(
    tx: Prisma.TransactionClient,
    context: Context,
    programEnrollmentId: number,
  ) {
    const enrollment = await tx.programEnrollment.findFirst({
      where: {
        id: programEnrollmentId,
        companyId: context.companyId,
        deletedAt: null,
        employee: { appUsers: { some: { id: context.userId, companyId: context.companyId, isActive: true } } },
      },
      select: { id: true, programId: true, employeeId: true, enrollmentStatus: true },
    });
    if (!enrollment) throw new NotFoundError("Program enrollment");
    return enrollment;
  }
}

export const programSurveyService = new ProgramSurveyService(getPrismaClient());
