import { Prisma, QuestionAnswerStructure } from "@prisma/client";
import { IAssessmentConfigurationRepository } from "./assessment-configuration.repository.js";
import {
  CreateAssessmentTypeDto,
  UpdateAssessmentTypeDto,
  AssessmentTypeFilterDto,
  CreateQuestionTypeDto,
  UpdateQuestionTypeDto,
  QuestionTypeFilterDto,
  CreateGradingMethodDto,
  UpdateGradingMethodDto,
  GradingMethodFilterDto,
  CreateAssessmentTemplateDto,
  UpdateAssessmentTemplateDto,
  AssessmentTemplateFilterDto,
} from "./assessment-configuration.dto.js";
import { AppError, ErrorCode } from "../../../common/errors/index.js";

export class AssessmentConfigurationService {
  constructor(private readonly repository: IAssessmentConfigurationRepository) {}

  // ─── 1. Assessment Types ─────────────────────────────────────────────────
  async createAssessmentType(dto: CreateAssessmentTypeDto, companyId: number) {
    const existing = await this.repository.findAssessmentTypeByCode(dto.code, companyId);
    if (existing) {
      throw new AppError(`Assessment type code '${dto.code}' already exists.`, 409, ErrorCode.CONFLICT);
    }

    const data: Prisma.AssessmentTypeCreateInput = {
      code: dto.code,
      name: dto.name,
      description: dto.description,
      isScored: dto.isScored,
      isPractice: dto.isPractice,
      isGraded: dto.isGraded,
      displayOrder: dto.displayOrder,
      isActive: dto.isActive,
      isSystem: false,
      company: { connect: { id: companyId } },
    };

    return this.repository.createAssessmentType(data);
  }

  async getAssessmentTypes(filter: AssessmentTypeFilterDto, companyId: number) {
    const [items, total] = await Promise.all([
      this.repository.findAssessmentTypes(filter, companyId),
      this.repository.countAssessmentTypes(filter, companyId),
    ]);

    return {
      items,
      meta: {
        total,
        page: filter.page,
        pageSize: filter.pageSize,
        totalPages: Math.ceil(total / filter.pageSize),
      },
    };
  }

  async getAssessmentTypeById(id: number, companyId: number) {
    const item = await this.repository.findAssessmentTypeById(id, companyId);
    if (!item) {
      throw new AppError(`Assessment type with ID ${id} not found.`, 404, ErrorCode.NOT_FOUND);
    }
    return item;
  }

  async updateAssessmentType(id: number, dto: UpdateAssessmentTypeDto, companyId: number) {
    const existing = await this.getAssessmentTypeById(id, companyId);

    if (existing.isSystem) {
      throw new AppError("System assessment types cannot be modified.", 403, ErrorCode.FORBIDDEN);
    }

    if (dto.code && dto.code !== existing.code) {
      const duplicate = await this.repository.findAssessmentTypeByCode(dto.code, companyId);
      if (duplicate && duplicate.id !== id) {
        throw new AppError(`Assessment type code '${dto.code}' already exists.`, 409, ErrorCode.CONFLICT);
      }
    }

    return this.repository.updateAssessmentType(id, companyId, dto);
  }

  async deleteAssessmentType(id: number, companyId: number) {
    const existing = await this.getAssessmentTypeById(id, companyId);

    if (existing.isSystem) {
      throw new AppError("System assessment types cannot be deleted.", 403, ErrorCode.FORBIDDEN);
    }

    const usages = await this.repository.countAssessmentTypeUsages(id, companyId);
    if (usages > 0) {
      throw new AppError(
        `Cannot delete assessment type because it is referenced by ${usages} record(s).`,
        409,
        ErrorCode.CONFLICT
      );
    }

    return this.repository.deleteAssessmentType(id, companyId);
  }

  // ─── 2. Question Types ───────────────────────────────────────────────────
  async createQuestionType(dto: CreateQuestionTypeDto, companyId: number) {
    const existingName = await this.repository.findQuestionTypeByName(dto.name, companyId);
    if (existingName) {
      throw new AppError(`Question type with name '${dto.name}' already exists.`, 409, ErrorCode.CONFLICT);
    }

    const existingSlug = await this.repository.findQuestionTypeBySlug(dto.slug, companyId);
    if (existingSlug) {
      throw new AppError(`Question type with slug '${dto.slug}' already exists.`, 409, ErrorCode.CONFLICT);
    }

    const data: Prisma.QuestionTypeCreateInput = {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      answerStructure: dto.answerStructure,
      isActive: dto.isActive,
      isSystem: false,
      company: { connect: { id: companyId } },
    };

    return this.repository.createQuestionType(data);
  }

