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

  // TEMPLATE METHODS REMOVED — moved to template-management module
}
