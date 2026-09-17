import logger from "../../config/logger.js";
import { assessmentAttemptService } from "./assessment-attempt.service.js";

const INTERVAL_MS = 60_000;
let running = false;

const sweep = async () => {
  if (running) return;
  running = true;
  try {
    const processed = await assessmentAttemptService.processExpired();
    if (processed.length > 0) {
      logger.info(`[AssessmentAttempts] Processed ${processed.length} expired attempt(s).`);
    }
  } catch (error) {
    logger.error("[AssessmentAttempts] Expiry sweep failed", { error });
  } finally {
    running = false;
  }
};

export const startAssessmentAttemptScheduler = () => {
  const timer = setInterval(() => void sweep(), INTERVAL_MS);
  timer.unref();
  void sweep();
  return timer;
};
