import { Request, Response } from "express";

import healthService from "./health.service.js";

class HealthController {
  getHealth(req: Request, res: Response): void {
    const response = healthService.getHealthStatus();

    res.status(200).json(response);
  }
}

export default new HealthController();