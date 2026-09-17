import { Prisma, type PrismaClient } from "@prisma/client";
import { getPrismaClient } from "../../config/database.js";
import logger from "../../config/logger.js";
import { emailDeliveryService } from "./email-delivery.service.js";
import type { NotificationDispatchResult } from "./types.js";

type EmailMessage = NotificationDispatchResult["emails"][number];
const BATCH_SIZE = 50;
const MAX_ATTEMPTS = 10;

const isEmailMessage = (value: Prisma.JsonValue): value is Prisma.JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export class EmailDeliveryOutboxService {
  constructor(private readonly prisma: PrismaClient) {}

  async processIds(ids: number[]) {
    const results = [];
    for (const id of ids) results.push(await this.processOne(id));
    return results;
  }

  async processPending(now = new Date()) {
    const staleLock = new Date(now.getTime() - 15 * 60_000);
    const rows = await this.prisma.emailDeliveryOutbox.findMany({
      where: {
        attemptCount: { lt: MAX_ATTEMPTS },
        OR: [
          { status: { in: ["PENDING", "FAILED"] }, availableAt: { lte: now } },
          { status: "PROCESSING", lockedAt: { lte: staleLock } },
        ],
      },
      select: { id: true },
      orderBy: [{ availableAt: "asc" }, { id: "asc" }],
      take: BATCH_SIZE,
    });
    return this.processIds(rows.map((row) => row.id));
  }

  private async processOne(id: number) {
    const now = new Date();
    const staleLock = new Date(now.getTime() - 15 * 60_000);
    const claimed = await this.prisma.emailDeliveryOutbox.updateMany({
      where: {
        id,
        attemptCount: { lt: MAX_ATTEMPTS },
        OR: [
          { status: { in: ["PENDING", "FAILED"] }, availableAt: { lte: now } },
          { status: "PROCESSING", lockedAt: { lte: staleLock } },
        ],
      },
      data: { status: "PROCESSING", lockedAt: now, attemptCount: { increment: 1 } },
    });
    if (claimed.count === 0) return { id, processed: false };

    const row = await this.prisma.emailDeliveryOutbox.findUniqueOrThrow({
      where: { id },
      select: { payload: true, attemptCount: true },
    });
    try {
      if (!isEmailMessage(row.payload)) throw new Error("Email outbox payload is malformed.");
      const outcome = await emailDeliveryService.send(row.payload as unknown as EmailMessage);
      if (!outcome.delivered) {
        if (outcome.reason === "disabled") {
          await this.prisma.emailDeliveryOutbox.update({
            where: { id },
            data: { status: "SKIPPED", processedAt: now, lockedAt: null, lastError: "Email delivery disabled." },
          });
          return { id, processed: true, skipped: true };
        }
        throw new Error("Email delivery API key is not configured.");
      }
      await this.prisma.emailDeliveryOutbox.update({
        where: { id },
        data: {
          status: "SENT",
          processedAt: now,
          providerId: outcome.providerId,
          lockedAt: null,
          lastError: null,
        },
      });
      return { id, processed: true, providerId: outcome.providerId };
    } catch (error) {
      const delayMinutes = Math.min(60, 2 ** Math.min(row.attemptCount, 6));
      await this.prisma.emailDeliveryOutbox.update({
        where: { id },
        data: {
          status: "FAILED",
          availableAt: new Date(now.getTime() + delayMinutes * 60_000),
          lockedAt: null,
          lastError: error instanceof Error ? error.message.slice(0, 5000) : String(error).slice(0, 5000),
        },
      });
      logger.error("[EmailDeliveryOutbox] Delivery failed", { id, error });
      return { id, processed: false, error };
    }
  }
}

export const emailDeliveryOutboxService = new EmailDeliveryOutboxService(getPrismaClient());
