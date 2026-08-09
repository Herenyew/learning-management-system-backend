import { Request, Response, NextFunction } from "express";
import { CourseConfigurationService } from "./course-configuration.service.js";
import {
  createCourseCategorySchema,
  updateCourseCategorySchema,
  courseCategoryFilterQuerySchema,
  createDifficultyLevelSchema,
  updateDifficultyLevelSchema,
  difficultyLevelFilterQuerySchema,
  createContentTypeSchema,
  updateContentTypeSchema,
  contentTypeFilterQuerySchema,
  createContentFileTypeSchema,
  updateContentFileTypeSchema,
  contentFileTypeFilterQuerySchema,
  createCourseTemplateSchema,
  updateCourseTemplateSchema,
  courseTemplateFilterQuerySchema,
} from "./course-configuration.dto.js";
import { UnauthorizedError } from "../../../common/errors/index.js";
import type { CurrentUser } from "../../../common/auth/current-user.js";
import { AppError, ErrorCode } from "../../../common/errors/index.js";

export class CourseConfigurationController {
  constructor(private readonly service: CourseConfigurationService) {}

  // Helper to safely extract tenant company ID from request context/user session
private getUserId(req: Request): number {
  const user = (req as any).user as CurrentUser | undefined;
  
  const userId = user?.appUserId ?? (user as any)?.id ?? (user as any)?.userId;
  const parsedUserId = Number(userId);

  if (!userId || isNaN(parsedUserId)) {
    throw new AppError(
      "User context missing: valid appUserId is required.",
      401,
      ErrorCode.UNAUTHORIZED
    );
  }

  return parsedUserId;
}

private getCompanyId(req: Request): number {
  const user = (req as any).user as CurrentUser | undefined;
  
  const companyId = user?.companyId;
  const parsedCompanyId = Number(companyId);

  if (!companyId || isNaN(parsedCompanyId)) {
    throw new AppError(
      "User context missing: valid companyId is required.",
      401,
      ErrorCode.UNAUTHORIZED
    );
  }

  return parsedCompanyId;
}

  // ==========================================
  // 1. Course Category Handlers
  // ==========================================

  createCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      const dto = createCourseCategorySchema.parse(req.body);

      const result = await this.service.createCategory(dto, companyId, userId);

      return res.status(201).json({
        success: true,
        message: "Course category created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getCategories = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const query = courseCategoryFilterQuerySchema.parse(req.query);

      const { page, pageSize, ...filter } = query;
      const result = await this.service.getCategories(
        { ...filter, companyId },
        page,
        pageSize
      );

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = Number(req.params.id);

      const result = await this.service.getCategoryById(id, companyId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = Number(req.params.id);
      const dto = updateCourseCategorySchema.parse(req.body);

      const result = await this.service.updateCategory(id, companyId, dto);

      return res.status(200).json({
        success: true,
        message: "Course category updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = Number(req.params.id);

      await this.service.deleteCategory(id, companyId);

      return res.status(200).json({
        success: true,
        message: "Course category deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 2. Difficulty Level Handlers
  // ==========================================

  createDifficultyLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const dto = createDifficultyLevelSchema.parse(req.body);

      const result = await this.service.createDifficultyLevel(dto, companyId);

      return res.status(201).json({
        success: true,
        message: "Difficulty level created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getDifficultyLevels = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const query = difficultyLevelFilterQuerySchema.parse(req.query);

      const { page, pageSize, ...filter } = query;
      const result = await this.service.getDifficultyLevels(
        { ...filter, companyId },
        page,
        pageSize
      );

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getDifficultyLevelById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = Number(req.params.id);

      const result = await this.service.getDifficultyLevelById(id, companyId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateDifficultyLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = Number(req.params.id);
      const dto = updateDifficultyLevelSchema.parse(req.body);

      const result = await this.service.updateDifficultyLevel(id, companyId, dto);

      return res.status(200).json({
        success: true,
        message: "Difficulty level updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteDifficultyLevel = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = Number(req.params.id);

      await this.service.deleteDifficultyLevel(id, companyId);

      return res.status(200).json({
        success: true,
        message: "Difficulty level deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 3. Content Type Handlers (Global System Table)
  // ==========================================

  createContentType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = createContentTypeSchema.parse(req.body);

      const result = await this.service.createContentType(dto);

      return res.status(201).json({
        success: true,
        message: "Content type created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getContentTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = contentTypeFilterQuerySchema.parse(req.query);

      const { page, pageSize, ...filter } = query;
      const result = await this.service.getContentTypes(filter, page, pageSize);

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getContentTypeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);

      const result = await this.service.getContentTypeById(id);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateContentType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const dto = updateContentTypeSchema.parse(req.body);

      const result = await this.service.updateContentType(id, dto);

      return res.status(200).json({
        success: true,
        message: "Content type updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteContentType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);

      await this.service.deleteContentType(id);

      return res.status(200).json({
        success: true,
        message: "Content type deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 4. Content File Type Handlers (Global System Table)
  // ==========================================

  createContentFileType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = createContentFileTypeSchema.parse(req.body);

      const result = await this.service.createContentFileType(dto);

      return res.status(201).json({
        success: true,
        message: "Content file type created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getContentFileTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = contentFileTypeFilterQuerySchema.parse(req.query);

      const { page, pageSize, ...filter } = query;
      const result = await this.service.getContentFileTypes(filter, page, pageSize);

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getContentFileTypeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);

      const result = await this.service.getContentFileTypeById(id);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateContentFileType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const dto = updateContentFileTypeSchema.parse(req.body);

      const result = await this.service.updateContentFileType(id, dto);

      return res.status(200).json({
        success: true,
        message: "Content file type updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteContentFileType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);

      await this.service.deleteContentFileType(id);

      return res.status(200).json({
        success: true,
        message: "Content file type deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 5. Course Template Handlers
  // ==========================================

  createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      const dto = createCourseTemplateSchema.parse(req.body);

      const result = await this.service.createTemplate(dto, companyId, userId);

      return res.status(201).json({
        success: true,
        message: "Course template created successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const query = courseTemplateFilterQuerySchema.parse(req.query);

      const { page, pageSize, ...filter } = query;
      const result = await this.service.getTemplates(
        { ...filter, companyId },
        page,
        pageSize
      );

      return res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getTemplateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = Number(req.params.id);

      const result = await this.service.getTemplateById(id, companyId);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = Number(req.params.id);
      const dto = updateCourseTemplateSchema.parse(req.body);

      const result = await this.service.updateTemplate(id, companyId, dto);

      return res.status(200).json({
        success: true,
        message: "Course template updated successfully",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = Number(req.params.id);

      await this.service.deleteTemplate(id, companyId);

      return res.status(200).json({
        success: true,
        message: "Course template deleted successfully",
      });
    } catch (error) {
      next(error);
    }
  };
}