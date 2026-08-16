import prisma from "../../../config/database.js";
import { TrainingEffectivenessRepository } from "./training-effectiveness.repository.js";
import { TrainingEffectivenessService } from "./training-effectiveness.service.js";
import { TrainingEffectivenessController } from "./training-effectiveness.controller.js";
import { TrainingEffectivenessRouter } from "./training-effectiveness.routes.js";

export * from "./training-effectiveness.dto.js";
export * from "./training-effectiveness.repository.js";
export * from "./training-effectiveness.service.js";
export * from "./training-effectiveness.controller.js";
export * from "./training-effectiveness.routes.js";

  const repository = new TrainingEffectivenessRepository(prisma);
  const service = new TrainingEffectivenessService(repository, prisma);
  const controller = new TrainingEffectivenessController(service);
  const router = TrainingEffectivenessRouter(prisma);

export default router;