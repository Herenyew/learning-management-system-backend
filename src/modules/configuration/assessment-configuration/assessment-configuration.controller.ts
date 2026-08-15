import { Request, Response, NextFunction } from "express";
import { AssessmentConfigurationService } from "./assessment-configuration.service.js";
import {
  AssessmentTypeFilterDto,
  AssessmentTemplateFilterDto,
  QuestionTypeFilterDto,
  GradingMethodFilterDto,
} from "./assessment-configuration.dto.js";
import { AppError, ErrorCode } from "../../../common/errors/index.js";
import type { CurrentUser } from "../../../common/auth/current-user.js";

export class AssessmentConfigurationController {
  constructor(private readonly service: AssessmentConfigurationService) {}

  private getUserId(req: Request): number {
    const user = req.user as CurrentUser | undefined;
    const userId = user?.appUserId ?? (user as any)?.id ?? (user as any)?.userId;
    const parsedUserId = Number(userId);

    if (!userId || isNaN(parsedUserId)) {
      throw new AppError("User context missing: valid appUserId is required.", 401, ErrorCode.UNAUTHORIZED);
    }

    return parsedUserId;
  }

  private getCompanyId(req: Request): number {
    const user = req.user as CurrentUser | undefined;
    const companyId = user?.companyId;
    const parsedCompanyId = Number(companyId);

    if (!companyId || isNaN(parsedCompanyId)) {
      throw new AppError("User context missing: valid companyId is required.", 401, ErrorCode.UNAUTHORIZED);
    }

    return parsedCompanyId;
  }

  private getIdParam(req: Request): number {
    const { id } = req.params as unknown as { id: number };
    return Number(id);
  }

  // ─── 1. Assessment Types ─────────────────────────────────────────────────
  createAssessmentType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const result = await this.service.createAssessmentType(req.body, companyId);
      return res.status(201).json({ success: true, message: "Assessment type created successfully", data: result });
    } catch (error) { next(error); }
  };

  getAssessmentTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const filter = req.query as unknown as AssessmentTypeFilterDto;
      const result = await this.service.getAssessmentTypes(filter, companyId);
      return res.status(200).json({ success: true, message: "Assessment types retrieved successfully", ...result });
    } catch (error) { next(error); }
  };

  getAssessmentTypeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = this.getIdParam(req);
      const result = await this.service.getAssessmentTypeById(id, companyId);
      return res.status(200).json({ success: true, message: "Assessment type retrieved successfully", data: result });
    } catch (error) { next(error); }
  };

  updateAssessmentType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = this.getIdParam(req);
      const result = await this.service.updateAssessmentType(id, req.body, companyId);
      return res.status(200).json({ success: true, message: "Assessment type updated successfully", data: result });
    } catch (error) { next(error); }
  };

  deleteAssessmentType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = this.getIdParam(req);
      await this.service.deleteAssessmentType(id, companyId);
      return res.status(200).json({ success: true, message: "Assessment type deleted successfully" });
    } catch (error) { next(error); }
  };

  // ─── 2. Question Types ───────────────────────────────────────────────────
  createQuestionType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const result = await this.service.createQuestionType(req.body, companyId);
      return res.status(201).json({ success: true, message: "Question type created successfully", data: result });
    } catch (error) { next(error); }
  };

  getQuestionTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const filter = req.query as unknown as QuestionTypeFilterDto;
      const result = await this.service.getQuestionTypes(filter, companyId);
      return res.status(200).json({ success: true, message: "Question types retrieved successfully", ...result });
    } catch (error) { next(error); }
  };

  getQuestionTypeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = this.getIdParam(req);
      const result = await this.service.getQuestionTypeById(id, companyId);
      return res.status(200).json({ success: true, message: "Question type retrieved successfully", data: result });
    } catch (error) { next(error); }
  };

  updateQuestionType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = this.getIdParam(req);
      const result = await this.service.updateQuestionType(id, req.body, companyId);
      return res.status(200).json({ success: true, message: "Question type updated successfully", data: result });
    } catch (error) { next(error); }
  };

  deleteQuestionType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = this.getIdParam(req);
      await this.service.deleteQuestionType(id, companyId);
      return res.status(200).json({ success: true, message: "Question type deleted successfully" });
    } catch (error) { next(error); }
  };

  // ─── 3. Grading Methods ──────────────────────────────────────────────────
  createGradingMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const result = await this.service.createGradingMethod(req.body, companyId);
      return res.status(201).json({ success: true, message: "Grading method created successfully", data: result });
    } catch (error) { next(error); }
  };

  getGradingMethods = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const filter = req.query as unknown as GradingMethodFilterDto;
      const result = await this.service.getGradingMethods(filter, companyId);
      return res.status(200).json({ success: true, message: "Grading methods retrieved successfully", ...result });
    } catch (error) { next(error); }
  };

  getGradingMethodById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = this.getIdParam(req);
      const result = await this.service.getGradingMethodById(id, companyId);
      return res.status(200).json({ success: true, message: "Grading method retrieved successfully", data: result });
    } catch (error) { next(error); }
  };

  updateGradingMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = this.getIdParam(req);
      const result = await this.service.updateGradingMethod(id, req.body, companyId);
      return res.status(200).json({ success: true, message: "Grading method updated successfully", data: result });
    } catch (error) { next(error); }
  };

  deleteGradingMethod = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = this.getIdParam(req);
      await this.service.deleteGradingMethod(id, companyId);
      return res.status(200).json({ success: true, message: "Grading method deleted successfully" });
    } catch (error) { next(error); }
  };

  // ─── 4. Assessment Templates ─────────────────────────────────────────────
  createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      const result = await this.service.createTemplate(req.body, companyId, userId);
      return res.status(201).json({ success: true, message: "Assessment template created successfully", data: result });
    } catch (error) { next(error); }
  };

  getTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const filter = req.query as unknown as AssessmentTemplateFilterDto;
      const result = await this.service.getTemplates(filter, companyId);
      return res.status(200).json({ success: true, message: "Assessment templates retrieved successfully", ...result });
    } catch (error) { next(error); }
  };

  getTemplateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const id = this.getIdParam(req);
      const result = await this.service.getTemplateById(id, companyId);
      return res.status(200).json({ success: true, message: "Assessment template retrieved successfully", data: result });
    } catch (error) { next(error); }
  };

  updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      const id = this.getIdParam(req);
      // Cleaned: req.body is already validated by updateAssessmentTemplateSchema in route middleware
      const result = await this.service.updateTemplate(id, req.body, companyId, userId);
      return res.status(200).json({ success: true, message: "Assessment template updated successfully", data: result });
    } catch (error) { next(error); }
  };

  deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = this.getCompanyId(req);
      const userId = this.getUserId(req);
      const id = this.getIdParam(req);
      await this.service.deleteTemplate(id, companyId, userId);
      return res.status(200).json({ success: true, message: "Assessment template deleted successfully" });
    } catch (error) { next(error); }
  };
}