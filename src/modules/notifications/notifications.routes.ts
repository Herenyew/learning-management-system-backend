import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { notificationInboxController } from "./inbox.controller.js";

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

notificationsRouter.get("/stream", (req, res, next) => {
  notificationInboxController.stream(req, res).catch(next);
});

notificationsRouter.get("/", (req, res, next) => {
  notificationInboxController.list(req, res).catch(next);
});

notificationsRouter.get("/unread-count", (req, res, next) => {
  notificationInboxController.unreadCount(req, res).catch(next);
});

notificationsRouter.patch("/read-all", (req, res, next) => {
  notificationInboxController.markAllRead(req, res).catch(next);
});

notificationsRouter.patch("/:id/read", (req, res, next) => {
  notificationInboxController.markRead(req, res).catch(next);
});
