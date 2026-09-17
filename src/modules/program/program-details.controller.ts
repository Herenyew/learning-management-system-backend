import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { ProgramDetailsService } from "./program-details.service.js";
import type { ProgramListQuery } from "./program-details.types.js";

export class ProgramDetailsController {
  constructor(private readonly service: ProgramDetailsService) { }

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const program = await this.service.create(
        req.user.companyId,
        req.user.appUserId,
        req.body,
      );
      res.status(201).json({ success: true, data: program });
    } catch (error) {
      next(error);
    }
  };

  listOwners = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const owners = await this.service.listOwners(req.user.companyId);
      res.status(200).json({ success: true, data: owners });
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.service.list(
        req.user.companyId,
        req.query as unknown as ProgramListQuery,
      );
      res.status(200).json({
        success: true,
        data: result.items,
        pagination: {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const program = await this.service.update(
        req.user.companyId,
        req.user.appUserId,
        Number(req.params.id),
        req.body,
      );
      res.status(200).json({ success: true, data: program });
    } catch (error) {
      next(error);
    }
  };

  archive = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const program = await this.service.archive(
        req.user.companyId,
        req.user.appUserId,
        Number(req.params.id),
      );
      res.status(200).json({ success: true, data: program });
    } catch (error) {
      next(error);
    }
  };

  restore = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const program = await this.service.restore(
        req.user.companyId,
        req.user.appUserId,
        Number(req.params.id),
      );
      res.status(200).json({ success: true, data: program });
    } catch (error) {
      next(error);
    }
  };

  duplicate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const program = await this.service.duplicate(
        req.user.companyId,
        req.user.appUserId,
        Number(req.params.id),
        req.body,
      );
      res.status(201).json({ success: true, data: program });
    } catch (error) {
      next(error);
    }
  };

  auditHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const history = await this.service.auditHistory(
        req.user.companyId,
        Number(req.params.id),
      );
      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const program = await this.service.getById(
        req.user.companyId,
        Number(req.params.id),
      );
      res.status(200).json({ success: true, data: program });
    } catch (error) {
      next(error);
    }
  };
}
