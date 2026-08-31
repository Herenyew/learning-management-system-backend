import type { PrismaClient, Prisma } from '@prisma/client';

import type {
  ConfigJson,
  CreateSurveyQuestionTypeInput,
  CreateSurveyTemplateInput,
  CreateSurveyTemplateQuestionInput,
  ISurveyConfigurationRepository,
  ReorderSurveyTemplateQuestionsInput,
  SurveyQuestionTypeFilterParams,
  SurveyTemplateFilterParams,
  SurveyTemplateQuestion,
  SurveyTemplateWithQuestions,
  UpdateSurveyQuestionTypeInput,
  UpdateSurveyTemplateInput,
  UpdateSurveyTemplateQuestionInput,
} from './survey-configuration.types.js';

// Shared projection: load a template together with its ordered questions.
const TEMPLATE_QUESTIONS_INCLUDE = {
  questions: {
    orderBy: { displayOrder: 'asc' },
    include: { questionType: true },
  },
} satisfies Prisma.SurveyTemplateInclude;

// Normalize a nullable JSON config into a Prisma JSON input value.
const toJsonInput = (value: ConfigJson | null | undefined): Prisma.InputJsonValue | undefined =>
  (value ?? undefined) as Prisma.InputJsonValue;

export class SurveyConfigurationRepository implements ISurveyConfigurationRepository {
  constructor(private prisma: PrismaClient) {}

  async createSurveyQuestionType(companyId: number, data: CreateSurveyQuestionTypeInput) {
    return this.prisma.surveyQuestionType.create({
      data: { ...data, configJson: toJsonInput(data.configJson), companyId },
    });
  }

  async findSurveyQuestionTypeById(companyId: number, id: number) {
    return this.prisma.surveyQuestionType.findFirst({ where: { id, companyId } });
  }

  async findSurveyQuestionTypeByName(companyId: number, name: string) {
    return this.prisma.surveyQuestionType.findFirst({ where: { companyId, name } });
  }

