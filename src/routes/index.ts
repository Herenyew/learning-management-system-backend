import { Router } from "express";
import internalRoutes from "../modules/internal/index.js";
import healthRoutes from "../modules/health/health.route.js";

// Feature Modules
import audienceRoutes from "../modules/configuration/audience-configuration/index.js";
import courseConfigRoutes from "../modules/configuration/course-configuration/index.js";

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

// ==========================================
// Core Domain Routes (Future)
// ==========================================
// router.use("/courses", courseRoutes);
// router.use("/programs", learningProgramRoutes);
// router.use("/enrollments", enrollmentRoutes);
// router.use("/assessments", assessmentRoutes);

export default router;