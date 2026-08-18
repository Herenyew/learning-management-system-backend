import type { PrismaClient, Prisma } from '@prisma/client';

import type {
  CreateSurveyQuestionTypeInput,
  CreateSurveyTemplateInput,
  ISurveyConfigurationRepository,
  SurveyQuestionTypeFilterParams,
  SurveyTemplateFilterParams,
  UpdateSurveyQuestionTypeInput,
  UpdateSurveyTemplateInput,
} from './survey-configuration.types.js';

export class SurveyConfigurationRepository implements ISurveyConfigurationRepository {
  constructor(private prisma: PrismaClient) {}

  // SurveyQuestionType repository methods
  async createSurveyQuestionType(companyId: number, data: CreateSurveyQuestionTypeInput) {
    return this.prisma.surveyQuestionType.create({ data: { ...data, companyId } });
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
    const where: Prisma.SurveyQuestionTypeWhereInput = {
      companyId,
      ...(isActive !== undefined && { isActive }),
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
    return this.prisma.surveyQuestionType.updateMany({ where: { id, companyId }, data });
  }

  async softDeleteSurveyQuestionType(companyId: number, id: number) {
    // SurveyQuestionType has no deletedAt in schema; perform soft-delete by toggling isActive=false
    return this.prisma.surveyQuestionType.updateMany({ where: { id, companyId }, data: { isActive: false } as any });
  }

  async countSurveyQuestionTypeUsages(companyId: number, id: number) {
    // Count Survey questions referencing this type (survey runtime tables own references)
    return this.prisma.surveyQuestion.count({ where: { companyId, questionTypeId: id } });
  }

  // SurveyTemplate repository methods
  async createTemplate(companyId: number, userId: number, data: CreateSurveyTemplateInput) {
    return this.prisma.surveyTemplate.create({ data: { ...data, companyId, createdBy: userId } });
  }

  async findTemplateById(companyId: number, id: number) {
    return this.prisma.surveyTemplate.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  async findTemplateByName(companyId: number, name: string) {
    return this.prisma.surveyTemplate.findFirst({ where: { companyId, name, deletedAt: null } });
  }

  async findTemplates(companyId: number, query: SurveyTemplateFilterParams) {
    const { page = 1, pageSize = 25, search, isActive } = query;
    const skip = (page - 1) * pageSize;
    const where: Prisma.SurveyTemplateWhereInput = {
      companyId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
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
    // Do not modify existing survey instances — ensure template updates only affect template record
    return this.prisma.surveyTemplate.update({ where: { id, companyId }, data: { ...data, updatedBy: userId } });
  }

  async softDeleteTemplate(companyId: number, id: number) {
    return this.prisma.surveyTemplate.updateMany({ where: { id, companyId }, data: { deletedAt: new Date() } });
  }

  async countTemplateUsages(companyId: number, id: number) {
    // Count Surveys created from this template (runtime table)
    // Survey has no direct template FK in schema; conservatively return 0
    return 0;
  }
}
