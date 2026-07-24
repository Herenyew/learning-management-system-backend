import { Router } from "express";

import healthRoutes from "../modules/health/health.route.js";

const router = Router();

router.use("/health", healthRoutes);

// Future routes
// router.use("/courses", courseRoutes);
// router.use("/programs", learningProgramRoutes);
// router.use("/enrollments", enrollmentRoutes);
// router.use("/assessments", assessmentRoutes);

export default router;