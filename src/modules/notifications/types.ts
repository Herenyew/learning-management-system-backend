import type { Prisma } from "@prisma/client";
import type { NotificationEventCode } from "./events.js";

export type NotificationTransaction = Prisma.TransactionClient;
export type NotificationVariable =
  | string
  | number
  | boolean
  | Date
  | null
  | undefined;

export type NotificationDispatchInput = {
  companyId: number;
  eventCode: NotificationEventCode;
  recipientUserIds: number[];
  entityType?: string;
  entityId?: string;
  occurrenceKey?: string;
  actionUrl?: string;
  variables?: Record<string, NotificationVariable>;
};

export type NotificationRealtimeSignal = {
  reason: "notification.created" | "notification.read-state.changed" | "permissions.changed";
  occurredAt: string;
};

export type NotificationDispatchResult = {
  emails: Array<{
    recipients: Array<{ email: string; name: string }>;
    subject: string;
    text: string;
    html: string;
  }>;
  inAppCount: number;
  emailOutboxIds?: number[];
  realtime?: {
    companyId: number;
    userIds: number[];
    signal: NotificationRealtimeSignal;
  };
};

export type NotificationRecipient = {
  id: number;
  email: string;
  fullName: string;
  preferredName: string | null;
  notificationSettings: Array<{
    channel: string;
    notificationType: string;
    isEnabled: boolean;
  }>;
};

export type RenderedNotification = {
  title: string;
  body: string;
  subject: string;
  emailBody: string;
  html: string;
};

export type InboxQuery = {
  page: number;
  pageSize: number;
  unreadOnly: boolean;
};
