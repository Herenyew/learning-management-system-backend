import { AudienceGroup, AudienceGroupRule, Prisma, PrismaClient } from "@prisma/client";

export interface AudienceGroupFilter {
  companyId: number;
  search?: string;
  isActive?: boolean;
}

// Scalar IDs from DTO — do not use AudienceGroupRuleCreateInput for this
export type AudienceGroupRuleWriteData = {
  departmentId?: number | null;
  jobTitleId?: number | null;
  jobLevelId?: number | null;
  appRoleId?: number | null;
  employmentTypeId?: number | null;
  hireWithinDays?: number | null;
  operator?: "AND" | "OR";
  isExclusion?: boolean;
};

export interface IAudienceRepository {
  create(data: Prisma.AudienceGroupCreateInput): Promise<AudienceGroup>;
  findById(audienceGroupId: number, companyId: number): Promise<AudienceGroup | null>;
  findByName(companyId: number, name: string): Promise<AudienceGroup | null>;
  findMany(filter: AudienceGroupFilter, page: number, pageSize: number): Promise<AudienceGroup[]>;
  countMany(filter: AudienceGroupFilter): Promise<number>;
  update(
    audienceGroupId: number,
    companyId: number,
    data: Prisma.AudienceGroupUpdateInput,
  ): Promise<AudienceGroup>;
  softDelete(audienceGroupId: number, companyId: number): Promise<AudienceGroup>;
  findTargetUsages(
    audienceGroupId: number,
    companyId: number,
  ): Promise<{ entityType: string; entityId: number }[]>;

  createRule(
    audienceGroupId: number,
    companyId: number,
    data: AudienceGroupRuleWriteData,
  ): Promise<AudienceGroupRule>;
  findRuleById(ruleId: number, companyId: number): Promise<AudienceGroupRule | null>;
  updateRule(
    ruleId: number,
    companyId: number,
    data: AudienceGroupRuleWriteData,
  ): Promise<AudienceGroupRule>;
  deleteRule(ruleId: number, companyId: number): Promise<AudienceGroupRule>;
  findRules(audienceGroupId: number, companyId: number): Promise<AudienceGroupRule[]>;
}

export class AudienceRepository implements IAudienceRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ==========================================
  // Audience Groups
  // ==========================================

  async create(data: Prisma.AudienceGroupCreateInput): Promise<AudienceGroup> {
    return this.prisma.audienceGroup.create({ data });
  }

  async findById(audienceGroupId: number, companyId: number): Promise<AudienceGroup | null> {
    return this.prisma.audienceGroup.findFirst({
      where: {
        id: audienceGroupId,
        companyId,
        deletedAt: null,
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
    filter: AudienceGroupFilter,
    page: number,
    pageSize: number,
  ): Promise<AudienceGroup[]> {
    return this.prisma.audienceGroup.findMany({
      where: {
        companyId: filter.companyId,
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
      orderBy: { createdAt: "desc" },
    });
  }

  async countMany(filter: AudienceGroupFilter): Promise<number> {
    return this.prisma.audienceGroup.count({
      where: {
        companyId: filter.companyId,
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

  // Ownership checked in service before this is called
  async update(
    audienceGroupId: number,
    _companyId: number,
    data: Prisma.AudienceGroupUpdateInput,
  ): Promise<AudienceGroup> {
    return this.prisma.audienceGroup.update({
      where: { id: audienceGroupId },
      data,
    });
  }

  // Ownership checked in service before this is called
  async softDelete(audienceGroupId: number, _companyId: number): Promise<AudienceGroup> {
    return this.prisma.audienceGroup.update({
      where: { id: audienceGroupId },
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

  // Ownership checked in service before this is called
  async updateRule(
    ruleId: number,
    _companyId: number,
    data: AudienceGroupRuleWriteData,
  ): Promise<AudienceGroupRule> {
    return this.prisma.audienceGroupRule.update({
      where: { id: ruleId },
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
}