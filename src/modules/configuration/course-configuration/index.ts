import prisma from "../../../config/database.js"; 
import { CourseConfigurationRepository } from "./course-configuration.repository.js";
import { CourseConfigurationService } from "./course-configuration.service.js";
import { CourseConfigurationController } from "./course-configuration.controller.js";
import { courseConfigurationRoutes } from "./course-configuration.routes.js";

// ============================================================================
// 1. Dependency Injection & Wiring
// ============================================================================

const repository = new CourseConfigurationRepository(prisma);
const service = new CourseConfigurationService(repository);
const controller = new CourseConfigurationController(service);
const router = courseConfigurationRoutes(controller);

// Export router as default for easy mounting in routes/index.ts
export default router;
