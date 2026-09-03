import { Permissions, type PermissionCode } from "./permission.constant.js";

export type ManagedPermissionDefinition = {
  code: PermissionCode;
  description: string;
  module: "assessment" | "audience" | "program";
  isReadPermission: boolean;
};

const permission = (
  code: PermissionCode,
  description: string,
  module: ManagedPermissionDefinition["module"],
  isReadPermission = false,
): ManagedPermissionDefinition => ({
  code,
  description,
  module,
  isReadPermission,
});

export const managedConfigurationPermissions = [
  permission(
    Permissions.AUDIENCE_CREATE,
    "Create audience groups.",
    "audience",
  ),
  permission(
    Permissions.AUDIENCE_VIEW,
    "View audience groups, rules, options, and resolved members.",
    "audience",
    true,
  ),
  permission(
    Permissions.AUDIENCE_UPDATE,
    "Edit audience groups and rules.",
    "audience",
  ),
  permission(
    Permissions.AUDIENCE_DELETE,
    "Delete audience groups and rules.",
    "audience",
  ),
  permission(
    Permissions.ASSESSMENT_TYPE_CREATE,
    "Create assessment types.",
    "assessment",
  ),
  permission(
    Permissions.ASSESSMENT_TYPE_VIEW,
    "View assessment types.",
    "assessment",
    true,
  ),
  permission(
    Permissions.ASSESSMENT_TYPE_UPDATE,
    "Update assessment types.",
    "assessment",
  ),
  permission(
    Permissions.ASSESSMENT_TYPE_DELETE,
    "Delete assessment types.",
    "assessment",
  ),
  permission(
    Permissions.QUESTION_TYPE_CREATE,
    "Create assessment question types.",
    "assessment",
  ),
  permission(
    Permissions.QUESTION_TYPE_VIEW,
    "View assessment question types.",
    "assessment",
    true,
  ),
  permission(
    Permissions.QUESTION_TYPE_UPDATE,
    "Update assessment question types.",
    "assessment",
  ),
  permission(
    Permissions.QUESTION_TYPE_DELETE,
    "Delete assessment question types.",
    "assessment",
  ),
  permission(
    Permissions.GRADING_METHOD_CREATE,
    "Create grading methods.",
    "assessment",
  ),
  permission(
    Permissions.GRADING_METHOD_VIEW,
    "View grading methods.",
    "assessment",
    true,
  ),
  permission(
    Permissions.GRADING_METHOD_UPDATE,
    "Update grading methods.",
    "assessment",
  ),
  permission(
    Permissions.GRADING_METHOD_DELETE,
    "Delete grading methods.",
    "assessment",
  ),
  permission(
    Permissions.ASSESSMENT_TEMPLATE_CREATE,
    "Create assessment templates.",
    "assessment",
  ),
  permission(
    Permissions.ASSESSMENT_TEMPLATE_VIEW,
    "View assessment templates.",
    "assessment",
    true,
  ),
  permission(
    Permissions.ASSESSMENT_TEMPLATE_UPDATE,
    "Update assessment templates.",
    "assessment",
  ),
  permission(
    Permissions.ASSESSMENT_TEMPLATE_DELETE,
    "Delete assessment templates.",
    "assessment",
  ),
  permission(
    Permissions.PROGRAM_TYPE_CREATE,
    "Create program types.",
    "program",
  ),
  permission(
    Permissions.PROGRAM_TYPE_VIEW,
    "View program types.",
    "program",
    true,
  ),
  permission(
    Permissions.PROGRAM_TYPE_UPDATE,
    "Update program types.",
    "program",
  ),
  permission(
    Permissions.PROGRAM_TYPE_DELETE,
    "Delete program types.",
    "program",
  ),
  permission(
    Permissions.PROGRAM_CATEGORY_CREATE,
    "Create program categories.",
    "program",
  ),
  permission(
    Permissions.PROGRAM_CATEGORY_VIEW,
    "View program categories.",
    "program",
    true,
  ),
  permission(
    Permissions.PROGRAM_CATEGORY_UPDATE,
    "Update program categories.",
    "program",
  ),
  permission(
    Permissions.PROGRAM_CATEGORY_DELETE,
    "Delete program categories.",
    "program",
  ),
  permission(
    Permissions.TASK_TYPE_CREATE,
    "Create program task types.",
    "program",
  ),
  permission(
    Permissions.TASK_TYPE_VIEW,
    "View program task types.",
    "program",
    true,
  ),
  permission(
    Permissions.TASK_TYPE_UPDATE,
    "Update program task types.",
    "program",
  ),
  permission(
    Permissions.TASK_TYPE_DELETE,
    "Delete program task types.",
    "program",
  ),
  permission(
    Permissions.PROGRAM_TEMPLATE_CREATE,
    "Create program templates.",
    "program",
  ),
  permission(
    Permissions.PROGRAM_TEMPLATE_VIEW,
    "View program templates.",
    "program",
    true,
  ),
  permission(
    Permissions.PROGRAM_TEMPLATE_UPDATE,
    "Update program templates.",
    "program",
  ),
  permission(
    Permissions.PROGRAM_TEMPLATE_DELETE,
    "Delete program templates.",
    "program",
  ),
] as const satisfies readonly ManagedPermissionDefinition[];

export const configurationManagerRoleNames = new Set([
  "admin",
  "hr",
  "super admin",
]);
