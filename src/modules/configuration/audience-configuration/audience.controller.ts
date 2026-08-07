import { Request, Response, NextFunction } from "express";
import { AudienceService } from "./audience.service.js";
import { AudienceMatchingService } from "./audience.matching.service.js";
import { parsePagination } from "../../../common/http/pagination.js";
import { ValidationError } from "../../../common/errors/http-errors.js";

export class AudienceController {
  constructor(
    private readonly audienceService: AudienceService,
    private readonly audienceMatchingService: AudienceMatchingService,
  ) {}

  private parseParamId(paramValue: string, paramName: string): number {
    const id = Number(paramValue);
    if (isNaN(id) || id <= 0) {
      throw new ValidationError(`Invalid ${paramName}: must be a positive integer.`);
    }
    return id;
  }

  // ==========================================
  // Audience Groups
  // ==========================================

  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

  findById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = this.parseParamId(req.params.id, "audience group ID");

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

  findMany = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { page, pageSize } = parsePagination(req);

      const result = await this.audienceService.findMany(
        {
          companyId: req.user.companyId,
          search: req.query.search as string | undefined,
          isActive:
            req.query.isActive !== undefined
              ? req.query.isActive === "true"
              : undefined,
        },
        page,
        pageSize,
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

  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = this.parseParamId(req.params.id, "audience group ID");

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

  delete = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = this.parseParamId(req.params.id, "audience group ID");

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

  resolveMembers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = this.parseParamId(req.params.id, "audience group ID");
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

  matchesEmployee = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = this.parseParamId(req.params.id, "audience group ID");
      const employeeId = req.params.employeeId;

      if (!employeeId?.trim()) {
        throw new ValidationError("Employee ID is required.");
      }

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

  createRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = this.parseParamId(req.params.id, "audience group ID");

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

  findRules = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = this.parseParamId(req.params.id, "audience group ID");

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

  updateRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = this.parseParamId(req.params.id, "audience group ID");
      const ruleId = this.parseParamId(req.params.ruleId, "rule ID");

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

  deleteRule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const audienceGroupId = this.parseParamId(req.params.id, "audience group ID");
      const ruleId = this.parseParamId(req.params.ruleId, "rule ID");

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