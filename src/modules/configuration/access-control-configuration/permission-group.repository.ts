import { getPrismaClient } from "../../../config/database.js";

const prisma = () => getPrismaClient();

export const permissionGroupRepository = {
  findAll(companyId: number) {
    return prisma().permissionGroup.findMany({
      where: { companyId, isActive: true },
      include: {
        _count: { select: { permissions: true } },
      },
      orderBy: [{ module: "asc" }, { name: "asc" }],
    });
  },

  findById(id: number, companyId: number) {
    return prisma().permissionGroup.findFirst({
      where: { id, companyId },
      include: {
        permissions: {
          select: { id: true, code: true, description: true, module: true },
          orderBy: { code: "asc" },
        },
      },
    });
  },

  findByName(name: string, companyId: number) {
    return prisma().permissionGroup.findFirst({
      where: { companyId, name: { equals: name, mode: "insensitive" } },
    });
  },

  create(data: {
    companyId: number;
    name: string;
    description?: string;
    module: string;
  }) {
    return prisma().permissionGroup.create({ data });
  },

  update(
    id: number,
    data: Partial<{
      name: string;
      description: string;
      module: string;
      isActive: boolean;
    }>,
  ) {
    return prisma().permissionGroup.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  },

  async delete(id: number, companyId: number) {
    return prisma().$transaction(async (tx) => {
      // Unlink permissions from this group before deleting
      await tx.lmsPermission.updateMany({
        where: { groupId: id, companyId },
        data: { groupId: null },
      });
      return tx.permissionGroup.delete({ where: { id } });
    });
  },

  countPermissionsInGroup(id: number) {
    return prisma().lmsPermission.count({ where: { groupId: id } });
  },
};
