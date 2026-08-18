import prisma from "../../../../config/database.js";
import { XpRulesRepository } from "./xp-rules.repository.js";
import { XpRulesService } from "./xp-rules.service.js";
import { XpRulesController } from "./xp-rules.controller.js";
import { xpRulesRoutes } from "./xp-rules.routes.js";

export * from "./xp-rules.dto.js";
export * from "./xp-rules.repository.js";
export * from "./xp-rules.service.js";
export * from "./xp-rules.controller.js";
export * from "./xp-rules.routes.js";

const repository = new XpRulesRepository(prisma);
const service = new XpRulesService(repository, prisma);
const controller = new XpRulesController(service);

export default xpRulesRoutes(controller);
