import prisma from "../../../../config/database.js";
import { LearningLevelsRepository } from "./learning-levels.repository.js";
import { LearningLevelsService } from "./learning-levels.service.js";
import { LearningLevelsController } from "./learning-levels.controller.js";
import { learningLevelsRoutes } from "./learning-levels.routes.js";

export * from "./learning-levels.dto.js";
export * from "./learning-levels.repository.js";
export * from "./learning-levels.service.js";
export * from "./learning-levels.controller.js";
export * from "./learning-levels.routes.js";

const repository = new LearningLevelsRepository(prisma);
const service = new LearningLevelsService(repository, prisma);
const controller = new LearningLevelsController(service);

export default learningLevelsRoutes(controller);
