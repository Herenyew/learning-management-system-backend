import prisma from "../../config/database.js";

class AuthRepository {
  async findAuthenticatedUser(appUserId: number) {
    return prisma.appUser.findUnique({
      where: {
        id: appUserId,
      },

      include: {
        employee: true,

        role: {
          include: {
            lmsPermissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
  }
}

export default new AuthRepository();