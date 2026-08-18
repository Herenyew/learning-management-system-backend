import prisma from "../../../../config/database.js";
import { BadgeRepository } from "./badge-configuration.repository.js";
import { BadgeService } from "./badge-configuration.service.js";
import { BadgeController } from "./badge-configuration.controller.js";
import { badgeConfigurationRoutes } from "./badge-configuration.routes.js";

export * from "./badge-configuration.dto.js";
export * from "./badge-configuration.repository.js";
export * from "./badge-configuration.service.js";
export * from "./badge-configuration.controller.js";
export * from "./badge-configuration.routes.js";

const repository = new BadgeRepository(prisma);
const service = new BadgeService(repository, prisma);
const controller = new BadgeController(service);

export default badgeConfigurationRoutes(controller);
