import prisma from "../../../config/database.js";
import { ProgramConfigurationRepository } from "./program-configuration.repository.js";
import { ProgramConfigurationService } from "./program-configuration.service.js";
import { ProgramConfigurationController } from "./program-configuration.controller.js";
import { programConfigurationRoutes } from "./program-configuration.routes.js";

// ============================================================================
// 1. Dependency Injection & Wiring
// ============================================================================

const repository = new ProgramConfigurationRepository(prisma);
const service = new ProgramConfigurationService(repository);
const controller = new ProgramConfigurationController(service);
const router = programConfigurationRoutes(controller);

// Export router as default for easy mounting in routes/index.ts
export default router;