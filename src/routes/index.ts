import { Router } from "express";
import healthRoutes from "../modules/health/health.route.js";
// Import the fully composed audience router from its module directory
import audienceRoutes from "../modules/configuration/audience-configuration/index.js";

const router = Router();

// ==========================================
// Core / Utility Routes
// ==========================================
router.use("/health", healthRoutes);

// ==========================================
// Feature Module Routes
// ==========================================
router.use("/configuration/audience", audienceRoutes);

// Future routes
// router.use("/courses", courseRoutes);
// router.use("/programs", learningProgramRoutes);
// router.use("/enrollments", enrollmentRoutes);
// router.use("/assessments", assessmentRoutes);

export default router;
