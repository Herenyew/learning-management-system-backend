export const Permissions = {
  // Course Configuration
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

//Assessment Configuration
  ASSESSMENT_TYPE_CREATE: "assessment_type.create",
  ASSESSMENT_TYPE_READ: "assessment_type.read",
  ASSESSMENT_TYPE_UPDATE: "assessment_type.update",
  ASSESSMENT_TYPE_DELETE: "assessment_type.delete",

  QUESTION_TYPE_CREATE: "question_type.create",
  QUESTION_TYPE_READ: "question_type.read",
  QUESTION_TYPE_UPDATE: "question_type.update",
  QUESTION_TYPE_DELETE: "question_type.delete",

  GRADING_METHOD_CREATE: "grading_method.create",
  GRADING_METHOD_READ: "grading_method.read",
  GRADING_METHOD_UPDATE: "grading_method.update",
  GRADING_METHOD_DELETE: "grading_method.delete",

  ASSESSMENT_TEMPLATE_CREATE: "assessment_template.create",
  ASSESSMENT_TEMPLATE_READ: "assessment_template.read",
  ASSESSMENT_TEMPLATE_UPDATE: "assessment_template.update",
  ASSESSMENT_TEMPLATE_DELETE: "assessment_template.delete",

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