  async findSurveyQuestionTypes(companyId: number, query: SurveyQuestionTypeFilterParams) {
    const { page = 1, pageSize = 25, search, isActive } = query;
    const skip = (page - 1) * pageSize;
    // Soft-deleted types (isActive=false) are hidden by default. Only show them
    // when explicitly requested with isActive=false. Express query params arrive
    // as strings, so coerce both shapes.
    const rawActive = isActive as unknown;
    const isActiveBool =
      rawActive === true || rawActive === 'true' ? true : rawActive === false || rawActive === 'false' ? false : undefined;
    const where: Prisma.SurveyQuestionTypeWhereInput = {
      companyId,
      ...(isActiveBool !== undefined ? { isActive: isActiveBool } : { isActive: true }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    } as any;

    const [items, total] = await Promise.all([
      this.prisma.surveyQuestionType.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      this.prisma.surveyQuestionType.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async countSurveyQuestionTypes(companyId: number) {
    return this.prisma.surveyQuestionType.count({ where: { companyId } });
  }

  async updateSurveyQuestionType(companyId: number, id: number, data: UpdateSurveyQuestionTypeInput) {
    return this.prisma.surveyQuestionType.updateMany({
      where: { id, companyId },
      data: { ...data, configJson: toJsonInput(data.configJson) },
    });
  }

  async softDeleteSurveyQuestionType(companyId: number, id: number) {
    // SurveyQuestionType has no deletedAt in schema; soft-delete by toggling isActive=false
    return this.prisma.surveyQuestionType.updateMany({ where: { id, companyId }, data: { isActive: false } as any });
  }

  async countSurveyQuestionTypeUsages(companyId: number, id: number) {
    // Count both runtime survey questions and template questions referencing this type
    const [runtime, template] = await Promise.all([
      this.prisma.surveyQuestion.count({ where: { companyId, questionTypeId: id } }),
      this.prisma.surveyTemplateQuestion.count({ where: { companyId, questionTypeId: id } }),
    ]);
    return runtime + template;
  }

  // Survey Templates

  async createTemplate(companyId: number, userId: number, data: CreateSurveyTemplateInput) {
    const { questions, ...templateData } = data as CreateSurveyTemplateInput & {
      questions?: CreateSurveyTemplateQuestionInput[];
    };
    const questionRows = (questions ?? []).map((question, index) => ({
      companyId,
      questionTypeId: question.questionTypeId,
      questionText: question.questionText,
      isRequired: question.isRequired ?? true,
      configJson: toJsonInput(question.configJson),
      displayOrder: index + 1,
    }));
    const created = await this.prisma.surveyTemplate.create({
      data: {
        ...templateData,
        companyId,
        createdBy: userId,
        questions: { create: questionRows },
      } as Prisma.SurveyTemplateUncheckedCreateInput,
      include: TEMPLATE_QUESTIONS_INCLUDE,
    });
    return created as SurveyTemplateWithQuestions;
  }

  async findTemplateById(companyId: number, id: number) {
    return this.prisma.surveyTemplate.findFirst({
      where: { id, companyId, deletedAt: null },
      include: TEMPLATE_QUESTIONS_INCLUDE,
    });
  }

  async findTemplateByName(companyId: number, name: string) {
    return this.prisma.surveyTemplate.findFirst({ where: { companyId, name, deletedAt: null } });
  }

  // The unique index on (companyId, name) still covers soft-deleted rows, so a
  // deleted template with the same name blocks recreation. Look it up explicitly.
  async findSoftDeletedTemplateByName(companyId: number, name: string) {
    return this.prisma.surveyTemplate.findFirst({ where: { companyId, name, deletedAt: { not: null } } });
  }

  // Re-use the row occupied by a soft-deleted template: restore it, refresh its
  // metadata and replace its questions with the incoming set.
  async resurrectTemplate(companyId: number, id: number, userId: number, data: CreateSurveyTemplateInput) {
    const { questions, ...templateData } = data as CreateSurveyTemplateInput & {
      questions?: CreateSurveyTemplateQuestionInput[];
    };
    const questionRows = (questions ?? []).map((question, index) => ({
      companyId,
      questionTypeId: question.questionTypeId,
      questionText: question.questionText,
      isRequired: question.isRequired ?? true,
      configJson: toJsonInput(question.configJson),
      displayOrder: index + 1,
    }));
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.surveyTemplateQuestion.deleteMany({ where: { templateId: id, companyId } });
      return tx.surveyTemplate.update({
        where: { id },
        data: {
          ...templateData,
          deletedAt: null,
          isActive: true,
          updatedBy: userId,
          questions: { create: questionRows },
        } as Prisma.SurveyTemplateUncheckedUpdateInput,
        include: TEMPLATE_QUESTIONS_INCLUDE,
      });
    });
    return updated as SurveyTemplateWithQuestions;
  }

  async findTemplates(companyId: number, query: SurveyTemplateFilterParams) {
        const { page = 1, pageSize = 25, search, isActive } = query;
    const skip = (page - 1) * pageSize;
    // isActive may arrive from query-string parsing as a string ("true"/"false")
    const isActiveBool = isActive === true || (typeof isActive === 'string' && isActive === 'true');
    const where: Prisma.SurveyTemplateWhereInput = {
      companyId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive: isActiveBool }),
      ...(search && { name: { contains: search, mode: 'insensitive' } }),
    } as any;

    const [items, total] = await Promise.all([
      this.prisma.surveyTemplate.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      this.prisma.surveyTemplate.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async countTemplates(companyId: number) {
    return this.prisma.surveyTemplate.count({ where: { companyId, deletedAt: null } });
  }

  async updateTemplate(companyId: number, id: number, userId: number, data: UpdateSurveyTemplateInput) {
    // Do not modify existing survey instances — template updates only affect the template record
    const { questions, ...templateData } = data as UpdateSurveyTemplateInput & {
      questions?: CreateSurveyTemplateQuestionInput[];
    };

    if (!questions) {
      const updated = await this.prisma.surveyTemplate.update({
        where: { id, companyId },
        data: { ...templateData, updatedBy: userId },
        include: TEMPLATE_QUESTIONS_INCLUDE,
      });
      return updated as SurveyTemplateWithQuestions;
    }

    // Replace-all semantics: the incoming question list becomes the full question set
    const questionRows = questions.map((question, index) => ({
      companyId,
      questionTypeId: question.questionTypeId,
      questionText: question.questionText,
      isRequired: question.isRequired ?? true,
      configJson: toJsonInput(question.configJson),
      displayOrder: index + 1,
    }));
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.surveyTemplateQuestion.deleteMany({ where: { templateId: id, companyId } });
      return tx.surveyTemplate.update({
        where: { id, companyId },
        data: {
          ...templateData,
          updatedBy: userId,
          questions: { create: questionRows },
        } as Prisma.SurveyTemplateUncheckedUpdateInput,
        include: TEMPLATE_QUESTIONS_INCLUDE,
      });
    });
    return updated as SurveyTemplateWithQuestions;
  }

  async softDeleteTemplate(companyId: number, id: number) {
    return this.prisma.surveyTemplate.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }

  async countTemplateUsages(companyId: number, id: number) {
    // Count Surveys created from this template (runtime table)
    // Survey has no direct template FK in schema; conservatively return 0
    return 0;
  }

  // Survey Template Questions (Dynamic Question Builder)

  async createTemplateQuestion(
    companyId: number,
    templateId: number,
    data: CreateSurveyTemplateQuestionInput & { displayOrder: number },
  ) {
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

  async findTemplateQuestions(companyId: number, templateId: number) {
    return this.prisma.surveyTemplateQuestion.findMany({
      where: { companyId, templateId },
      orderBy: { displayOrder: 'asc' },
      include: { questionType: true },
    });
  }

  async findTemplateQuestionById(companyId: number, templateId: number, id: number) {
    return this.prisma.surveyTemplateQuestion.findFirst({
      where: { companyId, templateId, id },
      include: { questionType: true },
    });
  }

  async findMaxTemplateQuestionOrder(companyId: number, templateId: number) {
    const result = await this.prisma.surveyTemplateQuestion.aggregate({
      where: { companyId, templateId },
      _max: { displayOrder: true },
    });
    return result._max.displayOrder ?? 0;
  }

  async updateTemplateQuestion(companyId: number, templateId: number, id: number, data: UpdateSurveyTemplateQuestionInput) {
    const { questionTypeId, questionText, isRequired, configJson, displayOrder } = data;
    const updateData: Prisma.SurveyTemplateQuestionUpdateInput = {
      ...(questionText !== undefined && { questionText }),
      ...(isRequired !== undefined && { isRequired }),
      ...(displayOrder !== undefined && { displayOrder }),
      ...(configJson !== undefined && { configJson: toJsonInput(configJson) }),
      ...(questionTypeId !== undefined && {
        questionType: { connect: { id: questionTypeId } },
      }),
    };
    return this.prisma.surveyTemplateQuestion.update({
      where: { id, templateId, companyId } as any,
      data: updateData,
      include: { questionType: true },
    });
  }

  async deleteTemplateQuestion(companyId: number, templateId: number, id: number) {
    return this.prisma.surveyTemplateQuestion.delete({
      where: { id, templateId, companyId } as any,
      include: { questionType: true },
    });
  }

  async reorderTemplateQuestions(
    companyId: number,
    templateId: number,
    items: ReorderSurveyTemplateQuestionsInput['questions'],
  ) {
    const OFFSET = 1_000_000;
    return this.prisma.$transaction(async (tx) => {
      // Shift every question out of the way to defeat the per-template unique
      // constraint on displayOrder, then apply the requested ordering.
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
        orderBy: { displayOrder: 'asc' },
        include: { questionType: true },
      });
    });
  }
}
