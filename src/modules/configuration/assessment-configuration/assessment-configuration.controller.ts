import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import type { AssessmentConfigurationService } from "./assessment-configuration.service.js";
import type {
  AssessmentTypeFilterInput,
  AssessmentTemplateFilterInput,
  QuestionTypeFilterInput,
  GradingMethodFilterInput,
} from "./assessment-configuration.types.js";

export class AssessmentConfigurationController {
  constructor(private readonly service: AssessmentConfigurationService) {}


  // ─── 1. Assessment Types ─────────────────────────────────────────────────
  createAssessmentType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const result = await this.service.createAssessmentType(req.body, companyId);
      return res.status(201).json({ success: true, message: "Assessment type created successfully", data: result });
    } catch (error) { next(error); }
  };

  getAssessmentTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const filter = req.query;
      const result = await this.service.getAssessmentTypes(filter, companyId);
      return res.status(200).json({ success: true, message: "Assessment types retrieved successfully", data: result.items, pagination: result.meta });
    } catch (error) { next(error); }
  };

  getAssessmentTypeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getAssessmentTypeById(id, companyId);
      return res.status(200).json({ success: true, message: "Assessment type retrieved successfully", data: result });
    } catch (error) { next(error); }
  };

  updateAssessmentType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.updateAssessmentType(id, req.body, companyId);
      return res.status(200).json({ success: true, message: "Assessment type updated successfully", data: result });
    } catch (error) { next(error); }
  };

  deleteAssessmentType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      await this.service.deleteAssessmentType(id, companyId);
      return res.status(200).json({ success: true, message: "Assessment type deleted successfully" });
    } catch (error) { next(error); }
  };

  // ─── 2. Question Types ───────────────────────────────────────────────────
  createQuestionType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const result = await this.service.createQuestionType(req.body, companyId);
      return res.status(201).json({ success: true, message: "Question type created successfully", data: result });
    } catch (error) { next(error); }
  };

  getQuestionTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const filter = req.query;
      const result = await this.service.getQuestionTypes(filter, companyId);
      return res.status(200).json({ success: true, message: "Question types retrieved successfully", data: result.items, pagination: result.meta });
    } catch (error) { next(error); }
  };

  getQuestionTypeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getQuestionTypeById(id, companyId);
      return res.status(200).json({ success: true, message: "Question type retrieved successfully", data: result });
    } catch (error) { next(error); }
  };

  updateQuestionType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.updateQuestionType(id, req.body, companyId);
      return res.status(200).json({ success: true, message: "Question type updated successfully", data: result });
    } catch (error) { next(error); }
  };

  deleteQuestionType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      await this.service.deleteQuestionType(id, companyId);
      return res.status(200).json({ success: true, message: "Question type deleted successfully" });
    } catch (error) { next(error); }
  };

  // ─── 3. Grading Methods ──────────────────────────────────────────────────
  createGradingMethod = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const result = await this.service.createGradingMethod(req.body, companyId);
      return res.status(201).json({ success: true, message: "Grading method created successfully", data: result });
    } catch (error) { next(error); }
  };

  getGradingMethods = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const filter = req.query;
      const result = await this.service.getGradingMethods(filter, companyId);
      return res.status(200).json({ success: true, message: "Grading methods retrieved successfully", data: result.items, pagination: result.meta });
    } catch (error) { next(error); }
  };

  getGradingMethodById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getGradingMethodById(id, companyId);
      return res.status(200).json({ success: true, message: "Grading method retrieved successfully", data: result });
    } catch (error) { next(error); }
  };

  updateGradingMethod = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.updateGradingMethod(id, req.body, companyId);
      return res.status(200).json({ success: true, message: "Grading method updated successfully", data: result });
    } catch (error) { next(error); }
  };

  deleteGradingMethod = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      await this.service.deleteGradingMethod(id, companyId);
      return res.status(200).json({ success: true, message: "Grading method deleted successfully" });
    } catch (error) { next(error); }
  };

  // ─── 4. Assessment Templates ─────────────────────────────────────────────
  createTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const result = await this.service.createTemplate(req.body, companyId, userId);
      return res.status(201).json({ success: true, message: "Assessment template created successfully", data: result });
    } catch (error) { next(error); }
  };

  getTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const filter = req.query;
      const result = await this.service.getTemplates(filter, companyId);
      return res.status(200).json({ success: true, message: "Assessment templates retrieved successfully", data: result.items, pagination: result.meta });
    } catch (error) { next(error); }
  };

  getTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getTemplateById(id, companyId);
      return res.status(200).json({ success: true, message: "Assessment template retrieved successfully", data: result });
    } catch (error) { next(error); }
  };

  updateTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = Number(req.params.id);
      // Cleaned: req.body is already validated by updateAssessmentTemplateSchema in route middleware
      const result = await this.service.updateTemplate(id, req.body, companyId, userId);
      return res.status(200).json({ success: true, message: "Assessment template updated successfully", data: result });
    } catch (error) { next(error); }
  };

  deleteTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = Number(req.params.id);
      await this.service.deleteTemplate(id, companyId, userId);
      return res.status(200).json({ success: true, message: "Assessment template deleted successfully" });
    } catch (error) { next(error); }
  };
}
