import type { PrismaClient, Prisma } from '@prisma/client';

import type {
  CreateSystemSettingInput,
  ISystemSettingRepository,
  SystemSettingFilterParams,
  UpdateSystemSettingInput,
} from './system-setting.types.js';
export class SystemSettingRepository implements ISystemSettingRepository {
  constructor(private prisma: PrismaClient) {}

  async create(companyId: number, userId: number, data: CreateSystemSettingInput) {
    return this.prisma.systemSetting.create({ data: { ...data, companyId, updatedBy: userId } });
  }

  async findById(companyId: number, id: number) {
    return this.prisma.systemSetting.findFirst({ where: { id, companyId } });
  }

  async findByKey(companyId: number, key: string) {
    return this.prisma.systemSetting.findFirst({ where: { companyId, settingKey: key } });
  }

  async findMany(companyId: number, query: SystemSettingFilterParams) {
    const { page = 1, pageSize = 25, search, category } = query;
    const skip = (page - 1) * pageSize;
    const where: Prisma.SystemSettingWhereInput = {
      companyId,
      ...(category && { category }),
      ...(search && { settingKey: { contains: search, mode: 'insensitive' } }),
    } as any;

    const [items, total] = await Promise.all([
      this.prisma.systemSetting.findMany({ where, skip, take: pageSize, orderBy: { createdAt: 'desc' } }),
      this.prisma.systemSetting.count({ where }),
    ]);

    return { items, total, page, pageSize };
  }

  async countMany(companyId: number) {
    return this.prisma.systemSetting.count({ where: { companyId } });
  }

  async update(companyId: number, id: number, userId: number, data: UpdateSystemSettingInput) {
    return this.prisma.systemSetting.update({ where: { id, companyId }, data: { ...data, updatedBy: userId } });
  }

  async delete(companyId: number, id: number) {
    return this.prisma.systemSetting.delete({ where: { id } });
  }
}
