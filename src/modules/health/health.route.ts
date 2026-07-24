import { Router } from "express";

import healthController from "./health.controller.js";

const router = Router();

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Health
 *     summary: Health Check
 *     description: Returns API health status.
 *     responses:
 *       200:
 *         description: Service is healthy.
 */
router.get("/", healthController.getHealth);

export default router;