import prisma from '../../../config/database.js';
import { SurveyConfigurationRepository } from './survey-configuration.repository.js';
import { SurveyConfigurationService } from './survey-configuration.service.js';
import { SurveyConfigurationController } from './survey-configuration.controller.js';
import surveyConfigurationRoutes from './survey-configuration.routes.js';

const repository = new SurveyConfigurationRepository(prisma as any);
const service = new SurveyConfigurationService(repository as any);
const controller = new SurveyConfigurationController(service as any);
const router = surveyConfigurationRoutes(controller as any);

export default router;

export { SurveyConfigurationRepository, SurveyConfigurationService, SurveyConfigurationController };
