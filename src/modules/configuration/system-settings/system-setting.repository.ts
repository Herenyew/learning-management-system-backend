import type { PrismaClient, Prisma } from '@prisma/client';

import type {
  BulkUpdateItem,
  CreateSystemSettingInput,
  ISystemSettingRepository,
  SystemSettingFilterParams,
  UpdateSystemSettingInput,
} from './system-setting.types.js';
export class SystemSettingRepository implements ISystemSettingRepository {
  constructor(private prisma: PrismaClient) {}

  async create(companyId: number, userId: number, data: CreateSystemSettingInput) {
    return this.prisma.systemSetting.create({
      data: {
        ...data,
        companyId,
        createdBy: userId,
        updatedBy: userId,
      } as Prisma.SystemSettingUncheckedCreateInput,
    });
  }

  async findById(companyId: number, id: number) {
    return this.prisma.systemSetting.findFirst({ where: { id, companyId } });
  }

  async findByKey(companyId: number, key: string) {
    return this.prisma.systemSetting.findFirst({ where: { companyId, settingKey: key } });
  }

  async findMany(companyId: number, query: SystemSettingFilterParams) {
    const { page = 1, pageSize = 100, search, category, isActive } = query;
    const skip = (page - 1) * pageSize;
    const where: Prisma.SystemSettingWhereInput = {
      companyId,
      ...(category && { category }),
      ...(isActive !== undefined && { isActive }),
      ...(search && { settingKey: { contains: search, mode: 'insensitive' } }),
    };

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
    return this.prisma.systemSetting.update({
      where: { id, companyId },
      data: { ...data, updatedBy: userId } as Prisma.SystemSettingUncheckedUpdateInput,
    });
  }

  async bulkUpdate(companyId: number, userId: number, items: BulkUpdateItem[]) {
    const prisma = this.prisma;
    const ids = items.filter((i) => i.id != null).map((i) => i.id as number);

    const results = await prisma.$transaction(
      items.map((item) => {
        if (item.id != null) {
          return prisma.systemSetting.update({
            where: { id: item.id, companyId },
            data: {
              ...(item.settingValue !== undefined && { settingValue: item.settingValue as Prisma.InputJsonValue }),
              ...(item.isActive !== undefined && { isActive: item.isActive }),
              updatedBy: userId,
            },
          });
        }
        // Upsert by key (used by seeding / bulk writes from the UI)
        return prisma.systemSetting.upsert({
          where: { companyId_settingKey: { companyId, settingKey: item.settingKey as string } },
          create: {
            companyId,
            settingKey: item.settingKey as string,
            settingValue: (item.settingValue ?? null) as Prisma.InputJsonValue,
            valueType: 'STRING',
            createdBy: userId,
            updatedBy: userId,
          } as Prisma.SystemSettingUncheckedCreateInput,
          update: {
            ...(item.settingValue !== undefined && { settingValue: item.settingValue as Prisma.InputJsonValue }),
            ...(item.isActive !== undefined && { isActive: item.isActive }),
            updatedBy: userId,
          },
        });
      }),
    );

    void ids;
    return results;
  }

  async delete(companyId: number, id: number) {
    // Tenant isolation: the delete must never cross company boundaries
    return this.prisma.systemSetting.delete({ where: { id, companyId } });
  }
}
