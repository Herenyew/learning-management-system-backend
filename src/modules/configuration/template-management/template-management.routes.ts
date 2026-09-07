import { Router } from "express";
import { TemplateManagementController } from "./template-management.controller.js";
import { authenticate } from "../../auth/auth.middleware.js";
import { requirePermission } from "../../../common/auth/permission.middleware.js";
import { validateBody, validateQuery, validateParams } from "../../../common/middlewares/validation.middleware.js";
import { Permissions } from "../../../common/constants/permission.constant.js";
import { z } from "zod";
import {
  createCourseTemplateSchema,
  updateCourseTemplateSchema,
  courseTemplateFilterQuerySchema,
  createProgramTemplateSchema,
  updateProgramTemplateSchema,
  programTemplateQuerySchema,
  createAssessmentTemplateSchema,
  updateAssessmentTemplateSchema,
    assessmentTemplateFilterSchema,
  CreateSurveyTemplateSchema,
  UpdateSurveyTemplateSchema,
  surveyTemplateQuerySchema,
  CreateSurveyTemplateQuestionSchema,
  UpdateSurveyTemplateQuestionSchema,
  ReorderSurveyTemplateQuestionsSchema,
  CreateCertificateTemplateSchema,
  UpdateCertificateTemplateSchema,
  CertificateTemplatePaginationSchema,
  CreateCertificateTemplateSignerSchema,
  UpdateCertificateTemplateSignerSchema,
  createNotificationTemplateSchema,
  updateNotificationTemplateSchema,
  notificationTemplateFilterSchema,
} from "./template-management.dto.js";

const idParamSchema = z.object({ id: z.coerce.number().int().positive() });
const templateQuestionIdParamSchema = z.object({
  templateId: z.coerce.number().int().positive(),
  questionId: z.coerce.number().int().positive(),
});
const signerIdParamSchema = z.object({
  templateId: z.coerce.number().int().positive(),
  signerId: z.coerce.number().int().positive(),
});

