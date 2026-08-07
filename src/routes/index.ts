import { Router } from "express";
import internalRoutes from "../modules/internal/index.js";
import healthRoutes from "../modules/health/health.route.js";
// Import the fully composed audience router from its module directory
import audienceRoutes from "../modules/configuration/audience-configuration/index.js";

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
// Feature Module Routes
// ==========================================
router.use("/configuration/audience", audienceRoutes);

// Future routes
// router.use("/courses", courseRoutes);
// router.use("/programs", learningProgramRoutes);
// router.use("/enrollments", enrollmentRoutes);
// router.use("/assessments", assessmentRoutes);

export default router;
