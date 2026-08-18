import type {
  ICourseConfigurationRepository,
  CourseCategoryFilter,
  DifficultyLevelFilter,
  ContentTypeFilter,
  ContentFileTypeFilter,
  CourseTemplateFilter,
} from "./course-configuration.types.js";
import type {
  CreateCourseCategoryInput,
  UpdateCourseCategoryInput,
  CreateDifficultyLevelInput,
  UpdateDifficultyLevelInput,
  CreateContentTypeInput,
  UpdateContentTypeInput,
  CreateContentFileTypeInput,
  UpdateContentFileTypeInput,
  CreateCourseTemplateInput,
  UpdateCourseTemplateInput,
} from "./course-configuration.types.js";
import {
  NotFoundError,
  ConflictError,
  BusinessRuleError,
} from "../../../common/errors/index.js";
import { Prisma } from "@prisma/client";
import slugify from "slugify";
export class CourseConfigurationService {
  constructor(
    private readonly repository: ICourseConfigurationRepository
  ) {}

  // ==========================================
  // 1. Course Category Logic
  // ==========================================

async createCategory(dto: CreateCourseCategoryInput, companyId: number, createdBy?: number) {
  const existingName = await this.repository.findCategoryByName(companyId, dto.name);
  if (existingName) {
    throw new ConflictError(`Category with name '${dto.name}' already exists.`);
  }

  const slug = dto.slug || slugify(dto.name, { lower: true, strict: true });
  const existingSlug = await this.repository.findCategoryBySlug(companyId, slug);
  if (existingSlug) {
    throw new ConflictError(`Category with slug '${slug}' already exists.`);
  }

  if (dto.parentId) {
    const parent = await this.repository.findCategoryById(dto.parentId, companyId);
    if (!parent) {
      throw new NotFoundError("Parent category");
    }
  }

  const data: Prisma.CourseCategoryCreateInput = {
    name: dto.name,
    slug,
    description: dto.description,
    color: dto.color,
    icon: dto.icon,
    displayOrder: dto.displayOrder,
    isActive: dto.isActive,
    isVisible: dto.isVisible,
    company: { connect: { id: companyId } },
    ...(createdBy && { createdByUser: { connect: { id: createdBy } } }),
    ...(dto.parentId && { parent: { connect: { id: dto.parentId } } }),
  };

  return this.repository.createCategory(data);
}

