import { Router } from "express";
import { authenticate } from "../../auth/auth.middleware.js";
import { requirePermission } from "../../../common/auth/permission.middleware.js";
import { Permissions } from "../../../common/constants/permission.constant.js";
import { accessControlController } from "./access-control.controller.js";

const router = Router();

router.use(authenticate);

router.get("/me", accessControlController.me);

router.get(
  "/roles",
  requirePermission(Permissions.ACCESS_CONTROL_MANAGE),
  accessControlController.list,
);

router.put(
  "/roles/:roleId/permissions",
  requirePermission(Permissions.ACCESS_CONTROL_MANAGE),
  accessControlController.updateRolePermissions,
);

export default router;
