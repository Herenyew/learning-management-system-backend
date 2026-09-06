import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import { CourseConfigurationService } from "./course-configuration.service.js";
import type { CreateCourseCategoryInput } from "./course-configuration.types.js";
import {
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
} from "./course-configuration.dto.js";

export class CourseConfigurationController {
  constructor(private readonly service: CourseConfigurationService) {}


  // ==========================================
  // 1. Course Category Handlers
  // ==========================================

  createCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const dto: CreateCourseCategoryInput = req.body;

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

  getCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const query = req.query as any; // already validated & transformed by validateQuery middleware

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

  getCategoryById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
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

  updateCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
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

  deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
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

  createDifficultyLevel = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
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

  getDifficultyLevels = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const query = req.query as any; // already validated & transformed by validateQuery middleware

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

  getDifficultyLevelById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
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

  updateDifficultyLevel = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
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

  deleteDifficultyLevel = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
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

  createContentType = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

  getContentTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = req.query as any; // already validated & transformed by validateQuery middleware

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

  getContentTypeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

  updateContentType = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

  deleteContentType = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

  createContentFileType = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

  getContentFileTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = req.query as any; // already validated & transformed by validateQuery middleware

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

  getContentFileTypeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

  updateContentFileType = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

  deleteContentFileType = async (req: AuthRequest, res: Response, next: NextFunction) => {
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
}
