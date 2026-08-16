import { Request, Response, NextFunction } from "express";
import { ApprovalWorkflowsService } from "./approval-workflows.service.js";
import {
  CreateApprovalWorkflowDto,
  UpdateApprovalWorkflowDto,
  ApprovalWorkflowFilterDto,
  CreateApprovalWorkflowStepDto,
  UpdateApprovalWorkflowStepDto,
} from "./approval-workflows.dto.js";

export class ApprovalWorkflowsController {
  constructor(private service: ApprovalWorkflowsService) {}

  // ==========================================
  // Workflow Controllers
  // ==========================================

  createWorkflow = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
      const dto = req.body as CreateApprovalWorkflowDto;

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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const filter = req.query as unknown as ApprovalWorkflowFilterDto;

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
    req: Request,
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
      const id = parseInt(req.params.id, 10);
      const dto = req.body as UpdateApprovalWorkflowDto;

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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const userId = req.user.id;
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const workflowId = parseInt(req.params.workflowId, 10);
      const dto = req.body as CreateApprovalWorkflowStepDto;

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
    req: Request,
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
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const companyId = req.user.companyId;
      const workflowId = parseInt(req.params.workflowId, 10);
      const stepId = parseInt(req.params.stepId, 10);
      const dto = req.body as UpdateApprovalWorkflowStepDto;

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
    req: Request,
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