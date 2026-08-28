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
      // #region agent log
      fetch("http://127.0.0.1:7830/ingest/abbebdd7-508e-4568-abae-0d46bcb99c33",{method:"POST",headers:{"Content-Type":"application/json","X-Debug-Session-Id":"22a059"},body:JSON.stringify({sessionId:"22a059",location:"custom-fields.controller.ts:getCustomFields",message:"custom fields list shape",hypothesisId:"E",data:{keys:result?Object.keys(result as object):[],dataIsArray:Array.isArray((result as {data?:unknown}).data),firstKeys:Array.isArray((result as {data?:{label?:unknown}[]}).data)&&(result as {data:{label?:unknown;name?:unknown}[]}).data[0]?Object.keys((result as {data:object[]}).data[0]).slice(0,12):[]},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
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
