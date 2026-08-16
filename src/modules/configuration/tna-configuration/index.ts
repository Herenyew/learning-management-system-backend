import prisma from "../../../config/database.js";
import { TnaConfigurationRepository } from "./tna-configuration.repository.js";
import { TnaConfigurationService } from "./tna-configuration.service.js";
import { TnaConfigurationController } from "./tna-configuration.controller.js";
import { TnaConfigurationRouter } from "./tna-configuration.routes.js";

  const repository = new TnaConfigurationRepository(prisma);
  const service = new TnaConfigurationService(repository);
  const controller = new TnaConfigurationController(service);
  const router = TnaConfigurationRouter(controller);

export default router;