import {
  managedConfigurationPermissions,
  type ManagedPermissionDefinition,
} from "./configuration-permission.constant.js";
import { Permissions, type PermissionCode } from "./permission.constant.js";

export type AccessControlRoleProfile =
  | "learner"
  | "manager"
  | "creator"
  | "hr"
  | "admin";

export type AccessControlPermissionDefinition = {
  code: PermissionCode;
  description: string;
  module: string;
  defaultProfiles: readonly AccessControlRoleProfile[];
};

const everyone = ["learner", "manager", "creator", "hr", "admin"] as const;
const workforceManagers = ["manager", "hr", "admin"] as const;
const contentManagers = ["creator", "hr", "admin"] as const;
const configurationManagers = ["hr", "admin"] as const;

const operationalPermissions: AccessControlPermissionDefinition[] = [
  {
    code: Permissions.ACCESS_CONTROL_MANAGE,
    description: "Configure LMS permissions assigned to EMS roles.",
    module: "access_control",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.SYSTEM_CONFIG_MANAGE,
    description: "Manage system-level LMS configuration resources.",
    module: "system",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.COURSE_VIEW,
    description: "View course configuration resources.",
    module: "course",
    defaultProfiles: everyone,
  },
  {
    code: Permissions.COURSE_READ,
    description: "View courses and the learning catalog.",
    module: "course",
    defaultProfiles: everyone,
  },
  {
    code: Permissions.COURSE_CREATE,
    description: "Create courses and course drafts.",
    module: "course",
    defaultProfiles: contentManagers,
  },
  {
    code: Permissions.COURSE_UPDATE,
    description: "Edit courses and course builder content.",
    module: "course",
    defaultProfiles: contentManagers,
  },
  {
    code: Permissions.COURSE_DELETE,
    description: "Archive or delete courses.",
    module: "course",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.COURSE_PUBLISH,
    description: "Submit courses into the publishing workflow.",
    module: "course",
    defaultProfiles: contentManagers,
  },
  {
    code: Permissions.COURSE_REVIEW,
    description: "Approve, reject, or request revisions for courses.",
    module: "course",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.COURSE_CATEGORY_CREATE,
    description: "Create course categories.",
    module: "course",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.COURSE_CATEGORY_VIEW,
    description: "View course categories.",
    module: "course",
    defaultProfiles: everyone,
  },
  {
    code: Permissions.COURSE_CATEGORY_UPDATE,
    description: "Update course categories.",
    module: "course",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.COURSE_CATEGORY_DELETE,
    description: "Delete course categories.",
    module: "course",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.DIFFICULTY_LEVEL_CREATE,
    description: "Create difficulty levels.",
    module: "course",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.DIFFICULTY_LEVEL_VIEW,
    description: "View difficulty levels.",
    module: "course",
    defaultProfiles: everyone,
  },
  {
    code: Permissions.DIFFICULTY_LEVEL_UPDATE,
    description: "Update difficulty levels.",
    module: "course",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.DIFFICULTY_LEVEL_DELETE,
    description: "Delete difficulty levels.",
    module: "course",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.COURSE_TEMPLATE_CREATE,
    description: "Create course templates.",
    module: "course",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.COURSE_TEMPLATE_VIEW,
    description: "View course templates.",
    module: "course",
    defaultProfiles: everyone,
  },
  {
    code: Permissions.COURSE_TEMPLATE_UPDATE,
    description: "Update course templates.",
    module: "course",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.COURSE_TEMPLATE_DELETE,
    description: "Delete course templates.",
    module: "course",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.TNA_SUBMIT,
    description: "Submit individual training needs requests.",
    module: "tna",
    defaultProfiles: everyone,
  },
  {
    code: Permissions.TNA_VIEW_ALL,
    description: "View training needs requests across the company.",
    module: "tna",
    defaultProfiles: workforceManagers,
  },
  {
    code: Permissions.TNA_REVIEW,
    description: "Approve or reject training needs requests.",
    module: "tna",
    defaultProfiles: workforceManagers,
  },
  {
    code: Permissions.TNA_CONFIG_MANAGE,
    description: "Configure TNA request types, workflows, and budgets.",
    module: "tna",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.PROGRAM_READ,
    description: "View learning programs.",
    module: "program",
    defaultProfiles: everyone,
  },
  {
    code: Permissions.PROGRAM_CREATE,
    description: "Create learning programs.",
    module: "program",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.PROGRAM_UPDATE,
    description: "Edit learning programs.",
    module: "program",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.PROGRAM_DELETE,
    description: "Archive or delete learning programs.",
    module: "program",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.PROGRAM_PUBLISH,
    description: "Publish or approve learning programs.",
    module: "program",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.CERTIFICATE_ISSUE,
    description:
      "Issue certificates and process certificate expiry operations.",
    module: "certificate",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.CERTIFICATE_CONFIG_MANAGE,
    description:
      "Manage certificate templates, providers, and certification settings.",
    module: "certificate",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.NOTIFICATION_CONFIG_MANAGE,
    description: "Manage tenant notification channels and delivery policy.",
    module: "notification",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.TEMPLATE_MANAGE,
    description: "Manage course, email, and reusable LMS templates.",
    module: "template",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.ENROLLMENT_CONFIG_MANAGE,
    description: "Manage enrollment policies, rules, and assignment behavior.",
    module: "enrollment",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.APPROVAL_WORKFLOW_MANAGE,
    description: "Manage approval workflows and configured approvers.",
    module: "workflow",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.GAMIFICATION_CONFIG_MANAGE,
    description:
      "Manage XP rules, leaderboards, levels, and gamification policy.",
    module: "gamification",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.ANALYTICS_VIEW,
    description: "View LMS analytics and reports within the user's data scope.",
    module: "analytics",
    defaultProfiles: ["manager", "creator", "hr", "admin"],
  },
  {
    code: Permissions.MODERATION_MANAGE,
    description: "Review and resolve content moderation items.",
    module: "moderation",
    defaultProfiles: configurationManagers,
  },
  {
    code: Permissions.ASSESSMENT_CREATE,
    description: "Create quizzes, questions, and assessments.",
    module: "assessment",
    defaultProfiles: contentManagers,
  },
  {
    code: Permissions.ASSESSMENT_VIEW,
    description: "View assessments and assessment results within scope.",
    module: "assessment",
    defaultProfiles: everyone,
  },
  {
    code: Permissions.ASSESSMENT_GRADE,
    description: "Grade assessments and assignment submissions.",
    module: "assessment",
    defaultProfiles: contentManagers,
  },
];

