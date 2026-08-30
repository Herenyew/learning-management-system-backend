import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import { SurveyConfigurationService } from './survey-configuration.service.js';

export class SurveyConfigurationController {
  constructor(private svc: SurveyConfigurationService) {}

  // ─── Survey Question Types ────────────────────────────────────────────────

  createSurveyQuestionType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.svc.createSurveyQuestionType(req.user.companyId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  findSurveyQuestionTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.svc.findSurveyQuestionTypes(req.user.companyId, req.query);
      // result is { items, total, page, pageSize } — return items array for consistency
      // with every other list endpoint in this service
      const items = Array.isArray(result) ? result : (result as any).items ?? result;
      res.json({ success: true, data: items });
    } catch (err) { next(err); }
  };

  findSurveyQuestionTypeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const item = await this.svc.findSurveyQuestionTypeById(
        req.user.companyId, Number(req.params.id)
      );
      if (!item) return res.status(404).json({ success: false, error: { message: 'Not found' } });
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  };

  updateSurveyQuestionType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.svc.updateSurveyQuestionType(
        req.user.companyId, Number(req.params.id), req.body
      );
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  deleteSurveyQuestionType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.svc.softDeleteSurveyQuestionType(req.user.companyId, Number(req.params.id));
      res.status(204).send();
    } catch (err) { next(err); }
  };

  // ─── Survey Templates ─────────────────────────────────────────────────────

  createTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.svc.createTemplate(
        req.user.companyId, req.user.appUserId!, req.body
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  findTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.svc.findTemplates(req.user.companyId, req.query);
      const items = Array.isArray(result) ? result : (result as any).items ?? result;
      res.json({ success: true, data: items });
    } catch (err) { next(err); }
  };

  findTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const item = await this.svc.findTemplateById(
        req.user.companyId, Number(req.params.id)
      );
      if (!item) return res.status(404).json({ success: false, error: { message: 'Not found' } });
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  };

  updateTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.svc.updateTemplate(
        req.user.companyId, Number(req.params.id), req.user.appUserId!, req.body
      );
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  deleteTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.svc.softDeleteTemplate(req.user.companyId, Number(req.params.id));
      res.status(204).send();
    } catch (err) { next(err); }
  };


  // Survey Template Questions (Dynamic Question Builder)

  createTemplateQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.svc.createTemplateQuestion(
        req.user.companyId, Number(req.params.templateId), req.body
      );
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  findTemplateQuestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.svc.findTemplateQuestions(
        req.user.companyId, Number(req.params.templateId)
      );
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  findTemplateQuestionById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const item = await this.svc.findTemplateQuestionById(
        req.user.companyId, Number(req.params.templateId), Number(req.params.id)
      );
      if (!item) return res.status(404).json({ success: false, error: { message: 'Not found' } });
      res.json({ success: true, data: item });
    } catch (err) { next(err); }
  };

  updateTemplateQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.svc.updateTemplateQuestion(
        req.user.companyId, Number(req.params.templateId), Number(req.params.id), req.body
      );
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  deleteTemplateQuestion = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      await this.svc.deleteTemplateQuestion(
        req.user.companyId, Number(req.params.templateId), Number(req.params.id)
      );
      res.status(204).send();
    } catch (err) { next(err); }
  };

  reorderTemplateQuestions = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.svc.reorderTemplateQuestions(
        req.user.companyId, Number(req.params.templateId), req.body
      );
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  };
}
