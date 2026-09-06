import { Prisma } from "@prisma/client";
import type {
  PrismaClient,
  AssessmentTemplate,
  CertificateTemplate,
  CertificateTemplateSigner,
  CourseTemplate,
  NotificationTemplate,
  ProgramTemplate,
  SurveyTemplate,
} from "@prisma/client";
import type {
  CourseTemplateFilterQuery,
  CreateCourseTemplateInput,
  UpdateCourseTemplateInput,
  ConfigJson,
  ProgramTemplateQueryInput,
  CreateProgramTemplateInput,
  UpdateProgramTemplateInput,
  AssessmentTemplateFilterInput,
  CreateAssessmentTemplateInput,
  UpdateAssessmentTemplateInput,
  CreateSurveyTemplateInput,
  UpdateSurveyTemplateInput,
  CreateSurveyTemplateQuestionInput,
  ReorderSurveyTemplateQuestionsInput,
  UpdateSurveyTemplateQuestionInput,
  CreateCertificateTemplateInput,
  CreateCertificateTemplateSignerInput,
  UpdateCertificateTemplateInput,
  UpdateCertificateTemplateSignerInput,
  CertificateTemplateFilterInput,
  CreateNotificationTemplateInput,
  UpdateNotificationTemplateInput,
  NotificationTemplateFilterInput,
} from "./template-management.dto.js";

// ─── Payload / list-item projections ───────────────────────────────────────────

export type CourseTemplateListItem = Prisma.CourseTemplateGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    shortSummary: true;
    isActive: true;
    createdAt: true;
    category: { select: { id: true; name: true } };
    difficultyLevel: { select: { id: true; name: true; code: true } };
  };
}>;

export type AssessmentTemplateDetail = Prisma.AssessmentTemplateGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    passingScore: true;
    maxAttempts: true;
    timeLimitMinutes: true;
    randomizeQuestions: true;
    randomizeOptions: true;
    showResultImmediately: true;
    allowReview: true;
    showCorrectAnswers: true;
    lockdownBrowser: true;
    proctoringEnabled: true;
    tabSwitchDetection: true;
    negativeMarking: true;
    questionCount: true;
    questionBankId: true;
    isActive: true;
    createdAt: true;
    updatedAt: true;
    assessmentType: { select: { id: true; name: true; code: true } };
    gradingMethod: { select: { id: true; name: true; slug: true } };
  };
}>;

export type AssessmentTemplateListItem = Prisma.AssessmentTemplateGetPayload<{
  select: {
    id: true;
    name: true;
    description: true;
    passingScore: true;
    maxAttempts: true;
    timeLimitMinutes: true;
    questionCount: true;
    isActive: true;
    createdAt: true;
    assessmentType: { select: { id: true; name: true; code: true } };
    gradingMethod: { select: { id: true; name: true; slug: true } };
  };
}>;

export type SurveyTemplateQuestion = Prisma.SurveyTemplateQuestionGetPayload<{
  include: { questionType: true };
}>;

export type SurveyTemplateWithQuestions = Prisma.SurveyTemplateGetPayload<{
  include: {
    questions: { orderBy: { displayOrder: "asc" }; include: { questionType: true } };
  };
}>;

// Normalize a nullable JSON config into a Prisma JSON input value.
const toJsonInput = (value: ConfigJson | null | undefined): Prisma.InputJsonValue | undefined =>
  (value ?? undefined) as Prisma.InputJsonValue;

// =============================================================================
// Repository implementation
// =============================================================================