export function templateManagementRoutes(controller: TemplateManagementController): Router {
  const router = Router();
  router.use(authenticate);

  // ─── 1. Course Templates ───────────────────────────────────────────────────
  router.post(
    "/course-templates",
    requirePermission(Permissions.COURSE_TEMPLATE_CREATE),
    validateBody(createCourseTemplateSchema),
    controller.createCourseTemplate.bind(controller),
  );
  router.get(
    "/course-templates",
    requirePermission(Permissions.COURSE_TEMPLATE_VIEW),
    validateQuery(courseTemplateFilterQuerySchema),
    controller.listCourseTemplates.bind(controller),
  );
  router.get(
    "/course-templates/:id",
    requirePermission(Permissions.COURSE_TEMPLATE_VIEW),
    validateParams(idParamSchema),
    controller.getCourseTemplateById.bind(controller),
  );
  router.put(
    "/course-templates/:id",
    requirePermission(Permissions.COURSE_TEMPLATE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateCourseTemplateSchema),
    controller.updateCourseTemplate.bind(controller),
  );
  router.delete(
    "/course-templates/:id",
    requirePermission(Permissions.COURSE_TEMPLATE_DELETE),
    validateParams(idParamSchema),
    controller.deleteCourseTemplate.bind(controller),
  );

  // ─── 2. Program Templates ──────────────────────────────────────────────────
  router.post(
    "/program-templates",
    requirePermission(Permissions.PROGRAM_TEMPLATE_CREATE),
    validateBody(createProgramTemplateSchema),
    controller.createProgramTemplate.bind(controller),
  );
  router.get(
    "/program-templates",
    requirePermission(Permissions.PROGRAM_TEMPLATE_VIEW),
    validateQuery(programTemplateQuerySchema),
    controller.listProgramTemplates.bind(controller),
  );
  router.get(
    "/program-templates/:id",
    requirePermission(Permissions.PROGRAM_TEMPLATE_VIEW),
    validateParams(idParamSchema),
    controller.getProgramTemplateById.bind(controller),
  );
  router.put(
    "/program-templates/:id",
    requirePermission(Permissions.PROGRAM_TEMPLATE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateProgramTemplateSchema),
    controller.updateProgramTemplate.bind(controller),
  );
  router.delete(
    "/program-templates/:id",
    requirePermission(Permissions.PROGRAM_TEMPLATE_DELETE),
    validateParams(idParamSchema),
    controller.deleteProgramTemplate.bind(controller),
  );

  // ─── 3. Assessment Templates ───────────────────────────────────────────────
  router.post(
    "/assessment-templates",
    requirePermission(Permissions.ASSESSMENT_TEMPLATE_CREATE),
    validateBody(createAssessmentTemplateSchema),
    controller.createAssessmentTemplate.bind(controller),
  );
  router.get(
    "/assessment-templates",
    requirePermission(Permissions.ASSESSMENT_TEMPLATE_VIEW),
    validateQuery(assessmentTemplateFilterSchema),
    controller.listAssessmentTemplates.bind(controller),
  );
  router.get(
    "/assessment-templates/:id",
    requirePermission(Permissions.ASSESSMENT_TEMPLATE_VIEW),
    validateParams(idParamSchema),
    controller.getAssessmentTemplateById.bind(controller),
  );
  router.put(
    "/assessment-templates/:id",
    requirePermission(Permissions.ASSESSMENT_TEMPLATE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateAssessmentTemplateSchema),
    controller.updateAssessmentTemplate.bind(controller),
  );
  router.delete(
    "/assessment-templates/:id",
    requirePermission(Permissions.ASSESSMENT_TEMPLATE_DELETE),
    validateParams(idParamSchema),
    controller.deleteAssessmentTemplate.bind(controller),
  );

  // ─── 4. Survey Templates (+ dynamic question builder) ──────────────────────
  router.post(
    "/survey-templates",
    requirePermission(Permissions.SURVEY_TEMPLATE_CREATE),
        validateBody(CreateSurveyTemplateSchema),
    controller.createSurveyTemplate.bind(controller),
  );
  router.get(
    "/survey-templates",
    requirePermission(Permissions.SURVEY_TEMPLATE_VIEW),
    validateQuery(surveyTemplateQuerySchema),
    controller.listSurveyTemplates.bind(controller),
  );
  router.get(
    "/survey-templates/:id",
    requirePermission(Permissions.SURVEY_TEMPLATE_VIEW),
    validateParams(idParamSchema),
    controller.getSurveyTemplateById.bind(controller),
  );
  router.put(
    "/survey-templates/:id",
    requirePermission(Permissions.SURVEY_TEMPLATE_UPDATE),
    validateParams(idParamSchema),
    validateBody(UpdateSurveyTemplateSchema),
    controller.updateSurveyTemplate.bind(controller),
  );
  router.delete(
    "/survey-templates/:id",
    requirePermission(Permissions.SURVEY_TEMPLATE_DELETE),
    validateParams(idParamSchema),
    controller.deleteSurveyTemplate.bind(controller),
  );

  // Survey Template Questions (Dynamic Question Builder)
  router.post(
    "/survey-templates/:templateId/questions",
    requirePermission(Permissions.SURVEY_TEMPLATE_CREATE),
    validateParams(z.object({ templateId: z.coerce.number().int().positive() })),
    validateBody(CreateSurveyTemplateQuestionSchema),
    controller.createSurveyTemplateQuestion.bind(controller),
  );
  router.get(
    "/survey-templates/:templateId/questions",
    requirePermission(Permissions.SURVEY_TEMPLATE_VIEW),
    validateParams(z.object({ templateId: z.coerce.number().int().positive() })),
    controller.getSurveyTemplateQuestions.bind(controller),
  );
  router.get(
    "/survey-templates/:templateId/questions/:questionId",
    requirePermission(Permissions.SURVEY_TEMPLATE_VIEW),
    validateParams(templateQuestionIdParamSchema),
    controller.getSurveyTemplateQuestionById.bind(controller),
  );
  router.put(
    "/survey-templates/:templateId/questions/:questionId",
    requirePermission(Permissions.SURVEY_TEMPLATE_UPDATE),
    validateParams(templateQuestionIdParamSchema),
        validateBody(UpdateSurveyTemplateQuestionSchema),
    controller.updateSurveyTemplateQuestion.bind(controller),
  );
  router.delete(
    "/survey-templates/:templateId/questions/:questionId",
    requirePermission(Permissions.SURVEY_TEMPLATE_DELETE),
    validateParams(templateQuestionIdParamSchema),
    controller.deleteSurveyTemplateQuestion.bind(controller),
  );
  router.put(
    "/survey-templates/:templateId/questions/reorder",
    requirePermission(Permissions.SURVEY_TEMPLATE_UPDATE),
    validateParams(z.object({ templateId: z.coerce.number().int().positive() })),
    validateBody(ReorderSurveyTemplateQuestionsSchema),
    controller.reorderSurveyTemplateQuestions.bind(controller),
  );

  // ─── 5. Certificate Templates (+ signers) ──────────────────────────────────
  router.post(
    "/certificate-templates",
    requirePermission(Permissions.CERTIFICATE_TEMPLATE_CREATE),
    validateBody(CreateCertificateTemplateSchema),
    controller.createCertificateTemplate.bind(controller),
  );
  router.get(
    "/certificate-templates",
    requirePermission(Permissions.CERTIFICATE_TEMPLATE_VIEW),
    validateQuery(CertificateTemplatePaginationSchema),
    controller.listCertificateTemplates.bind(controller),
  );
  router.get(
    "/certificate-templates/:id",
    requirePermission(Permissions.CERTIFICATE_TEMPLATE_VIEW),
    validateParams(idParamSchema),
    controller.getCertificateTemplateById.bind(controller),
  );
  router.put(
    "/certificate-templates/:id",
    requirePermission(Permissions.CERTIFICATE_TEMPLATE_UPDATE),
    validateParams(idParamSchema),
    validateBody(UpdateCertificateTemplateSchema),
    controller.updateCertificateTemplate.bind(controller),
  );
  router.delete(
    "/certificate-templates/:id",
    requirePermission(Permissions.CERTIFICATE_TEMPLATE_DELETE),
    validateParams(idParamSchema),
    controller.deleteCertificateTemplate.bind(controller),
  );

  // Certificate Template Signers
  router.post(
    "/certificate-templates/:templateId/signers",
    requirePermission(Permissions.CERTIFICATE_TEMPLATE_SIGNER_CREATE),
    validateParams(z.object({ templateId: z.coerce.number().int().positive() })),
    validateBody(CreateCertificateTemplateSignerSchema),
    controller.createCertificateTemplateSigner.bind(controller),
  );
  router.get(
    "/certificate-templates/:templateId/signers",
    requirePermission(Permissions.CERTIFICATE_TEMPLATE_SIGNER_VIEW),
    validateParams(z.object({ templateId: z.coerce.number().int().positive() })),
    controller.getCertificateTemplateSigners.bind(controller),
  );
  router.put(
    "/certificate-templates/:templateId/signers/:signerId",
    requirePermission(Permissions.CERTIFICATE_TEMPLATE_SIGNER_UPDATE),
    validateParams(signerIdParamSchema),
    validateBody(UpdateCertificateTemplateSignerSchema),
    controller.updateCertificateTemplateSigner.bind(controller),
  );
  router.delete(
    "/certificate-templates/:templateId/signers/:signerId",
    requirePermission(Permissions.CERTIFICATE_TEMPLATE_SIGNER_DELETE),
    validateParams(signerIdParamSchema),
    controller.deleteCertificateTemplateSigner.bind(controller),
  );

  // ─── 6. Notification Templates ─────────────────────────────────────────────
  router.post(
    "/notification-templates",
    requirePermission(Permissions.NOTIFICATION_TEMPLATE_CREATE),
    validateBody(createNotificationTemplateSchema),
    controller.createNotificationTemplate.bind(controller),
  );
  router.get(
    "/notification-templates",
    requirePermission(Permissions.NOTIFICATION_TEMPLATE_VIEW),
    validateQuery(notificationTemplateFilterSchema),
    controller.listNotificationTemplates.bind(controller),
  );
  router.get(
    "/notification-templates/:id",
    requirePermission(Permissions.NOTIFICATION_TEMPLATE_VIEW),
    validateParams(idParamSchema),
    controller.getNotificationTemplateById.bind(controller),
  );
  router.put(
    "/notification-templates/:id",
    requirePermission(Permissions.NOTIFICATION_TEMPLATE_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateNotificationTemplateSchema),
    controller.updateNotificationTemplate.bind(controller),
  );
  router.delete(
    "/notification-templates/:id",
    requirePermission(Permissions.NOTIFICATION_TEMPLATE_DELETE),
    validateParams(idParamSchema),
    controller.deleteNotificationTemplate.bind(controller),
  );

  // ─── Helper: Users & Employees (for dropdowns) ────────────────────────────
  router.get(
    "/users",
    requirePermission(Permissions.COURSE_TEMPLATE_VIEW),
    controller.listUsers.bind(controller),
  );
  router.get(
    "/employees",
    requirePermission(Permissions.PROGRAM_TEMPLATE_VIEW),
    controller.listEmployees.bind(controller),
  );

  return router;
}
