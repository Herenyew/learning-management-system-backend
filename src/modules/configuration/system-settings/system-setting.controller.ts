import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import { SystemSettingService } from './system-setting.service.js';

export class SystemSettingController {
  constructor(private svc: SystemSettingService) {}

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const data = req.body;
      const result = await this.svc.create(companyId, userId, data);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  findMany = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;
      const result = await this.svc.findMany(companyId, query);
      const items = Array.isArray(result) ? result : (result as any).items ?? result;
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const item = await this.svc.findById(companyId, id);
      if (!item) return res.status(404).json({ success: false, error: { message: 'Not found' } });
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  };

  findByKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const key = String(req.params.key);
      const item = await this.svc.findByKey(companyId, key);
      if (!item) return res.status(404).json({ success: false, error: { message: 'Not found' } });
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = Number(req.params.id);
      const data = req.body;
      const result = await this.svc.update(companyId, id, userId, data);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      await this.svc.delete(companyId, id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
