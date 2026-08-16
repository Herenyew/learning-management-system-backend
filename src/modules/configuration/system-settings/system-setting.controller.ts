import { Request, Response, NextFunction } from 'express';
import { SystemSettingService } from './system-setting.service.js';

export class SystemSettingController {
  constructor(private svc: SystemSettingService) {}

  create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const userId = (req as any).ctx.userId;
      const data = req.body;
      const result = await this.svc.create(companyId, userId, data);
      res.status(201).json(result);
    } catch (err) {
      next(err);
    }
  };

  findMany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const query = req.query;
      const result = await this.svc.findMany(companyId, query);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  findById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const id = Number(req.params.id);
      const item = await this.svc.findById(companyId, id);
      if (!item) return res.status(404).send({ message: 'Not found' });
      res.json(item);
    } catch (err) {
      next(err);
    }
  };

  findByKey = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const key = String(req.params.key);
      const item = await this.svc.findByKey(companyId, key);
      if (!item) return res.status(404).send({ message: 'Not found' });
      res.json(item);
    } catch (err) {
      next(err);
    }
  };

  update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const userId = (req as any).ctx.userId;
      const id = Number(req.params.id);
      const data = req.body;
      const result = await this.svc.update(companyId, id, userId, data);
      res.json(result);
    } catch (err) {
      next(err);
    }
  };

  delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = (req as any).ctx.companyId;
      const id = Number(req.params.id);
      await this.svc.delete(companyId, id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
