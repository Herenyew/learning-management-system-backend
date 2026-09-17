import {
  NotificationChannel,
  type NotificationArea,
  type Prisma,
} from "@prisma/client";

import { getPrismaClient } from "../../config/database.js";
import type {
  InboxQuery,
  NotificationRecipient,
  NotificationTransaction,
} from "./types.js";

const recipientSelect = {
  id: true,
  email: true,
  employee: {
    select: {
      fullName: true,
    },
  },
  notificationSettings: {
    select: { channel: true, notificationType: true, isEnabled: true },
  },
} satisfies Prisma.AppUserSelect;

const inboxSelect = {
  id: true,
  title: true,
  body: true,
  eventCode: true,
  notificationType: true,
  actionUrl: true,
  readAt: true,
  createdAt: true,
} satisfies Prisma.NotificationSelect;

export const notificationsRepository = {
  transaction<T>(
    operation: (transaction: NotificationTransaction) => Promise<T>,
  ) {
    return getPrismaClient().$transaction(operation);
  },

  findCompanyChannelSettings(
    transaction: NotificationTransaction,
    companyId: number,
    area: NotificationArea,
  ) {
    return transaction.companyNotificationSetting.findMany({
      where: {
        companyId,
        area,
        channel: {
          in: [NotificationChannel.EMAIL, NotificationChannel.IN_APP],
        },
      },
      select: { channel: true, isEnabled: true },
    });
  },

  async findRecipients(
    transaction: NotificationTransaction,
    companyId: number,
    userIds: number[],
  ): Promise<NotificationRecipient[]> {
    if (userIds.length === 0) return Promise.resolve([]);
    const users = await transaction.appUser.findMany({
      where: { companyId, id: { in: userIds }, isActive: true },
      select: recipientSelect,
    });
    return users.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.employee?.fullName ?? u.email,
      preferredName: null,
      notificationSettings: u.notificationSettings,
    }));
  },

  findManagedEmailTemplate(
    transaction: NotificationTransaction,
    companyId: number,
    eventCode: string,
  ) {
    return transaction.notificationTemplate.findFirst({
      where: { companyId, eventCode, isActive: true },
      select: { body: true, subject: true, variables: true },
    });
  },

  findExistingOccurrenceUserIds(
    transaction: NotificationTransaction,
    input: {
      companyId: number;
      userIds: number[];
      eventCode: string;
      entityType: string;
      entityId: string;
      occurrenceKey: string;
    },
  ) {
    return transaction.notification
      .findMany({
        where: {
          companyId: input.companyId,
          appUserId: { in: input.userIds },
          eventCode: input.eventCode,
          entityType: input.entityType,
          entityId: input.entityId,
          occurrenceKey: input.occurrenceKey,
        },
        select: { appUserId: true },
      })
      .then((rows) => rows.map((row) => row.appUserId));
  },

  createNotifications(
    transaction: NotificationTransaction,
    data: Prisma.NotificationCreateManyInput[],
  ) {
    if (data.length === 0) return Promise.resolve([]);
    return transaction.notification.createManyAndReturn({
      data,
      skipDuplicates: true,
      select: { id: true, appUserId: true, inAppVisible: true },
    });
  },

  async listInbox(companyId: number, userId: number, query: InboxQuery) {
    const where: Prisma.NotificationWhereInput = {
      companyId,
      appUserId: userId,
      inAppVisible: true,
      ...(query.unreadOnly ? { readAt: null } : {}),
    };
    const prisma = getPrismaClient();
    const [items, total] = await prisma.$transaction([
      prisma.notification.findMany({
        where,
        select: inboxSelect,
        orderBy: [{ createdAt: "desc" }, { id: "desc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      prisma.notification.count({ where }),
    ]);
    return { items, total };
  },

  countUnread(companyId: number, userId: number) {
    return getPrismaClient().notification.count({
      where: { companyId, appUserId: userId, inAppVisible: true, readAt: null },
    });
  },

  async markRead(companyId: number, userId: number, id: string, readAt: Date) {
    const prisma = getPrismaClient();
    const updated = await prisma.notification.updateMany({
      where: { id, companyId, appUserId: userId, inAppVisible: true },
      data: { readAt },
    });
    if (updated.count === 0) return null;
    return prisma.notification.findFirst({
      where: { id, companyId, appUserId: userId, inAppVisible: true },
      select: inboxSelect,
    });
  },

  markAllRead(companyId: number, userId: number, readAt: Date) {
    return getPrismaClient().notification.updateMany({
      where: { companyId, appUserId: userId, inAppVisible: true, readAt: null },
      data: { readAt },
    });
  },
};
