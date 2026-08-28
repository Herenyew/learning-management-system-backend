import type { CreateLearningLevelInput, UpdateLearningLevelInput, LearningLevelFilterInput } from "./learning-levels.types.js";
import type { ILearningLevelsRepository } from "./learning-levels.types.js";
import { ConflictError, NotFoundError, ValidationError } from "../../../../common/errors/http-errors.js";

function throwIfUniqueViolation(err: unknown, message: string): void {
  if (
    typeof err === "object" &&
    err !== null &&
    (err as { code?: string }).code === "P2002"
  ) {
    throw new ConflictError(message);
  }
}

export class LearningLevelsService {
  constructor(private repo: ILearningLevelsRepository, private prisma: any) {}

  async createLearningLevel(companyId: number, userId: number, data: CreateLearningLevelInput) {
    const existing = await this.repo.findLearningLevels(companyId, { search: data.name, page: 1, limit: 1 } as any);
    if (existing.data.some((l) => l.name.toLowerCase() === data.name.toLowerCase())) throw new ConflictError("Learning level with this name already exists.");

    try {
      return await this.repo.createLearningLevel(companyId, userId, data);
    } catch (err) {
      throwIfUniqueViolation(err, "A learning level with this XP threshold or display order already exists.");
      throw err;
    }
  }

  async listLearningLevels(companyId: number, query: LearningLevelFilterInput) {
    return this.repo.findLearningLevels(companyId, query);
  }

  async getLearningLevelById(companyId: number, id: number) {
    const item = await this.repo.findLearningLevelById(companyId, id);
    if (!item) throw new NotFoundError(`Learning level with ID ${id} not found.`);
    return item;
  }

  async updateLearningLevel(companyId: number, id: number, userId: number, data: UpdateLearningLevelInput) {
    const existing = await this.getLearningLevelById(companyId, id);
    if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
      const duplicates = await this.repo.findLearningLevels(companyId, { search: data.name, page: 1, limit: 1 } as any);
      if (duplicates.data.some((l) => l.id !== id && l.name.toLowerCase() === data.name!.toLowerCase())) {
        throw new ConflictError("Learning level with this name already exists.");
      }
    }
    try {
      return await this.repo.updateLearningLevel(companyId, id, userId, data);
    } catch (err) {
      throwIfUniqueViolation(err, "A learning level with this XP threshold or display order already exists.");
      throw err;
    }
  }

  async deleteLearningLevel(companyId: number, id: number, userId: number) {
    const usages = await this.repo.findLearningLevelUsages(companyId, id);
    if (usages.length > 0) throw new ValidationError("Cannot delete learning level while it is assigned to users.");
    return this.repo.softDeleteLearningLevel(companyId, id, userId);
  }
}
