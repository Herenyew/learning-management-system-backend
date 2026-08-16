import { PrismaClient, Prisma } from '@prisma/client';

export interface ISystemSettingRepository {
  create(companyId: number, userId: number, data: any): Promise<any>;
  findById(companyId: number, id: number): Promise<any | null>;
  findByKey(companyId: number, key: string): Promise<any | null>;
  findMany(companyId: number, query: any): Promise<{ items: any[]; total: number; page: number; pageSize: number }>;
  countMany(companyId: number): Promise<number>;
  update(companyId: number, id: number, userId: number, data: any): Promise<any>;
  delete(companyId: number, id: number): Promise<any>;
}

export class SystemSettingRepository implements ISystemSettingRepository {
  constructor(private prisma: PrismaClient) {}

  async create(companyId: number, userId: number, data: any) {
    return this.prisma.systemSetting.create({ data: { ...data, companyId, updatedBy: userId } });
  }

  async findById(companyId: number, id: number) {
    return this.prisma.systemSetting.findFirst({ where: { id, companyId } });
  }

  async findByKey(companyId: number, key: string) {
    return this.prisma.systemSetting.findFirst({ where: { companyId, settingKey: key } });
  }

  async findMany(companyId: number, query: any) {
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

  async update(companyId: number, id: number, userId: number, data: any) {
    return this.prisma.systemSetting.update({ where: { id, companyId }, data: { ...data, updatedBy: userId } });
  }

  async delete(companyId: number, id: number) {
    return this.prisma.systemSetting.delete({ where: { id } });
  }
}
