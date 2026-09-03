import { notificationDispatcher } from "../notifications/index.js";
import { generateCertificateNumber } from "./certificate-number.js";
import { certificatesRepository } from "./certificates.repository.js";

const utcDayWindow = (now: Date, daysFromNow: number) => {
  const start = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + daysFromNow,
    ),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
};

export const certificatesService = {
  async issue(
    context: { companyId: number; actorUserId: number },
    input: {
      userId: number;
      templateId: number;
      courseId?: number;
      programId?: number;
      expiresAt?: Date | null;
    },
  ) {
    const result = await certificatesRepository.transaction(
      async (transaction) => {
        const issueCtx = await certificatesRepository.findIssueContext(transaction, {
          companyId: context.companyId,
          ...input,
        });
        const certificate = await certificatesRepository.issue(transaction, {
          companyId: context.companyId,
          issuedByUserId: context.actorUserId,
          certificateNumber: generateCertificateNumber(),
          ...input,
        });
        const dispatch = await notificationDispatcher.dispatch(transaction, {
          companyId: context.companyId,
          eventCode: "CERTIFICATE_ISSUED",
          recipientUserIds: [input.userId],
          entityType: "CERTIFICATE",
          entityId: String(certificate.id),
          occurrenceKey: "issued",
          actionUrl: `/?screen=my-certificates&certificateId=${certificate.id}`,
          variables: {
            certificateName: certificate.template?.name ?? issueCtx.template?.name ?? "Certificate",
            certificateNumber: certificate.certificateNumber,
          },
        });
        return { certificate, dispatch };
      },
    );
    await notificationDispatcher.deliverAfterCommit(result.dispatch);
    return result.certificate;
  },

  listOwn(context: { companyId: number; userId: number }) {
    return certificatesRepository.listOwn(context.companyId, context.userId);
  },

  async processExpiry(companyId: number, now = new Date()) {
    const result = await certificatesRepository.transaction(
      async (transaction) => {
        const dispatches = [];
        let scanned = 0;
        for (const daysUntilExpiry of [30, 7] as const) {
          const window = utcDayWindow(now, daysUntilExpiry);
          const certificates = await certificatesRepository.findExpiring(
            transaction,
            companyId,
            window.start,
            window.end,
          );
          scanned += certificates.length;
          for (const certificate of certificates) {
            const expiryDate = certificate.expiresAt!;
            const recipientUserId = certificate.completion?.enrollment?.employee?.appUsers[0]?.id;
            if (!recipientUserId) continue;

            dispatches.push(
              await notificationDispatcher.dispatch(transaction, {
                companyId,
                eventCode: "CERTIFICATE_EXPIRING",
                recipientUserIds: [recipientUserId],
                entityType: "CERTIFICATE",
                entityId: String(certificate.id),
                occurrenceKey: `${daysUntilExpiry}d:${expiryDate.toISOString().slice(0, 10)}`,
                actionUrl: `/?screen=my-certificates&certificateId=${certificate.id}`,
                variables: {
                  certificateName: certificate.template?.name ?? "Certificate",
                  certificateNumber: certificate.certificateNumber,
                  daysUntilExpiry,
                  expiryDate: expiryDate.toLocaleDateString("en-GB", {
                    timeZone: "UTC",
                  }),
                },
              }),
            );
          }
        }
        return { scanned, dispatches };
      },
    );
    await Promise.all(
      result.dispatches.map((dispatch) =>
        notificationDispatcher.deliverAfterCommit(dispatch),
      ),
    );
    return {
      scanned: result.scanned,
      inAppCreated: result.dispatches.reduce(
        (total, item) => total + item.inAppCount,
        0,
      ),
      emailsPrepared: result.dispatches.reduce(
        (total, item) => total + item.emails.length,
        0,
      ),
    };
  },
};
