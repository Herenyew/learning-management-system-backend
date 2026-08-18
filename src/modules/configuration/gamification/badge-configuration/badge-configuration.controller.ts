import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../../auth-request.js";
import type { BadgeService } from "./badge-configuration.service.js";
import type { CreateBadgeInput, UpdateBadgeInput, CreateBadgeRuleInput, UpdateBadgeRuleInput } from "./badge-configuration.types.js";

export class BadgeController {
  constructor(private service: BadgeService) {}

  createBadge = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const body = req.body as CreateBadgeInput;
      const result = await this.service.createBadge(companyId, userId, body);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  listBadges = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const result = await this.service.listBadges(companyId, req.query);
      res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
  };

  getBadgeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getBadgeById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  updateBadge = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = Number(req.params.id);
      const body = req.body as UpdateBadgeInput;
      const result = await this.service.updateBadge(companyId, id, userId, body);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  deleteBadge = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = Number(req.params.id);
      const result = await this.service.deleteBadge(companyId, id, userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  // Rules
  createBadgeRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const badgeId = Number(req.params.id);
      const body = req.body as CreateBadgeRuleInput;
      const result = await this.service.createBadgeRule(companyId, badgeId, userId, body);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  listBadgeRules = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const badgeId = Number(req.params.id);
      const result = await this.service.listBadgeRules(companyId, badgeId, req.query);
      res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
  };

  updateBadgeRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const badgeId = Number(req.params.id);
      const ruleId = Number(req.params.ruleId);
      const body = req.body as UpdateBadgeRuleInput;
      const result = await this.service.updateBadgeRule(companyId, badgeId, ruleId, userId, body);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  deleteBadgeRule = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const badgeId = Number(req.params.id);
      const ruleId = Number(req.params.ruleId);
      const result = await this.service.deleteBadgeRule(companyId, badgeId, ruleId, userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };
}