const configurationPermissions: AccessControlPermissionDefinition[] =
  managedConfigurationPermissions.map(
    (definition: ManagedPermissionDefinition) => ({
      code: definition.code,
      description: definition.description,
      module: definition.module,
      defaultProfiles: definition.isReadPermission
        ? everyone
        : configurationManagers,
    }),
  );

const definitionsByCode = new Map<
  PermissionCode,
  AccessControlPermissionDefinition
>();
for (const definition of [
  ...operationalPermissions,
  ...configurationPermissions,
]) {
  definitionsByCode.set(definition.code, definition);
}

export const accessControlPermissionDefinitions = [
  ...definitionsByCode.values(),
].sort(
  (left, right) =>
    left.module.localeCompare(right.module) ||
    left.code.localeCompare(right.code),
);

export const roleProfileFromName = (name: string): AccessControlRoleProfile => {
  const normalized = name
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
  if (
    [
      "admin",
      "administrator",
      "super admin",
      "system admin",
      "lms admin",
    ].includes(normalized)
  ) {
    return "admin";
  }
  if (
    [
      "hr",
      "hr admin",
      "hr manager",
      "human resources",
      "human resource",
    ].includes(normalized)
  ) {
    return "hr";
  }
  if (
    [
      "course creator",
      "content creator",
      "creator",
      "instructor",
      "trainer",
    ].includes(normalized)
  ) {
    return "creator";
  }
  if (
    [
      "manager",
      "line manager",
      "people manager",
      "supervisor",
      "team lead",
    ].includes(normalized)
  ) {
    return "manager";
  }
  return "learner";
};

export const defaultPermissionCodesForRole = (roleName: string) => {
  const profile = roleProfileFromName(roleName);
  return accessControlPermissionDefinitions
    .filter((definition) => definition.defaultProfiles.includes(profile))
    .map((definition) => definition.code);
};
