import { Router } from 'express';
import { SurveyConfigurationController } from './survey-configuration.controller.js';
// Common Middlewares
import { authenticate } from '../../../common/auth/auth.middleware.js';
import { requirePermission } from '../../../common/auth/permission.middleware.js';
import {
  validateBody,
  validateQuery,
  validateParams,
} from '../../../common/middlewares/validation.middleware.js';
import { Permissions } from '../../../common/constants/permission.constant.js';
import { z } from 'zod';
import { CreateSurveyQuestionTypeSchema, UpdateSurveyQuestionTypeSchema, CreateSurveyTemplateSchema, UpdateSurveyTemplateSchema } from './survey-configuration.dto.js';

const idParamSchema = z.object({ id: z.string().transform((v) => parseInt(v, 10)) });

export default function routes(controller: SurveyConfigurationController) {
  const router = Router();

  // Protect all configuration routes
  router.use(authenticate);

  // Survey Question Types
  router.post(
    '/survey-question-types',
    requirePermission(Permissions.SURVEY_QUESTION_TYPE_CREATE),
    validateBody(CreateSurveyQuestionTypeSchema),
    controller.createSurveyQuestionType.bind(controller)
  );

  router.get(
    '/survey-question-types',
    requirePermission(Permissions.SURVEY_QUESTION_TYPE_VIEW),
    validateQuery(CreateSurveyQuestionTypeSchema.partial ? (CreateSurveyQuestionTypeSchema.partial() as any) : undefined),
    controller.findSurveyQuestionTypes.bind(controller)
  );

  router.get(
    '/survey-question-types/:id',
    requirePermission(Permissions.SURVEY_QUESTION_TYPE_VIEW),
    validateParams(idParamSchema),
    controller.findSurveyQuestionTypeById.bind(controller)
  );

  router.put(
    '/survey-question-types/:id',
    requirePermission(Permissions.SURVEY_QUESTION_TYPE_UPDATE),
    validateParams(idParamSchema),
    validateBody(UpdateSurveyQuestionTypeSchema),
    controller.updateSurveyQuestionType.bind(controller)
  );

  router.delete(
    '/survey-question-types/:id',
    requirePermission(Permissions.SURVEY_QUESTION_TYPE_DELETE),
    validateParams(idParamSchema),
    controller.deleteSurveyQuestionType.bind(controller)
  );

  // Survey Templates
  // Survey Templates
  router.post(
    '/templates',
    requirePermission(Permissions.SURVEY_TEMPLATE_CREATE),
    validateBody(CreateSurveyTemplateSchema),
    controller.createTemplate.bind(controller)
  );

  router.get(
    '/templates',
    requirePermission(Permissions.SURVEY_TEMPLATE_VIEW),
    controller.findTemplates.bind(controller)
  );

  router.get(
    '/templates/:id',
    requirePermission(Permissions.SURVEY_TEMPLATE_VIEW),
    validateParams(idParamSchema),
    controller.findTemplateById.bind(controller)
  );

  router.put(
    '/templates/:id',
    requirePermission(Permissions.SURVEY_TEMPLATE_UPDATE),
    validateParams(idParamSchema),
    validateBody(UpdateSurveyTemplateSchema),
    controller.updateTemplate.bind(controller)
  );

  router.delete(
    '/templates/:id',
    requirePermission(Permissions.SURVEY_TEMPLATE_DELETE),
    validateParams(idParamSchema),
    controller.deleteTemplate.bind(controller)
  );

  return router;
}
