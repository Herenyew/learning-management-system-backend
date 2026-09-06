import {
  NotFoundError,
  ConflictError,
  ValidationError,
} from "../../../common/errors/http-errors.js"; 
import type { IProgramConfigurationRepository } from "./program-configuration.types.js";
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

// Utility helper for slug generation
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class ProgramConfigurationService {
  constructor(private repo: IProgramConfigurationRepository) {}

  // ==========================================
  // 1. ProgramType Service Methods
  // ==========================================

  async createProgramType(companyId: number, data: CreateProgramTypeInput) {
    const existing = await this.repo.findProgramTypeByName(companyId, data.name);
    if (existing) {
      throw new ConflictError(`Program type with name '${data.name}' already exists.`);
    }

    return this.repo.createProgramType(companyId, data);
  }

  async getProgramTypeById(companyId: number, id: number) {
    const type = await this.repo.findProgramTypeById(companyId, id);
    if (!type) {
      throw new NotFoundError(`Program type with ID ${id} not found.`);
    }
    return type;
  }

  async listProgramTypes(companyId: number, query: ProgramTypeQueryInput) {
    return this.repo.findProgramTypes(companyId, query);
  }

  async updateProgramType(
    companyId: number,
    id: number,
    data: UpdateProgramTypeInput
  ) {
    await this.getProgramTypeById(companyId, id);

    if (data.name) {
      const existing = await this.repo.findProgramTypeByName(companyId, data.name);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Program type with name '${data.name}' already exists.`);
      }
    }

    return this.repo.updateProgramType(companyId, id, data);
  }

  async deleteProgramType(companyId: number, id: number) {
    await this.getProgramTypeById(companyId, id);

    const usageCount = await this.repo.countProgramTypeUsages(companyId, id);
    if (usageCount > 0) {
      throw new ValidationError(
        `Cannot delete program type. It is currently referenced by ${usageCount} program(s).`
      );
    }

    return this.repo.softDeleteProgramType(companyId, id);
  }

  // ==========================================
  // 2. ProgramCategory Service Methods
  // ==========================================

  async createProgramCategory(
    companyId: number,
    userId: number,
    data: CreateProgramCategoryInput
  ) {
    const existing = await this.repo.findProgramCategoryByName(companyId, data.name);
    if (existing) {
      throw new ConflictError(`Program category with name '${data.name}' already exists.`);
    }

    return this.repo.createProgramCategory(companyId, userId, data);
  }

  async getProgramCategoryById(companyId: number, id: number) {
    const category = await this.repo.findProgramCategoryById(companyId, id);
    if (!category) {
      throw new NotFoundError(`Program category with ID ${id} not found.`);
    }
    return category;
  }

  async listProgramCategories(companyId: number, query: ProgramCategoryQueryInput) {
    return this.repo.findProgramCategories(companyId, query);
  }

  async updateProgramCategory(
    companyId: number,
    id: number,
    userId: number,
    data: UpdateProgramCategoryInput
  ) {
    await this.getProgramCategoryById(companyId, id);

    if (data.name) {
      const existing = await this.repo.findProgramCategoryByName(companyId, data.name);
      if (existing && existing.id !== id) {
        throw new ConflictError(`Program category with name '${data.name}' already exists.`);
      }
    }

    return this.repo.updateProgramCategory(companyId, id, userId, data);
  }

  async deleteProgramCategory(companyId: number, id: number) {
    await this.getProgramCategoryById(companyId, id);

    const usageCount = await this.repo.countProgramCategoryUsages(companyId, id);
    if (usageCount > 0) {
      throw new ValidationError(
        `Cannot delete category. It is referenced by ${usageCount} program(s) or template(s).`
      );
    }

    return this.repo.softDeleteProgramCategory(companyId, id);
  }

  // ==========================================
  // 3. TaskType Service Methods
  // ==========================================

  async createTaskType(companyId: number, data: CreateTaskTypeInput) {
    const existingName = await this.repo.findTaskTypeByName(companyId, data.name);
    if (existingName) {
      throw new ConflictError(`Task type with name '${data.name}' already exists.`);
    }

    const generatedSlug = data.slug ? slugify(data.slug) : slugify(data.name);

    const existingSlug = await this.repo.findTaskTypeBySlug(companyId, generatedSlug);
    if (existingSlug) {
      throw new ConflictError(`Task type with slug '${generatedSlug}' already exists.`);
    }

    return this.repo.createTaskType(companyId, {
      ...data,
      slug: generatedSlug,
    });
  }

  async getTaskTypeById(companyId: number, id: number) {
    const taskType = await this.repo.findTaskTypeById(companyId, id);
    if (!taskType) {
      throw new NotFoundError(`Task type with ID ${id} not found.`);
    }
    return taskType;
  }

  async listTaskTypes(companyId: number, query: TaskTypeQueryInput) {
    return this.repo.findTaskTypes(companyId, query);
  }

  async updateTaskType(
    companyId: number,
    id: number,
    data: UpdateTaskTypeInput
  ) {
    const existingTaskType = await this.getTaskTypeById(companyId, id);

    if (existingTaskType.isSystem) {
      throw new ValidationError("System-defined task types cannot be modified.");
    }

    if (data.name) {
      const existingName = await this.repo.findTaskTypeByName(companyId, data.name);
      if (existingName && existingName.id !== id) {
        throw new ConflictError(`Task type with name '${data.name}' already exists.`);
      }
    }

    if (data.slug) {
      const newSlug = slugify(data.slug);
      const existingSlug = await this.repo.findTaskTypeBySlug(companyId, newSlug);
      if (existingSlug && existingSlug.id !== id) {
        throw new ConflictError(`Task type with slug '${newSlug}' already exists.`);
      }
      data.slug = newSlug;
    }

    return this.repo.updateTaskType(companyId, id, data);
  }

  async deleteTaskType(companyId: number, id: number) {
    const taskType = await this.getTaskTypeById(companyId, id);

    if (taskType.isSystem) {
      throw new ValidationError("System-defined task types cannot be deleted.");
    }

    const usageCount = await this.repo.countTaskTypeUsages(companyId, id);
    if (usageCount > 0) {
      throw new ValidationError(
        `Cannot delete task type. It is referenced by ${usageCount} task(s).`
      );
    }

    return this.repo.softDeleteTaskType(companyId, id);
  }

}
