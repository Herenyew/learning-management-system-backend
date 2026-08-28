import type { PrismaClient } from "@prisma/client";
import { Prisma } from "@prisma/client";
import type { CreateXpRuleInput, XpRuleFilterParams, UpdateXpRuleInput, XpRuleLookups } from "./xp-rules.types.js";
import type { IXpRulesRepository } from "./xp-rules.types.js";

const toJson = (value: unknown): Prisma.InputJsonValue | typeof Prisma.DbNull =>
  value ? (value as Prisma.InputJsonValue) : Prisma.DbNull;

export class XpRulesRepository implements IXpRulesRepository {
  constructor(private prisma: PrismaClient) {}

  async createXpRule(companyId: number, userId: number, data: CreateXpRuleInput) {
    return this.prisma.xpRule.create({
      data: {
        companyId,
        createdBy: userId,
        name: data.name,
        categoryId: data.categoryId,
        triggerEventId: data.triggerEventId,
        xpAmount: data.xpAmount,
        isActive: data.isActive,
        maximumAward: data.maximumAward ?? null,
        multiplier: data.multiplier ?? null,
        targetAudienceId: data.targetAudienceId ?? null,
        courseVersionId: data.courseVersionId ?? null,
        programId: data.programId ?? null,
        conditionExpression: toJson(data.conditionExpression),
      },
    });
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
    await this.prisma.xpRule.updateMany({
      where: { id, companyId },
      data: {
        updatedBy: userId,
        ...(data.name !== undefined && { name: data.name }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.triggerEventId !== undefined && { triggerEventId: data.triggerEventId }),
        ...(data.xpAmount !== undefined && { xpAmount: data.xpAmount }),
        ...(data.maximumAward !== undefined && { maximumAward: data.maximumAward }),
        ...(data.multiplier !== undefined && { multiplier: data.multiplier }),
        ...(data.targetAudienceId !== undefined && { targetAudienceId: data.targetAudienceId }),
        ...(data.courseVersionId !== undefined && { courseVersionId: data.courseVersionId }),
        ...(data.programId !== undefined && { programId: data.programId }),
        ...(data.conditionExpression !== undefined && {
          conditionExpression: toJson(data.conditionExpression),
        }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
    });
    const updated = await this.findXpRuleById(companyId, id);
    if (!updated) throw Object.assign(new Error("XP rule not found after update."), { statusCode: 404 });
    return updated;
  }

  async softDeleteXpRule(companyId: number, id: number, userId: number) {
    // XpRule has no deletedAt column in the schema — perform a real delete.
    // Company scoping was already verified by the service before calling this.
    return this.prisma.xpRule.delete({ where: { id } });
  }

  async findXpRuleUsages(companyId: number, id: number) {
    const count = await this.prisma.xpTransaction.count({ where: { ruleId: id } });
    return count > 0 ? [{ count }] : [];
  }

  async findRuleLookups(companyId: number): Promise<XpRuleLookups> {
    const [categories, triggerEvents] = await Promise.all([
      this.prisma.xpRuleCategory.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
      this.prisma.xpTriggerEvent.findMany({
        where: { companyId, isActive: true },
        select: { id: true, name: true, slug: true },
        orderBy: { name: "asc" },
      }),
    ]);
    return { categories, triggerEvents };
  }
}
