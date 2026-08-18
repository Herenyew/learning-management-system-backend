import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../auth-request.js";
import type { XpRulesService } from "./xp-rules.service.js";
import type { CreateXpRuleInput, UpdateXpRuleInput } from "./xp-rules.types.js";

export class XpRulesController {
  constructor(private service: XpRulesService) {}

  createXpRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const body = req.body as CreateXpRuleInput;
      const result = await this.service.createXpRule(companyId, userId, body);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  listXpRules = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;
      const result = await this.service.listXpRules(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
  };

  getXpRuleById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getXpRuleById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  updateXpRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = Number(req.params.id);
      const body = req.body as UpdateXpRuleInput;
      const result = await this.service.updateXpRule(companyId, id, userId, body);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  deleteXpRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = Number(req.params.id);
      const result = await this.service.deleteXpRule(companyId, id, userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };
}
