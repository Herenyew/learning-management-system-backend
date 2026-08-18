import type { PrismaClient, Prisma } from "@prisma/client";
import type { CreateXpRuleInput, XpRuleFilterParams, UpdateXpRuleInput } from "./xp-rules.types.js";
import type { IXpRulesRepository } from "./xp-rules.types.js";

export class XpRulesRepository implements IXpRulesRepository {
  constructor(private prisma: PrismaClient) {}

  async createXpRule(companyId: number, userId: number, data: CreateXpRuleInput) {
    return this.prisma.xpRule.create({ data: { companyId, createdBy: userId, ...data } as any });
  }

  async findXpRuleById(companyId: number, id: number) {
    return this.prisma.xpRule.findFirst({ where: { id, companyId } });
  }

  async findXpRuleByName(companyId: number, name: string) {
    return this.prisma.xpRule.findFirst({ where: { companyId, name: { equals: name, mode: "insensitive" } } });
  }

  async findXpRules(companyId: number, query: XpRuleFilterParams) {
    const { search, categoryId, triggerEventId, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = { companyId };
    if (categoryId) where.categoryId = categoryId;
    if (triggerEventId) where.triggerEventId = triggerEventId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.name = { contains: search, mode: "insensitive" };

    const [data, total] = await Promise.all([
      this.prisma.xpRule.findMany({ where, skip, take: limit, orderBy: { createdAt: "desc" } }),
      this.prisma.xpRule.count({ where }),
    ]);

    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async countXpRules(companyId: number, query: XpRuleFilterParams) {
    const { search, categoryId, triggerEventId, isActive } = query;
    const where: any = { companyId };
    if (categoryId) where.categoryId = categoryId;
    if (triggerEventId) where.triggerEventId = triggerEventId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.name = { contains: search, mode: "insensitive" };
    return this.prisma.xpRule.count({ where });
  }

  async updateXpRule(companyId: number, id: number, userId: number, data: UpdateXpRuleInput) {
    return this.prisma.xpRule.update({ where: { id }, data: { ...data, updatedBy: userId } as any });
  }

  async softDeleteXpRule(companyId: number, id: number, userId: number) {
    return this.prisma.xpRule.update({ where: { id }, data: {}  });
  }

  async findXpRuleUsages(companyId: number, id: number) {
    return [];
  }
}
