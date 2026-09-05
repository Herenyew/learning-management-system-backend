import { getPrismaClient } from "../../../config/database.js";

const prisma = () => getPrismaClient();

export const emsMappingRepository = {
  findAll(companyId: number) {
    return prisma().eMSRoleMapping.findMany({
      where: { companyId },
      include: {
        appRole: { select: { id: true, name: true, description: true, isActive: true } },
      },
      orderBy: [{ priority: "desc" }, { emsRoleName: "asc" }],
    });
  },

  findByEmsRole(emsRoleName: string, companyId: number) {
    return prisma().eMSRoleMapping.findFirst({
      where: {
        emsRoleName: { equals: emsRoleName, mode: "insensitive" },
        companyId,
        isActive: true,
      },
      include: { appRole: true },
      orderBy: { priority: "desc" },
    });
  },

  findById(id: number, companyId: number) {
    return prisma().eMSRoleMapping.findFirst({
      where: { id, companyId },
      include: { appRole: { select: { id: true, name: true } } },
    });
  },

  create(data: {
    companyId: number;
    emsRoleName: string;
    appRoleId: number;
    autoAssign?: boolean;
    priority?: number;
  }) {
    return prisma().eMSRoleMapping.create({ data });
  },

  update(
    id: number,
    data: Partial<{
      emsRoleName: string;
      appRoleId: number;
      isActive: boolean;
      autoAssign: boolean;
      priority: number;
    }>,
  ) {
    return prisma().eMSRoleMapping.update({
      where: { id },
      data: { ...data, updatedAt: new Date() },
    });
  },

  delete(id: number) {
    return prisma().eMSRoleMapping.delete({ where: { id } });
  },
};
