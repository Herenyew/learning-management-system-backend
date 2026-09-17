import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../config/logger.js", () => ({
  default: { error: vi.fn(), info: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock("../../config/env.js", () => ({
  env: {
    email: {
      enabled: true,
      apiUrl: "https://email.example.test/messages",
      apiKey: "test-key",
      from: "LearnOS <learn@example.test>",
    },
  },
}));

const { emailDeliveryService } = await import("./email-delivery.service.js");

describe("emailDeliveryService", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("delivers rendered notification email through the configured provider", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ id: "msg-1" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      emailDeliveryService.send({
        recipients: [{ email: "learner@example.test", name: "Ada Learner" }],
        subject: "Course complete",
        text: "Completed",
        html: "<p>Completed</p>",
      }),
    ).resolves.toEqual({ delivered: true, providerId: "msg-1" });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://email.example.test/messages",
      expect.objectContaining({
        method: "POST",
        headers: {
          Authorization: "Bearer test-key",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "LearnOS <learn@example.test>",
          to: ["learner@example.test"],
          subject: "Course complete",
          text: "Completed",
          html: "<p>Completed</p>",
        }),
      }),
    );
  });
});
