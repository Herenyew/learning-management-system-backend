import { PrismaClient, Prisma, ProgramType, ProgramCategory, TaskType, ProgramTemplate } from "@prisma/client";
import {
  CreateProgramTypeInput,
  UpdateProgramTypeInput,
  ProgramTypeQueryInput,
  CreateProgramCategoryInput,
  UpdateProgramCategoryInput,
  ProgramCategoryQueryInput,
  CreateTaskTypeInput,
  UpdateTaskTypeInput,
  TaskTypeQueryInput,
  CreateProgramTemplateInput,
  UpdateProgramTemplateInput,
  ProgramTemplateQueryInput,
} from "./program-configuration.dto.js";

// ==========================================
// Repository Interface
// ==========================================

export interface IProgramConfigurationRepository {
  // ProgramType
  createProgramType(companyId: number, data: CreateProgramTypeInput): Promise<ProgramType>;
  findProgramTypeById(companyId: number, id: number): Promise<ProgramType | null>;
  findProgramTypeByName(companyId: number, name: string): Promise<ProgramType | null>;
  findProgramTypes(
    companyId: number,
    query: ProgramTypeQueryInput
  ): Promise<{ items: ProgramType[]; total: number; page: number; pageSize: number }>;
  countProgramTypes(companyId: number): Promise<number>;
  updateProgramType(companyId: number, id: number, data: UpdateProgramTypeInput): Promise<ProgramType>;
  softDeleteProgramType(companyId: number, id: number): Promise<ProgramType>;
  countProgramTypeUsages(companyId: number, id: number): Promise<number>;

  // ProgramCategory
  createProgramCategory(companyId: number, userId: number, data: CreateProgramCategoryInput): Promise<ProgramCategory>;
  findProgramCategoryById(companyId: number, id: number): Promise<ProgramCategory | null>;
  findProgramCategoryByName(companyId: number, name: string): Promise<ProgramCategory | null>;
  findProgramCategories(
    companyId: number,
    query: ProgramCategoryQueryInput
  ): Promise<{ items: ProgramCategory[]; total: number; page: number; pageSize: number }>;
  countProgramCategories(companyId: number): Promise<number>;
  updateProgramCategory(companyId: number, id: number, userId: number, data: UpdateProgramCategoryInput): Promise<ProgramCategory>;
  softDeleteProgramCategory(companyId: number, id: number): Promise<ProgramCategory>;
  countProgramCategoryUsages(companyId: number, id: number): Promise<number>;

  // TaskType
  createTaskType(companyId: number, data: CreateTaskTypeInput & { slug: string }): Promise<TaskType>;
  findTaskTypeById(companyId: number, id: number): Promise<TaskType | null>;
  findTaskTypeByName(companyId: number, name: string): Promise<TaskType | null>;
  findTaskTypeBySlug(companyId: number, slug: string): Promise<TaskType | null>;
  findTaskTypes(
    companyId: number,
    query: TaskTypeQueryInput
  ): Promise<{ items: TaskType[]; total: number; page: number; pageSize: number }>;
  countTaskTypes(companyId: number): Promise<number>;
  updateTaskType(companyId: number, id: number, data: UpdateTaskTypeInput): Promise<TaskType>;
  softDeleteTaskType(companyId: number, id: number): Promise<TaskType>;
  countTaskTypeUsages(companyId: number, id: number): Promise<number>;

  // ProgramTemplate
  createTemplate(companyId: number, userId: number, data: CreateProgramTemplateInput): Promise<ProgramTemplate>;
  findTemplateById(companyId: number, id: number): Promise<ProgramTemplate | null>;
  findTemplateByName(companyId: number, name: string): Promise<ProgramTemplate | null>;
  findTemplates(
    companyId: number,
    query: ProgramTemplateQueryInput
  ): Promise<{ items: ProgramTemplate[]; total: number; page: number; pageSize: number }>;
  countTemplates(companyId: number): Promise<number>;
  updateTemplate(companyId: number, id: number, userId: number, data: UpdateProgramTemplateInput): Promise<ProgramTemplate>;
  softDeleteTemplate(companyId: number, id: number): Promise<ProgramTemplate>;
  countTemplateUsages(companyId: number, id: number): Promise<number>;
}

