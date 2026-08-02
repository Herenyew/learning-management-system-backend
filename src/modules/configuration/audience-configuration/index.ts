import prisma from "../../../config/database.js";
import { AudienceRepository } from "./audience.repository.js";
import { AudienceService } from "./audience.service.js";
import { AudienceMatchingService } from "./audience.matching.service.js";
import { AudienceController } from "./audience.controller.js";
import { audienceRoutes } from "./audience.routes.js";

// 1. Initialize data layer with Prisma instance
const repository = new AudienceRepository(prisma);

// 2. Inject repository into domain services
const audienceService = new AudienceService(repository);
const audienceMatchingService = new AudienceMatchingService(prisma, repository);

// 3. Inject both services into the controller
const controller = new AudienceController(audienceService, audienceMatchingService);

// 4. Export the functional Router initialized with the controller instance
export default audienceRoutes(controller);