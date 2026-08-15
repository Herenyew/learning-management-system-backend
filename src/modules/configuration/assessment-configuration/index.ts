import { Router } from "express";
import prisma from "../../../config/database.js";
import { AssessmentConfigurationRepository } from "./assessment-configuration.repository.js";
import { AssessmentConfigurationService } from "./assessment-configuration.service.js";
import { AssessmentConfigurationController } from "./assessment-configuration.controller.js";
import { assessmentConfigurationRoutes } from "./assessment-configuration.routes.js";

const repository = new AssessmentConfigurationRepository(prisma);
const service = new AssessmentConfigurationService(repository);
const controller = new AssessmentConfigurationController(service);
const router = assessmentConfigurationRoutes(controller);

export default router;

