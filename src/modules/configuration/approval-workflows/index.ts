import prisma from "../../../config/database.js";
import { ApprovalWorkflowsRepository } from "./approval-workflows.repository.js";
import { ApprovalWorkflowsService } from "./approval-workflows.service.js";
import { ApprovalWorkflowsController } from "./approval-workflows.controller.js";
import { ApprovalWorkflowsRouter } from "./approval-workflows.routes.js";

  const repository = new ApprovalWorkflowsRepository(prisma);
  const service = new ApprovalWorkflowsService(repository, prisma);
  const controller = new ApprovalWorkflowsController(service);
  const router = ApprovalWorkflowsRouter(prisma);

export default router;