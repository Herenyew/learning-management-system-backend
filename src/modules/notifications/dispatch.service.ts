import { NotificationChannel } from "@prisma/client";

import { env } from "../../config/env.js";
import { notificationEventCatalog } from "./events.js";
import { emailDeliveryService } from "./email-delivery.service.js";
import { emailDeliveryOutboxService } from "./email-delivery-outbox.service.js";
import { notificationRealtimeHub } from "./realtime-hub.js";
import { notificationsRepository } from "./repository.js";
import { renderNotificationTemplate } from "./template-renderer.js";
import type {
  NotificationDispatchInput,
  NotificationDispatchResult,
  NotificationRecipient,
  NotificationTransaction,
} from "./types.js";

const uniqueNumbers = (values: number[]) => Array.from(new Set(values));

const userChannelEnabled = (
  user: NotificationRecipient,
  channel: "EMAIL" | "IN_APP",
  eventCode: string,
) =>
  user.notificationSettings.find(
    (setting) =>
      setting.channel.toUpperCase() === channel &&
      setting.notificationType === eventCode,
  )?.isEnabled !== false;

const baseUrl = env.cors.clientUrl || "http://localhost:3000";

const absoluteActionUrl = (actionUrl?: string) => {
  if (!actionUrl) return baseUrl;
  if (/^https?:\/\//i.test(actionUrl)) return actionUrl;
  return `${baseUrl}${actionUrl.startsWith("/") ? actionUrl : `/${actionUrl}`}`;
};

export const notificationDispatcher = {
  async dispatch(
    transaction: NotificationTransaction,
    input: NotificationDispatchInput,
  ): Promise<NotificationDispatchResult> {
    const definition = notificationEventCatalog[input.eventCode];
    if (!definition) {
      return { emails: [], inAppCount: 0 };
    }

    const [settings, recipients, managedTemplate] = await Promise.all([
      notificationsRepository.findCompanyChannelSettings(
        transaction,
        input.companyId,
        definition.area,
      ),
      notificationsRepository.findRecipients(
        transaction,
        input.companyId,
        uniqueNumbers(input.recipientUserIds),
      ),
      notificationsRepository.findManagedEmailTemplate(
        transaction,
        input.companyId,
        input.eventCode,
      ),
    ]);

    const emailEnabled =
      settings.find((setting) => setting.channel === NotificationChannel.EMAIL)
        ?.isEnabled !== false;
    const inAppEnabled =
      settings.find((setting) => setting.channel === NotificationChannel.IN_APP)
        ?.isEnabled !== false;
    if (!emailEnabled && !inAppEnabled) return { emails: [], inAppCount: 0 };

    const managedTemplateData = managedTemplate;
    const actionUrl = input.actionUrl ?? null;
    const emailActionUrl = absoluteActionUrl(input.actionUrl);
    const recipientStates = recipients.map((recipient) => {
      const allowsEmail =
        emailEnabled &&
        userChannelEnabled(
          recipient,
          NotificationChannel.EMAIL,
          input.eventCode,
        );
      const allowsInApp =
        inAppEnabled &&
        userChannelEnabled(
          recipient,
          NotificationChannel.IN_APP,
          input.eventCode,
        );
      const variables = {
        ...(input.variables ?? {}),
        recipientName: recipient.preferredName ?? recipient.fullName,
        recipientEmail: recipient.email,
        actionUrl: emailActionUrl,
        actionPath: input.actionUrl ?? "",
      };
      return {
        recipient,
        allowsEmail,
        allowsInApp,
        rendered: renderNotificationTemplate({
          definition,
          managedTemplateData,
          eventCode: input.eventCode,
          variables,
          actionUrl: emailActionUrl,
        }),
      };
    });

    const hasOccurrence = Boolean(
      input.occurrenceKey && input.entityType && input.entityId,
    );
    let eligibleStates = recipientStates.filter(
      (state) => state.allowsEmail || state.allowsInApp,
    );
    if (hasOccurrence) {
      const existingUserIds = new Set(
        await notificationsRepository.findExistingOccurrenceUserIds(
          transaction,
          {
            companyId: input.companyId,
            userIds: eligibleStates.map(({ recipient }) => recipient.id),
            eventCode: input.eventCode,
            entityType: input.entityType!,
            entityId: input.entityId!,
            occurrenceKey: input.occurrenceKey!,
          },
        ),
      );
      eligibleStates = eligibleStates.filter(
        ({ recipient }) => !existingUserIds.has(recipient.id),
      );
    }

    const statesToPersist = eligibleStates;
    const persisted = await notificationsRepository.createNotifications(
      transaction,
      statesToPersist.map((state) => ({
        companyId: input.companyId,
        appUserId: state.recipient.id,
        title: state.rendered.title,
        body: state.rendered.body,
        notificationType: input.eventCode,
        eventCode: input.eventCode,
        entityType: input.entityType ?? null,
        entityId: input.entityId ?? null,
        occurrenceKey: input.occurrenceKey ?? null,
        inAppVisible: state.allowsInApp,
        actionUrl,
      })),
    );
    const persistedUserIds = new Set(persisted.map((row) => row.appUserId));
    const realtimeUserIds = uniqueNumbers(
      persisted.filter((row) => row.inAppVisible).map((row) => row.appUserId),
    );
    const emailStates = eligibleStates.filter(
      (state) =>
        state.allowsEmail &&
        (!hasOccurrence || persistedUserIds.has(state.recipient.id)),
    );

    const emails = emailStates.map((state) => ({
      recipients: [
        {
          email: state.recipient.email,
          name: state.recipient.preferredName ?? state.recipient.fullName,
        },
      ],
      subject: state.rendered.subject,
      text: `${state.rendered.emailBody}\n\n${definition.actionLabel}: ${emailActionUrl}`,
      html: state.rendered.html,
    }));
    let emailOutboxIds: number[] = [];
    const outboxDelegate = (transaction as NotificationTransaction & {
      emailDeliveryOutbox?: NotificationTransaction["emailDeliveryOutbox"];
    }).emailDeliveryOutbox;
    if (outboxDelegate && emails.length > 0) {
      const rows = emailStates.flatMap((state, index) => {
        const notification = persisted.find((item) => item.appUserId === state.recipient.id);
        if (!notification) return [];
        return [{
          companyId: input.companyId,
          eventKey: `notification-email:${notification.id}`,
          payload: JSON.parse(JSON.stringify(emails[index])),
        }];
      });
      if (rows.length > 0) {
        await outboxDelegate.createMany({ data: rows, skipDuplicates: true });
        const saved = await outboxDelegate.findMany({
          where: { eventKey: { in: rows.map((row) => row.eventKey) } },
          select: { id: true },
        });
        emailOutboxIds = saved.map((row) => row.id);
      }
    }

    return {
      inAppCount: persisted.filter((row) => row.inAppVisible).length,
      emails,
      emailOutboxIds,
      ...(realtimeUserIds.length > 0
        ? {
            realtime: {
              companyId: input.companyId,
              userIds: realtimeUserIds,
              signal: {
                reason: "notification.created" as const,
                occurredAt: new Date().toISOString(),
              },
            },
          }
        : {}),
    };
  },

  async deliverAfterCommit(result: NotificationDispatchResult) {
    if (result.emailOutboxIds && result.emailOutboxIds.length > 0) {
      await emailDeliveryOutboxService.processIds(result.emailOutboxIds);
    } else {
      await emailDeliveryService.deliver(result.emails);
    }
    if (result.realtime) {
      for (const userId of result.realtime.userIds) {
        notificationRealtimeHub.publish(
          result.realtime.companyId,
          userId,
          result.realtime.signal,
        );
      }
    }
  },
};
