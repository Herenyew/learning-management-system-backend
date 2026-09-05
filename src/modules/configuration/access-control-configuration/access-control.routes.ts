import { Router } from "express";
import { authenticate } from "../../auth/auth.middleware.js";
import { requirePermission } from "../../../common/auth/permission.middleware.js";
import { Permissions } from "../../../common/constants/permission.constant.js";
import { accessControlController } from "./access-control.controller.js";
import {
  emsMappingController,
  permissionGroupController,
  userRoleController,
} from "./access-control-extended.controller.js";

const router = Router();

router.use(authenticate);

router.get("/me", accessControlController.me);

// ─── Role Management ──────────────────────────────────────────────────────
router.get("/roles",                  requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.list);
router.get("/roles/:roleId",         requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.getRoleById);
router.post("/roles",                requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.createRole);
router.put("/roles/:roleId",         requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.updateRole);
router.delete("/roles/:roleId",      requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.deleteRole);
router.patch("/roles/:roleId/status", requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.toggleRoleStatus);
router.get("/roles/:roleId/permissions", requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.getRolePermissions);
router.post("/roles/:roleId/permissions", requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.bulkAssignPermissions);
router.delete("/roles/:roleId/permissions/:permissionId", requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.revokePermission);
router.post("/roles/:roleId/permissions/bulk-assign", requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.bulkAssignPermissions);
router.delete("/roles/:roleId/permissions/bulk-revoke", requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.bulkRevokePermissions);

// ─── Permission Management ──────────────────────────────────────────────
router.get("/permissions",           requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.listPermissions);
router.post("/permissions",          requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.createPermission);
router.put("/permissions/:id",        requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.updatePermission);
router.delete("/permissions/:id",     requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.deletePermission);

router.put("/roles/:roleId/permissions", requirePermission(Permissions.ACCESS_CONTROL_MANAGE), accessControlController.updateRolePermissions);

// ─── Permission Groups ──────────────────────────────────────────────────────
router.get("/permission-groups",                   requirePermission(Permissions.ACCESS_CONTROL_MANAGE), permissionGroupController.list);
router.get("/permission-groups/:id",               requirePermission(Permissions.ACCESS_CONTROL_MANAGE), permissionGroupController.getById);
router.post("/permission-groups",                  requirePermission(Permissions.ACCESS_CONTROL_MANAGE), permissionGroupController.create);
router.put("/permission-groups/:id",               requirePermission(Permissions.ACCESS_CONTROL_MANAGE), permissionGroupController.update);
router.delete("/permission-groups/:id",            requirePermission(Permissions.ACCESS_CONTROL_MANAGE), permissionGroupController.delete);
router.post("/permission-groups/:id/permissions",  requirePermission(Permissions.ACCESS_CONTROL_MANAGE), permissionGroupController.assignPermissions);

// ─── EMS Mappings ───────────────────────────────────────────────────────────
router.get("/ems-mappings",         requirePermission(Permissions.ACCESS_CONTROL_MANAGE), emsMappingController.list);
router.post("/ems-mappings",        requirePermission(Permissions.ACCESS_CONTROL_MANAGE), emsMappingController.create);
router.put("/ems-mappings/:id",     requirePermission(Permissions.ACCESS_CONTROL_MANAGE), emsMappingController.update);
router.delete("/ems-mappings/:id",  requirePermission(Permissions.ACCESS_CONTROL_MANAGE), emsMappingController.delete);
router.post("/ems-mappings/sync", requirePermission(Permissions.ACCESS_CONTROL_MANAGE), emsMappingController.sync);

// ─── User Role Assignments ──────────────────────────────────────────────────
router.get("/users/:userId/roles",           requirePermission(Permissions.ACCESS_CONTROL_MANAGE), userRoleController.getUserRoles);
router.get("/users/:userId/roles/all",       requirePermission(Permissions.ACCESS_CONTROL_MANAGE), userRoleController.getUserAllRoles);
router.get("/users/:userId/permissions",     requirePermission(Permissions.ACCESS_CONTROL_MANAGE), userRoleController.getEffectivePermissions);
router.get("/users/:userId/menu",            requirePermission(Permissions.ACCESS_CONTROL_MANAGE), userRoleController.getUserMenu);
router.get("/users/:userId/primary-role",    requirePermission(Permissions.ACCESS_CONTROL_MANAGE), userRoleController.getUserPrimaryRole);
router.post("/users/:userId/roles",          requirePermission(Permissions.ACCESS_CONTROL_MANAGE), userRoleController.assignRole);
router.delete("/users/:userId/roles/:roleId", requirePermission(Permissions.ACCESS_CONTROL_MANAGE), userRoleController.revokeRole);
router.post("/users/bulk-assign",            requirePermission(Permissions.ACCESS_CONTROL_MANAGE), userRoleController.bulkAssign);
router.get("/roles/:roleId/users",           requirePermission(Permissions.ACCESS_CONTROL_MANAGE), userRoleController.getUsersByRole);

export default router;
