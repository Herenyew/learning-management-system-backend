import { Prisma } from "@prisma/client";
import type { PrismaClient, ProgramType, ProgramCategory, TaskType } from "@prisma/client";
import type {
  CreateProgramTypeInput,
  UpdateProgramTypeInput,
  ProgramTypeQueryInput,
  CreateProgramCategoryInput,
  UpdateProgramCategoryInput,
  ProgramCategoryQueryInput,
  CreateTaskTypeInput,
  UpdateTaskTypeInput,
  TaskTypeQueryInput,
} from "./program-configuration.types.js";

import type { IProgramConfigurationRepository } from "./program-configuration.types.js";

// ==========================================
// Repository Implementation
// ==========================================

export class ProgramConfigurationRepository implements IProgramConfigurationRepository {
  constructor(private prisma: PrismaClient) {}

  // 1. ProgramType Repository Methods

  async createProgramType(companyId: number, data: CreateProgramTypeInput): Promise<ProgramType> {
    return this.prisma.programType.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async findProgramTypeById(companyId: number, id: number): Promise<ProgramType | null> {
    return this.prisma.programType.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });
  }

  async findProgramTypeByName(companyId: number, name: string): Promise<ProgramType | null> {
    return this.prisma.programType.findFirst({
      where: {
        companyId,
        name: {
          equals: name,
          mode: "insensitive",
        },
        deletedAt: null,
      },
    });
  }

  async findProgramTypes(
    companyId: number,
    query: ProgramTypeQueryInput
  ): Promise<{ items: ProgramType[]; total: number; page: number; pageSize: number }> {
    const { page, pageSize, search, isActive } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProgramTypeWhereInput = {
      companyId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.programType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.programType.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async countProgramTypes(companyId: number): Promise<number> {
    return this.prisma.programType.count({
      where: { companyId, deletedAt: null },
    });
  }

  async updateProgramType(
    companyId: number,
    id: number,
    data: UpdateProgramTypeInput
  ): Promise<ProgramType> {
    return this.prisma.programType.update({
      where: { id, companyId},
      data,
    });
  }

  async softDeleteProgramType(companyId: number, id: number): Promise<ProgramType> {
    return this.prisma.programType.update({
      where: { id, companyId},
      data: { deletedAt: new Date() },
    });
  }

  async countProgramTypeUsages(companyId: number, id: number): Promise<number> {
    return this.prisma.learningProgram.count({
      where: {
        companyId,
        programTypeId: id,
        deletedAt: null,
      },
    });
  }

  // 2. ProgramCategory Repository Methods

  async createProgramCategory(
    companyId: number,
    userId: number,
    data: CreateProgramCategoryInput
  ): Promise<ProgramCategory> {
    return this.prisma.programCategory.create({
      data: {
        ...data,
        companyId,
        createdBy: userId,
      },
    });
  }

  async findProgramCategoryById(companyId: number, id: number): Promise<ProgramCategory | null> {
    return this.prisma.programCategory.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        creator: { select: { id: true, email: true } },
        updater: { select: { id: true, email: true } },
      },
    });
  }

  async findProgramCategoryByName(companyId: number, name: string): Promise<ProgramCategory | null> {
    return this.prisma.programCategory.findFirst({
      where: {
        companyId,
        name: {
          equals: name,
          mode: "insensitive",
        },
        deletedAt: null,
      },
    });
  }

  async findProgramCategories(
    companyId: number,
    query: ProgramCategoryQueryInput
  ): Promise<{ items: ProgramCategory[]; total: number; page: number; pageSize: number }> {
    const { page, pageSize, search, isActive } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProgramCategoryWhereInput = {
      companyId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.programCategory.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.programCategory.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async countProgramCategories(companyId: number): Promise<number> {
    return this.prisma.programCategory.count({
      where: { companyId, deletedAt: null },
    });
  }

  async updateProgramCategory(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateProgramCategoryInput
  ): Promise<ProgramCategory> {
    return this.prisma.programCategory.update({
      where: { id, companyId },
      data: {
        ...data,
        updatedBy: userId,
      },
    });
  }

  async softDeleteProgramCategory(companyId: number, id: number): Promise<ProgramCategory> {
    return this.prisma.programCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async countProgramCategoryUsages(companyId: number, id: number): Promise<number> {
    const programCount = await this.prisma.learningProgram.count({
      where: { companyId, programCategoryId: id, deletedAt: null },
    });

    return programCount;
  }

  // 3. TaskType Repository Methods

  async createTaskType(
    companyId: number,
    data: CreateTaskTypeInput & { slug: string }
  ): Promise<TaskType> {
    return this.prisma.taskType.create({
      data: {
        ...data,
        companyId,
      },
    });
  }

  async findTaskTypeById(companyId: number, id: number): Promise<TaskType | null> {
    return this.prisma.taskType.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
    });
  }

  async findTaskTypeByName(companyId: number, name: string): Promise<TaskType | null> {
    return this.prisma.taskType.findFirst({
      where: {
        companyId,
        name: {
          equals: name,
          mode: "insensitive",
        },
        deletedAt: null,
      },
    });
  }

  async findTaskTypeBySlug(companyId: number, slug: string): Promise<TaskType | null> {
    return this.prisma.taskType.findFirst({
      where: {
        companyId,
        slug: {
          equals: slug,
          mode: "insensitive",
        },
        deletedAt: null,
      },
    });
  }

  async findTaskTypes(
    companyId: number,
    query: TaskTypeQueryInput
  ): Promise<{ items: TaskType[]; total: number; page: number; pageSize: number }> {
    const { page, pageSize, search, isActive, isSystem } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.TaskTypeWhereInput = {
      companyId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(isSystem !== undefined && { isSystem }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { slug: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.taskType.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.taskType.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async countTaskTypes(companyId: number): Promise<number> {
    return this.prisma.taskType.count({
      where: { companyId, deletedAt: null },
    });
  }

  async updateTaskType(
    companyId: number,
    id: number,
    data: UpdateTaskTypeInput
  ): Promise<TaskType> {
    return this.prisma.taskType.update({
      where: { id, companyId },
      data,
    });
  }

  async softDeleteTaskType(companyId: number, id: number): Promise<TaskType> {
    return this.prisma.taskType.update({
      where: { id, companyId },
      data: { deletedAt: new Date() },
    });
  }

  async countTaskTypeUsages(companyId: number, id: number): Promise<number> {
    return this.prisma.programTask.count({
      where: {
        taskTypeId: id,
        deletedAt: null,
      },
    });
  }

}
