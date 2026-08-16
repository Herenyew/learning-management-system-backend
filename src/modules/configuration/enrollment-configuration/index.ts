import prisma from "../../../config/database.js";
import { EnrollmentConfigurationRepository } from "./enrollment-configuration.repository.js";
import { EnrollmentConfigurationService } from "./enrollment-configuration.service.js";
import { EnrollmentConfigurationController } from "./enrollment-configuration.controller.js";
import { enrollmentConfigurationRoutes } from "./enrollment-configuration.routes.js";

// ============================================================================
// 1. Dependency Injection & Wiring
// ============================================================================

const repository = new EnrollmentConfigurationRepository(prisma);
const service = new EnrollmentConfigurationService(repository);
const controller = new EnrollmentConfigurationController(service);
const router = enrollmentConfigurationRoutes(controller);

// Export router as default for easy mounting in routes/index.ts
export default router;