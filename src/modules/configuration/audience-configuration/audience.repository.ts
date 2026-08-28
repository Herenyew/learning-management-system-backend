import type { AudienceGroup, AudienceGroupRule, PrismaClient } from "@prisma/client";
import type {
  AudienceGroupFilterParams,
  AudienceGroupRuleWriteData,
  AudienceGroupWithRules,
  CreateAudienceGroupInput,
  IAudienceRepository,
  UpdateAudienceGroupInput,
} from "./audience.types.js";

export class AudienceRepository implements IAudienceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ==========================================
  // Audience Groups
  // ==========================================

  async create(
    companyId: number,
    userId: number,
    data: CreateAudienceGroupInput,
  ): Promise<AudienceGroup> {
    return this.prisma.audienceGroup.create({
      data: {
        ...data,
        companyId,
        createdBy: userId,
      },
    });
  }

  async findById(
    audienceGroupId: number,
    companyId: number,
  ): Promise<AudienceGroupWithRules | null> {
    return this.prisma.audienceGroup.findFirst({
      where: {
        id: audienceGroupId,
        companyId,
        deletedAt: null,
      },
      include: {
        rules: true,
      },
    });
  }

  async findByName(companyId: number, name: string): Promise<AudienceGroup | null> {
    return this.prisma.audienceGroup.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });
  }

  async findMany(
    companyId: number,
    filter: AudienceGroupFilterParams,
  ): Promise<AudienceGroup[]> {
    const page = filter.page ?? 1;
    const pageSize = filter.pageSize ?? 10;

    return this.prisma.audienceGroup.findMany({
      where: {
        companyId,
        deletedAt: null,
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.search && {
          OR: [
            { name: { contains: filter.search, mode: "insensitive" } },
            { description: { contains: filter.search, mode: "insensitive" } },
          ],
        }),
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [filter.sortBy ?? "createdAt"]: filter.sortOrder ?? "desc" },
    });
  }

  async countMany(
    companyId: number,
    filter: AudienceGroupFilterParams,
  ): Promise<number> {
    return this.prisma.audienceGroup.count({
      where: {
        companyId,
        deletedAt: null,
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.search && {
          OR: [
            { name: { contains: filter.search, mode: "insensitive" } },
            { description: { contains: filter.search, mode: "insensitive" } },
          ],
        }),
      },
    });
  }

  async update(
    audienceGroupId: number,
    companyId: number,
    userId: number,
    data: UpdateAudienceGroupInput,
  ): Promise<AudienceGroup> {
    return this.prisma.audienceGroup.update({
      where: {
        id: audienceGroupId,
        companyId,
      },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  async softDelete(audienceGroupId: number, companyId: number): Promise<AudienceGroup> {
    return this.prisma.audienceGroup.update({
      where: {
        id: audienceGroupId,
        companyId,
      },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });
  }

  async findTargetUsages(
    audienceGroupId: number,
    companyId: number,
  ): Promise<{ entityType: string; entityId: number }[]> {
    return this.prisma.targetAudience.findMany({
      where: { audienceGroupId, companyId },
      select: { entityType: true, entityId: true },
    });
  }

  // ==========================================
  // Audience Group Rules
  // ==========================================

  async createRule(
    audienceGroupId: number,
    companyId: number,
    data: AudienceGroupRuleWriteData,
  ): Promise<AudienceGroupRule> {
    return this.prisma.audienceGroupRule.create({
      data: {
        audienceGroupId,
        companyId,
        departmentId: data.departmentId ?? null,
        jobTitleId: data.jobTitleId ?? null,
        jobLevelId: data.jobLevelId ?? null,
        appRoleId: data.appRoleId ?? null,
        employmentTypeId: data.employmentTypeId ?? null,
        hireWithinDays: data.hireWithinDays ?? null,
        operator: data.operator ?? "OR",
        isExclusion: data.isExclusion ?? false,
      },
    });
  }

  async findRuleById(ruleId: number, companyId: number): Promise<AudienceGroupRule | null> {
    return this.prisma.audienceGroupRule.findFirst({
      where: { id: ruleId, companyId },
    });
  }

  async updateRule(
    ruleId: number,
    companyId: number,
    data: AudienceGroupRuleWriteData,
  ): Promise<AudienceGroupRule> {
    return this.prisma.audienceGroupRule.update({
      where: { id: ruleId, companyId },
      data: {
        ...(data.departmentId !== undefined && { departmentId: data.departmentId }),
        ...(data.jobTitleId !== undefined && { jobTitleId: data.jobTitleId }),
        ...(data.jobLevelId !== undefined && { jobLevelId: data.jobLevelId }),
        ...(data.appRoleId !== undefined && { appRoleId: data.appRoleId }),
        ...(data.employmentTypeId !== undefined && {
          employmentTypeId: data.employmentTypeId,
        }),
        ...(data.hireWithinDays !== undefined && { hireWithinDays: data.hireWithinDays }),
        ...(data.operator !== undefined && { operator: data.operator }),
        ...(data.isExclusion !== undefined && { isExclusion: data.isExclusion }),
      },
    });
  }

  async deleteRule(ruleId: number, companyId: number): Promise<AudienceGroupRule> {
    const existingRule = await this.prisma.audienceGroupRule.findFirstOrThrow({
      where: { id: ruleId, companyId },
    });

    await this.prisma.audienceGroupRule.delete({
      where: { id: ruleId },
    });

    return existingRule;
  }

  async findRules(audienceGroupId: number, companyId: number): Promise<AudienceGroupRule[]> {
    return this.prisma.audienceGroupRule.findMany({
      where: { audienceGroupId, companyId },
      orderBy: { createdAt: "asc" },
    });
  }

  // ==========================================
  // Targeting Options
  // ==========================================

  async findDepartments(companyId: number) {
    return this.prisma.department.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  async findJobTitles(companyId: number) {
    return this.prisma.jobTitle.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  async findJobLevels(companyId: number) {
    return this.prisma.jobLevel.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    });
  }

  async findAppRoles(companyId: number) {
    return this.prisma.appRole.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true, description: true },
      orderBy: { name: "asc" },
    });
  }

  async findEmploymentTypes(companyId: number) {
    return this.prisma.employmentType.findMany({
      where: { companyId, isActive: true },
      select: { id: true, name: true, code: true },
      orderBy: { name: "asc" },
    });
  }
}