import { Router } from 'express';
import { SystemSettingController } from './system-setting.controller.js';
// Common Middlewares
import { authenticate } from '../../auth/auth.middleware.js';
import { requirePermission } from '../../../common/auth/permission.middleware.js';
import { validateBody, validateQuery, validateParams } from '../../../common/middlewares/validation.middleware.js';
import { CreateSystemSettingSchema, UpdateSystemSettingSchema, QueryListSchema, BulkUpdateSettingSchema } from './system-setting.dto.js';
import { Permissions } from '../../../common/constants/permission.constant.js';
import { z } from 'zod';

const idParamSchema = z.object({ id: z.string().transform((v) => parseInt(v, 10)) });
const keyParamSchema = z.object({ key: z.string().min(1).max(150) });
const categoryParamSchema = z.object({
  category: z.enum(['GENERAL', 'ENROLLMENT', 'NOTIFICATIONS', 'CERTIFICATION', 'GAMIFICATION', 'SECURITY', 'INTEGRATIONS']),
});

export default function routes(controller: SystemSettingController) {
  const router = Router();

  // Protect all routes
  router.use(authenticate);

  // Managed reads — any user with the view permission.
  router.get('/', requirePermission(Permissions.SYSTEM_SETTING_VIEW), validateQuery(QueryListSchema), controller.findMany.bind(controller));
  router.get('/category/:category', requirePermission(Permissions.SYSTEM_SETTING_VIEW), validateParams(categoryParamSchema), controller.listByCategory.bind(controller));
  router.get('/:id', requirePermission(Permissions.SYSTEM_SETTING_VIEW), validateParams(idParamSchema), controller.findById.bind(controller));
  router.get('/key/:key', requirePermission(Permissions.SYSTEM_SETTING_VIEW), validateParams(keyParamSchema), controller.findByKey.bind(controller));

  // Bulk updates — requires the update permission (multiple rows per Save Changes).
  router.put('/bulk', requirePermission(Permissions.SYSTEM_SETTING_UPDATE), validateBody(BulkUpdateSettingSchema), controller.bulkUpdate.bind(controller));

  // Single-row updates.
  router.put('/:id', requirePermission(Permissions.SYSTEM_SETTING_UPDATE), validateParams(idParamSchema), validateBody(UpdateSystemSettingSchema), controller.update.bind(controller));

  // Custom key creation & deletion are Super-Admin only (Advanced mode).
  router.post('/', requirePermission([Permissions.SYSTEM_SETTING_CREATE, Permissions.SYSTEM_CONFIG_MANAGE], 'ALL'), validateBody(CreateSystemSettingSchema), controller.create.bind(controller));
  router.delete('/:id', requirePermission([Permissions.SYSTEM_SETTING_DELETE, Permissions.SYSTEM_CONFIG_MANAGE], 'ALL'), validateParams(idParamSchema), controller.delete.bind(controller));

  return router;
}
