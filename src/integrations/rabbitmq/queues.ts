export const Queues = {
  //
  // EMS Synchronization
  //
  EMPLOYEE_SYNC: "lms.employee.sync",
  COMPANY_SYNC: "lms.company.sync",
  DEPARTMENT_SYNC: "lms.department.sync",
  JOB_TITLE_SYNC: "lms.job-title.sync",
  JOB_LEVEL_SYNC: "lms.job-level.sync",
  ROLE_SYNC: "lms.role.sync",

  //
  // Internal LMS
  //
  NOTIFICATION: "lms.notification",
  ANALYTICS: "lms.analytics",
} as const;

export type Queue =
  (typeof Queues)[keyof typeof Queues];