  async getQuestionTypes(filter: QuestionTypeFilterDto, companyId: number) {
    const [items, total] = await Promise.all([
      this.repository.findQuestionTypes(filter, companyId),
      this.repository.countQuestionTypes(filter, companyId),
    ]);

    return {
      items,
      meta: {
        total,
        page: filter.page,
        pageSize: filter.pageSize,
        totalPages: Math.ceil(total / filter.pageSize),
      },
    };
  }

  async getQuestionTypeById(id: number, companyId: number) {
    const item = await this.repository.findQuestionTypeById(id, companyId);
    if (!item) {
      throw new AppError(`Question type with ID ${id} not found.`, 404, ErrorCode.NOT_FOUND);
    }
    return item;
  }

  async updateQuestionType(id: number, dto: UpdateQuestionTypeDto, companyId: number) {
    const existing = await this.getQuestionTypeById(id, companyId);

    if (existing.isSystem) {
      throw new AppError("System question types cannot be modified.", 403, ErrorCode.FORBIDDEN);
    }

    // 🔴 Critical Guard: Prevent changing answerStructure if questions/blueprints exist
    if (dto.answerStructure && dto.answerStructure !== existing.answerStructure) {
      const usages = await this.repository.countQuestionTypeUsages(id, companyId);
      if (usages > 0) {
        throw new AppError(
          "Cannot change answer structure for a question type that is already in use.",
          400,
          ErrorCode.BAD_REQUEST
        );
      }
    }

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.repository.findQuestionTypeByName(dto.name, companyId);
      if (duplicate && duplicate.id !== id) {
        throw new AppError(`Question type with name '${dto.name}' already exists.`, 409, ErrorCode.CONFLICT);
      }
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const duplicate = await this.repository.findQuestionTypeBySlug(dto.slug, companyId);
      if (duplicate && duplicate.id !== id) {
        throw new AppError(`Question type with slug '${dto.slug}' already exists.`, 409, ErrorCode.CONFLICT);
      }
    }

