import logger from "../../config/logger.js";
import { completionRewardsService } from "./completion-rewards.service.js";

const INTERVAL_MS = 60_000;
let running = false;

const sweep = async () => {
  if (running) return;
  running = true;
  try {
    const results = await completionRewardsService.processPending();
    if (results.length > 0) {
      logger.info(`[CompletionRewards] Processed ${results.length} outbox item(s).`);
    }
  } catch (error) {
    logger.error("[CompletionRewards] Outbox sweep failed", { error });
  } finally {
    running = false;
  }
};

export const startCompletionRewardsScheduler = () => {
  const timer = setInterval(() => void sweep(), INTERVAL_MS);
  timer.unref();
  void sweep();
  return timer;
};
