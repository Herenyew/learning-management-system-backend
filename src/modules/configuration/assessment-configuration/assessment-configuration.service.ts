import type { Prisma, QuestionAnswerStructure } from "@prisma/client";
import type { IAssessmentConfigurationRepository } from "./assessment-configuration.types.js";
import type {
  CreateAssessmentTypeInput,
  UpdateAssessmentTypeInput,
  AssessmentTypeFilterInput,
  CreateQuestionTypeInput,
  UpdateQuestionTypeInput,
  QuestionTypeFilterInput,
  CreateGradingMethodInput,
  UpdateGradingMethodInput,
  GradingMethodFilterInput,
} from "./assessment-configuration.types.js";
import { AppError, ErrorCode } from "../../../common/errors/index.js";

export class AssessmentConfigurationService {
  constructor(private readonly repository: IAssessmentConfigurationRepository) {}

  // ─── 1. Assessment Types ─────────────────────────────────────────────────
  async createAssessmentType(dto: CreateAssessmentTypeInput, companyId: number) {
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

  async getAssessmentTypes(filter: AssessmentTypeFilterInput, companyId: number) {
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

  async updateAssessmentType(id: number, dto: UpdateAssessmentTypeInput, companyId: number) {
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
  async createQuestionType(dto: CreateQuestionTypeInput, companyId: number) {
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

  async getQuestionTypes(filter: QuestionTypeFilterInput, companyId: number) {
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

  async updateQuestionType(id: number, dto: UpdateQuestionTypeInput, companyId: number) {
    const existing = await this.getQuestionTypeById(id, companyId);

    if (existing.isSystem) {
      throw new AppError("System question types cannot be modified.", 403, ErrorCode.FORBIDDEN);
    }

    // Critical Guard: Prevent changing answerStructure if questions/blueprints exist
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
  async createGradingMethod(dto: CreateGradingMethodInput, companyId: number) {
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

  async getGradingMethods(filter: GradingMethodFilterInput, companyId: number) {
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

  async updateGradingMethod(id: number, dto: UpdateGradingMethodInput, companyId: number) {
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

}
