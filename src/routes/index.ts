// src/routes/index.ts
import { Router } from "express";
import healthRoutes from "../modules/health/health.route.js";

// ─── Auth Routes ──────────────────────────────────────────────────────────────
import { createAuthRoutes, AuthController, AuthMiddleware } from "../modules/auth/index.js";
import { getAuthService } from "../common/bootstrap/auth.bootstrap.js";

// ─── Configuration Modules ───────────────────────────────────────────────────
import audienceRoutes from "../modules/configuration/audience-configuration/index.js";
import courseConfigRoutes from "../modules/configuration/course-configuration/index.js";
import assessmentConfigRoutes from "../modules/configuration/assessment-configuration/index.js";
import programConfigRoutes from "../modules/configuration/program-configuration/index.js";
import enrollmentConfigRoutes from "../modules/configuration/enrollment-configuration/index.js";
import notificationConfigRoutes from "../modules/configuration/notification-configuration/index.js";
import certificateConfigRoutes from "../modules/configuration/certificate-configuration/index.js";
import tnaConfigRoutes from "../modules/configuration/tna-configuration/index.js";
import trainingEffectivenessConfigRoutes from "../modules/configuration/training-effectiveness/index.js";
import approvalWorkflowsConfigRoutes from "../modules/configuration/approval-workflows/index.js";
import customFieldsConfigRoutes from "../modules/configuration/custom-fields/index.js";
import learningLevelConfigRoutes from "../modules/configuration/gamification/learning-levels/index.js";
import xpRuleConfigRoutes from "../modules/configuration/gamification/xp-rules/index.js";
import badgeConfigRoutes from "../modules/configuration/gamification/badge-configuration/index.js";
import systemSettingRoutes from "../modules/configuration/system-settings/index.js";
import surveyConfigRoutes from "../modules/configuration/survey-configuration/index.js";
import templateManagementRoutes from "../modules/configuration/template-management/index.js";
import accessControlConfigRoutes from "../modules/configuration/access-control-configuration/index.js";
import { notificationsRouter } from "../modules/notifications/index.js";
import { certificatesRouter } from "../modules/certificates/index.js";
import { enrollmentsRouter, learningSessionsRouter } from "../modules/enrollments/index.js";
import { assessmentsRouter, assessmentAttemptsRouter } from "../modules/assessments/index.js";
import { programTaskSubmissionsRouter, submissionsRouter } from "../modules/submissions/index.js";
import { liveSessionAttendanceRouter } from "../modules/attendance/index.js";
import { programSurveyRouter } from "../modules/surveys/program-survey.routes.js";
import { coursePublishingRouter } from "../modules/course/course-publishing.routes.js";
import { programDetailsRouter } from "../modules/program/program-details.routes.js";
import { programCompositionRouter } from "../modules/program/program-composition.routes.js";
import { programCohortRosterRouter } from "../modules/program/program-cohort-roster.routes.js";
import { programPublishingRouter } from "../modules/program/program-publishing.routes.js";
import { programTaskWaiverRouter } from "../modules/program/program-task-waiver.routes.js";
import { programTemplateApplicationRouter } from "../modules/program/program-template-application.routes.js";

const router = Router();

// ─── Core / Utility Routes ──────────────────────────────────────────────────
router.use("/health", healthRoutes);

// ─── Auth Routes (lazily resolved so bootstrapAuth runs first) ────────────
// The /auth/* routes are registered lazily: getAuthService() is only called
// when the first request arrives, at which point bootstrapAuth() has already run.
router.use("/auth", (req, res, next) => {
  const authService = getAuthService();
  const authController = new AuthController(authService);
  const authMiddleware = new AuthMiddleware(authService);
  const authRoutes = createAuthRoutes(authController, authMiddleware);
  authRoutes(req, res, next);
});

// ─── Configuration & Setup Routes ──────────────────────────────────────────
router.use("/configuration/access-control", accessControlConfigRoutes);
router.use("/configuration/audience", audienceRoutes);
router.use("/configuration/course", courseConfigRoutes);
router.use("/configuration/assessment", assessmentConfigRoutes);
router.use("/configuration/program", programConfigRoutes);
router.use("/configuration/enrollment", enrollmentConfigRoutes);
router.use("/configuration/notification", notificationConfigRoutes);
router.use("/configuration/certification", certificateConfigRoutes);
router.use("/configuration/tna", tnaConfigRoutes);
router.use("/configuration/training-effectiveness", trainingEffectivenessConfigRoutes);
router.use("/configuration/approval-workflows", approvalWorkflowsConfigRoutes);
router.use("/configuration/custom-fields", customFieldsConfigRoutes);
router.use("/configuration/learning-levels", learningLevelConfigRoutes);
router.use("/configuration/xp-rules", xpRuleConfigRoutes);
router.use("/configuration/badges", badgeConfigRoutes);
router.use("/configuration/system-settings", systemSettingRoutes);
router.use("/configuration/survey", surveyConfigRoutes);
router.use("/configuration/templates", templateManagementRoutes);
router.use("/notifications", notificationsRouter);
router.use("/certificates", certificatesRouter);
router.use("/enrollments", enrollmentsRouter);
router.use("/enrollments", programTaskSubmissionsRouter);
router.use("/enrollments", programSurveyRouter);
router.use("/submissions", submissionsRouter);
router.use("/learning-sessions", learningSessionsRouter);
router.use("/live-sessions", liveSessionAttendanceRouter);
router.use("/assessments", assessmentsRouter);
router.use("/assessment-attempts", assessmentAttemptsRouter);
router.use("/courses", coursePublishingRouter);
router.use("/programs", programDetailsRouter);
router.use("/programs", programTemplateApplicationRouter);
router.use("/programs", programCohortRosterRouter);
router.use("/programs", programTaskWaiverRouter);
router.use("/programs", programCompositionRouter);
router.use("/programs", programPublishingRouter);

// ─── Core Domain Routes (Future) ───────────────────────────────────────────
// router.use("/courses", courseRoutes);
// router.use("/programs", learningProgramRoutes);
// router.use("/enrollments", enrollmentRoutes);


export default router;
