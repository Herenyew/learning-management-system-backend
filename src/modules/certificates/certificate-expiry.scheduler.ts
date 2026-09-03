import logger from "../../config/logger.js";
import { certificatesRepository } from "./certificates.repository.js";
import { certificatesService } from "./certificates.service.js";

export class CertificateExpiryScheduler {
  private timer: NodeJS.Timeout | null = null;
  private isRunning = false;

  constructor(private readonly intervalMs = 24 * 60 * 60 * 1000) {}

  start() {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.runOnce();
    }, this.intervalMs);
    void this.runOnce();
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async runOnce() {
    if (this.isRunning) return;
    this.isRunning = true;

    try {
      const companyIds = await certificatesRepository.listActiveCompanyIds();
      for (const companyId of companyIds) {
        await certificatesService.processExpiry(companyId);
      }
    } catch (error) {
      logger.error("[CertificateExpiryScheduler] Failed to process certificate expiry", { error });
    } finally {
      this.isRunning = false;
    }
  }
}

export const certificateExpiryScheduler = new CertificateExpiryScheduler();
