import type { Response } from "express";
import type { NotificationRealtimeSignal } from "./types.js";

const HEARTBEAT_INTERVAL_MS = 25_000;
const RECONNECT_RETRY_MS = 5_000;
const MAX_CONNECTIONS_PER_USER = 5;
const MAX_CONNECTIONS_PER_PROCESS = 10_000;

type ConnectionResult = "connected" | "connection-limit" | "closed";
type RealtimePayload =
  | NotificationRealtimeSignal
  | {
      reason: "connected";
      occurredAt: string;
    };

const eventFrame = (event: string, payload: RealtimePayload) =>
  `event: ${event}\ndata: ${JSON.stringify({
    reason: payload.reason,
    occurredAt: payload.occurredAt,
  })}\n\n`;

export class NotificationRealtimeHub {
  private readonly connections = new Map<number, Map<number, Set<Response>>>();
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private acceptingConnections = true;
  private connectionCount = 0;

  connect(
    companyId: number,
    userId: number,
    response: Response,
  ): ConnectionResult {
    if (!this.acceptingConnections) return "closed";

    const existingConnections = this.connections.get(companyId)?.get(userId);
    if (
      this.connectionCount >= MAX_CONNECTIONS_PER_PROCESS ||
      (existingConnections &&
        existingConnections.size >= MAX_CONNECTIONS_PER_USER)
    ) {
      return "connection-limit";
    }

    response.set({
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    });
    response.flushHeaders();

    const companyConnections =
      this.connections.get(companyId) ?? new Map<number, Set<Response>>();
    const userConnections =
      companyConnections.get(userId) ?? new Set<Response>();
    userConnections.add(response);
    this.connectionCount += 1;
    companyConnections.set(userId, userConnections);
    this.connections.set(companyId, companyConnections);

    response.once("close", () => this.remove(companyId, userId, response));
    this.ensureHeartbeat();
    this.write(response, `retry: ${RECONNECT_RETRY_MS}\n\n`);
    this.write(
      response,
      eventFrame("connected", {
        reason: "connected",
        occurredAt: new Date().toISOString(),
      }),
    );
    return "connected";
  }

  publish(
    companyId: number,
    userId: number,
    signal: NotificationRealtimeSignal,
  ) {
    const userConnections = this.connections.get(companyId)?.get(userId);
    if (!userConnections) return;

    const frame = eventFrame("notifications.changed", signal);
    for (const response of Array.from(userConnections)) {
      if (!this.write(response, frame)) {
        this.remove(companyId, userId, response);
      }
    }
  }

  /**
   * Broadcasts a signal to every connected user in a company.
   * Used for company-wide events like permission changes.
   */
  publishToCompany(companyId: number, signal: NotificationRealtimeSignal) {
    const companyConnections = this.connections.get(companyId);
    if (!companyConnections) return;

    const frame = eventFrame("notifications.changed", signal);
    for (const [userId, userConnections] of companyConnections) {
      for (const response of Array.from(userConnections)) {
        if (!this.write(response, frame)) {
          this.remove(companyId, userId, response);
        }
      }
    }
  }

  /**
   * Broadcasts a signal to specific users in a company.
   * Used for role-scoped events — only users holding the changed role are notified.
   */
  publishToUsers(companyId: number, userIds: number[], signal: NotificationRealtimeSignal) {
    for (const userId of userIds) {
      this.publish(companyId, userId, signal);
    }
  }

  closeAll() {
    this.acceptingConnections = false;
    this.stopHeartbeat();

    const responses = Array.from(this.connections.values()).flatMap(
      (companyConnections) =>
        Array.from(companyConnections.values()).flatMap((connections) =>
          Array.from(connections),
        ),
    );
    this.connections.clear();
    this.connectionCount = 0;

    for (const response of responses) {
      if (!response.writableEnded) response.end();
    }
  }

  private write(response: Response, frame: string) {
    if (response.writableEnded || response.destroyed) return false;
    try {
      const accepted = response.write(frame);
      if (!accepted) {
        response.end();
        return false;
      }
      return true;
    } catch {
      if (!response.writableEnded) response.end();
      return false;
    }
  }

  private remove(companyId: number, userId: number, response: Response) {
    const companyConnections = this.connections.get(companyId);
    const userConnections = companyConnections?.get(userId);
    if (!companyConnections || !userConnections) return;

    if (!userConnections.delete(response)) return;
    this.connectionCount = Math.max(0, this.connectionCount - 1);
    if (userConnections.size === 0) companyConnections.delete(userId);
    if (companyConnections.size === 0) this.connections.delete(companyId);
    if (this.connections.size === 0) this.stopHeartbeat();
  }

  private ensureHeartbeat() {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      for (const [companyId, companyConnections] of this.connections) {
        for (const [userId, userConnections] of companyConnections) {
          for (const response of Array.from(userConnections)) {
            if (!this.write(response, ": heartbeat\n\n")) {
              this.remove(companyId, userId, response);
            }
          }
        }
      }
    }, HEARTBEAT_INTERVAL_MS);
    this.heartbeatTimer.unref();
  }

  private stopHeartbeat() {
    if (!this.heartbeatTimer) return;
    clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = null;
  }
}

export const notificationRealtimeHub = new NotificationRealtimeHub();
