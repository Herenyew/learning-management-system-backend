import { Prisma } from "@prisma/client";
import prisma from "../../config/database.js";

// Export the inferred return type so AuthService gets full type safety for relations
export type AuthenticatedUser = Prisma.PromiseReturnType<
  typeof AuthRepository.prototype.findAuthenticatedUser
>;

class AuthRepository {
  async findAuthenticatedUser(appUserId: number) {
    // 1. Fetch user base info for companyId
    const baseUser = await prisma.appUser.findFirst({
      where: { id: appUserId },
      select: { companyId: true },
    });

    if (!baseUser) return null;

    // 2. Fetch user with relations
    return prisma.appUser.findFirst({
      where: {
        id: appUserId,
      },
      select: {
        id: true,
        email: true,
        companyId: true,
        roleId: true,
        isActive: true,
        employee: {
          select: {
            id: true,
            isActive: true,
          },
        },
        role: {
          select: {
            id: true,
            lmsPermissions: {
              where: {
                companyId: baseUser.companyId,
              },
              select: {
                permission: {
                  select: {
                    code: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}

export default new AuthRepository();