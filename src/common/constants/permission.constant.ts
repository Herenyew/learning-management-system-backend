export const Permissions = {
  // Course Management
  COURSE_CREATE: "course.create",
  COURSE_READ: "course.read",
  COURSE_UPDATE: "course.update",
  COURSE_DELETE: "course.delete",
  COURSE_PUBLISH: "course.publish",

  // Audience Management
  AUDIENCE_CREATE: "audience.create",
  AUDIENCE_VIEW: "audience.view",
  AUDIENCE_UPDATE: "audience.edit",
  AUDIENCE_DELETE: "audience.delete",

  // Assessments
  ASSESSMENT_CREATE: "assessment.create",
  ASSESSMENT_VIEW: "assessment.view",
  ASSESSMENT_GRADE: "assessment.grade",
} as const;

export type PermissionCode = (typeof Permissions)[keyof typeof Permissions];