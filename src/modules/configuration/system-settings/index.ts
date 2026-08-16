import prisma from '../../../config/database.js';
import { SystemSettingRepository } from './system-setting.repository.js';
import { SystemSettingService } from './system-setting.service.js';
import { SystemSettingController } from './system-setting.controller.js';
import systemSettingRoutes from './system-setting.routes.js';

const repository = new SystemSettingRepository(prisma as any);
const service = new SystemSettingService(repository as any);
const controller = new SystemSettingController(service as any);
const router = systemSettingRoutes(controller as any);

export default router;

export { SystemSettingRepository, SystemSettingService, SystemSettingController };
