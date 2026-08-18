import type { PrismaClient } from "@prisma/client";
import type {
  BadgeFilterParams,
  BadgeRuleFilterParams,
  CreateBadgeInput,
  CreateBadgeRuleInput,
  UpdateBadgeInput,
  UpdateBadgeRuleInput,
} from "./badge-configuration.types.js";
import type { IBadgeRepository } from "./badge-configuration.types.js";

export class BadgeRepository implements IBadgeRepository {
  constructor(private prisma: PrismaClient) {}

  async createBadge(companyId: number, userId: number, data: CreateBadgeInput) {
    return this.prisma.badge.create({ data: { companyId, ...data } as any });
  }

  async findBadgeById(companyId: number, id: number) {
    return this.prisma.badge.findFirst({ where: { id, companyId } });
  }

  async findBadges(companyId: number, query: BadgeFilterParams) {
    const { search, categoryId, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = { companyId };
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.name = { contains: search, mode: "insensitive" };
    const [data, total] = await Promise.all([
      this.prisma.badge.findMany({ where, skip, take: limit, orderBy: { name: "asc" } }),
      this.prisma.badge.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async countBadges(companyId: number, query: BadgeFilterParams) {
    const { search, categoryId, isActive } = query;
    const where: any = { companyId };
    if (categoryId) where.categoryId = categoryId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.name = { contains: search, mode: "insensitive" };
    return this.prisma.badge.count({ where });
  }

  async updateBadge(companyId: number, id: number, userId: number, data: UpdateBadgeInput) {
    return this.prisma.badge.updateMany({ where: { id, companyId }, data: { ...data } as any });
  }

  async softDeleteBadge(companyId: number, id: number, userId: number) {
    return this.prisma.badge.updateMany({ where: { id, companyId }, data: {}  });
  }

  // Badge Rules
  async createBadgeRule(companyId: number, badgeId: number, userId: number, data: CreateBadgeRuleInput) {
    return this.prisma.badgeRule.create({ data: { companyId, badgeId, ...data } as any });
  }

  async findBadgeRuleById(companyId: number, badgeId: number, ruleId: number) {
    return this.prisma.badgeRule.findFirst({ where: { id: ruleId, badgeId, companyId } });
  }

  async findBadgeRules(companyId: number, badgeId: number, query: BadgeRuleFilterParams) {
    const { isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = { badgeId, companyId };
    if (isActive !== undefined) where.isActive = isActive;
    const [data, total] = await Promise.all([
      this.prisma.badgeRule.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      this.prisma.badgeRule.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async updateBadgeRule(companyId: number, badgeId: number, ruleId: number, userId: number, data: UpdateBadgeRuleInput) {
    return this.prisma.badgeRule.updateMany({ where: { id: ruleId, badgeId, companyId }, data: { ...data } as any });
  }

  async deleteBadgeRule(companyId: number, badgeId: number, ruleId: number, userId: number) {
    return this.prisma.badgeRule.updateMany({ where: { id: ruleId, badgeId, companyId }, data: {}  });
  }
}
