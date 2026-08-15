import {
  PrismaClient,
  AssessmentType,
  QuestionType,
  GradingMethod,
  AssessmentTemplate,
  Prisma,
} from "@prisma/client";
import {
  AssessmentTypeFilterDto,
  QuestionTypeFilterDto,
  GradingMethodFilterDto,
  AssessmentTemplateFilterDto,
} from "./assessment-configuration.dto.js";

export interface IAssessmentConfigurationRepository {
  // Assessment Type
  createAssessmentType(data: Prisma.AssessmentTypeCreateInput): Promise<AssessmentType>;
  findAssessmentTypeById(id: number, companyId: number): Promise<AssessmentType | null>;
  findAssessmentTypeByCode(code: string, companyId: number): Promise<AssessmentType | null>;
  findAssessmentTypes(filter: AssessmentTypeFilterDto, companyId: number): Promise<AssessmentType[]>;
  countAssessmentTypes(filter: AssessmentTypeFilterDto, companyId: number): Promise<number>;
  updateAssessmentType(id: number, companyId: number, data: Prisma.AssessmentTypeUpdateInput): Promise<AssessmentType>;
  deleteAssessmentType(id: number, companyId: number): Promise<AssessmentType>;
  countAssessmentTypeUsages(id: number, companyId: number): Promise<number>;

  // Question Type
  createQuestionType(data: Prisma.QuestionTypeCreateInput): Promise<QuestionType>;
  findQuestionTypeById(id: number, companyId: number): Promise<QuestionType | null>;
  findQuestionTypeByName(name: string, companyId: number): Promise<QuestionType | null>;
  findQuestionTypeBySlug(slug: string, companyId: number): Promise<QuestionType | null>;
  findQuestionTypes(filter: QuestionTypeFilterDto, companyId: number): Promise<QuestionType[]>;
  countQuestionTypes(filter: QuestionTypeFilterDto, companyId: number): Promise<number>;
  updateQuestionType(id: number, companyId: number, data: Prisma.QuestionTypeUpdateInput): Promise<QuestionType>;
  deleteQuestionType(id: number, companyId: number): Promise<QuestionType>;
  countQuestionTypeUsages(id: number, companyId: number): Promise<number>;

  // Grading Method
  createGradingMethod(data: Prisma.GradingMethodCreateInput): Promise<GradingMethod>;
  findGradingMethodById(id: number, companyId: number): Promise<GradingMethod | null>;
  findGradingMethodByName(name: string, companyId: number): Promise<GradingMethod | null>;
  findGradingMethodBySlug(slug: string, companyId: number): Promise<GradingMethod | null>;
  findGradingMethods(filter: GradingMethodFilterDto, companyId: number): Promise<GradingMethod[]>;
  countGradingMethods(filter: GradingMethodFilterDto, companyId: number): Promise<number>;
  updateGradingMethod(id: number, companyId: number, data: Prisma.GradingMethodUpdateInput): Promise<GradingMethod>;
  deleteGradingMethod(id: number, companyId: number): Promise<GradingMethod>;
  countGradingMethodUsages(id: number, companyId: number): Promise<number>;

  // Assessment Template
  createTemplate(data: Prisma.AssessmentTemplateCreateInput): Promise<AssessmentTemplate>;
  findTemplateById(id: number, companyId: number): Promise<any | null>;
  findTemplateByName(name: string, companyId: number): Promise<AssessmentTemplate | null>;
  findTemplates(filter: AssessmentTemplateFilterDto, companyId: number): Promise<any[]>;
  countTemplates(filter: AssessmentTemplateFilterDto, companyId: number): Promise<number>;
  updateTemplate(id: number, companyId: number, data: Prisma.AssessmentTemplateUpdateInput): Promise<AssessmentTemplate>;
  softDeleteTemplate(id: number, companyId: number, updatedBy: number): Promise<AssessmentTemplate>;
  countTemplateUsages(id: number, companyId: number): Promise<number>;
}

