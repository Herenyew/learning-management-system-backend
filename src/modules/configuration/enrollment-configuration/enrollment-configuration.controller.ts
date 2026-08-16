import { Request, Response, NextFunction } from "express";
import { EnrollmentConfigurationService } from "./enrollment-configuration.service.js";
import {
  CreateEnrollmentRuleTypeInputDto,
  UpdateEnrollmentRuleTypeInputDto,
  EnrollmentRuleTypeFilterQueryDto,
  CreateEnrollmentRuleInputDto,
  UpdateEnrollmentRuleInputDto,
  EnrollmentRuleFilterQueryDto,
} from "./enrollment-configuration.dto.js";

export class EnrollmentConfigurationController {
  constructor(private service: EnrollmentConfigurationService) {}

  // ==========================================
  // 1. EnrollmentRuleType Endpoints
  // ==========================================

  createEnrollmentRuleType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const body = req.body as CreateEnrollmentRuleTypeInputDto;

      const result = await this.service.createEnrollmentRuleType(companyId, body);
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getEnrollmentRuleTypes = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const query = req.query as unknown as EnrollmentRuleTypeFilterQueryDto;

      const result = await this.service.listEnrollmentRuleTypes(companyId, query);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getEnrollmentRuleTypeById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const id = Number(req.params.id);

      const result = await this.service.getEnrollmentRuleTypeById(companyId, id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateEnrollmentRuleType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const id = Number(req.params.id);
      const body = req.body as UpdateEnrollmentRuleTypeInputDto;

      await this.service.updateEnrollmentRuleType(companyId, id, body);
      res.status(200).json({
        success: true,
        message: "Enrollment rule type updated successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  deleteEnrollmentRuleType = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const id = Number(req.params.id);

      await this.service.deleteEnrollmentRuleType(companyId, id);
      res.status(200).json({
        success: true,
        message: "Enrollment rule type deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 2. EnrollmentRule Endpoints
  // ==========================================

  createEnrollmentRule = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const body = req.body as CreateEnrollmentRuleInputDto;

      const result = await this.service.createEnrollmentRule(
        companyId,
        userId,
        body
      );
      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getEnrollmentRules = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const query = req.query as unknown as EnrollmentRuleFilterQueryDto;

      const result = await this.service.listEnrollmentRules(companyId, query);
      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getEnrollmentRuleById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const id = Number(req.params.id);

      const result = await this.service.getEnrollmentRuleById(companyId, id);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateEnrollmentRule = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const userId = req.user!.id;
      const id = Number(req.params.id);
      const body = req.body as UpdateEnrollmentRuleInputDto;

      await this.service.updateEnrollmentRule(companyId, id, userId, body);
      res.status(200).json({
        success: true,
        message: "Enrollment rule updated successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  deleteEnrollmentRule = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user!.companyId;
      const id = Number(req.params.id);

      await this.service.deleteEnrollmentRule(companyId, id);
      res.status(200).json({
        success: true,
        message: "Enrollment rule deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  };
}