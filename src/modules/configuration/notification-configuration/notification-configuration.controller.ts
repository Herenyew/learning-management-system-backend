import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import type { NotificationConfigurationService } from "./notification-configuration.service.js";
import type {
  CreateNotificationModuleInput,
  UpdateNotificationModuleInput,
  NotificationModuleFilterInput,
  CreateNotificationEventInput,
  UpdateNotificationEventInput,
  NotificationEventFilterInput,
} from "./notification-configuration.types.js";

export class NotificationConfigurationController {
  constructor(
    private service: NotificationConfigurationService
  ) {}

  // ==========================================
  // 1. NotificationModule Handlers
  // ==========================================

  createNotificationModule = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const dto: CreateNotificationModuleInput = req.body;
      const result = await this.service.createNotificationModule(companyId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listNotificationModules = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;
      const result = await this.service.listNotificationModules(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getNotificationModuleById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getNotificationModuleById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateNotificationModule = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const dto: UpdateNotificationModuleInput = req.body;
      const result = await this.service.updateNotificationModule(
        companyId,
        id,
        dto
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deactivateNotificationModule = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.deactivateNotificationModule(
        companyId,
        id
      );
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 2. NotificationEvent Handlers
  // ==========================================

  createNotificationEvent = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const dto: CreateNotificationEventInput = req.body;
      const result = await this.service.createNotificationEvent(companyId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listNotificationEvents = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;
      const result = await this.service.listNotificationEvents(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getNotificationEventById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getNotificationEventById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateNotificationEvent = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const dto: UpdateNotificationEventInput = req.body;
      const result = await this.service.updateNotificationEvent(
        companyId,
        id,
        dto
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deactivateNotificationEvent = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.deactivateNotificationEvent(
        companyId,
        id
      );
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };
}
