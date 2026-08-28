import type { PrismaClient } from "@prisma/client";
import type { CreateLearningLevelInput, LearningLevelFilterParams, UpdateLearningLevelInput } from "./learning-levels.types.js";
import type { ILearningLevelsRepository } from "./learning-levels.types.js";

export class LearningLevelsRepository implements ILearningLevelsRepository {
  constructor(private prisma: PrismaClient) {}

  async createLearningLevel(companyId: number, _userId: number, data: CreateLearningLevelInput) {
    // displayOrder is NOT NULL + unique per company — default to last position
    let { displayOrder } = data;
    if (displayOrder === undefined) {
      const last = await this.prisma.learningLevel.findFirst({
        where: { companyId, deletedAt: null },
        orderBy: { displayOrder: "desc" },
        select: { displayOrder: true },
      });
      displayOrder = (last?.displayOrder ?? 0) + 1;
    }
    return this.prisma.learningLevel.create({
      data: {
        companyId,
        name: data.name,
        minimumXp: data.minimumXp,
        maximumXp: data.maximumXp ?? null,
        badgeColor: data.badgeColor ?? null,
        displayOrder,
      },
    });
  }

  async findLearningLevelById(companyId: number, id: number) {
    return this.prisma.learningLevel.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  async findLearningLevels(companyId: number, query: LearningLevelFilterParams) {
    const { search, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = { companyId, deletedAt: null };
    if (search) where.name = { contains: search, mode: "insensitive" };
    const [data, total] = await Promise.all([
      this.prisma.learningLevel.findMany({ where, skip, take: limit, orderBy: { displayOrder: "asc" } }),
      this.prisma.learningLevel.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async countLearningLevels(companyId: number, query: LearningLevelFilterParams) {
    const { search } = query;
    const where: any = { companyId, deletedAt: null };
    if (search) where.name = { contains: search, mode: "insensitive" };
    return this.prisma.learningLevel.count({ where });
  }

  async updateLearningLevel(companyId: number, id: number, _userId: number, data: UpdateLearningLevelInput) {
    // Tenant isolation: scope every write to the caller's company
    return this.prisma.learningLevel.update({
      where: { id, companyId },
      data: { ...data } as any,
    });
  }

  async softDeleteLearningLevel(companyId: number, id: number, _userId: number) {
    return this.prisma.learningLevel.update({
      where: { id, companyId },
      data: { deletedAt: new Date() },
    });
  }

  async findLearningLevelUsages(companyId: number, id: number) {
    return [];
  }
}
