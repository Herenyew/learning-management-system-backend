import {
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '../../../common/errors/index.js';
import { SurveyConfigurationRepository } from './survey-configuration.repository.js';

function throwIfUniqueViolation(err: unknown, message: string): void {
  if (
    typeof err === 'object' &&
    err !== null &&
    (err as { code?: string }).code === 'P2002'
  ) {
    throw new ConflictError(message);
  }
}

export class SurveyConfigurationService {
  constructor(private repo: SurveyConfigurationRepository) {}

  // ─── Survey Question Types ────────────────────────────────────────────────

  async createSurveyQuestionType(companyId: number, data: any) {
    // Validate duplicates and business rules in service layer
    const existingName = await this.repo.findSurveyQuestionTypeByName(companyId, data.name);
    if (existingName) {
      throw new ConflictError(`Survey question type with name "${data.name}" already exists.`);
    }
    try {
      return await this.repo.createSurveyQuestionType(companyId, data);
    } catch (err) {
      throwIfUniqueViolation(err, `Survey question type slug "${data.slug ?? ''}" is already in use.`);
      throw err;
    }
  }

  async findSurveyQuestionTypeById(companyId: number, id: number) {
    return this.repo.findSurveyQuestionTypeById(companyId, id);
  }

  async findSurveyQuestionTypes(companyId: number, query: any) {
    return this.repo.findSurveyQuestionTypes(companyId, query);
  }

  async updateSurveyQuestionType(companyId: number, id: number, data: any) {
    const existing = await this.repo.findSurveyQuestionTypeById(companyId, id);
    if (!existing) {
      throw new NotFoundError('Survey question type');
    }
    if (data.name && data.name !== existing.name) {
      const duplicate = await this.repo.findSurveyQuestionTypeByName(companyId, data.name);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(`Survey question type with name "${data.name}" already exists.`);
      }
    }
    try {
      const result = await this.repo.updateSurveyQuestionType(companyId, id, data);
      if (result.count === 0) {
        throw new NotFoundError('Survey question type');
      }
    } catch (err) {
      throwIfUniqueViolation(err, 'Survey question type name/slug is already in use.');
      throw err;
    }
    return this.repo.findSurveyQuestionTypeById(companyId, id);
  }

  async softDeleteSurveyQuestionType(companyId: number, id: number) {
    const existing = await this.repo.findSurveyQuestionTypeById(companyId, id);
    if (!existing) {
      throw new NotFoundError('Survey question type');
    }
    if (existing.isSystem) {
      throw new ForbiddenError('System survey question types cannot be deleted.');
    }
    // Deletion is blocked while survey questions still reference this type
    const usageCount = await this.repo.countSurveyQuestionTypeUsages(companyId, id);
    if (usageCount > 0) {
      throw new ConflictError(
        `Cannot delete survey question type because it is used by ${usageCount} survey question(s).`
      );
    }
    // SurveyQuestionType has no deletedAt in schema; perform soft-delete by toggling isActive=false
    return this.repo.softDeleteSurveyQuestionType(companyId, id);
  }

  // ─── Survey Templates ─────────────────────────────────────────────────────

  async createTemplate(companyId: number, userId: number, data: any) {
    const existingName = await this.repo.findTemplateByName(companyId, data.name);
    if (existingName) {
      throw new ConflictError(`Survey template with name "${data.name}" already exists.`);
    }
    return this.repo.createTemplate(companyId, userId, data);
  }

  async findTemplateById(companyId: number, id: number) {
    return this.repo.findTemplateById(companyId, id);
  }

  async findTemplates(companyId: number, query: any) {
    return this.repo.findTemplates(companyId, query);
  }

  async updateTemplate(companyId: number, id: number, userId: number, data: any) {
    const existing = await this.repo.findTemplateById(companyId, id);
    if (!existing) {
      throw new NotFoundError('Survey template');
    }
    if (data.name && data.name !== existing.name) {
      const duplicate = await this.repo.findTemplateByName(companyId, data.name);
      if (duplicate && duplicate.id !== id) {
        throw new ConflictError(`Survey template with name "${data.name}" already exists.`);
      }
    }
    // Do not modify existing survey instances — ensure template updates only affect the template record
    return this.repo.updateTemplate(companyId, id, userId, data);
  }

  async softDeleteTemplate(companyId: number, id: number) {
    const existing = await this.repo.findTemplateById(companyId, id);
    if (!existing) {
      throw new NotFoundError('Survey template');
    }
    // Soft delete only affects the template record — existing surveys remain untouched
    return this.repo.softDeleteTemplate(companyId, id);
  }


  // Survey Template Questions (Dynamic Question Builder)

  async createTemplateQuestion(companyId: number, templateId: number, data: any) {
    const template = await this.repo.findTemplateById(companyId, templateId);
    if (!template) {
      throw new NotFoundError('Survey template');
    }
    const questionType = await this.repo.findSurveyQuestionTypeById(companyId, data.questionTypeId);
    if (!questionType || !questionType.isActive) {
      throw new NotFoundError('Survey question type');
    }
    const displayOrder =
      data.displayOrder ?? (await this.repo.findMaxTemplateQuestionOrder(companyId, templateId)) + 1;
    try {
      return await this.repo.createTemplateQuestion(companyId, templateId, { ...data, displayOrder });
    } catch (err) {
      throwIfUniqueViolation(err, 'A question already exists at that display order for this template.');
      throw err;
    }
  }

  async findTemplateQuestions(companyId: number, templateId: number) {
    return this.repo.findTemplateQuestions(companyId, templateId);
  }

  async findTemplateQuestionById(companyId: number, templateId: number, id: number) {
    return this.repo.findTemplateQuestionById(companyId, templateId, id);
  }

  async updateTemplateQuestion(companyId: number, templateId: number, id: number, data: any) {
    const existing = await this.repo.findTemplateQuestionById(companyId, templateId, id);
    if (!existing) {
      throw new NotFoundError('Survey template question');
    }
    if (data.questionTypeId && data.questionTypeId !== existing.questionTypeId) {
      const questionType = await this.repo.findSurveyQuestionTypeById(companyId, data.questionTypeId);
      if (!questionType || !questionType.isActive) {
        throw new NotFoundError('Survey question type');
      }
    }
    try {
      return await this.repo.updateTemplateQuestion(companyId, templateId, id, data);
    } catch (err) {
      throwIfUniqueViolation(err, 'A question already exists at that display order for this template.');
      throw err;
    }
  }

  async deleteTemplateQuestion(companyId: number, templateId: number, id: number) {
    const existing = await this.repo.findTemplateQuestionById(companyId, templateId, id);
    if (!existing) {
      throw new NotFoundError('Survey template question');
    }
    return this.repo.deleteTemplateQuestion(companyId, templateId, id);
  }

  async reorderTemplateQuestions(companyId: number, templateId: number, data: any) {
    const template = await this.repo.findTemplateById(companyId, templateId);
    if (!template) {
      throw new NotFoundError('Survey template');
    }
    const questions = await this.repo.findTemplateQuestions(companyId, templateId);
    const knownIds = new Set(questions.map((q) => q.id));
    const requestedIds = data.questions.map((q: { id: number }) => q.id);
    const missing = requestedIds.filter((qid: number) => !knownIds.has(qid));
    if (missing.length > 0) {
      throw new NotFoundError(`Survey template question(s): ${missing.join(', ')}`);
    }
    if (new Set(requestedIds).size !== requestedIds.length) {
      throw new ConflictError('Duplicate question ids in reorder payload.');
    }
    return this.repo.reorderTemplateQuestions(companyId, templateId, data.questions);
  }
}
