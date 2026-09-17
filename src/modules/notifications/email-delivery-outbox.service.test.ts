import type { PrismaClient } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./email-delivery.service.js", () => ({
  emailDeliveryService: { send: vi.fn() },
}));

import { emailDeliveryService } from "./email-delivery.service.js";
import { EmailDeliveryOutboxService } from "./email-delivery-outbox.service.js";

const payload = {
  recipients: [{ email: "learner@example.com", name: "Learner" }],
  subject: "Subject",
  text: "Text",
  html: "<p>Text</p>",
};

describe("EmailDeliveryOutboxService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("claims and marks a provider-delivered message as sent", async () => {
    const update = vi.fn(async () => ({}));
    const prisma = {
      emailDeliveryOutbox: {
        updateMany: vi.fn(async () => ({ count: 1 })),
        findUniqueOrThrow: vi.fn(async () => ({ payload, attemptCount: 1 })),
        update,
      },
    } as unknown as PrismaClient;
    vi.mocked(emailDeliveryService.send).mockResolvedValue({ delivered: true, providerId: "msg-1" });

    const result = await new EmailDeliveryOutboxService(prisma).processIds([12]);

    expect(emailDeliveryService.send).toHaveBeenCalledWith(payload);
    expect(update).toHaveBeenCalledWith({
      where: { id: 12 },
      data: expect.objectContaining({ status: "SENT", providerId: "msg-1", lastError: null }),
    });
    expect(result[0]).toMatchObject({ id: 12, processed: true, providerId: "msg-1" });
  });

  it("persists a failed attempt with a future retry time", async () => {
    const update = vi.fn(async () => ({}));
    const prisma = {
      emailDeliveryOutbox: {
        updateMany: vi.fn(async () => ({ count: 1 })),
        findUniqueOrThrow: vi.fn(async () => ({ payload, attemptCount: 2 })),
        update,
      },
    } as unknown as PrismaClient;
    vi.mocked(emailDeliveryService.send).mockRejectedValue(new Error("provider unavailable"));

    await new EmailDeliveryOutboxService(prisma).processIds([13]);

    expect(update).toHaveBeenCalledWith({
      where: { id: 13 },
      data: expect.objectContaining({
        status: "FAILED",
        lockedAt: null,
        lastError: "provider unavailable",
        availableAt: expect.any(Date),
      }),
    });
  });
});
