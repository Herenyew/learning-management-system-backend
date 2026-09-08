import { consumer, rabbitMQ } from "../rabbitmq/index.js";
import { Queues } from "../rabbitmq/queues.js";
import type { EventEnvelope } from "../rabbitmq/event-envelope.js";
import { CacheKeys, cacheService } from "../../common/cache/cache.service.js";
import { notificationRealtimeHub } from "../../modules/notifications/realtime-hub.js";
import logger from "../../config/logger.js";

/**
 * Role Sync Consumer
 *
 * Subscribes to the LMS role-sync queue and reacts to org-side role changes
 * published by the EMS microservice (e.g. `role.updated` on `ex.ems.events`).
 *
 * What it does on a role change:
 *   1. Busts the company's EMS-role-mapping cache so the next login resolves
 *      against the FRESH mapping table (auth.middleware Step 2.5 reads the DB
 *      directly, but other resolvers use the cached mapping).
 *   2. Busts per-user permission caches for any affected users included in
 *      the event payload.
 *   3. Pushes `permissions.changed` over SSE so open sessions re-hydrate
 *      within ~1 second instead of waiting for their next request.
 *
 * Defensive by design: the exact EMS payload shape is not finalized, so the
 * handler extracts what it can and never throws on unexpected shapes.
 */

type RoleUpdatedPayload = {
  companyId?: number | string;
  roleId?: number | string;
  roleName?: string;
  newName?: string;
  affectedUserIds?: Array<number | string>;
};

function asCompanyNumber(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : null;
}

async function handleRoleUpdated(envelope: EventEnvelope<RoleUpdatedPayload>) {
  const payload = envelope.payload ?? {};
  const companyId = asCompanyNumber(payload.companyId);
  if (!companyId) {
    logger.warn("[RoleSyncConsumer] role.updated without a valid companyId — skipping", {
      eventId: envelope.eventId,
    });
    return;
  }

  // 1. Bust the company-level mapping cache.
  await cacheService.del(CacheKeys.emsMappings(companyId));

  // 2. Bust per-user caches + push SSE for explicitly affected users.
  const affectedUserIds = Array.from(
    new Set(
      (payload.affectedUserIds ?? [])
        .map((id) => Number(id))
        .filter((n) => Number.isFinite(n) && n > 0),
    ),
  );

  if (affectedUserIds.length > 0) {
    await Promise.all(
      affectedUserIds.map(async (userId) => {
        await Promise.all([
          cacheService.del(CacheKeys.userRoles(userId)),
          cacheService.del(CacheKeys.userPermissions(userId)),
        ]);
        notificationRealtimeHub.publishToUsers(companyId, [userId], {
          reason: "permissions.changed",
          occurredAt: new Date().toISOString(),
        });
      }),
    );
  }

  logger.info("[RoleSyncConsumer] Processed role.updated event", {
    eventId: envelope.eventId,
    companyId,
    roleName: payload.roleName ?? payload.roleId ?? "unknown",
    affectedUsers: affectedUserIds.length,
  });
}

/** Start the consumer. Safe to call multiple times; failures are logged, not thrown. */
export async function startRoleSyncConsumer(): Promise<void> {
  try {
    rabbitMQ.getChannel(); // throws if RabbitMQ is not connected
    await consumer.subscribe(Queues.ROLE_SYNC, async (raw) => {
      try {
        const envelope =
          typeof (raw as { eventType?: string })?.eventType === "string"
            ? (raw as EventEnvelope<RoleUpdatedPayload>)
            : // Tolerate publishers that send the bare payload without an envelope.
              ({
                eventId: "unknown",
                eventType: "role.updated",
                source: "ems",
                version: 1,
                occurredAt: new Date().toISOString(),
                payload: (raw ?? {}) as RoleUpdatedPayload,
              } as EventEnvelope<RoleUpdatedPayload>);

        switch (envelope.eventType) {
          case "role.updated":
          case "role.created":
          case "role.deleted":
            await handleRoleUpdated(envelope);
            break;
          default:
            logger.debug("[RoleSyncConsumer] Ignoring event type", {
              eventType: envelope.eventType,
            });
        }
      } catch (err) {
        // Never crash the consumer on unexpected shapes — log and move on.
        logger.error("[RoleSyncConsumer] Failed to process message", { err });
      }
    });
    logger.info("[RoleSyncConsumer] Subscribed to role sync queue", {
      queue: Queues.ROLE_SYNC,
    });
  } catch (err) {
    logger.warn(
      "[RoleSyncConsumer] Could not subscribe to role sync queue (RabbitMQ unavailable?) — will not retry until restart",
      { err },
    );
  }
}
