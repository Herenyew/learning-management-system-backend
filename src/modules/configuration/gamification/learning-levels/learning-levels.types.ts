import { z } from "zod";
import { createLearningLevelSchema, updateLearningLevelSchema, learningLevelFilterSchema } from "./learning-levels.dto.js";
import { Prisma } from "@prisma/client";

export type CreateLearningLevelInput = z.infer<typeof createLearningLevelSchema>;
export type UpdateLearningLevelInput = z.infer<typeof updateLearningLevelSchema>;
export type LearningLevelFilterInput = z.infer<typeof learningLevelFilterSchema>;

export interface LearningLevelFilterParams {
  search?: string;
  isActive?: boolean;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export type LearningLevel = Prisma.LearningLevelGetPayload<{}>;

export type PaginatedLearningLevelResult = {
  data: LearningLevel[];
  meta: { total: number; page: number; limit: number; totalPages: number };
};

export interface ILearningLevelsRepository {
  createLearningLevel(companyId: number, userId: number, data: CreateLearningLevelInput): Promise<LearningLevel>;
  findLearningLevelById(companyId: number, id: number): Promise<LearningLevel | null>;
  findLearningLevels(companyId: number, query: LearningLevelFilterParams): Promise<PaginatedLearningLevelResult>;
  countLearningLevels(companyId: number, query: LearningLevelFilterParams): Promise<number>;
  updateLearningLevel(companyId: number, id: number, userId: number, data: UpdateLearningLevelInput): Promise<LearningLevel>;
  softDeleteLearningLevel(companyId: number, id: number, userId: number): Promise<LearningLevel>;
  findLearningLevelUsages(companyId: number, id: number): Promise<any[]>;
}
