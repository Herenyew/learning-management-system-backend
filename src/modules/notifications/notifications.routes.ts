import { Router } from "express";
import { authenticate } from "../auth/auth.middleware.js";
import { notificationInboxController } from "./inbox.controller.js";

export const notificationsRouter = Router();

notificationsRouter.use(authenticate);

// Each handler now accepts (req, res, next) and manages its own error routing
// via try/catch + next(err), so we can register them directly without wrappers.
notificationsRouter.get("/stream",       notificationInboxController.stream);
notificationsRouter.get("/",             notificationInboxController.list);
notificationsRouter.get("/unread-count", notificationInboxController.unreadCount);
notificationsRouter.patch("/read-all",   notificationInboxController.markAllRead);
notificationsRouter.patch("/:id/read",   notificationInboxController.markRead);
