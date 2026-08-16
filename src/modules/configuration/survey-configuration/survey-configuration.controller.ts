import { Request, Response, NextFunction } from 'express';
import { SurveyConfigurationService } from './survey-configuration.service.js';

export class SurveyConfigurationController {
  constructor(private svc: SurveyConfigurationService) {}

  // SurveyQuestionType
  createSurveyQuestionType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const data = req.body;
      const result = await this.svc.createSurveyQuestionType(companyId, data);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  findSurveyQuestionTypes = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const query = req.query;
      const result = await this.svc.findSurveyQuestionTypes(companyId, query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  findSurveyQuestionTypeById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const id = Number(req.params.id);
      const item = await this.svc.findSurveyQuestionTypeById(companyId, id);
      if (!item) return res.status(404).send({ message: 'Not found' });
      res.json(item);
    } catch (err) {
      next(err);
    }
  };

  updateSurveyQuestionType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const id = Number(req.params.id);
      const data = req.body;
      const result = await this.svc.updateSurveyQuestionType(companyId, id, data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  deleteSurveyQuestionType = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const id = Number(req.params.id);
      await this.svc.softDeleteSurveyQuestionType(companyId, id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };

  // SurveyTemplate
  createTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const userId = (req as any).ctx.userId;
      const data = req.body;
      const result = await this.svc.createTemplate(companyId, userId, data);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  findTemplates = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const query = req.query;
      const result = await this.svc.findTemplates(companyId, query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  findTemplateById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const id = Number(req.params.id);
      const item = await this.svc.findTemplateById(companyId, id);
      if (!item) return res.status(404).send({ message: 'Not found' });
      res.json(item);
    } catch (err) {
      next(err);
    }
  };

  updateTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const userId = (req as any).ctx.userId;
      const id = Number(req.params.id);
      const data = req.body;
      const result = await this.svc.updateTemplate(companyId, id, userId, data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  deleteTemplate = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const id = Number(req.params.id);
      await this.svc.softDeleteTemplate(companyId, id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
