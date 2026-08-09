import {
  PrismaClient,
  Prisma,
  CourseCategory,
  DifficultyLevel,
  ContentType,
  ContentFileType,
  CourseTemplate,
} from "@prisma/client";

// ==========================================
// Filter Interfaces
// ==========================================

export interface CourseCategoryFilter {
  companyId: number;
  search?: string;
  isActive?: boolean;
  parentId?: number | null;
}

export interface DifficultyLevelFilter {
  companyId: number; // Used to fetch system defaults (companyId: null) + company-specific records
  search?: string;
  isActive?: boolean;
}

export interface ContentTypeFilter {
  search?: string;
  isActive?: boolean;
}

export interface ContentFileTypeFilter {
  search?: string;
  isActive?: boolean;
}

export interface CourseTemplateFilter {
  companyId: number;
  search?: string;
  isActive?: boolean;
  categoryId?: number;
  difficultyLevelId?: number;
}

// ==========================================
// Repository Interface
// ==========================================

export interface ICourseConfigurationRepository {
  // --- 1. Course Category (Tenant Scoped) ---
  countCategoryChildren(id: number, companyId: number): Promise<number>;
  createCategory(data: Prisma.CourseCategoryCreateInput): Promise<CourseCategory>;
  findCategoryById(id: number, companyId: number): Promise<CourseCategory | null>;
  findCategoryByName(companyId: number, name: string): Promise<CourseCategory | null>;
  findCategoryBySlug(companyId: number, slug: string): Promise<CourseCategory | null>;
  findCategories(filter: CourseCategoryFilter, page: number, pageSize: number): Promise<CourseCategory[]>;
  countCategories(filter: CourseCategoryFilter): Promise<number>;
  updateCategory(id: number, companyId: number, data: Prisma.CourseCategoryUpdateInput): Promise<CourseCategory>;
  softDeleteCategory(id: number, companyId: number): Promise<CourseCategory>;
  countCategoryUsages(id: number, companyId: number): Promise<number>;

  // --- 2. Difficulty Level (System & Tenant Dual Scoped) ---
  createDifficultyLevel(data: Prisma.DifficultyLevelCreateInput): Promise<DifficultyLevel>;
  findDifficultyLevelById(id: number, companyId: number): Promise<DifficultyLevel | null>;
  findDifficultyLevelByName(companyId: number, name: string): Promise<DifficultyLevel | null>;
  findDifficultyLevels(filter: DifficultyLevelFilter, page: number, pageSize: number): Promise<DifficultyLevel[]>;
  countDifficultyLevels(filter: DifficultyLevelFilter): Promise<number>;
  updateDifficultyLevel(id: number, companyId: number, data: Prisma.DifficultyLevelUpdateInput): Promise<DifficultyLevel>;
  softDeleteDifficultyLevel(id: number, companyId: number): Promise<DifficultyLevel>;
  countDifficultyLevelUsages(id: number, companyId: number): Promise<number>;

  // --- 3. Content Type (Global) ---
  createContentType(data: Prisma.ContentTypeCreateInput): Promise<ContentType>;
  findContentTypeById(id: number): Promise<ContentType | null>;
  findContentTypeByName(name: string): Promise<ContentType | null>;
  findContentTypes(filter: ContentTypeFilter, page: number, pageSize: number): Promise<ContentType[]>;
  countContentTypes(filter: ContentTypeFilter): Promise<number>;
  updateContentType(id: number, data: Prisma.ContentTypeUpdateInput): Promise<ContentType>;
  softDeleteContentType(id: number): Promise<ContentType>;
  countContentTypeUsages(id: number): Promise<number>;

  // --- 4. Content File Type (Global) ---
  createContentFileType(data: Prisma.ContentFileTypeCreateInput): Promise<ContentFileType>;
  findContentFileTypeById(id: number): Promise<ContentFileType | null>;
  findContentFileTypeByName(name: string): Promise<ContentFileType | null>;
  findContentFileTypes(filter: ContentFileTypeFilter, page: number, pageSize: number): Promise<ContentFileType[]>;
  countContentFileTypes(filter: ContentFileTypeFilter): Promise<number>;
  updateContentFileType(id: number, data: Prisma.ContentFileTypeUpdateInput): Promise<ContentFileType>;
  softDeleteContentFileType(id: number): Promise<ContentFileType>;
  countContentFileTypeUsages(id: number): Promise<number>;

