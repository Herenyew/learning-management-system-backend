import { Router } from "express";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health check
 *     responses:
 *       200:
 *         description: Service is healthy
 */
router.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "LMS API is running.",
    timestamp: new Date().toISOString(),
  });
});

export default router;