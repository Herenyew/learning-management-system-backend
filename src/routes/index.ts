import { Router } from "express";
import internalRoutes from "../modules/internal/index.js";
import healthRoutes from "../modules/health/health.route.js";

// Feature Modules
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

const router = Router();

// ==========================================
// Core / Utility Routes
// ==========================================
router.use("/health", healthRoutes);

// ==========================================
// Internal/System Routes (for service-to-service)
// ==========================================
router.use("/internal", internalRoutes); 

// ==========================================
// Configuration & Setup Routes
// ==========================================
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
router.use("/configuration/xp-rules", xpRuleConfigRoutes)
router.use("configuration/badges", badgeConfigRoutes);

// ==========================================
// Core Domain Routes (Future)
// ==========================================
// router.use("/courses", courseRoutes);
// router.use("/programs", learningProgramRoutes);
// router.use("/enrollments", enrollmentRoutes);
// router.use("/assessments", assessmentRoutes);

export default router;