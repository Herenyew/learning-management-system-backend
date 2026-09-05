import { getPrismaClient } from "../../../config/database.js";

const prisma = () => getPrismaClient();

export const userRoleRepository = {
  findByUser(userId: number) {
    return prisma().userRoleAssignment.findMany({
      where: {
        userId,
        isActive: true,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: {
        appRole: {
          select: {
            id: true,
            name: true,
            description: true,
            isActive: true,
            lmsPermissions: {
              select: { permission: { select: { code: true } } },
            },
          },
        },
      },
      orderBy: { assignedAt: "desc" },
    });
  },

  findByRole(roleId: number, companyId: number) {
    return prisma().userRoleAssignment.findMany({
      where: { appRoleId: roleId, companyId, isActive: true },
      include: {
        user: { select: { id: true, email: true, employeeId: true } },
      },
      orderBy: { assignedAt: "desc" },
    });
  },

  findOne(userId: number, roleId: number) {
    return prisma().userRoleAssignment.findFirst({
      where: { userId, appRoleId: roleId },
    });
  },

  create(data: {
    companyId: number;
    userId: number;
    appRoleId: number;
    assignedBy: number;
    isManual: boolean;
    notes?: string;
    expiresAt?: Date;
  }) {
    return prisma().userRoleAssignment.create({ data });
  },

  reactivate(id: number, data: { assignedBy: number; isManual: boolean; notes?: string; expiresAt?: Date }) {
    return prisma().userRoleAssignment.update({
      where: { id },
      data: { isActive: true, ...data },
    });
  },

  deactivate(userId: number, roleId: number) {
    return prisma().userRoleAssignment.updateMany({
      where: { userId, appRoleId: roleId },
      data: { isActive: false },
    });
  },

  bulkCreate(
    assignments: Array<{
      companyId: number;
      userId: number;
      appRoleId: number;
      assignedBy: number;
      isManual: boolean;
    }>,
  ) {
    return prisma().userRoleAssignment.createMany({
      data: assignments,
      skipDuplicates: true,
    });
  },
};
