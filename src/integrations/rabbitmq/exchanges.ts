export const Exchanges = {
  EMS: "ems.events",
  LMS: "lms.events",
} as const;

export type Exchange =
  (typeof Exchanges)[keyof typeof Exchanges];