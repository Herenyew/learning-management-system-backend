import type { PrismaClient, Prisma } from '@prisma/client';

import type {
  ConfigJson,
  CreateSurveyQuestionTypeInput,
  ISurveyConfigurationRepository,
  SurveyQuestionTypeFilterParams,
  UpdateSurveyQuestionTypeInput,
} from './survey-configuration.types.js';

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
    // Count runtime survey questions referencing this type
    // Note: template question usages are tracked in the template-management module
    return this.prisma.surveyQuestion.count({ where: { companyId, questionTypeId: id } });
  }

  // TEMPLATE METHODS REMOVED — moved to template-management module
}
