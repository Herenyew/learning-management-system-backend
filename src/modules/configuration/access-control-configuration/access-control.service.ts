import { getPrismaClient } from "../../../config/database.js";
import { notificationRealtimeHub } from "../../notifications/realtime-hub.js";
import { accessControlRepository } from "./access-control.repository.js";

export const accessControlService = {
  list(companyId: number) {
    return accessControlRepository.list(companyId);
  },

  async updateRolePermissions(input: {
    companyId: number;
    actorUserId?: number;
    roleId: number;
    actorRoleId?: number;
    permissionCodes: string[];
  }) {
    await accessControlRepository.replaceRolePermissions(input);

    // Find all active users who hold this role so we can notify only them.
    // We target by role so learners (who have a different role) are not
    // unnecessarily re-fetching their session.
    const affectedUsers = await getPrismaClient().appUser.findMany({
      where: {
        companyId: input.companyId,
        roleId: input.roleId,
        isActive: true,
      },
      select: { id: true },
    });

    if (affectedUsers.length > 0) {
      notificationRealtimeHub.publishToUsers(
        input.companyId,
        affectedUsers.map((u) => u.id),
        {
          reason: "permissions.changed",
          occurredAt: new Date().toISOString(),
        },
      );
    }

    return accessControlRepository.list(input.companyId);
  },
};