// ==========================================
// Repository Implementation
// ==========================================

export class ProgramConfigurationRepository implements IProgramConfigurationRepository {
  constructor(private prisma: PrismaClient) {}

  // ==========================================
  // 1. ProgramType Repository Methods
  // ==========================================

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

  // ==========================================
  // 2. ProgramCategory Repository Methods
  // ==========================================

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
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        updater: { select: { id: true, firstName: true, lastName: true, email: true } },
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
    const [programCount, templateCount] = await Promise.all([
      this.prisma.learningProgram.count({
        where: { companyId, categoryId: id, deletedAt: null },
      }),
      this.prisma.programTemplate.count({
        where: { companyId, categoryId: id, deletedAt: null },
      }),
    ]);

    return programCount + templateCount;
  }

  // ==========================================
  // 3. TaskType Repository Methods
  // ==========================================

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
      where: { id },
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

  // ==========================================
  // 4. ProgramTemplate Repository Methods
  // ==========================================

  async createTemplate(
    companyId: number,
    userId: number,
    data: CreateProgramTemplateInput
  ): Promise<ProgramTemplate> {
    const { defaultMilestones, ...rest } = data;

    return this.prisma.programTemplate.create({
      data: {
        ...rest,
        defaultMilestones: defaultMilestones
          ? (defaultMilestones as unknown as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        companyId,
        createdBy: userId,
      },
    });
  }

  async findTemplateById(companyId: number, id: number): Promise<ProgramTemplate | null> {
    return this.prisma.programTemplate.findFirst({
      where: {
        id,
        companyId,
        deletedAt: null,
      },
      include: {
        category: { select: { id: true, name: true } },
        creator: { select: { id: true, firstName: true, lastName: true, email: true } },
        updater: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
  }

  async findTemplateByName(companyId: number, name: string): Promise<ProgramTemplate | null> {
    return this.prisma.programTemplate.findFirst({
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

  async findTemplates(
    companyId: number,
    query: ProgramTemplateQueryInput
  ): Promise<{ items: ProgramTemplate[]; total: number; page: number; pageSize: number }> {
    const { page, pageSize, search, categoryId, programTypeId, isActive } = query;
    const skip = (page - 1) * pageSize;

    const where: Prisma.ProgramTemplateWhereInput = {
      companyId,
      deletedAt: null,
      ...(isActive !== undefined && { isActive }),
      ...(categoryId && { categoryId }),
      ...(programTypeId && { programTypeId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [items, total] = await Promise.all([
      this.prisma.programTemplate.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          category: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.programTemplate.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async countTemplates(companyId: number): Promise<number> {
    return this.prisma.programTemplate.count({
      where: { companyId, deletedAt: null },
    });
  }

  async updateTemplate(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateProgramTemplateInput
  ): Promise<ProgramTemplate> {
    const { defaultMilestones, ...rest } = data;

    return this.prisma.programTemplate.update({
      where: { id, companyId },
      data: {
        ...rest,
        ...(defaultMilestones !== undefined && {
          defaultMilestones: defaultMilestones
            ? (defaultMilestones as unknown as Prisma.InputJsonValue)
            : Prisma.JsonNull,
        }),
        updatedBy: userId,
      },
    });
  }

  async softDeleteTemplate(companyId: number, id: number): Promise<ProgramTemplate> {
    return this.prisma.programTemplate.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async countTemplateUsages(companyId: number, id: number): Promise<number> {
    return this.prisma.learningProgram.count({
      where: {
        companyId,
        templateId: id,
        deletedAt: null,
      },
    });
  }
}