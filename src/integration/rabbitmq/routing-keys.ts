export const RoutingKeys = {
  //
  // EMS → LMS
  //
  EMPLOYEE_CREATED: "employee.created",
  EMPLOYEE_UPDATED: "employee.updated",
  EMPLOYEE_DELETED: "employee.deleted",

  COMPANY_UPDATED: "company.updated",

  DEPARTMENT_CREATED: "department.created",
  DEPARTMENT_UPDATED: "department.updated",

  JOB_TITLE_UPDATED: "job-title.updated",

  JOB_LEVEL_UPDATED: "job-level.updated",

  ROLE_UPDATED: "role.updated",

  //
  // LMS → Other Services
  //
  COURSE_CREATED: "course.created",
  COURSE_UPDATED: "course.updated",
  COURSE_PUBLISHED: "course.published",

  PROGRAM_CREATED: "program.created",
  PROGRAM_UPDATED: "program.updated",

  ENROLLMENT_CREATED: "enrollment.created",
  ENROLLMENT_COMPLETED: "enrollment.completed",

  ASSESSMENT_COMPLETED: "assessment.completed",

  CERTIFICATE_ISSUED: "certificate.issued",

  SURVEY_COMPLETED: "survey.completed",

  NOTIFICATION_CREATED: "notification.created",
} as const;

export type RoutingKey =
  (typeof RoutingKeys)[keyof typeof RoutingKeys];