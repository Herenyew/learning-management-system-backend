import type { NextFunction, Response } from "express";
import type { AuthenticatedRequest } from "../auth/auth.types.js";
import type { ProgramCompositionService } from "./program-composition.service.js";

export class ProgramCompositionController {
  constructor(private readonly service: ProgramCompositionService) { }

  private context(req: AuthenticatedRequest) {
    return { companyId: req.user.companyId, userId: req.user.appUserId };
  }

  getTargetAudiences = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getTargetAudiences(req.user.companyId, Number(req.params.programId));
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  replaceTargetAudiences = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.replaceTargetAudiences(this.context(req), Number(req.params.programId), req.body);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  getCohorts = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getCohorts(req.user.companyId, Number(req.params.programId));
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  createCohort = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.createCohort(this.context(req), Number(req.params.programId), req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  };

  updateCohort = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.updateCohort(this.context(req), Number(req.params.programId), Number(req.params.itemId), req.body);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  deleteCohort = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.deleteCohort(this.context(req), Number(req.params.programId), Number(req.params.itemId));
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  getCourses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getCourses(req.user.companyId, Number(req.params.programId));
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  createCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.createCourse(this.context(req), Number(req.params.programId), req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  };

  updateCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.updateCourse(this.context(req), Number(req.params.programId), Number(req.params.itemId), req.body);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  orderCourses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.orderCourses(this.context(req), Number(req.params.programId), req.body);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  deleteCourse = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.deleteCourse(this.context(req), Number(req.params.programId), Number(req.params.itemId));
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  getTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getTasks(req.user.companyId, Number(req.params.programId));
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  createTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.createTask(this.context(req), Number(req.params.programId), req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  };

  updateTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.updateTask(this.context(req), Number(req.params.programId), Number(req.params.itemId), req.body);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  orderTasks = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.orderTasks(this.context(req), Number(req.params.programId), req.body);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  deleteTask = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.deleteTask(this.context(req), Number(req.params.programId), Number(req.params.itemId));
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  getMilestones = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.getMilestones(req.user.companyId, Number(req.params.programId));
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  createMilestone = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.createMilestone(this.context(req), Number(req.params.programId), req.body);
      res.status(201).json({ success: true, data });
    } catch (error) { next(error); }
  };

  updateMilestone = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.updateMilestone(this.context(req), Number(req.params.programId), Number(req.params.itemId), req.body);
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };

  deleteMilestone = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const data = await this.service.deleteMilestone(this.context(req), Number(req.params.programId), Number(req.params.itemId));
      res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  };
}
