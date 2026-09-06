import type {
  PrismaClient,
  Prisma,
  CourseCategory,
  DifficultyLevel,
  ContentType,
  ContentFileType,
} from "@prisma/client";
import type {
  ContentFileTypeFilter,
  ContentTypeFilter,
  CourseCategoryFilter,
  DifficultyLevelFilter,
  ICourseConfigurationRepository,
} from "./course-configuration.types.js";

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
    const [coursesCount, questionBanksCount] = await Promise.all([
      this.prisma.course.count({
        where: { categoryId: id, companyId, deletedAt: null },
      }),
      this.prisma.questionBank.count({
        where: { categoryId: id, companyId, deletedAt: null },
      }),
    ]);
    return coursesCount + questionBanksCount;
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
    const [versionsCount, blueprintsCount, questionsCount] = await Promise.all([
      this.prisma.courseVersion.count({
        where: { difficultyLevelId: id, course: { companyId }, deletedAt: null },
      }),
      this.prisma.assessmentBlueprint.count({
        where: { difficultyLevelId: id, companyId, deletedAt: null },
      }),
      this.prisma.question.count({
        where: { difficultyLevelId: id, companyId, deletedAt: null },
      }),
    ]);
    return versionsCount + blueprintsCount + questionsCount;

  // ------------------------------------------
  }
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
}
