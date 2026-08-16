import { SurveyConfigurationRepository } from './survey-configuration.repository.js';

export class SurveyConfigurationService {
  constructor(private repo: SurveyConfigurationRepository) {}

  // SurveyQuestionType
  createSurveyQuestionType(companyId: number, data: any) {
    // Validate duplicates and business rules in service layer
    return this.repo.createSurveyQuestionType(companyId, data);
  }

  findSurveyQuestionTypeById(companyId: number, id: number) {
    return this.repo.findSurveyQuestionTypeById(companyId, id);
  }

  findSurveyQuestionTypes(companyId: number, query: any) {
    return this.repo.findSurveyQuestionTypes(companyId, query);
  }

  updateSurveyQuestionType(companyId: number, id: number, data: any) {
    return this.repo.updateSurveyQuestionType(companyId, id, data);
  }

  softDeleteSurveyQuestionType(companyId: number, id: number) {
    return this.repo.softDeleteSurveyQuestionType(companyId, id);
  }

  // SurveyTemplate
  createTemplate(companyId: number, userId: number, data: any) {
    return this.repo.createTemplate(companyId, userId, data);
  }

  findTemplateById(companyId: number, id: number) {
    return this.repo.findTemplateById(companyId, id);
  }

  findTemplates(companyId: number, query: any) {
    return this.repo.findTemplates(companyId, query);
  }

  updateTemplate(companyId: number, id: number, userId: number, data: any) {
    return this.repo.updateTemplate(companyId, id, userId, data);
  }

  softDeleteTemplate(companyId: number, id: number) {
    return this.repo.softDeleteTemplate(companyId, id);
  }
}