    return this.repository.updateQuestionType(id, companyId, dto);
  }

  async deleteQuestionType(id: number, companyId: number) {
    const existing = await this.getQuestionTypeById(id, companyId);

    if (existing.isSystem) {
      throw new AppError("System question types cannot be deleted.", 403, ErrorCode.FORBIDDEN);
    }

    const usages = await this.repository.countQuestionTypeUsages(id, companyId);
    if (usages > 0) {
      throw new AppError(
        `Cannot delete question type because it is referenced by ${usages} record(s).`,
        409,
        ErrorCode.CONFLICT
      );
    }

    return this.repository.deleteQuestionType(id, companyId);
  }

  // ─── 3. Grading Methods ──────────────────────────────────────────────────
  async createGradingMethod(dto: CreateGradingMethodDto, companyId: number) {
    const existingName = await this.repository.findGradingMethodByName(dto.name, companyId);
    if (existingName) {
      throw new AppError(`Grading method with name '${dto.name}' already exists.`, 409, ErrorCode.CONFLICT);
    }

    const existingSlug = await this.repository.findGradingMethodBySlug(dto.slug, companyId);
    if (existingSlug) {
      throw new AppError(`Grading method with slug '${dto.slug}' already exists.`, 409, ErrorCode.CONFLICT);
    }

    const data: Prisma.GradingMethodCreateInput = {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      isActive: dto.isActive,
      isSystem: false,
      company: { connect: { id: companyId } },
    };

    return this.repository.createGradingMethod(data);
  }

  async getGradingMethods(filter: GradingMethodFilterDto, companyId: number) {
    const [items, total] = await Promise.all([
      this.repository.findGradingMethods(filter, companyId),
      this.repository.countGradingMethods(filter, companyId),
    ]);

    return {
      items,
      meta: {
        total,
        page: filter.page,
        pageSize: filter.pageSize,
        totalPages: Math.ceil(total / filter.pageSize),
      },
    };
  }

  async getGradingMethodById(id: number, companyId: number) {
    const item = await this.repository.findGradingMethodById(id, companyId);
    if (!item) {
      throw new AppError(`Grading method with ID ${id} not found.`, 404, ErrorCode.NOT_FOUND);
    }
    return item;
  }

  async updateGradingMethod(id: number, dto: UpdateGradingMethodDto, companyId: number) {
    const existing = await this.getGradingMethodById(id, companyId);

    if (existing.isSystem) {
      throw new AppError("System grading methods cannot be modified.", 403, ErrorCode.FORBIDDEN);
    }

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.repository.findGradingMethodByName(dto.name, companyId);
      if (duplicate && duplicate.id !== id) {
        throw new AppError(`Grading method with name '${dto.name}' already exists.`, 409, ErrorCode.CONFLICT);
      }
    }

    if (dto.slug && dto.slug !== existing.slug) {
      const duplicate = await this.repository.findGradingMethodBySlug(dto.slug, companyId);
      if (duplicate && duplicate.id !== id) {
        throw new AppError(`Grading method with slug '${dto.slug}' already exists.`, 409, ErrorCode.CONFLICT);
      }
    }

    return this.repository.updateGradingMethod(id, companyId, dto);
  }

  async deleteGradingMethod(id: number, companyId: number) {
    const existing = await this.getGradingMethodById(id, companyId);

    if (existing.isSystem) {
      throw new AppError("System grading methods cannot be deleted.", 403, ErrorCode.FORBIDDEN);
    }

    const usages = await this.repository.countGradingMethodUsages(id, companyId);
    if (usages > 0) {
      throw new AppError(
        `Cannot delete grading method because it is referenced by ${usages} record(s).`,
        409,
        ErrorCode.CONFLICT
      );
    }

    return this.repository.deleteGradingMethod(id, companyId);
  }

  // ─── 4. Assessment Templates ─────────────────────────────────────────────
  async createTemplate(dto: CreateAssessmentTemplateDto, companyId: number, createdById: number) {
    const existing = await this.repository.findTemplateByName(dto.name, companyId);
    if (existing) {
      throw new AppError(`Assessment template with name '${dto.name}' already exists.`, 409, ErrorCode.CONFLICT);
    }

    // Validate relations exist
    await this.getAssessmentTypeById(dto.assessmentTypeId, companyId);
    await this.getGradingMethodById(dto.gradingMethodId, companyId);

    const data: Prisma.AssessmentTemplateCreateInput = {
      name: dto.name,
      description: dto.description,
      passingScore: dto.passingScore,
      maxAttempts: dto.maxAttempts,
      timeLimitMinutes: dto.timeLimitMinutes,
      randomizeQuestions: dto.randomizeQuestions,
      randomizeOptions: dto.randomizeOptions,
      showResultImmediately: dto.showResultImmediately,
      allowReview: dto.allowReview,
      showCorrectAnswers: dto.showCorrectAnswers,
      lockdownBrowser: dto.lockdownBrowser,
      proctoringEnabled: dto.proctoringEnabled,
      negativeMarking: dto.negativeMarking,
      isActive: dto.isActive,
      company: { connect: { id: companyId } },
      assessmentType: { connect: { id: dto.assessmentTypeId } },
      gradingMethod: { connect: { id: dto.gradingMethodId } },
      creator: { connect: { id: createdById } },
    };

    return this.repository.createTemplate(data);
  }

  async getTemplates(filter: AssessmentTemplateFilterDto, companyId: number) {
    const [items, total] = await Promise.all([
      this.repository.findTemplates(filter, companyId),
      this.repository.countTemplates(filter, companyId),
    ]);

    return {
      items,
      meta: {
        total,
        page: filter.page,
        pageSize: filter.pageSize,
        totalPages: Math.ceil(total / filter.pageSize),
      },
    };
  }

  async getTemplateById(id: number, companyId: number) {
    const item = await this.repository.findTemplateById(id, companyId);
    if (!item) {
      throw new AppError(`Assessment template with ID ${id} not found.`, 404, ErrorCode.NOT_FOUND);
    }
    return item;
  }

  async updateTemplate(id: number, dto: UpdateAssessmentTemplateDto, companyId: number, updatedById: number) {
    const existing = await this.getTemplateById(id, companyId);

    if (dto.name && dto.name !== existing.name) {
      const duplicate = await this.repository.findTemplateByName(dto.name, companyId);
      if (duplicate && duplicate.id !== id) {
        throw new AppError(`Assessment template with name '${dto.name}' already exists.`, 409, ErrorCode.CONFLICT);
      }
    }

    if (dto.assessmentTypeId) {
      await this.getAssessmentTypeById(dto.assessmentTypeId, companyId);
    }
    if (dto.gradingMethodId) {
      await this.getGradingMethodById(dto.gradingMethodId, companyId);
    }

    const data: Prisma.AssessmentTemplateUpdateInput = {
      ...dto,
      ...(dto.assessmentTypeId && { assessmentType: { connect: { id: dto.assessmentTypeId } } }),
      ...(dto.gradingMethodId && { gradingMethod: { connect: { id: dto.gradingMethodId } } }),
      updater: { connect: { id: updatedById } },
    };

    // Remove raw FK numbers from data
    delete (data as any).assessmentTypeId;
    delete (data as any).gradingMethodId;

    return this.repository.updateTemplate(id, companyId, data);
  }

  async deleteTemplate(id: number, companyId: number, updatedById: number) {
    await this.getTemplateById(id, companyId);

    const usages = await this.repository.countTemplateUsages(id, companyId);
    if (usages > 0) {
      throw new AppError(
        `Cannot delete assessment template because it has been used by ${usages} assessment(s).`,
        409,
        ErrorCode.CONFLICT
      );
    }

    return this.repository.softDeleteTemplate(id, companyId, updatedById);
  }
}