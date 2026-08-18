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
  CreateNotificationTemplateInput,
  UpdateNotificationTemplateInput,
  NotificationTemplateFilterInput,
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

  // ==========================================
  // 3. NotificationTemplate Handlers
  // ==========================================

  createTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const dto: CreateNotificationTemplateInput = req.body;
      const result = await this.service.createTemplate(companyId, userId, dto);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listTemplates = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;
      const result = await this.service.listTemplates(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  getTemplateById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getTemplateById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  updateTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = Number(req.params.id);
      const dto: UpdateNotificationTemplateInput = req.body;
      const result = await this.service.updateTemplate(
        companyId,
        id,
        userId,
        dto
      );
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteTemplate = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.deleteTemplate(companyId, id);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };
}
