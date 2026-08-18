import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import type { CustomFieldsService } from "./custom-fields.service.js";
import type { CreateCustomFieldInput, UpdateCustomFieldInput } from "./custom-fields.types.js";

export class CustomFieldsController {
  constructor(private service: CustomFieldsService) {}

  createCustomField = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const body = req.body as CreateCustomFieldInput;
      const result = await this.service.createCustomField(companyId, userId, body);
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  getCustomFields = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const query = req.query;
      const result = await this.service.getCustomFields(companyId, query);
      res.status(200).json({ success: true, ...result });
    } catch (err) { next(err); }
  };

  getCustomFieldById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);
      const result = await this.service.getCustomFieldById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  updateCustomField = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = Number(req.params.id);
      const body = req.body as UpdateCustomFieldInput;
      const result = await this.service.updateCustomField(companyId, id, userId, body);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };

  deleteCustomField = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = Number(req.params.id);
      const result = await this.service.deleteCustomField(companyId, id, userId);
      res.status(200).json({ success: true, data: result });
    } catch (err) { next(err); }
  };
}
