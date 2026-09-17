import { Router } from "express";
import { requirePermission } from "../../common/auth/permission.middleware.js";
import { Permissions } from "../../common/constants/permission.constant.js";
import { authenticate } from "../auth/auth.middleware.js";
import { LiveSessionAttendanceController } from "./live-session-attendance.controller.js";
import { liveSessionAttendanceService } from "./live-session-attendance.service.js";

const controller = new LiveSessionAttendanceController(liveSessionAttendanceService);
export const liveSessionAttendanceRouter = Router();

liveSessionAttendanceRouter.use(authenticate);
liveSessionAttendanceRouter.get("/my", requirePermission(Permissions.COURSE_READ), controller.listMine);
liveSessionAttendanceRouter.post(
  "/:sessionId/check-in",
  requirePermission(Permissions.COURSE_READ),
  controller.checkIn,
);
liveSessionAttendanceRouter.post(
  "/:sessionId/check-in-challenge",
  requirePermission([Permissions.ATTENDANCE_FINALIZE, Permissions.ATTENDANCE_MANAGE], "ANY"),
  controller.createChallenge,
);
liveSessionAttendanceRouter.get(
  "/:sessionId/attendance",
  requirePermission([Permissions.ATTENDANCE_FINALIZE, Permissions.ATTENDANCE_MANAGE], "ANY"),
  controller.roster,
);
liveSessionAttendanceRouter.post(
  "/:sessionId/attendance/finalize",
  requirePermission([Permissions.ATTENDANCE_FINALIZE, Permissions.ATTENDANCE_MANAGE], "ANY"),
  controller.finalize,
);
