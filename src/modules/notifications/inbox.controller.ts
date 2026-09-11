import type { NextFunction, Request, Response } from "express";
import { z } from "zod";

import { NotFoundError, UnauthorizedError } from "../../common/errors/http-errors.js";
import { notificationRealtimeHub } from "./realtime-hub.js";
import { notificationsRepository } from "./repository.js";

const inboxQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
  unreadOnly: z
    .preprocess((val) => val === "true" || val === true, z.boolean())
    .default(false),
});
const notificationIdSchema = z.string().uuid();

const contextFrom = (req: Request) => {
  const reqAny = req as any;
  const user = reqAny.user || reqAny.currentUser;
  const companyId = user?.companyId ? Number(user.companyId) : (reqAny.companyId ? Number(reqAny.companyId) : undefined);
  const userId = user?.appUserId ?? (user?.id ? Number(user.id) : undefined);
  if (!companyId || !userId) {
    throw new UnauthorizedError("Authenticated user context is required.");
  }
  return { companyId, userId };
};

export const notificationInboxController = {
  stream: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = contextFrom(req);
      const result = notificationRealtimeHub.connect(
        context.companyId,
        context.userId,
        res,
      );
      if (result === "connection-limit") {
        res.status(429).json({ success: false, error: { message: "Too many notification stream connections." } });
        return;
      }
      if (result === "closed") {
        res.status(503).json({ success: false, error: { message: "Notification streaming is shutting down." } });
        return;
      }
    } catch (err) {
      next(err);
    }
  },

  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = contextFrom(req);
      const query = inboxQuerySchema.parse(req.query);
      const { items, total } = await notificationsRepository.listInbox(
        context.companyId,
        context.userId,
        query,
      );
      return res.status(200).json({
        success: true,
        data: items,
        pagination: {
          page: query.page,
          pageSize: query.pageSize,
          totalRecords: total,
          totalPages: Math.ceil(total / query.pageSize),
        },
      });
    } catch (err) {
      next(err);
    }
  },

  unreadCount: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = contextFrom(req);
      const count = await notificationsRepository.countUnread(
        context.companyId,
        context.userId,
      );
      return res.status(200).json({
        success: true,
        data: { count },
      });
    } catch (err) {
      next(err);
    }
  },

  markRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = contextFrom(req);
      const readAt = new Date();
      const notification = await notificationsRepository.markRead(
        context.companyId,
        context.userId,
        notificationIdSchema.parse(req.params.id),
        readAt,
      );
      if (!notification) {
        throw new NotFoundError("Notification");
      }
      notificationRealtimeHub.publish(context.companyId, context.userId, {
        reason: "notification.read-state.changed",
        occurredAt: readAt.toISOString(),
      });
      return res.status(200).json({
        success: true,
        data: notification,
      });
    } catch (err) {
      next(err);
    }
  },

  markAllRead: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const context = contextFrom(req);
      const readAt = new Date();
      const result = await notificationsRepository.markAllRead(
        context.companyId,
        context.userId,
        readAt,
      );
      notificationRealtimeHub.publish(context.companyId, context.userId, {
        reason: "notification.read-state.changed",
        occurredAt: readAt.toISOString(),
      });
      return res.status(200).json({
        success: true,
        data: { updatedCount: result.count },
      });
    } catch (err) {
      next(err);
    }
  },
};
