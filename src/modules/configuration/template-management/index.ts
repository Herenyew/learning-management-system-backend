import prisma from "../../../config/database.js";
import { TemplateManagementRepository } from "./template-management.repository.js";
import { TemplateManagementService } from "./template-management.service.js";
import { TemplateManagementController } from "./template-management.controller.js";
import { templateManagementRoutes } from "./template-management.routes.js";

const repository = new TemplateManagementRepository(prisma);
const service = new TemplateManagementService(repository);
const controller = new TemplateManagementController(service);
const router = templateManagementRoutes(controller);

export default router;
