import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import { AudienceService } from "./audience.service.js";
import { AudienceMatchingService } from "./audience.matching.service.js";
import { parsePagination } from "../../../common/http/pagination.js";

export class AudienceController {
  constructor(
    private readonly audienceService: AudienceService,
    private readonly audienceMatchingService: AudienceMatchingService,
  ) {}


  // ==========================================
  // Audience Groups
  // ==========================================

  create = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.audienceService.create(
        req.user.companyId,
        req.user.appUserId,
        req.body,
      );

      res.status(201).json({
        success: true,
        message: "Audience group created successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  findById = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = Number(req.params.id);

      const result = await this.audienceService.findById(
        req.user.companyId,
        audienceGroupId,
      );

      res.json({
        success: true,
        message: "Audience group retrieved successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  findMany = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, pageSize } = parsePagination(req);

      const result = await this.audienceService.findMany(
        req.user.companyId,
        {
          search: req.query.search as string | undefined,
          isActive:
            req.query.isActive !== undefined
              ? req.query.isActive === "true"
              : undefined,
          page,
          pageSize,
        }
      );

      res.json({
        success: true,
        message: "Audience groups retrieved successfully.",
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = Number(req.params.id);

      const result = await this.audienceService.update(
        req.user.companyId,
        audienceGroupId,
        req.user.appUserId,
        req.body,
      );

      res.json({
        success: true,
        message: "Audience group updated successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = Number(req.params.id);

      await this.audienceService.delete(req.user.companyId, audienceGroupId);

      res.json({
        success: true,
        message: "Audience group deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // Member Matching & Preview
  // ==========================================

  resolveMembers = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = Number(req.params.id);
      const { page, pageSize } = parsePagination(req);

      const result = await this.audienceMatchingService.resolveMembers(
        audienceGroupId,
        req.user.companyId,
        page,
        pageSize,
        {
          search: req.query.search as string | undefined,
        },
      );

      res.json({
        success: true,
        message: "Audience group members resolved successfully.",
        data: result.data,
        pagination: {
          page,
          pageSize,
          totalRecords: result.totalRecords,
          totalPages: pageSize > 0 ? Math.ceil(result.totalRecords / pageSize) : 0,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  matchesEmployee = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = Number(req.params.id);
      const employeeId = req.params.employeeId;


      const matches = await this.audienceMatchingService.matchesEmployee(
        employeeId,
        audienceGroupId,
        req.user.companyId,
      );

      res.json({
        success: true,
        message: "Employee eligibility evaluated successfully.",
        data: { matches },
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // Audience Group Rules
  // ==========================================

  createRule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = Number(req.params.id);

      const result = await this.audienceService.createRule(
        audienceGroupId,
        req.user.companyId,
        req.body,
      );

      res.status(201).json({
        success: true,
        message: "Rule created successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  findRules = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = Number(req.params.id);

      const result = await this.audienceService.findRules(
        audienceGroupId,
        req.user.companyId,
      );

      res.json({
        success: true,
        message: "Rules retrieved successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateRule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = Number(req.params.id);
      const ruleId = Number(req.params.ruleId);

      const result = await this.audienceService.updateRule(
        audienceGroupId,
        ruleId,
        req.user.companyId,
        req.body,
      );

      res.json({
        success: true,
        message: "Rule updated successfully.",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteRule = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = Number(req.params.id);
      const ruleId = Number(req.params.ruleId);

      await this.audienceService.deleteRule(
        audienceGroupId,
        ruleId,
        req.user.companyId,
      );

      res.json({
        success: true,
        message: "Rule deleted successfully.",
      });
    } catch (error) {
      next(error);
    }
  };
}
