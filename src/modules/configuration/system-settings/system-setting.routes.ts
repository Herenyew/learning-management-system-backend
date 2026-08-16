import { Router } from 'express';
import { SystemSettingController } from './system-setting.controller.js';
// Common Middlewares
import { authenticate } from '../../../common/auth/auth.middleware.js';
import { requirePermission } from '../../../common/auth/permission.middleware.js';
import { validateBody, validateQuery, validateParams } from '../../../common/middlewares/validation.middleware.js';
import { CreateSystemSettingSchema, UpdateSystemSettingSchema } from './system-setting.dto.js';
import { Permissions } from '../../../common/constants/permission.constant.js';
import { z } from 'zod';

const idParamSchema = z.object({ id: z.string().transform((v) => parseInt(v, 10)) });

export default function routes(controller: SystemSettingController) {
  const router = Router();

  // Protect all routes
  router.use(authenticate);

  router.post('/system-settings', requirePermission(Permissions.SYSTEM_SETTING_CREATE), validateBody(CreateSystemSettingSchema), controller.create.bind(controller));
  router.get('/system-settings', requirePermission(Permissions.SYSTEM_SETTING_VIEW), validateQuery(CreateSystemSettingSchema.partial ? (CreateSystemSettingSchema.partial() as any) : undefined), controller.findMany.bind(controller));
  router.get('/system-settings/:id', requirePermission(Permissions.SYSTEM_SETTING_VIEW), validateParams(idParamSchema), controller.findById.bind(controller));
  router.get('/system-settings/key/:key', requirePermission(Permissions.SYSTEM_SETTING_VIEW), controller.findByKey.bind(controller));
  router.put('/system-settings/:id', requirePermission(Permissions.SYSTEM_SETTING_UPDATE), validateParams(idParamSchema), validateBody(UpdateSystemSettingSchema), controller.update.bind(controller));
  router.delete('/system-settings/:id', requirePermission(Permissions.SYSTEM_SETTING_DELETE), validateParams(idParamSchema), controller.delete.bind(controller));

  return router;
}