  async getCategories(filter: CourseCategoryFilter, page: number, pageSize: number) {
    const [items, total] = await Promise.all([
      this.repository.findCategories(filter, page, pageSize),
      this.repository.countCategories(filter),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getCategoryById(id: number, companyId: number) {
    const category = await this.repository.findCategoryById(id, companyId);
    if (!category) {
      throw new NotFoundError("Course category");
    }
    return category;
  }

  async updateCategory(id: number, companyId: number, dto: UpdateCourseCategoryInput) {
    const category = await this.getCategoryById(id, companyId);
    if (dto.name && dto.name !== category.name) {
      const existing = await this.repository.findCategoryByName(companyId, dto.name);
      if (existing) {
        throw new ConflictError(`Category with name '${dto.name}' already exists.`);
      }
    }

    // Circular parent hierarchy prevention
    if (dto.parentId !== undefined && dto.parentId !== null) {
      if (dto.parentId === id) {
        throw new BusinessRuleError("A category cannot be its own parent.");
      }
      const parent = await this.repository.findCategoryById(dto.parentId, companyId);
      if (!parent) {
        throw new NotFoundError("Parent category");
      }
    }

    const data: Prisma.CourseCategoryUpdateInput = {
      ...(dto.name && { name: dto.name }),
      ...(dto.slug && { slug: dto.slug }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.isVisible !== undefined && { isVisible: dto.isVisible }),
      ...(dto.parentId === null
        ? { parent: { disconnect: true } }
        : dto.parentId
        ? { parent: { connect: { id: dto.parentId } } }
        : {}),
    };

    return this.repository.updateCategory(id, companyId, data);
  }

  async deleteCategory(id: number, companyId: number) {
    const usages = await this.repository.countCategoryUsages(id, companyId);
    
    // Check for child categories (prevents orphaned subcategories)
    const childCount = await this.repository.countCategoryChildren(id, companyId);
    if (childCount > 0) {
        throw new BusinessRuleError(
        `Cannot delete category. It has ${childCount} active child subcategory(ies). Reassign or delete them first.`
        );
    }

    // Check for relationship usage (courses, templates, question banks)
    if (usages > 0) {
      throw new BusinessRuleError(
        `Cannot delete category. It is referenced by ${usages} course(s), template(s), or question bank(s).`
      );
    }

    return this.repository.softDeleteCategory(id, companyId);
  }

  // ==========================================
  // 2. Difficulty Level Logic
  // ==========================================

  async createDifficultyLevel(dto: CreateDifficultyLevelInput, companyId: number) {
    const existing = await this.repository.findDifficultyLevelByName(companyId, dto.name);
    if (existing) {
      throw new ConflictError(`Difficulty level with name '${dto.name}' already exists.`);
    }

    const data: Prisma.DifficultyLevelCreateInput = {
      code: dto.code,
      name: dto.name,
      description: dto.description,
      color: dto.color,
      icon: dto.icon,
      displayOrder: dto.displayOrder,
      isActive: dto.isActive,
      isSystem: false,
      company: { connect: { id: companyId } },
    };

    return this.repository.createDifficultyLevel(data);
  }

  async getDifficultyLevels(filter: DifficultyLevelFilter, page: number, pageSize: number) {
    const [items, total] = await Promise.all([
      this.repository.findDifficultyLevels(filter, page, pageSize),
      this.repository.countDifficultyLevels(filter),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getDifficultyLevelById(id: number, companyId: number) {
    const difficultyLevel = await this.repository.findDifficultyLevelById(id, companyId);
    if (!difficultyLevel) {
      throw new NotFoundError("Difficulty level");
    }
    return difficultyLevel;
  }

  async updateDifficultyLevel(id: number, companyId: number, dto: UpdateDifficultyLevelInput) {
    const difficultyLevel = await this.getDifficultyLevelById(id, companyId);

    if (difficultyLevel.isSystem || difficultyLevel.companyId === null) {
      throw new BusinessRuleError("System-default difficulty levels cannot be modified by company administrators.");
    }

    if (dto.name && dto.name !== difficultyLevel.name) {
      const existing = await this.repository.findDifficultyLevelByName(companyId, dto.name);
      if (existing) {
        throw new ConflictError(`Difficulty level with name '${dto.name}' already exists.`);
      }
    }

    const data: Prisma.DifficultyLevelUpdateInput = {
      ...(dto.code && { code: dto.code }),
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.displayOrder !== undefined && { displayOrder: dto.displayOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    return this.repository.updateDifficultyLevel(id, companyId, data);
  }

  async deleteDifficultyLevel(id: number, companyId: number) {
    const difficultyLevel = await this.getDifficultyLevelById(id, companyId);

    if (difficultyLevel.isSystem || difficultyLevel.companyId === null) {
      throw new BusinessRuleError("System-default difficulty levels cannot be deleted.");
    }

    const usages = await this.repository.countDifficultyLevelUsages(id, companyId);
    if (usages > 0) {
      throw new BusinessRuleError(
        `Cannot delete difficulty level. It is referenced by ${usages} active course version(s), template(s), or blueprint(s).`
      );
    }

    return this.repository.softDeleteDifficultyLevel(id, companyId);
  }

  // ==========================================
  // 3. Content Type Logic (Global System Table)
  // ==========================================

  async createContentType(dto: CreateContentTypeInput) {
    const existing = await this.repository.findContentTypeByName(dto.name);
    if (existing) {
      throw new ConflictError(`Content type with name '${dto.name}' already exists.`);
    }

    const data: Prisma.ContentTypeCreateInput = {
      slug: dto.slug,
      name: dto.name,
      category: dto.category as any,
      description: dto.description,
      icon: dto.icon,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    };

    return this.repository.createContentType(data);
  }

  async getContentTypes(filter: ContentTypeFilter, page: number, pageSize: number) {
    const [items, total] = await Promise.all([
      this.repository.findContentTypes(filter, page, pageSize),
      this.repository.countContentTypes(filter),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getContentTypeById(id: number) {
    const contentType = await this.repository.findContentTypeById(id);
    if (!contentType) {
      throw new NotFoundError("Content type");
    }
    return contentType;
  }

  async updateContentType(id: number, dto: UpdateContentTypeInput) {
    const contentType = await this.getContentTypeById(id);

    if (dto.name && dto.name !== contentType.name) {
      const existing = await this.repository.findContentTypeByName(dto.name);
      if (existing) {
        throw new ConflictError(`Content type with name '${dto.name}' already exists.`);
      }
    }

    const data: Prisma.ContentTypeUpdateInput = {
      ...(dto.slug && { slug: dto.slug }),
      ...(dto.name && { name: dto.name }),
      ...(dto.category && { category: dto.category as any }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.icon !== undefined && { icon: dto.icon }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    return this.repository.updateContentType(id, data);
  }

  async deleteContentType(id: number) {
    await this.getContentTypeById(id);

    const usages = await this.repository.countContentTypeUsages(id);
    if (usages > 0) {
      throw new BusinessRuleError(
        `Cannot delete content type. It is referenced by ${usages} course content item(s).`
      );
    }

    return this.repository.softDeleteContentType(id);
  }

  // ==========================================
  // 4. Content File Type Logic (Global System Table)
  // ==========================================

  async createContentFileType(dto: CreateContentFileTypeInput) {
    const existing = await this.repository.findContentFileTypeByName(dto.name);
    if (existing) {
      throw new ConflictError(`Content file type with name '${dto.name}' already exists.`);
    }

    const data: Prisma.ContentFileTypeCreateInput = {
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      icon: dto.icon,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    };

    return this.repository.createContentFileType(data);
  }

  async getContentFileTypes(filter: ContentFileTypeFilter, page: number, pageSize: number) {
    const [items, total] = await Promise.all([
      this.repository.findContentFileTypes(filter, page, pageSize),
      this.repository.countContentFileTypes(filter),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getContentFileTypeById(id: number) {
    const fileType = await this.repository.findContentFileTypeById(id);
    if (!fileType) {
      throw new NotFoundError("Content file type");
    }
    return fileType;
  }

  async updateContentFileType(id: number, dto: UpdateContentFileTypeInput) {
    const fileType = await this.getContentFileTypeById(id);

    if (dto.name && dto.name !== fileType.name) {
      const existing = await this.repository.findContentFileTypeByName(dto.name);
      if (existing) {
        throw new ConflictError(`Content file type with name '${dto.name}' already exists.`);
      }
    }

    const data: Prisma.ContentFileTypeUpdateInput = {
      ...(dto.name && { name: dto.name }),
      ...(dto.slug && { slug: dto.slug }),
      ...(dto.description && { description: dto.description }),
      ...(dto.icon && { icon: dto.icon }),
      ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    return this.repository.updateContentFileType(id, data);
  }

  async deleteContentFileType(id: number) {
    await this.getContentFileTypeById(id);

    const usages = await this.repository.countContentFileTypeUsages(id);
    if (usages > 0) {
      throw new BusinessRuleError(
        `Cannot delete content file type. It is referenced by ${usages} stored file(s).`
      );
    }

    return this.repository.softDeleteContentFileType(id);
  }

  // ==========================================
  // 5. Course Template Logic
  // ==========================================

  async createTemplate(dto: CreateCourseTemplateInput, companyId: number, createdById: number) {
    const existing = await this.repository.findTemplateByName(companyId, dto.name);
    if (existing) {
      throw new ConflictError(`Course template with name '${dto.name}' already exists.`);
    }

    // Validate relations exist
    await this.getCategoryById(dto.categoryId, companyId);
    await this.getDifficultyLevelById(dto.difficultyLevelId, companyId);

    const data: Prisma.CourseTemplateCreateInput = {
      name: dto.name,
      description: dto.description,
      shortSummary: dto.shortSummary,
      passingScore: dto.passingScore ?? 0,
      completionThreshold: dto.completionThreshold ?? 0,
      isActive: dto.isActive,
      company: { connect: { id: companyId } },
      creator: { connect: { id: createdById } },
      category: { connect: { id: dto.categoryId } },
      difficultyLevel: { connect: { id: dto.difficultyLevelId } },
      ...(dto.targetAudienceIds && dto.targetAudienceIds.length > 0 && {
        targetAudiences: {
          create: dto.targetAudienceIds.map((audienceGroupId) => ({
            audienceGroup: { connect: { id: audienceGroupId } },
          })),
        },
      }),
    };

    return this.repository.createTemplate(data);
  }

  async getTemplates(filter: CourseTemplateFilter, page: number, pageSize: number) {
    const [items, total] = await Promise.all([
      this.repository.findTemplates(filter, page, pageSize),
      this.repository.countTemplates(filter),
    ]);

    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  }

  async getTemplateById(id: number, companyId: number) {
    const template = await this.repository.findTemplateById(id, companyId);
    if (!template) {
      throw new NotFoundError("Course template");
    }
    return template;
  }

  async updateTemplate(id: number, companyId: number, dto: UpdateCourseTemplateInput) {
    const template = await this.getTemplateById(id, companyId);

    if (dto.name && dto.name !== template.name) {
      const existing = await this.repository.findTemplateByName(companyId, dto.name);
      if (existing) {
        throw new ConflictError(`Course template with name '${dto.name}' already exists.`);
      }
    }

    if (dto.categoryId) {
      await this.getCategoryById(dto.categoryId, companyId);
    }

    if (dto.difficultyLevelId) {
      await this.getDifficultyLevelById(dto.difficultyLevelId, companyId);
    }

    const data: Prisma.CourseTemplateUpdateInput = {
      ...(dto.name && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.shortSummary !== undefined && { shortSummary: dto.shortSummary }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      ...(dto.categoryId && { category: { connect: { id: dto.categoryId } } }),
      ...(dto.difficultyLevelId && { difficultyLevel: { connect: { id: dto.difficultyLevelId } } }),
      ...(dto.targetAudienceIds && {
        targetAudiences: {
          deleteMany: {},
          create: dto.targetAudienceIds.map((audienceGroupId) => ({
            audienceGroup: { connect: { id: audienceGroupId } },
          })),
        },
      }),
    };

    return this.repository.updateTemplate(id, companyId, data);
  }

  async deleteTemplate(id: number, companyId: number) {
    await this.getTemplateById(id, companyId);

    const usages = await this.repository.countTemplateUsages(id, companyId);
    if (usages > 0) {
      throw new BusinessRuleError(
        `Cannot delete template. It is referenced by ${usages} course(s).`
      );
    }

    return this.repository.softDeleteTemplate(id, companyId);
  }
}