export class AssessmentConfigurationRepository implements IAssessmentConfigurationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ─── 1. Assessment Type ──────────────────────────────────────────────────
  async createAssessmentType(data: Prisma.AssessmentTypeCreateInput): Promise<AssessmentType> {
    return this.prisma.assessmentType.create({ data });
  }

  async findAssessmentTypeById(id: number, companyId: number): Promise<AssessmentType | null> {
    return this.prisma.assessmentType.findFirst({
      where: {
        id,
        OR: [{ companyId }, { companyId: null }],
      },
    });
  }

  async findAssessmentTypeByCode(code: string, companyId: number): Promise<AssessmentType | null> {
    return this.prisma.assessmentType.findFirst({
      where: {
        code: code.toUpperCase(),
        OR: [{ companyId }, { companyId: null }],
      },
    });
  }

  async findAssessmentTypes(filter: AssessmentTypeFilterDto, companyId: number): Promise<AssessmentType[]> {
    const { search, isActive, page, pageSize } = filter;
    return this.prisma.assessmentType.findMany({
      where: {
        OR: [{ companyId }, { companyId: null }],
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
    });
  }

  async countAssessmentTypes(filter: AssessmentTypeFilterDto, companyId: number): Promise<number> {
    const { search, isActive } = filter;
    return this.prisma.assessmentType.count({
      where: {
        OR: [{ companyId }, { companyId: null }],
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { code: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
    });
  }

  async updateAssessmentType(
    id: number,
    companyId: number,
    data: Prisma.AssessmentTypeUpdateInput
  ): Promise<AssessmentType> {
    return this.prisma.assessmentType.update({
      where: { id },
      data,
    });
  }

  async deleteAssessmentType(id: number, companyId: number): Promise<AssessmentType> {
    return this.prisma.assessmentType.delete({
      where: { id },
    });
  }

  async countAssessmentTypeUsages(id: number, companyId: number): Promise<number> {
    const [assessmentsCount, templatesCount] = await Promise.all([
      this.prisma.assessment.count({ where: { assessmentTypeId: id, companyId, deletedAt: null } }),
      this.prisma.assessmentTemplate.count({ where: { assessmentTypeId: id, companyId, deletedAt: null } }),
    ]);
    return assessmentsCount + templatesCount;
  }

  // ─── 2. Question Type ────────────────────────────────────────────────────
  async createQuestionType(data: Prisma.QuestionTypeCreateInput): Promise<QuestionType> {
    return this.prisma.questionType.create({ data });
  }

  async findQuestionTypeById(id: number, companyId: number): Promise<QuestionType | null> {
    return this.prisma.questionType.findFirst({
      where: { id, companyId },
    });
  }

  async findQuestionTypeByName(name: string, companyId: number): Promise<QuestionType | null> {
    return this.prisma.questionType.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, companyId },
    });
  }

  async findQuestionTypeBySlug(slug: string, companyId: number): Promise<QuestionType | null> {
    return this.prisma.questionType.findFirst({
      where: { slug: { equals: slug, mode: "insensitive" }, companyId },
    });
  }

  async findQuestionTypes(filter: QuestionTypeFilterDto, companyId: number): Promise<QuestionType[]> {
    const { search, isActive, answerStructure, page, pageSize } = filter;
    return this.prisma.questionType.findMany({
      where: {
        companyId,
        ...(isActive !== undefined && { isActive }),
        ...(answerStructure && { answerStructure }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
    });
  }

  async countQuestionTypes(filter: QuestionTypeFilterDto, companyId: number): Promise<number> {
    const { search, isActive, answerStructure } = filter;
    return this.prisma.questionType.count({
      where: {
        companyId,
        ...(isActive !== undefined && { isActive }),
        ...(answerStructure && { answerStructure }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
    });
  }

  async updateQuestionType(
    id: number,
    companyId: number,
    data: Prisma.QuestionTypeUpdateInput
  ): Promise<QuestionType> {
    return this.prisma.questionType.update({
      where: { id },
      data,
    });
  }

  async deleteQuestionType(id: number, companyId: number): Promise<QuestionType> {
    return this.prisma.questionType.delete({
      where: { id },
    });
  }

  async countQuestionTypeUsages(id: number, companyId: number): Promise<number> {
    const [questionsCount, blueprintsCount] = await Promise.all([
      this.prisma.question.count({ where: { questionTypeId: id, companyId } }),
      this.prisma.assessmentBlueprint.count({ where: { questionTypeId: id, companyId, deletedAt: null } }),
    ]);
    return questionsCount + blueprintsCount;
  }

  // ─── 3. Grading Method ───────────────────────────────────────────────────
  async createGradingMethod(data: Prisma.GradingMethodCreateInput): Promise<GradingMethod> {
    return this.prisma.gradingMethod.create({ data });
  }

  async findGradingMethodById(id: number, companyId: number): Promise<GradingMethod | null> {
    return this.prisma.gradingMethod.findFirst({
      where: { id, companyId },
    });
  }

  async findGradingMethodByName(name: string, companyId: number): Promise<GradingMethod | null> {
    return this.prisma.gradingMethod.findFirst({
      where: { name: { equals: name, mode: "insensitive" }, companyId },
    });
  }

  async findGradingMethodBySlug(slug: string, companyId: number): Promise<GradingMethod | null> {
    return this.prisma.gradingMethod.findFirst({
      where: { slug: { equals: slug, mode: "insensitive" }, companyId },
    });
  }

  async findGradingMethods(filter: GradingMethodFilterDto, companyId: number): Promise<GradingMethod[]> {
    const { search, isActive, page, pageSize } = filter;
    return this.prisma.gradingMethod.findMany({
      where: {
        companyId,
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { name: "asc" },
    });
  }

  async countGradingMethods(filter: GradingMethodFilterDto, companyId: number): Promise<number> {
    const { search, isActive } = filter;
    return this.prisma.gradingMethod.count({
      where: {
        companyId,
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { slug: { contains: search, mode: "insensitive" } },
          ],
        }),
      },
    });
  }

  async updateGradingMethod(
    id: number,
    companyId: number,
    data: Prisma.GradingMethodUpdateInput
  ): Promise<GradingMethod> {
    return this.prisma.gradingMethod.update({
      where: { id },
      data,
    });
  }

  async deleteGradingMethod(id: number, companyId: number): Promise<GradingMethod> {
    return this.prisma.gradingMethod.delete({
      where: { id },
    });
  }

  async countGradingMethodUsages(id: number, companyId: number): Promise<number> {
    const [assessmentsCount, templatesCount] = await Promise.all([
      this.prisma.assessment.count({ where: { gradingMethodId: id, companyId, deletedAt: null } }),
      this.prisma.assessmentTemplate.count({ where: { gradingMethodId: id, companyId, deletedAt: null } }),
    ]);
    return assessmentsCount + templatesCount;
  }

  // ─── 4. Assessment Template ──────────────────────────────────────────────
  async createTemplate(data: Prisma.AssessmentTemplateCreateInput): Promise<AssessmentTemplate> {
    return this.prisma.assessmentTemplate.create({ data });
  }

  async findTemplateById(id: number, companyId: number): Promise<any | null> {
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
        negativeMarking: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        assessmentType: {
          select: { id: true, name: true, code: true },
        },
        gradingMethod: {
          select: { id: true, name: true, slug: true },
        },
      },
    });
  }

  async findTemplateByName(name: string, companyId: number): Promise<AssessmentTemplate | null> {
    return this.prisma.assessmentTemplate.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        companyId,
        deletedAt: null,
      },
    });
  }

  async findTemplates(filter: AssessmentTemplateFilterDto, companyId: number): Promise<any[]> {
    const { search, assessmentTypeId, gradingMethodId, isActive, page, pageSize } = filter;
    return this.prisma.assessmentTemplate.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(assessmentTypeId && { assessmentTypeId }),
        ...(gradingMethodId && { gradingMethodId }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          name: { contains: search, mode: "insensitive" },
        }),
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
        isActive: true,
        createdAt: true,
        assessmentType: {
          select: { id: true, name: true, code: true },
        },
        gradingMethod: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async countTemplates(filter: AssessmentTemplateFilterDto, companyId: number): Promise<number> {
    const { search, assessmentTypeId, gradingMethodId, isActive } = filter;
    return this.prisma.assessmentTemplate.count({
      where: {
        companyId,
        deletedAt: null,
        ...(assessmentTypeId && { assessmentTypeId }),
        ...(gradingMethodId && { gradingMethodId }),
        ...(isActive !== undefined && { isActive }),
        ...(search && {
          name: { contains: search, mode: "insensitive" },
        }),
      },
    });
  }

  async updateTemplate(
    id: number,
    companyId: number,
    data: Prisma.AssessmentTemplateUpdateInput
  ): Promise<AssessmentTemplate> {
    return this.prisma.assessmentTemplate.update({
      where: { id },
      data,
    });
  }

  async softDeleteTemplate(id: number, companyId: number, updatedBy: number): Promise<AssessmentTemplate> {
    return this.prisma.assessmentTemplate.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        updatedBy,
      },
    });
  }

  async countTemplateUsages(id: number, companyId: number): Promise<number> {
    return this.prisma.assessment.count({
      where: {
        templateId: id,
        companyId,
        deletedAt: null,
      },
    });
  }
}