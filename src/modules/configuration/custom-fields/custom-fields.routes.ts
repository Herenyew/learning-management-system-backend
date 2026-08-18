import { Router } from "express";
import { z } from "zod";
import { CustomFieldsController } from "./custom-fields.controller.js";
import { authenticate } from "../../../common/auth/auth.middleware.js";
import { requirePermission } from "../../../common/auth/permission.middleware.js";
import { validateBody, validateParams, validateQuery } from "../../../common/middlewares/validation.middleware.js";
import { Permissions } from "../../../common/constants/permission.constant.js";
import { createCustomFieldSchema, updateCustomFieldSchema, customFieldFilterSchema } from "./custom-fields.dto.js";

const idParamSchema = z.object({ id: z.coerce.number().int().positive({ message: "ID must be a positive integer" }) });

export function customFieldsRoutes(controller: CustomFieldsController) {
  const router = Router();
  router.use(authenticate);

  router.post(
    "/",
    requirePermission(Permissions.CUSTOM_FIELD_CREATE),
    validateBody(createCustomFieldSchema),
    controller.createCustomField.bind(controller)
  );

  router.get(
    "/",
    requirePermission(Permissions.CUSTOM_FIELD_VIEW),
    validateQuery(customFieldFilterSchema),
    controller.getCustomFields.bind(controller)
  );

  router.get(
    "/:id",
    requirePermission(Permissions.CUSTOM_FIELD_VIEW),
    validateParams(idParamSchema),
    controller.getCustomFieldById.bind(controller)
  );

  router.put(
    "/:id",
    requirePermission(Permissions.CUSTOM_FIELD_UPDATE),
    validateParams(idParamSchema),
    validateBody(updateCustomFieldSchema),
    controller.updateCustomField.bind(controller)
  );

  router.delete(
    "/:id",
    requirePermission(Permissions.CUSTOM_FIELD_DELETE),
    validateParams(idParamSchema),
    controller.deleteCustomField.bind(controller)
  );

  return router;
}
