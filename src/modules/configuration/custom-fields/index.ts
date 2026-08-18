import prisma from "../../../config/database.js";
import { CustomFieldsRepository } from "./custom-fields.repository.js";
import { CustomFieldsService } from "./custom-fields.service.js";
import { CustomFieldsController } from "./custom-fields.controller.js";
import { customFieldsRoutes } from "./custom-fields.routes.js";

export * from "./custom-fields.dto.js";
export * from "./custom-fields.repository.js";
export * from "./custom-fields.service.js";
export * from "./custom-fields.controller.js";
export * from "./custom-fields.routes.js";

const repository = new CustomFieldsRepository(prisma);
const service = new CustomFieldsService(repository, prisma);
const controller = new CustomFieldsController(service);

export default customFieldsRoutes(controller);
