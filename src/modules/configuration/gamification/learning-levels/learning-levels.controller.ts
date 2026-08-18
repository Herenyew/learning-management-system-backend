import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../auth-request.js";
import type { LearningLevelsService } from "./learning-levels.service.js";
import type { CreateLearningLevelInput, UpdateLearningLevelInput } from "./learning-levels.types.js";

export class LearningLevelsController {
  constructor(private service: LearningLevelsService) {}

  createLearningLevel = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const body = req.body as CreateLearningLevelInput;
      const result = await this.service.createLearningLevel(companyId, userId, body);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  listLearningLevels = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;
      const result = await this.service.listLearningLevels(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
  };

  getLearningLevelById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getLearningLevelById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  updateLearningLevel = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = Number(req.params.id);
      const body = req.body as UpdateLearningLevelInput;
      const result = await this.service.updateLearningLevel(companyId, id, userId, body);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  deleteLearningLevel = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = Number(req.params.id);
      const result = await this.service.deleteLearningLevel(companyId, id, userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };
}
