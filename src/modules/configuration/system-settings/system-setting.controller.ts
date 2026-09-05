import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import { SystemSettingService, type SystemSettingActor } from './system-setting.service.js';
import type { SettingCategory } from '@prisma/client';

export class SystemSettingController {
  constructor(private svc: SystemSettingService) {}

  /** Build the actor from the authenticated request (used for gating rules). */
  private actor(req: AuthRequest): SystemSettingActor {
    return {
      companyId: (req.user as any).companyId,
      appUserId: (req.user as any).appUserId ?? 0,
      permissions: (req.user as any).permissions ?? [],
    };
  }

  create = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await this.svc.create(this.actor(req), req.body);
      res.status(201).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  findMany = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const query = req.query;
      const result = await this.svc.findMany(this.actor(req).companyId, query);
      res.json({ success: true, data: result.items, meta: { total: result.total, page: result.page, pageSize: result.pageSize } });
    } catch (err) {
      next(err);
    }
  };

  listByCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const category = String(req.params.category) as SettingCategory;
      const items = await this.svc.listActiveByCategory(this.actor(req).companyId, category);
      res.json({ success: true, data: items });
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const item = await this.svc.findById(this.actor(req).companyId, id);
      if (!item) return res.status(404).json({ success: false, error: { message: 'Not found' } });
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  };

  findByKey = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const key = String(req.params.key);
      const item = await this.svc.findByKey(this.actor(req).companyId, key);
      if (!item) return res.status(404).json({ success: false, error: { message: 'Not found' } });
      res.json({ success: true, data: item });
    } catch (err) {
      next(err);
    }
  };

  /** Live branding palette — available to any authenticated user. */
  getBranding = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const branding = await this.svc.getBranding(this.actor(req).companyId);
      res.json({ success: true, data: branding });
    } catch (err) {
      next(err);
    }
  };

  update = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      const result = await this.svc.update(this.actor(req), id, req.body);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  bulkUpdate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const items = req.body.items;
      const result = await this.svc.bulkUpdate(this.actor(req), items);
      res.json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = Number(req.params.id);
      await this.svc.delete(this.actor(req), id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
