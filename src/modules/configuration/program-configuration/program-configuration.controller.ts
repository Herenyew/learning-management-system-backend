import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import { ProgramConfigurationService } from "./program-configuration.service.js";
import type {
  ProgramCategoryQueryInput,
  ProgramTemplateQueryInput,
  ProgramTypeQueryInput,
  TaskTypeQueryInput,
} from "./program-configuration.types.js";


export class ProgramConfigurationController {
  constructor(private service: ProgramConfigurationService) {}


  // ==========================================
  // 1. ProgramType Handlers
  // ==========================================

  createProgramType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const result = await this.service.createProgramType(companyId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getProgramTypeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);

      const result = await this.service.getProgramTypeById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listProgramTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const result = await this.service.listProgramTypes(companyId, req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  updateProgramType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);

      const result = await this.service.updateProgramType(companyId, id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteProgramType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);

      await this.service.deleteProgramType(companyId, id);
      res.status(200).json({ success: true, message: "Program type deleted successfully." });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 2. ProgramCategory Handlers
  // ==========================================

  createProgramCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId, appUserId: userId } = req.user;
      const result = await this.service.createProgramCategory(companyId, userId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getProgramCategoryById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);

      const result = await this.service.getProgramCategoryById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listProgramCategories = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const result = await this.service.listProgramCategories(companyId, req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  updateProgramCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId, appUserId: userId } = req.user;
      const id = Number(req.params.id);

      const result = await this.service.updateProgramCategory(companyId, id, userId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteProgramCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);

      await this.service.deleteProgramCategory(companyId, id);
      res.status(200).json({ success: true, message: "Program category deleted successfully." });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 3. TaskType Handlers
  // ==========================================

  createTaskType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const result = await this.service.createTaskType(companyId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getTaskTypeById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);

      const result = await this.service.getTaskTypeById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listTaskTypes = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const result = await this.service.listTaskTypes(companyId, req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  updateTaskType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);

      const result = await this.service.updateTaskType(companyId, id, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteTaskType = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);

      await this.service.deleteTaskType(companyId, id);
      res.status(200).json({ success: true, message: "Task type deleted successfully." });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // 4. ProgramTemplate Handlers
  // ==========================================

  createTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId, appUserId: userId } = req.user;
      const result = await this.service.createTemplate(companyId, userId, req.body);
      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  getTemplateById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);

      const result = await this.service.getTemplateById(companyId, id);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  listTemplates = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const result = await this.service.listTemplates(companyId, req.query);
      res.status(200).json({ success: true, ...result });
    } catch (error) {
      next(error);
    }
  };

  updateTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { companyId, appUserId: userId } = req.user;
      const id = Number(req.params.id);

      const result = await this.service.updateTemplate(companyId, id, userId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  };

  deleteTemplate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = req.user.companyId;
      const id = Number(req.params.id);

      await this.service.deleteTemplate(companyId, id);
      res.status(200).json({ success: true, message: "Program template deleted successfully." });
    } catch (error) {
      next(error);
    }
  };
}
