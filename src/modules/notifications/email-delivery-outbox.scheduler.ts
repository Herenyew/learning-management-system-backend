import logger from "../../config/logger.js";
import { emailDeliveryOutboxService } from "./email-delivery-outbox.service.js";

const INTERVAL_MS = 60_000;
let running = false;

const sweep = async () => {
  if (running) return;
  running = true;
  try {
    await emailDeliveryOutboxService.processPending();
  } catch (error) {
    logger.error("[EmailDeliveryOutbox] Retry sweep failed", { error });
  } finally {
    running = false;
  }
};

export const startEmailDeliveryOutboxScheduler = () => {
  const timer = setInterval(() => void sweep(), INTERVAL_MS);
  timer.unref();
  void sweep();
  return timer;
};
