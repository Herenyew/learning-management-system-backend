import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import type { TnaConfigurationService } from "./tna-configuration.service.js";
import type {
  CreateTnaRequestTypeInput,
  UpdateTnaRequestTypeInput,
  TnaRequestTypeFilterInput,
  CreateFundingTypeInput,
  UpdateFundingTypeInput,
  FundingTypeFilterInput,
  CreateTrainingFormatInput,
  UpdateTrainingFormatInput,
  TrainingFormatFilterInput,
} from "./tna-configuration.types.js";

export class TnaConfigurationController {
  constructor(private service: TnaConfigurationService) {}

  // ==========================================
  // 1. TnaRequestTypeConfig Handlers
  // ==========================================

  createRequestType = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const dto: CreateTnaRequestTypeInput = req.body;
      const result = await this.service.createRequestType(companyId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listRequestTypes = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;
      const result = await this.service.getRequestTypes(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getRequestTypeById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getRequestTypeById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateRequestType = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const dto: UpdateTnaRequestTypeInput = req.body;
      const result = await this.service.updateRequestType(
        companyId,
        id,
        dto
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteRequestType = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.deleteRequestType(companyId, id);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 2. FundingType Handlers
  // ==========================================

  createFundingType = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const dto: CreateFundingTypeInput = req.body;
      const result = await this.service.createFundingType(companyId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listFundingTypes = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;
      const result = await this.service.getFundingTypes(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getFundingTypeById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getFundingTypeById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateFundingType = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const dto: UpdateFundingTypeInput = req.body;
      const result = await this.service.updateFundingType(
        companyId,
        id,
        dto
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteFundingType = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.deleteFundingType(companyId, id);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 3. TrainingFormat Handlers
  // ==========================================

  createTrainingFormat = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const dto: CreateTrainingFormatInput = req.body;
      const result = await this.service.createTrainingFormat(companyId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listTrainingFormats = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;
      const result = await this.service.getTrainingFormats(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getTrainingFormatById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getTrainingFormatById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateTrainingFormat = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const dto: UpdateTrainingFormatInput = req.body;
      const result = await this.service.updateTrainingFormat(
        companyId,
        id,
        dto
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteTrainingFormat = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.deleteTrainingFormat(companyId, id);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };
}
