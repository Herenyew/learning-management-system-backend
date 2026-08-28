import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import type { EnrollmentConfigurationService } from "./enrollment-configuration.service.js";
import type {
  CreateEnrollmentRuleTypeInput,
  UpdateEnrollmentRuleTypeInput,
  EnrollmentRuleTypeFilterQueryInput,
  CreateEnrollmentRuleInput,
  UpdateEnrollmentRuleInput,
  EnrollmentRuleFilterQueryInput,
  EnrollmentReferenceOptionsQueryInput,
} from "./enrollment-configuration.types.js";

export class EnrollmentConfigurationController {
  constructor(private service: EnrollmentConfigurationService) {}

  // ==========================================
  // 1. EnrollmentRuleType Endpoints
  // ==========================================

  createEnrollmentRuleType = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const body = req.body as CreateEnrollmentRuleTypeInput;

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
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;

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
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
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
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const body = req.body as UpdateEnrollmentRuleTypeInput;

      const result = await this.service.updateEnrollmentRuleType(companyId, id, body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteEnrollmentRuleType = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
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
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const body = req.body as CreateEnrollmentRuleInput;

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
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;

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
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
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
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = Number(req.params.id);
      const body = req.body as UpdateEnrollmentRuleInput;

      const result = await this.service.updateEnrollmentRule(companyId, id, userId, body);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteEnrollmentRule = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
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

  // ==========================================
  // 3. Reference Option Endpoints (dropdowns)
  // ==========================================

  getCourseVersionOptions = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;

      const result = await this.service.listCourseVersionOptions(companyId, query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getLearningProgramOptions = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;

      const result = await this.service.listLearningProgramOptions(companyId, query);
      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
