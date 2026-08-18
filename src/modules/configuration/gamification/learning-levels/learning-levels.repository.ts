import type { PrismaClient } from "@prisma/client";
import type { CreateLearningLevelInput, LearningLevelFilterParams, UpdateLearningLevelInput } from "./learning-levels.types.js";
import type { ILearningLevelsRepository } from "./learning-levels.types.js";

export class LearningLevelsRepository implements ILearningLevelsRepository {
  constructor(private prisma: PrismaClient) {}

  async createLearningLevel(companyId: number, userId: number, data: CreateLearningLevelInput) {
    return this.prisma.learningLevel.create({ data: { companyId, createdBy: userId, ...data } as any });
  }

  async findLearningLevelById(companyId: number, id: number) {
    return this.prisma.learningLevel.findFirst({ where: { id, companyId, deletedAt: null } });
  }

  async findLearningLevels(companyId: number, query: LearningLevelFilterParams) {
    const { search, isActive, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const where: any = { companyId, deletedAt: null };
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.name = { contains: search, mode: "insensitive" };
    const [data, total] = await Promise.all([
      this.prisma.learningLevel.findMany({ where, skip, take: limit, orderBy: { maximumXp: "asc" } }),
      this.prisma.learningLevel.count({ where }),
    ]);
    return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async countLearningLevels(companyId: number, query: LearningLevelFilterParams) {
    const { search, isActive } = query;
    const where: any = { companyId, deletedAt: null };
    if (isActive !== undefined) where.isActive = isActive;
    if (search) where.name = { contains: search, mode: "insensitive" };
    return this.prisma.learningLevel.count({ where });
  }

  async updateLearningLevel(companyId: number, id: number, userId: number, data: UpdateLearningLevelInput) {
    return this.prisma.learningLevel.update({ where: { id }, data: { ...data } as any });
  }

  async softDeleteLearningLevel(companyId: number, id: number, userId: number) {
    return this.prisma.learningLevel.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async findLearningLevelUsages(companyId: number, id: number) {
    return [];
  }
}