  // --- 5. Course Template (Tenant Scoped) ---
  createTemplate(data: Prisma.CourseTemplateCreateInput): Promise<CourseTemplate>;
  findTemplateById(id: number, companyId: number): Promise<CourseTemplate | null>;
  findTemplateByName(companyId: number, name: string): Promise<CourseTemplate | null>;
  findTemplates(filter: CourseTemplateFilter, page: number, pageSize: number): Promise<any[]>;
  countTemplates(filter: CourseTemplateFilter): Promise<number>;
  updateTemplate(id: number, companyId: number, data: Prisma.CourseTemplateUpdateInput): Promise<CourseTemplate>;
  softDeleteTemplate(id: number, companyId: number): Promise<CourseTemplate>;
  countTemplateUsages(id: number, companyId: number): Promise<number>;
}

// ==========================================
// Repository Implementation
// ==========================================

export class CourseConfigurationRepository implements ICourseConfigurationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  // ------------------------------------------
  // 1. Course Category
  // ------------------------------------------

  async countCategoryChildren(id: number, companyId: number): Promise<number> {
    return this.prisma.courseCategory.count({
        where: {
        parentId: id,
        companyId,
        deletedAt: null,
        },
    });
}
  async createCategory(data: Prisma.CourseCategoryCreateInput): Promise<CourseCategory> {
    return this.prisma.courseCategory.create({ data });
  }

  async findCategoryById(id: number, companyId: number): Promise<CourseCategory | null> {
    return this.prisma.courseCategory.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        parent: { select: { id: true, name: true } },
        children: { where: { deletedAt: null }, select: { id: true, name: true } },
      },
    });
  }

  async findCategoryByName(companyId: number, name: string): Promise<CourseCategory | null> {
    return this.prisma.courseCategory.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });
  }

  async findCategoryBySlug(companyId: number, slug: string): Promise<CourseCategory | null> {
  return this.prisma.courseCategory.findFirst({
    where: {
      companyId,
      slug,
      deletedAt: null,
    },
  });
}

  async findCategories(filter: CourseCategoryFilter, page: number, pageSize: number): Promise<CourseCategory[]> {
    return this.prisma.courseCategory.findMany({
      where: {
        companyId: filter.companyId,
        deletedAt: null,
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.parentId !== undefined && { parentId: filter.parentId }),
        ...(filter.search && {
          name: { contains: filter.search, mode: "insensitive" },
        }),
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { displayOrder: "asc" },
    });
  }

  async countCategories(filter: CourseCategoryFilter): Promise<number> {
    return this.prisma.courseCategory.count({
      where: {
        companyId: filter.companyId,
        deletedAt: null,
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.parentId !== undefined && { parentId: filter.parentId }),
        ...(filter.search && {
          name: { contains: filter.search, mode: "insensitive" },
        }),
      },
    });
  }

  async updateCategory(id: number, companyId: number, data: Prisma.CourseCategoryUpdateInput): Promise<CourseCategory> {
    return this.prisma.courseCategory.update({
      where: { id, companyId },
      data,
    });
  }

  async softDeleteCategory(id: number, companyId: number): Promise<CourseCategory> {
    return this.prisma.courseCategory.update({
      where: { id, companyId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async countCategoryUsages(id: number, companyId: number): Promise<number> {
    const [coursesCount, templatesCount, questionBanksCount] = await Promise.all([
      this.prisma.course.count({
        where: { categoryId: id, companyId, deletedAt: null },
      }),
      this.prisma.courseTemplate.count({
        where: { categoryId: id, companyId, deletedAt: null },
      }),
      this.prisma.questionBank.count({
        where: { categoryId: id, companyId, deletedAt: null },
      }),
    ]);
    return coursesCount + templatesCount + questionBanksCount;
  }

  // ------------------------------------------
  // 2. Difficulty Level
  // ------------------------------------------

  async createDifficultyLevel(data: Prisma.DifficultyLevelCreateInput): Promise<DifficultyLevel> {
    return this.prisma.difficultyLevel.create({ data });
  }

  async findDifficultyLevelById(id: number, companyId: number): Promise<DifficultyLevel | null> {
    return this.prisma.difficultyLevel.findFirst({
      where: {
        id,
        OR: [{ companyId }, { companyId: null }],
        deletedAt: null,
      },
    });
  }

  async findDifficultyLevelByName(companyId: number, name: string): Promise<DifficultyLevel | null> {
    return this.prisma.difficultyLevel.findFirst({
      where: {
        OR: [{ companyId }, { companyId: null }],
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });
  }

// Replace findDifficultyLevels to include System Defaults + Company Records
async findDifficultyLevels(
  filter: DifficultyLevelFilter,
  page: number,
  pageSize: number
): Promise<DifficultyLevel[]> {
  const where: Prisma.DifficultyLevelWhereInput = {
    // Return both system-wide defaults AND tenant-specific levels
    OR: [
      { isSystem: true, companyId: null },
      { companyId: filter.companyId },
    ],
    ...(filter.search && {
      OR: [
        { name: { contains: filter.search, mode: "insensitive" } },
        { code: { contains: filter.search, mode: "insensitive" } },
      ],
    }),
    ...(filter.isActive !== undefined && { isActive: filter.isActive }),
  };

  return this.prisma.difficultyLevel.findMany({
    where,
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { displayOrder: "asc" },
  });
}

// Update countDifficultyLevels matching the same tiered filter logic
async countDifficultyLevels(filter: DifficultyLevelFilter): Promise<number> {
  const where: Prisma.DifficultyLevelWhereInput = {
    OR: [
      { isSystem: true, companyId: null },
      { companyId: filter.companyId },
    ],
    ...(filter.search && {
      OR: [
        { name: { contains: filter.search, mode: "insensitive" } },
        { code: { contains: filter.search, mode: "insensitive" } },
      ],
    }),
    ...(filter.isActive !== undefined && { isActive: filter.isActive }),
  };

  return this.prisma.difficultyLevel.count({ where });
}

  async updateDifficultyLevel(id: number, companyId: number, data: Prisma.DifficultyLevelUpdateInput): Promise<DifficultyLevel> {
    return this.prisma.difficultyLevel.update({
      where: { id, companyId },
      data,
    });
  }

  async softDeleteDifficultyLevel(id: number, companyId: number): Promise<DifficultyLevel> {
    return this.prisma.difficultyLevel.update({
      where: { id, companyId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async countDifficultyLevelUsages(id: number, companyId: number): Promise<number> {
    const [versionsCount, templatesCount, blueprintsCount, questionsCount] = await Promise.all([
      this.prisma.courseVersion.count({
        where: { difficultyLevelId: id, course: { companyId }, deletedAt: null },
      }),
      this.prisma.courseTemplate.count({
        where: { difficultyLevelId: id, companyId, deletedAt: null },
      }),
      this.prisma.assessmentBlueprint.count({
        where: { difficultyLevelId: id, companyId, deletedAt: null },
      }),
      this.prisma.question.count({
        where: { difficultyLevelId: id, companyId, deletedAt: null },
      }),
    ]);
    return versionsCount + templatesCount + blueprintsCount + questionsCount;
  }

  // ------------------------------------------
  // 3. Content Type (Global System Table)
  // ------------------------------------------

  async createContentType(data: Prisma.ContentTypeCreateInput): Promise<ContentType> {
    return this.prisma.contentType.create({ data });
  }

  async findContentTypeById(id: number): Promise<ContentType | null> {
    return this.prisma.contentType.findUnique({
      where: { id},
    });
  }

  async findContentTypeByName(name: string): Promise<ContentType | null> {
    return this.prisma.contentType.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });
  }

  async findContentTypes(filter: ContentTypeFilter, page: number, pageSize: number): Promise<ContentType[]> {
    return this.prisma.contentType.findMany({
      where: {
        deletedAt: null,
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.search && {
          name: { contains: filter.search, mode: "insensitive" },
        }),
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { sortOrder: "asc" },
    });
  }

  async countContentTypes(filter: ContentTypeFilter): Promise<number> {
    return this.prisma.contentType.count({
      where: {
        deletedAt: null,
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.search && {
          name: { contains: filter.search, mode: "insensitive" },
        }),
      },
    });
  }

  async updateContentType(id: number, data: Prisma.ContentTypeUpdateInput): Promise<ContentType> {
    return this.prisma.contentType.update({
      where: { id },
      data,
    });
  }

  async softDeleteContentType(id: number): Promise<ContentType> {
    return this.prisma.contentType.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async countContentTypeUsages(id: number): Promise<number> {
    return this.prisma.courseContent.count({
      where: { contentTypeId: id, deletedAt: null },
    });
  }

  // ------------------------------------------
  // 4. Content File Type (Global System Table)
  // ------------------------------------------

  async createContentFileType(data: Prisma.ContentFileTypeCreateInput): Promise<ContentFileType> {
    return this.prisma.contentFileType.create({ data });
  }

  async findContentFileTypeById(id: number): Promise<ContentFileType | null> {
    return this.prisma.contentFileType.findUnique({
      where: { id },
    });
  }

  async findContentFileTypeByName(name: string): Promise<ContentFileType | null> {
    return this.prisma.contentFileType.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });
  }

  async findContentFileTypes(filter: ContentFileTypeFilter, page: number, pageSize: number): Promise<ContentFileType[]> {
    return this.prisma.contentFileType.findMany({
      where: {
        deletedAt: null,
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.search && {
          name: { contains: filter.search, mode: "insensitive" },
        }),
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { sortOrder: "asc" },
    });
  }

  async countContentFileTypes(filter: ContentFileTypeFilter): Promise<number> {
    return this.prisma.contentFileType.count({
      where: {
        deletedAt: null,
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.search && {
          name: { contains: filter.search, mode: "insensitive" },
        }),
      },
    });
  }

  async updateContentFileType(id: number, data: Prisma.ContentFileTypeUpdateInput): Promise<ContentFileType> {
    return this.prisma.contentFileType.update({
      where: { id },
      data,
    });
  }

  async softDeleteContentFileType(id: number): Promise<ContentFileType> {
    return this.prisma.contentFileType.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async countContentFileTypeUsages(id: number): Promise<number> {
    return this.prisma.storedFile.count({
      where: { fileTypeId: id, deletedAt: null },
    });
  }

  // ------------------------------------------
  // 5. Course Template (Tenant Scoped)
  // ------------------------------------------

  async createTemplate(data: Prisma.CourseTemplateCreateInput): Promise<CourseTemplate> {
    return this.prisma.courseTemplate.create({ data });
  }

  async findTemplateById(id: number, companyId: number): Promise<CourseTemplate | null> {
    return this.prisma.courseTemplate.findFirst({
      where: { id, companyId, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
        difficultyLevel: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async findTemplateByName(companyId: number, name: string): Promise<CourseTemplate | null> {
    return this.prisma.courseTemplate.findFirst({
      where: {
        companyId,
        name: { equals: name, mode: "insensitive" },
        deletedAt: null,
      },
    });
  }

  async findTemplates(filter: CourseTemplateFilter, page: number, pageSize: number): Promise<any[]> {
    return this.prisma.courseTemplate.findMany({
      where: {
        companyId: filter.companyId,
        deletedAt: null,
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.categoryId && { categoryId: filter.categoryId }),
        ...(filter.difficultyLevelId && { difficultyLevelId: filter.difficultyLevelId }),
        ...(filter.search && {
          name: { contains: filter.search, mode: "insensitive" },
        }),
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        description: true,
        shortSummary: true,
        isActive: true,
        createdAt: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        difficultyLevel: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async countTemplates(filter: CourseTemplateFilter): Promise<number> {
    return this.prisma.courseTemplate.count({
      where: {
        companyId: filter.companyId,
        deletedAt: null,
        ...(filter.isActive !== undefined && { isActive: filter.isActive }),
        ...(filter.categoryId && { categoryId: filter.categoryId }),
        ...(filter.difficultyLevelId && { difficultyLevelId: filter.difficultyLevelId }),
        ...(filter.search && {
          name: { contains: filter.search, mode: "insensitive" },
        }),
      },
    });
  }

  async updateTemplate(id: number, companyId: number, data: Prisma.CourseTemplateUpdateInput): Promise<CourseTemplate> {
    return this.prisma.courseTemplate.update({
      where: { id, companyId },
      data,
    });
  }

  async softDeleteTemplate(id: number, companyId: number): Promise<CourseTemplate> {
    return this.prisma.courseTemplate.update({
      where: { id, companyId },
      data: { deletedAt: new Date(), isActive: false },
    });
  }

  async countTemplateUsages(id: number, companyId: number): Promise<number> {
    return this.prisma.course.count({
      where: { sourceTemplateId: id, companyId, deletedAt: null },
    });
  }
}