export class TemplateManagementRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── 1. Course Templates ────────────────────────────────────────────────────

    async createCourseTemplate(
    companyId: number,
    userId: number,
    data: CreateCourseTemplateInput
  ): Promise<CourseTemplate> {
    const { ownerId, responsiblePersonId, defaultChapters, ...rest } = data;
    return this.prisma.courseTemplate.create({
      data: {
        ...rest,
        companyId,
        createdBy: userId,
        updatedBy: userId,
        ownerId,
        responsiblePersonId,
        ...(defaultChapters !== undefined
          ? {
              defaultChapters: defaultChapters
                ? (defaultChapters as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            }
          : {}),
      },
      include: {
        category: { select: { id: true, name: true } },
        difficultyLevel: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async findCourseTemplateById(companyId: number, id: number): Promise<CourseTemplate | null> {
    return this.prisma.courseTemplate.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        difficultyLevel: { select: { id: true, name: true, code: true } },
        owner: { select: { id: true, email: true } },
        responsiblePerson: { select: { id: true, email: true } },
      },
    });
  }

  async findCourseTemplateByName(companyId: number, name: string): Promise<CourseTemplate | null> {
    return this.prisma.courseTemplate.findFirst({
      where: { companyId, name: { equals: name, mode: "insensitive" }, deletedAt: null },
    });
  }

  async findCourseTemplates(
    companyId: number,
    filter: CourseTemplateFilterQuery,
    page: number,
    pageSize: number
  ): Promise<CourseTemplateListItem[]> {
    const { search, isActive, categoryId, difficultyLevelId, ownerId, completionMethod } = filter;
    return this.prisma.courseTemplate.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(isActive !== undefined && { isActive }),
        ...(categoryId && { categoryId }),
        ...(difficultyLevelId && { difficultyLevelId }),
        ...(ownerId && { ownerId }),
        ...(completionMethod && { completionMethod }),
        ...(search && { name: { contains: search, mode: "insensitive" } }),
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        description: true,
        shortSummary: true,
        isActive: true,
        createdAt: true,
        category: { select: { id: true, name: true } },
        difficultyLevel: { select: { id: true, name: true, code: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async countCourseTemplates(
    companyId: number,
    filter: CourseTemplateFilterQuery
  ): Promise<number> {
    const { search, isActive, categoryId, difficultyLevelId, ownerId, completionMethod } = filter;
    return this.prisma.courseTemplate.count({
      where: {
        companyId,
        deletedAt: null,
        ...(isActive !== undefined && { isActive }),
        ...(categoryId && { categoryId }),
        ...(difficultyLevelId && { difficultyLevelId }),
        ...(ownerId && { ownerId }),
        ...(completionMethod && { completionMethod }),
        ...(search && { name: { contains: search, mode: "insensitive" } }),
      },
    });
  }

  async updateCourseTemplate(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateCourseTemplateInput
  ): Promise<CourseTemplate> {
    const { ownerId, responsiblePersonId, defaultChapters, ...rest } = data;
    return this.prisma.courseTemplate.update({
      where: { id, companyId },
      data: {
        ...rest,
        ...(ownerId !== undefined && { ownerId }),
        ...(responsiblePersonId !== undefined && { responsiblePersonId }),
        ...(defaultChapters !== undefined
          ? {
              defaultChapters: defaultChapters
                ? (defaultChapters as Prisma.InputJsonValue)
                : Prisma.JsonNull,
            }
          : {}),
        updatedBy: userId,
      },
      include: {
        category: { select: { id: true, name: true } },
        difficultyLevel: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async softDeleteCourseTemplate(companyId: number, id: number): Promise<Prisma.BatchPayload> {
    return this.prisma.courseTemplate.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async countCourseTemplateUsages(companyId: number, id: number): Promise<number> {
    return this.prisma.course.count({
      where: { sourceTemplateId: id, companyId, deletedAt: null },
    });
  }

  // ─── 2. Program Templates ───────────────────────────────────────────────────

  async createProgramTemplate(
    companyId: number,
    userId: number,
    data: CreateProgramTemplateInput,
  ): Promise<ProgramTemplate> {
    const { defaultMilestones, defaultCourses, defaultTasks, ...rest } = data;
    return this.prisma.programTemplate.create({
      data: {
        ...rest,
        companyId,
        createdBy: userId,
        updatedBy: userId,
        ...(defaultMilestones !== undefined && {
          defaultMilestones: defaultMilestones
            ? (defaultMilestones as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        }),
        ...(defaultCourses !== undefined && {
          defaultCourses: defaultCourses
            ? (defaultCourses as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        }),
        ...(defaultTasks !== undefined && {
          defaultTasks: defaultTasks
            ? (defaultTasks as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        }),
      },
                  include: {
        category: { select: { id: true, name: true } },
        owner: { select: { id: true, fullName: true } },
        creator: { select: { id: true, email: true } },
      },
    });
  }

  async findProgramTemplateById(companyId: number, id: number): Promise<ProgramTemplate | null> {
    return this.prisma.programTemplate.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        owner: { select: { id: true, fullName: true } },
        creator: { select: { id: true, email: true } },
        updater: { select: { id: true, email: true } },
      },
    });
  }

  async findProgramTemplateByName(companyId: number, name: string): Promise<ProgramTemplate | null> {
    return this.prisma.programTemplate.findFirst({
      where: { companyId, name: { equals: name, mode: "insensitive" }, deletedAt: null },
    });
  }

  async findProgramTemplates(
    companyId: number,
    query: ProgramTemplateQueryInput
  ): Promise<ProgramTemplate[]> {
    const { page = 1, pageSize = 10, search, isActive, categoryId, programTypeId, ownerEmployeeId } = query;
    const where: Prisma.ProgramTemplateWhereInput = {
      companyId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(categoryId && { categoryId }),
      ...(programTypeId && { programTypeId }),
      ...(ownerEmployeeId && { ownerEmployeeId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };
    return this.prisma.programTemplate.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { category: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    });
  }

  async countProgramTemplates(companyId: number, query?: ProgramTemplateQueryInput): Promise<number> {
    const { search, isActive, categoryId, programTypeId, ownerEmployeeId } = query ?? {};
    return this.prisma.programTemplate.count({
      where: {
        companyId,
        deletedAt: null,
        ...(isActive !== undefined && { isActive }),
        ...(categoryId && { categoryId }),
        ...(programTypeId && { programTypeId }),
        ...(ownerEmployeeId && { ownerEmployeeId }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
    });
  }

  async updateProgramTemplate(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateProgramTemplateInput
  ): Promise<ProgramTemplate> {
    const { defaultMilestones, defaultCourses, defaultTasks, ...rest } = data;
    return this.prisma.programTemplate.update({
      where: { id, companyId },
      data: {
        ...rest,
        ...(defaultMilestones !== undefined && {
          defaultMilestones: defaultMilestones
            ? (defaultMilestones as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        }),
        ...(defaultCourses !== undefined && {
          defaultCourses: defaultCourses
            ? (defaultCourses as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        }),
        ...(defaultTasks !== undefined && {
          defaultTasks: defaultTasks
            ? (defaultTasks as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        }),
        updatedBy: userId,
      },
    });
  }

  async softDeleteProgramTemplate(companyId: number, id: number): Promise<ProgramTemplate> {
    return this.prisma.programTemplate.update({
      where: { id, companyId },
      data: { deletedAt: new Date() },
    });
  }

  async countProgramTemplateUsages(companyId: number, id: number): Promise<number> {
    // LearningProgram has no direct FK to ProgramTemplate; conservatively 0.
    return 0;
  }

  // ─── 3. Assessment Templates ─────────────────────────────────────────────────

    async createAssessmentTemplate(
    companyId: number,
    userId: number,
    data: CreateAssessmentTemplateInput,
  ): Promise<AssessmentTemplateDetail> {
                const { assessmentTypeId, gradingMethodId, passingScore, negativeMarking, ...rest } = data;
    return this.prisma.assessmentTemplate.create({
      data: {
        ...(rest as any),
        companyId,
        createdBy: userId,
        updatedBy: userId,
        passingScore: new Prisma.Decimal(passingScore),
        ...(negativeMarking !== undefined
          ? { negativeMarking: negativeMarking !== null ? new Prisma.Decimal(negativeMarking) : null }
          : {}),
        assessmentType: { connect: { id: assessmentTypeId } },
        gradingMethod: { connect: { id: gradingMethodId } },
      } as any,
      select: {
        id: true,
        name: true,
        description: true,
        passingScore: true,
        maxAttempts: true,
        timeLimitMinutes: true,
        randomizeQuestions: true,
        randomizeOptions: true,
        showResultImmediately: true,
        allowReview: true,
        showCorrectAnswers: true,
        lockdownBrowser: true,
        proctoringEnabled: true,
        tabSwitchDetection: true,
        negativeMarking: true,
        questionCount: true,
        questionBankId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        assessmentType: { select: { id: true, name: true, code: true } },
        gradingMethod: { select: { id: true, name: true, slug: true } },
      },
    }) as Promise<AssessmentTemplateDetail>;
  }

  async findAssessmentTemplateById(companyId: number, id: number): Promise<AssessmentTemplateDetail | null> {
    return this.prisma.assessmentTemplate.findFirst({
      where: { id, companyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        description: true,
        passingScore: true,
        maxAttempts: true,
        timeLimitMinutes: true,
        randomizeQuestions: true,
        randomizeOptions: true,
        showResultImmediately: true,
        allowReview: true,
        showCorrectAnswers: true,
        lockdownBrowser: true,
        proctoringEnabled: true,
        tabSwitchDetection: true,
        negativeMarking: true,
        questionCount: true,
        questionBankId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        assessmentType: { select: { id: true, name: true, code: true } },
        gradingMethod: { select: { id: true, name: true, slug: true } },
      },
    }) as Promise<AssessmentTemplateDetail | null>;
  }

  async findAssessmentTemplateByName(companyId: number, name: string): Promise<AssessmentTemplate | null> {
    return this.prisma.assessmentTemplate.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, companyId, deletedAt: null },
    });
  }

  async findAssessmentTemplates(
    companyId: number,
    filter: AssessmentTemplateFilterInput,
  ): Promise<AssessmentTemplateListItem[]> {
    const { search, assessmentTypeId, gradingMethodId, questionBankId, isActive, page = 1, pageSize = 10 } = filter;
    return this.prisma.assessmentTemplate.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(assessmentTypeId && { assessmentTypeId }),
        ...(gradingMethodId && { gradingMethodId }),
        ...(questionBankId && { questionBankId }),
        ...(isActive !== undefined && { isActive }),
        ...(search && { name: { contains: search, mode: "insensitive" } }),
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        description: true,
        passingScore: true,
        maxAttempts: true,
        timeLimitMinutes: true,
        questionCount: true,
        isActive: true,
        createdAt: true,
        assessmentType: { select: { id: true, name: true, code: true } },
        gradingMethod: { select: { id: true, name: true, slug: true } },
      },
      orderBy: { createdAt: "desc" },
    }) as Promise<AssessmentTemplateListItem[]>;
  }

  async countAssessmentTemplates(
    companyId: number,
    filter: AssessmentTemplateFilterInput,
  ): Promise<number> {
    const { search, assessmentTypeId, gradingMethodId, questionBankId, isActive } = filter;
    return this.prisma.assessmentTemplate.count({
      where: {
        companyId,
        deletedAt: null,
        ...(assessmentTypeId && { assessmentTypeId }),
        ...(gradingMethodId && { gradingMethodId }),
        ...(questionBankId && { questionBankId }),
        ...(isActive !== undefined && { isActive }),
        ...(search && { name: { contains: search, mode: "insensitive" } }),
      },
    });
  }

  async updateAssessmentTemplate(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateAssessmentTemplateInput,
  ): Promise<AssessmentTemplate> {
        const { assessmentTypeId, gradingMethodId, passingScore, negativeMarking, ...rest } = data;
    const updateData: any = {
      ...rest,
      updatedBy: userId,
      ...(assessmentTypeId !== undefined && { assessmentType: { connect: { id: assessmentTypeId } } }),
      ...(gradingMethodId !== undefined && { gradingMethod: { connect: { id: gradingMethodId } } }),
    };
    if (passingScore !== undefined) updateData.passingScore = new Prisma.Decimal(passingScore);
    if (negativeMarking !== undefined) {
      updateData.negativeMarking = negativeMarking === null ? null : new Prisma.Decimal(negativeMarking);
    }
    return this.prisma.assessmentTemplate.update({
      where: { id, companyId },
      data: updateData,
    });
  }

  async softDeleteAssessmentTemplate(companyId: number, id: number): Promise<Prisma.BatchPayload> {
    return this.prisma.assessmentTemplate.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), updatedBy: undefined as any },
    });
  }

  async countAssessmentTemplateUsages(companyId: number, id: number): Promise<number> {
    return this.prisma.assessment.count({
      where: { templateId: id, companyId, deletedAt: null },
    });
  }

  // ─── 4. Survey Templates (incl. dynamic question builder) ──────────────────

  async createSurveyTemplate(
    companyId: number,
    userId: number,
    data: CreateSurveyTemplateInput
  ): Promise<SurveyTemplateWithQuestions> {
    const { questions, ...rest } = data;
    return this.prisma.surveyTemplate.create({
      data: {
        ...rest,
        companyId,
        createdBy: userId,
        ...(questions?.length
          ? {
              questions: {
                create: questions.map((q, index) => ({
                  companyId,
                  questionTypeId: q.questionTypeId,
                  questionText: q.questionText,
                  isRequired: q.isRequired ?? true,
                  configJson: toJsonInput(q.configJson),
                  displayOrder: index + 1,
                })),
              },
            }
          : {}),
      },
      include: {
        questions: {
          orderBy: { displayOrder: "asc" },
          include: { questionType: true },
        },
      },
    });
  }

  async findSurveyTemplateById(companyId: number, id: number): Promise<SurveyTemplateWithQuestions | null> {
    return this.prisma.surveyTemplate.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        questions: {
          orderBy: { displayOrder: "asc" },
          include: { questionType: true },
        },
      },
    });
  }

  async findSurveyTemplateByName(companyId: number, name: string): Promise<SurveyTemplate | null> {
    return this.prisma.surveyTemplate.findFirst({
      where: { companyId, name: { equals: name, mode: "insensitive" }, deletedAt: null },
    });
  }

  async findSurveyTemplates(
    companyId: number,
    query: { page?: number; pageSize?: number; search?: string; isActive?: boolean; surveyType?: string; kirkpatrickLevel?: string },
    page: number,
    pageSize: number
  ): Promise<SurveyTemplate[]> {
    const { search, isActive, surveyType, kirkpatrickLevel } = query;
    const where: Prisma.SurveyTemplateWhereInput = {
      companyId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(surveyType && { surveyType: surveyType as any }),
      ...(kirkpatrickLevel && { kirkpatrickLevel: kirkpatrickLevel as any }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };
    return this.prisma.surveyTemplate.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    });
  }

  async countSurveyTemplates(companyId: number, query?: { search?: string; isActive?: boolean; surveyType?: string; kirkpatrickLevel?: string }): Promise<number> {
    const { search, isActive, surveyType, kirkpatrickLevel } = query ?? {};
    return this.prisma.surveyTemplate.count({
      where: {
        companyId,
        deletedAt: null,
        ...(isActive !== undefined && { isActive }),
        ...(surveyType && { surveyType: surveyType as any }),
        ...(kirkpatrickLevel && { kirkpatrickLevel: kirkpatrickLevel as any }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
    });
  }

  async updateSurveyTemplate(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateSurveyTemplateInput
  ): Promise<SurveyTemplateWithQuestions> {
    const { questions, ...rest } = data;
    return this.prisma.$transaction(async (tx) => {
      await tx.surveyTemplate.update({
        where: { id, companyId },
        data: { ...rest, updatedBy: userId },
      });
      if (questions?.length) {
        // Replace the question set when inline questions are provided
        await tx.surveyTemplateQuestion.deleteMany({ where: { templateId: id, companyId } });
        await tx.surveyTemplateQuestion.createMany({
          data: questions.map((q, index) => ({
            companyId,
            templateId: id,
            questionTypeId: q.questionTypeId,
            questionText: q.questionText,
            isRequired: q.isRequired ?? true,
            configJson: toJsonInput(q.configJson),
            displayOrder: index + 1,
          })),
        });
      }
      return tx.surveyTemplate.findFirstOrThrow({
        where: { id, companyId },
        include: {
          questions: {
            orderBy: { displayOrder: "asc" },
            include: { questionType: true },
          },
        },
      }) as Promise<SurveyTemplateWithQuestions>;
    });
  }

  async softDeleteSurveyTemplate(companyId: number, id: number): Promise<Prisma.BatchPayload> {
    return this.prisma.surveyTemplate.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async createSurveyTemplateQuestion(
    companyId: number,
    templateId: number,
    data: CreateSurveyTemplateQuestionInput & { displayOrder: number }
  ): Promise<SurveyTemplateQuestion> {
    const { displayOrder, ...rest } = data;
    const created = await this.prisma.surveyTemplateQuestion.create({
      data: {
        companyId,
        templateId,
        displayOrder,
        questionTypeId: rest.questionTypeId,
        questionText: rest.questionText,
        isRequired: rest.isRequired ?? true,
        configJson: toJsonInput(rest.configJson),
      },
      include: { questionType: true },
    });
    return created as SurveyTemplateQuestion;
  }

  async findSurveyTemplateQuestions(companyId: number, templateId: number): Promise<SurveyTemplateQuestion[]> {
    return this.prisma.surveyTemplateQuestion.findMany({
      where: { companyId, templateId },
      orderBy: { displayOrder: "asc" },
      include: { questionType: true },
    });
  }

  async findSurveyTemplateQuestionById(
    companyId: number,
    templateId: number,
    id: number
  ): Promise<SurveyTemplateQuestion | null> {
    return this.prisma.surveyTemplateQuestion.findFirst({
      where: { companyId, templateId, id },
      include: { questionType: true },
    });
  }

  async findMaxSurveyTemplateQuestionOrder(companyId: number, templateId: number): Promise<number> {
    const result = await this.prisma.surveyTemplateQuestion.aggregate({
      where: { companyId, templateId },
      _max: { displayOrder: true },
    });
    return result._max.displayOrder ?? 0;
  }

  async updateSurveyTemplateQuestion(
    companyId: number,
    templateId: number,
    id: number,
    data: UpdateSurveyTemplateQuestionInput
  ): Promise<SurveyTemplateQuestion> {
    const { questionTypeId, questionText, isRequired, configJson, displayOrder } = data;
    const updateData: Prisma.SurveyTemplateQuestionUpdateInput = {
      ...(questionText !== undefined && { questionText }),
      ...(isRequired !== undefined && { isRequired }),
      ...(displayOrder !== undefined && { displayOrder }),
      ...(configJson !== undefined && { configJson: toJsonInput(configJson) }),
      ...(questionTypeId !== undefined && { questionType: { connect: { id: questionTypeId } } }),
    };
    return this.prisma.surveyTemplateQuestion.update({
      where: { id, templateId, companyId } as any,
      data: updateData,
      include: { questionType: true },
    });
  }

  async deleteSurveyTemplateQuestion(
    companyId: number,
    templateId: number,
    id: number
  ): Promise<SurveyTemplateQuestion> {
    return this.prisma.surveyTemplateQuestion.delete({
      where: { id, templateId, companyId } as any,
      include: { questionType: true },
    });
  }

  async reorderSurveyTemplateQuestions(
    companyId: number,
    templateId: number,
    items: ReorderSurveyTemplateQuestionsInput["questions"]
  ): Promise<SurveyTemplateQuestion[]> {
    const OFFSET = 1_000_000;
    return this.prisma.$transaction(async (tx) => {
      await tx.surveyTemplateQuestion.updateMany({
        where: { templateId, companyId },
        data: { displayOrder: { increment: OFFSET } },
      });
      for (const item of items) {
        await tx.surveyTemplateQuestion.updateMany({
          where: { id: item.id, templateId, companyId },
          data: { displayOrder: item.displayOrder },
        });
      }
      return tx.surveyTemplateQuestion.findMany({
        where: { companyId, templateId },
        orderBy: { displayOrder: "asc" },
        include: { questionType: true },
      });
    });
  }
  // ─── 6. Notification Templates ──────────────────────────────────────────────

  async createNotificationTemplate(
    companyId: number,
    userId: number,
    data: CreateNotificationTemplateInput,
  ): Promise<NotificationTemplate> {
    const { notificationEventId, variables, ...rest } = data;
    return this.prisma.notificationTemplate.create({
      data: {
        ...rest,
        ...(variables !== undefined && {
          variables: variables
            ? (variables as Prisma.InputJsonValue)
            : Prisma.DbNull,
        }),
        companyId,
        createdBy: userId,
        updatedBy: userId,
        ...(notificationEventId && { notificationEventId }),
      },
    });
  }

  async findNotificationTemplateById(
    companyId: number,
    id: number,
  ): Promise<NotificationTemplate | null> {
    return this.prisma.notificationTemplate.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { notificationEvent: true },
    });
  }

  async findNotificationTemplateByName(
    companyId: number,
    name: string,
  ): Promise<NotificationTemplate | null> {
    return this.prisma.notificationTemplate.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });
  }

  async findNotificationTemplates(
    companyId: number,
    query: NotificationTemplateFilterInput,
  ): Promise<{ data: NotificationTemplate[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { page = 1, limit = 10, search, channel, eventCode, notificationEventId, isActive, sortBy = "createdAt", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationTemplateWhereInput = {
      companyId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(channel && { channel }),
      ...(eventCode && { eventCode: { equals: eventCode, mode: "insensitive" } }),
      ...(notificationEventId && { notificationEventId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { subject: { contains: search, mode: "insensitive" } },
          { body: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.notificationTemplate.findMany({
        where,
        skip,
        take: limit,
        include: { notificationEvent: true },
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.notificationTemplate.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async countNotificationTemplates(
    companyId: number,
    query?: Prisma.NotificationTemplateWhereInput,
  ): Promise<number> {
    return this.prisma.notificationTemplate.count({
      where: { companyId, deletedAt: null, ...(query ?? {}) },
    });
  }

  async updateNotificationTemplate(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateNotificationTemplateInput,
  ): Promise<NotificationTemplate> {
    const { notificationEventId, variables, ...rest } = data;
    return this.prisma.notificationTemplate.update({
      where: { id, companyId },
      data: {
        ...rest,
        ...(variables !== undefined && {
          variables: variables
            ? (variables as Prisma.InputJsonValue)
            : Prisma.DbNull,
        }),
        updatedBy: userId,
        ...(notificationEventId !== undefined && { notificationEventId }),
      },
      include: { notificationEvent: true },
    });
  }

  async softDeleteNotificationTemplate(companyId: number, id: number): Promise<Prisma.BatchPayload> {
    return this.prisma.notificationTemplate.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async countNotificationTemplateUsages(companyId: number, id: number): Promise<number> {
    // Notification dispatch records live outside LMS (EMS boundary);
    // NotificationTemplate has no child relation that would block deletion.
    return 0;
  }

  // ─── 7. Certificate Templates ──────────────────────────────────────────────

  async createCertificateTemplate(
    companyId: number,
    userId: number,
    data: CreateCertificateTemplateInput,
  ): Promise<CertificateTemplate> {
    const { ...rest } = data;
    return this.prisma.certificateTemplate.create({
      data: {
        ...rest,
        companyId,
        createdBy: userId,
        updatedBy: userId,
      },
    });
  }

  async findCertificateTemplateById(
    companyId: number,
    id: number,
  ): Promise<CertificateTemplate | null> {
    return this.prisma.certificateTemplate.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { certificateType: true, courseVersion: true, learningProgram: true, signers: true },
    });
  }

  async findCertificateTemplateByName(
    companyId: number,
    name: string,
  ): Promise<CertificateTemplate | null> {
    return this.prisma.certificateTemplate.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });
  }

  async findCertificateTemplates(
    companyId: number,
    query: CertificateTemplateFilterInput,
  ): Promise<{ data: CertificateTemplate[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { page = 1, limit = 10, search, certificateTypeId, courseVersionId, learningProgramId, status, sortBy = "createdAt", sortOrder = "desc" } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.CertificateTemplateWhereInput = {
      companyId,
      deletedAt: null,
      ...(certificateTypeId && { certificateTypeId }),
      ...(courseVersionId && { courseVersionId }),
      ...(learningProgramId && { learningProgramId }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { certificateIdPattern: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [data, total] = await Promise.all([
      this.prisma.certificateTemplate.findMany({
        where,
        skip,
        take: limit,
        include: { certificateType: true, signers: true },
        orderBy: { [sortBy]: sortOrder },
      }),
      this.prisma.certificateTemplate.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async countCertificateTemplates(
    companyId: number,
    query?: Prisma.CertificateTemplateWhereInput,
  ): Promise<number> {
    return this.prisma.certificateTemplate.count({
      where: { companyId, deletedAt: null, ...(query ?? {}) },
    });
  }

  async updateCertificateTemplate(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateCertificateTemplateInput,
  ): Promise<CertificateTemplate> {
    return this.prisma.certificateTemplate.update({
      where: { id, companyId },
      data: {
        ...data,
        updatedBy: userId,
      },
      include: { certificateType: true, courseVersion: true, learningProgram: true, signers: true },
    });
  }

  async softDeleteCertificateTemplate(companyId: number, id: number): Promise<Prisma.BatchPayload> {
    return this.prisma.certificateTemplate.updateMany({
      where: { id, companyId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
  }

  async countCertificateTemplateUsages(companyId: number, id: number): Promise<number> {
    return this.prisma.certificate.count({
      where: { companyId, templateId: id },
    });
  }

  // ─── 8. Certificate Template Signers ───────────────────────────────────────

  async createCertificateTemplateSigner(
    companyId: number,
    templateId: number,
    data: CreateCertificateTemplateSignerInput,
  ): Promise<CertificateTemplateSigner> {
    return this.prisma.certificateTemplateSigner.create({
      data: {
        companyId,
        templateId,
        employeeId: data.employeeId,
        displayOrder: data.displayOrder,
      },
      include: { employee: true },
    });
  }

  async findCertificateTemplateSignerById(
    companyId: number,
    id: number,
  ): Promise<CertificateTemplateSigner | null> {
    return this.prisma.certificateTemplateSigner.findFirst({
      where: { id, companyId },
      include: { employee: true },
    });
  }

  async findCertificateTemplateSigners(
    companyId: number,
    templateId: number,
  ): Promise<CertificateTemplateSigner[]> {
    return this.prisma.certificateTemplateSigner.findMany({
      where: { companyId, templateId },
      orderBy: { displayOrder: "asc" },
      include: { employee: true },
    });
  }

  async updateCertificateTemplateSigner(
    companyId: number,
    id: number,
    data: UpdateCertificateTemplateSignerInput,
  ): Promise<CertificateTemplateSigner> {
    return this.prisma.certificateTemplateSigner.update({
      where: { id, companyId },
      data,
    });
  }

  async deleteCertificateTemplateSigner(
    companyId: number,
    id: number,
  ): Promise<CertificateTemplateSigner> {
    return this.prisma.certificateTemplateSigner.delete({
      where: { id, companyId },
    });
  }

  // ─── Helper lookups for related configuration entities ───────────────────

  async findProgramCategoryById(companyId: number, id: number) {
    return this.prisma.programCategory.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  async findProgramTypeById(companyId: number, id: number) {
    return this.prisma.programType.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  async findAssessmentTypeById(id: number, companyId: number) {
    return this.prisma.assessmentType.findFirst({ where: { id, companyId } });
  }

  async findGradingMethodById(id: number, companyId: number) {
    return this.prisma.gradingMethod.findFirst({ where: { id, companyId } });
  }

  async findSurveyQuestionTypeById(companyId: number, id: number) {
    return this.prisma.surveyQuestionType.findFirst({ where: { id, companyId } });
  }

  async findCertificateTypeById(companyId: number, id: number) {
    return this.prisma.certificateType.findFirst({ where: { id, companyId } });
  }

    async findNotificationEventByCode(companyId: number, code: string) {
    return this.prisma.notificationEvent.findFirst({ where: { companyId, code } });
  }

  async findQuestionBankById(companyId: number, id: number) {
    return this.prisma.questionBank.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  async findCertificateTemplateSignerByEmployee(
    companyId: number,
    templateId: number,
    employeeId: string,
  ): Promise<CertificateTemplateSigner | null> {
    return this.prisma.certificateTemplateSigner.findFirst({
      where: { companyId, templateId, employeeId },
    });
  }

  async findCertificateTemplateSignerByOrder(
    companyId: number,
    templateId: number,
    displayOrder: number,
  ): Promise<CertificateTemplateSigner | null> {
    return this.prisma.certificateTemplateSigner.findFirst({
      where: { companyId, templateId, displayOrder },
    });
  }
}
