export const Permissions = {
  // Course Management
  COURSE_VIEW: "course.view",
  SYSTEM_CONFIG_MANAGE: "system_config.manage",

  COURSE_CATEGORY_CREATE: "course_category.create",
  COURSE_CATEGORY_VIEW: "course_category.view",
  COURSE_CATEGORY_UPDATE: "course_category.update",
  COURSE_CATEGORY_DELETE: "course_category.delete",

  DIFFICULTY_LEVEL_CREATE: "difficulty_level.create",
  DIFFICULTY_LEVEL_VIEW: "difficulty_level.view",
  DIFFICULTY_LEVEL_UPDATE: "difficulty_level.update",
  DIFFICULTY_LEVEL_DELETE: "difficulty_level.delete",

  COURSE_TEMPLATE_CREATE: "course_template.create",
  COURSE_TEMPLATE_VIEW: "course_template.view",
  COURSE_TEMPLATE_UPDATE: "course_template.update",
  COURSE_TEMPLATE_DELETE: "course_template.delete",

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