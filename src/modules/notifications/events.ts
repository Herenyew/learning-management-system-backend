import { NotificationArea } from "@prisma/client";

export const notificationEventCodes = [
  "COURSE_ENROLLMENT_CONFIRMED",
  "PROGRAM_ENROLLMENT_CONFIRMED",
  "TNA_REQUEST_SUBMITTED",
  "TNA_REQUEST_APPROVED",
  "TNA_REQUEST_REJECTED",
  "COURSE_PUBLISHING_REVIEW_REQUESTED",
  "COURSE_PUBLISHED",
  "COURSE_REJECTED",
  "COURSE_REVISION_REQUESTED",
  "PROGRAM_PUBLISHING_REVIEW_REQUESTED",
  "PROGRAM_PUBLISHED",
  "PROGRAM_REJECTED",
  "PROGRAM_REVISION_REQUESTED",
  "CERTIFICATE_ISSUED",
  "CERTIFICATE_EXPIRING",
] as const;

export type NotificationEventCode = (typeof notificationEventCodes)[number];

export type NotificationEventDefinition = {
  area: NotificationArea;
  title: string;
  subject: string;
  body: string;
  actionLabel: string;
};

export const notificationEventCatalog: Record<
  NotificationEventCode,
  NotificationEventDefinition
> = {
  COURSE_ENROLLMENT_CONFIRMED: {
    area: NotificationArea.COURSE,
    title: "Course enrollment confirmed",
    subject: "Enrollment confirmed: {{courseTitle}}",
    body: "You are enrolled in {{courseTitle}}.",
    actionLabel: "Open course",
  },
  PROGRAM_ENROLLMENT_CONFIRMED: {
    area: NotificationArea.PROGRAM,
    title: "Program enrollment confirmed",
    subject: "Enrollment confirmed: {{programTitle}}",
    body: "You are enrolled in {{programTitle}}.",
    actionLabel: "Open program",
  },
  TNA_REQUEST_SUBMITTED: {
    area: NotificationArea.TNA,
    title: "Training needs request submitted",
    subject: "New training needs request from {{requesterName}}",
    body: "{{requesterName}} submitted a {{requestType}} training needs request for review.",
    actionLabel: "Review request",
  },
  TNA_REQUEST_APPROVED: {
    area: NotificationArea.TNA,
    title: "Training needs request approved",
    subject: "Your training needs request was approved",
    body: "Your {{requestType}} training needs request has been approved.",
    actionLabel: "View request",
  },
  TNA_REQUEST_REJECTED: {
    area: NotificationArea.TNA,
    title: "Training needs request rejected",
    subject: "Your training needs request was rejected",
    body: "Your {{requestType}} training needs request has been rejected.",
    actionLabel: "View request",
  },
  COURSE_PUBLISHING_REVIEW_REQUESTED: {
    area: NotificationArea.COURSE,
    title: "Course review requested",
    subject: "Review requested: {{courseTitle}}",
    body: "{{courseTitle}} is ready for review.{{reviewDueText}}",
    actionLabel: "Review course",
  },
  COURSE_PUBLISHED: {
    area: NotificationArea.COURSE,
    title: "Course approved and published",
    subject: "Course published: {{courseTitle}}",
    body: "{{courseTitle}} has been approved and is now available to learners.{{reviewerNote}}",
    actionLabel: "Open course",
  },
  COURSE_REJECTED: {
    area: NotificationArea.COURSE,
    title: "Course submission rejected",
    subject: "Course rejected: {{courseTitle}}",
    body: "{{courseTitle}} was not approved and has returned to draft.{{reviewerNote}}",
    actionLabel: "Open course",
  },
  COURSE_REVISION_REQUESTED: {
    area: NotificationArea.COURSE,
    title: "Course changes requested",
    subject: "Changes requested: {{courseTitle}}",
    body: "{{courseTitle}} requires updates before it can be published.{{reviewerNote}}",
    actionLabel: "Open course",
  },
  PROGRAM_PUBLISHING_REVIEW_REQUESTED: {
    area: NotificationArea.PROGRAM,
    title: "Program review requested",
    subject: "Review requested: {{programName}}",
    body: "{{programName}} is ready for review.{{reviewDueText}}",
    actionLabel: "Review program",
  },
  PROGRAM_PUBLISHED: {
    area: NotificationArea.PROGRAM,
    title: "Program approved and published",
    subject: "Program published: {{programName}}",
    body: "{{programName}} has been approved and is now active.{{reviewerNote}}",
    actionLabel: "Open program",
  },
  PROGRAM_REJECTED: {
    area: NotificationArea.PROGRAM,
    title: "Program submission rejected",
    subject: "Program rejected: {{programName}}",
    body: "{{programName}} was not approved and has returned to draft.{{reviewerNote}}",
    actionLabel: "Open program",
  },
  PROGRAM_REVISION_REQUESTED: {
    area: NotificationArea.PROGRAM,
    title: "Program changes requested",
    subject: "Changes requested: {{programName}}",
    body: "{{programName}} requires updates before it can be published.{{reviewerNote}}",
    actionLabel: "Open program",
  },
  CERTIFICATE_ISSUED: {
    area: NotificationArea.CERTIFICATE,
    title: "Certificate issued",
    subject: "Certificate issued: {{certificateName}}",
    body: "Your certificate {{certificateNumber}} for {{certificateName}} is now available.",
    actionLabel: "View certificate",
  },
  CERTIFICATE_EXPIRING: {
    area: NotificationArea.CERTIFICATE_EXPIRY,
    title: "Certificate expiring soon",
    subject: "Certificate expires in {{daysUntilExpiry}} days",
    body: "Your certificate {{certificateNumber}} for {{certificateName}} expires on {{expiryDate}}.",
    actionLabel: "View certificate",
  },
};
