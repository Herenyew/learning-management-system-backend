import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import type { TrainingEffectivenessService } from "./training-effectiveness.service.js";
import type {
  CreateEffectivenessWeightConfigInput,
  UpdateEffectivenessWeightConfigInput,
  EffectivenessWeightConfigFilterInput,
} from "./training-effectiveness.types.js";

export class TrainingEffectivenessController {
  constructor(private service: TrainingEffectivenessService) {}

  createWeightConfig = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const dto = req.body as CreateEffectivenessWeightConfigInput;

      const result = await this.service.createWeightConfig(
        companyId,
        userId,
        dto
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getActiveWeightConfig = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const result = await this.service.getActiveWeightConfig(companyId);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getWeightConfigById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = parseInt(req.params.id, 10);

      const result = await this.service.getWeightConfigById(companyId, id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getWeightConfigs = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const filter = req.query;

      const result = await this.service.getWeightConfigs(companyId, filter);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateWeightConfig = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = parseInt(req.params.id, 10);
      const dto = req.body as UpdateEffectivenessWeightConfigInput;

      const result = await this.service.updateWeightConfig(
        companyId,
        id,
        dto
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deactivateWeightConfig = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = parseInt(req.params.id, 10);

      const result = await this.service.deactivateWeightConfig(companyId, id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
