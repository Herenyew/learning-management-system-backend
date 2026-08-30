import { Router } from 'express';
import { SurveyConfigurationController } from './survey-configuration.controller.js';
// Common Middlewares
import { authenticate } from '../../auth/auth.middleware.js';
import { requirePermission } from '../../../common/auth/permission.middleware.js';
import {
  validateBody,
  validateQuery,
  validateParams,
} from '../../../common/middlewares/validation.middleware.js';
import { Permissions } from '../../../common/constants/permission.constant.js';
import { z } from 'zod';
import {
  CreateSurveyQuestionTypeSchema,
  UpdateSurveyQuestionTypeSchema,
  CreateSurveyTemplateSchema,
  UpdateSurveyTemplateSchema,
  CreateSurveyTemplateQuestionSchema,
  UpdateSurveyTemplateQuestionSchema,
  ReorderSurveyTemplateQuestionsSchema,
} from './survey-configuration.dto.js';

const idParamSchema = z.object({ id: z.string().transform((v) => parseInt(v, 10)) });

const templateIdParamSchema = z.object({ templateId: z.string().transform((v) => parseInt(v, 10)) });
const questionParamSchema = z.object({
  templateId: z.string().transform((v) => parseInt(v, 10)),
  id: z.string().transform((v) => parseInt(v, 10)),
});

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


  // Survey Template Questions (Dynamic Question Builder)
  // Template questions are part of the template, so they reuse the template
  // update/view permissions.
  router.post(
    '/templates/:templateId/questions',
    requirePermission(Permissions.SURVEY_TEMPLATE_UPDATE),
    validateParams(templateIdParamSchema),
    validateBody(CreateSurveyTemplateQuestionSchema),
    controller.createTemplateQuestion.bind(controller)
  );

  router.get(
    '/templates/:templateId/questions',
    requirePermission(Permissions.SURVEY_TEMPLATE_VIEW),
    validateParams(templateIdParamSchema),
    controller.findTemplateQuestions.bind(controller)
  );

  router.get(
    '/templates/:templateId/questions/:id',
    requirePermission(Permissions.SURVEY_TEMPLATE_VIEW),
    validateParams(questionParamSchema),
    controller.findTemplateQuestionById.bind(controller)
  );

  router.put(
    '/templates/:templateId/questions/:id',
    requirePermission(Permissions.SURVEY_TEMPLATE_UPDATE),
    validateParams(questionParamSchema),
    validateBody(UpdateSurveyTemplateQuestionSchema),
    controller.updateTemplateQuestion.bind(controller)
  );

  router.delete(
    '/templates/:templateId/questions/:id',
    requirePermission(Permissions.SURVEY_TEMPLATE_UPDATE),
    validateParams(questionParamSchema),
    controller.deleteTemplateQuestion.bind(controller)
  );

  router.patch(
    '/templates/:templateId/questions/reorder',
    requirePermission(Permissions.SURVEY_TEMPLATE_UPDATE),
    validateParams(templateIdParamSchema),
    validateBody(ReorderSurveyTemplateQuestionsSchema),
    controller.reorderTemplateQuestions.bind(controller)
  );

  return router;
}
