import { AudienceGroup, AudienceGroupRule, Prisma, PrismaClient } from "@prisma/client";

export interface AudienceGroupFilter {
  companyId: number;
  search?: string;
  isActive?: boolean;
}

// ─────────────────────────────────────────────────────────
// 1. Interface Contract
// ─────────────────────────────────────────────────────────
export interface IAudienceRepository {
  // Audience Group
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

  // Rules
  createRule(
    audienceGroupId: number,
    companyId: number,
    data: Omit<Prisma.AudienceGroupRuleCreateInput, "audienceGroup" | "company">,
  ): Promise<AudienceGroupRule>;
  findRuleById(ruleId: number, companyId: number): Promise<AudienceGroupRule | null>;
  updateRule(
    ruleId: number,
    companyId: number,
    data: Prisma.AudienceGroupRuleUpdateInput,
  ): Promise<AudienceGroupRule>;
  deleteRule(ruleId: number, companyId: number): Promise<AudienceGroupRule>;
  findRules(audienceGroupId: number, companyId: number): Promise<AudienceGroupRule[]>;
}

// ─────────────────────────────────────────────────────────
// 2. Prisma Implementation
// ─────────────────────────────────────────────────────────
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

  async update(
      audienceGroupId: number,
      companyId: number,
      data: Prisma.AudienceGroupUpdateInput,
    ): Promise<AudienceGroup> {
      // Destructure the second element (the updated AudienceGroup entity)
      const [, updated] = await this.prisma.$transaction([
        this.prisma.audienceGroup.updateMany({
          where: { id: audienceGroupId, companyId, deletedAt: null },
          data,
        }),
        this.prisma.audienceGroup.findFirstOrThrow({
          where: { id: audienceGroupId, companyId, deletedAt: null },
        }),
      ]);

      return updated;
    }

  async softDelete(audienceGroupId: number, companyId: number): Promise<AudienceGroup> {
      const [, deletedGroup] = await this.prisma.$transaction([
        this.prisma.audienceGroup.updateMany({
          where: { id: audienceGroupId, companyId, deletedAt: null },
          data: {
            deletedAt: new Date(),
            isActive: false,
          },
        }),
        this.prisma.audienceGroup.findFirstOrThrow({
          where: { id: audienceGroupId, companyId },
        }),
      ]);

      return deletedGroup;
    }

  async findTargetUsages(
    audienceGroupId: number,
    companyId: number,
  ): Promise<{ entityType: string; entityId: number }[]> {
    return this.prisma.targetAudience.findMany({
      where: {
        audienceGroupId,
        companyId,
      },
      select: {
        entityType: true,
        entityId: true,
      },
    });
  }

  // ==========================================
  // Audience Group Rules
  // ==========================================

  async createRule(
    audienceGroupId: number,
    companyId: number,
    data: Omit<Prisma.AudienceGroupRuleCreateInput, "audienceGroup" | "company">,
  ): Promise<AudienceGroupRule> {
    return this.prisma.audienceGroupRule.create({
      data: {
        ...data,
        audienceGroup: { connect: { id: audienceGroupId } },
        company: { connect: { id: companyId } },
      },
    });
  }

  async findRuleById(ruleId: number, companyId: number): Promise<AudienceGroupRule | null> {
    return this.prisma.audienceGroupRule.findFirst({
      where: {
        id: ruleId,
        companyId,
      },
    });
  }

  async updateRule(
      ruleId: number,
      companyId: number,
      data: Prisma.AudienceGroupRuleUpdateInput,
    ): Promise<AudienceGroupRule> {
      const [, updatedRule] = await this.prisma.$transaction([
        this.prisma.audienceGroupRule.updateMany({
          where: { id: ruleId, companyId },
          data,
        }),
        this.prisma.audienceGroupRule.findFirstOrThrow({
          where: { id: ruleId, companyId },
        }),
      ]);

      return updatedRule;
    }

  async deleteRule(ruleId: number, companyId: number): Promise<AudienceGroupRule> {
    // SECURITY FIX: Multi-tenant isolated rule deletion
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
      where: {
        audienceGroupId,
        companyId,
      },
      orderBy: { createdAt: "asc" },
    });
  }
}