import { Request, Response, NextFunction } from "express";
import { TrainingEffectivenessService } from "./training-effectiveness.service.js";
import {
  CreateEffectivenessWeightConfigDto,
  UpdateEffectivenessWeightConfigDto,
  EffectivenessWeightConfigFilterDto,
} from "./training-effectiveness.dto.js";

export class TrainingEffectivenessController {
  constructor(private service: TrainingEffectivenessService) {}

  createWeightConfig = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
      const dto = req.body as CreateEffectivenessWeightConfigDto;

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
    req: Request,
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
    req: Request,
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const filter = req.query as unknown as EffectivenessWeightConfigFilterDto;

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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = parseInt(req.params.id, 10);
      const dto = req.body as UpdateEffectivenessWeightConfigDto;

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
    req: Request,
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