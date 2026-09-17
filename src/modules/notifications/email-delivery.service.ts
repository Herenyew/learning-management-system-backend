import { env } from "../../config/env.js";
import logger from "../../config/logger.js";
import type { NotificationDispatchResult } from "./types.js";

type EmailMessage = NotificationDispatchResult["emails"][number];

export const emailDeliveryService = {
  async send(message: EmailMessage) {
    if (!env.email.enabled) return { delivered: false, reason: "disabled" as const };
    if (!env.email.apiKey) {
      logger.error("[EmailDelivery] EMAIL_API_KEY is required when email delivery is enabled.");
      return { delivered: false, reason: "missing_api_key" as const };
    }
    const response = await fetch(env.email.apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.email.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: env.email.from,
        to: message.recipients.map((recipient) => recipient.email),
        subject: message.subject,
        text: message.text,
        html: message.html,
      }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(`Email provider returned ${response.status}: ${detail.slice(0, 500)}`);
    }
    const result = (await response.json().catch(() => ({}))) as { id?: string };
    return { delivered: true, providerId: result.id ?? null };
  },

  async deliver(messages: EmailMessage[]) {
    const outcomes = await Promise.allSettled(messages.map((message) => this.send(message)));
    for (const outcome of outcomes) {
      if (outcome.status === "rejected") {
        logger.error("[EmailDelivery] Message delivery failed", { error: outcome.reason });
      }
    }
    return outcomes;
  },
};
