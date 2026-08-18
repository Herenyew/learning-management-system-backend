import type { NextFunction, Response } from "express";
import type { AuthRequest } from "../auth-request.js";
import type { ApprovalWorkflowsService } from "./approval-workflows.service.js";
import type {
  CreateApprovalWorkflowInput,
  UpdateApprovalWorkflowInput,
  ApprovalWorkflowFilterInput,
  CreateApprovalWorkflowStepInput,
  UpdateApprovalWorkflowStepInput,
} from "./approval-workflows.types.js";

export class ApprovalWorkflowsController {
  constructor(private service: ApprovalWorkflowsService) {}

  // ==========================================
  // Workflow Controllers
  // ==========================================

  createWorkflow = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const dto = req.body as CreateApprovalWorkflowInput;

      const result = await this.service.createWorkflow(
        companyId,
        userId,
        dto
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getWorkflows = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const filter = req.query;

      const result = await this.service.getWorkflows(companyId, filter);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  };

  getWorkflowById = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const id = parseInt(req.params.id, 10);

      const result = await this.service.getWorkflowById(companyId, id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateWorkflow = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = parseInt(req.params.id, 10);
      const dto = req.body as UpdateApprovalWorkflowInput;

      const result = await this.service.updateWorkflow(
        companyId,
        id,
        userId,
        dto
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteWorkflow = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.appUserId;
      const id = parseInt(req.params.id, 10);

      const result = await this.service.deleteWorkflow(
        companyId,
        id,
        userId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================================
  // Workflow Step Controllers
  // ==========================================

  createWorkflowStep = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const workflowId = parseInt(req.params.workflowId, 10);
      const dto = req.body as CreateApprovalWorkflowStepInput;

      const result = await this.service.createWorkflowStep(
        companyId,
        workflowId,
        dto
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getWorkflowSteps = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const workflowId = parseInt(req.params.workflowId, 10);

      const result = await this.service.getWorkflowSteps(
        companyId,
        workflowId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  updateWorkflowStep = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const workflowId = parseInt(req.params.workflowId, 10);
      const stepId = parseInt(req.params.stepId, 10);
      const dto = req.body as UpdateApprovalWorkflowStepInput;

      const result = await this.service.updateWorkflowStep(
        companyId,
        workflowId,
        stepId,
        dto
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteWorkflowStep = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const workflowId = parseInt(req.params.workflowId, 10);
      const stepId = parseInt(req.params.stepId, 10);

      const result = await this.service.deleteWorkflowStep(
        companyId,
        workflowId,
        stepId
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
