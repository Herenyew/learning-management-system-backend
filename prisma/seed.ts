import { PrismaClient, ContentCategory } from "@prisma/client";
import {
  KNOWN_SETTINGS,
  isSecretSettingKey,
} from "../src/modules/configuration/system-settings/known-settings.registry.js";
import { encryptSettingValue } from "../src/modules/configuration/system-settings/system-setting-crypto.js";

const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────
// Helper: Seed Difficulty Levels (works for both types)
// ──────────────────────────────────────────────────────────────
async function seedDifficultyLevels(
  companyId: number | null,
  levels: { name: string; code: string; displayOrder: number }[],
  isSystem: boolean,
) {
  for (const item of levels) {
    await prisma.difficultyLevel.upsert({
      where: {
        code: item.code,
        companyId: companyId,
      },
      update: {
        name: item.name,
        displayOrder: item.displayOrder,
        isSystem: isSystem,
        isActive: true,
      },
      create: {
        companyId: companyId,
        code: item.code,
        name: item.name,
        displayOrder: item.displayOrder,
        isSystem: isSystem,
        isActive: true,
      },
    });
  }
  console.log(
    ` ${levels.length} Difficulty Levels seeded (${companyId === null ? "system-wide" : "company-specific"})`,
  );
}

// ──────────────────────────────────────────────────────────────
// Helper: Seed Content Types (System-wide)
// ──────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────
// Helper: Seed Content Types (System-wide)
// ──────────────────────────────────────────────────────────────
async function seedContentTypes(
  types: {
    slug: string;
    name: string;
    category: ContentCategory;
    description?: string;
    icon?: string;
    sortOrder: number;
  }[],
) {
  for (const item of types) {
    await prisma.contentType.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        category: item.category,
        description: item.description,
        icon: item.icon,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: {
        slug: item.slug,
        name: item.name,
        category: item.category,
        description: item.description,
        icon: item.icon,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
  }
  console.log(`${types.length} Content Types upserted`);
}

// ──────────────────────────────────────────────────────────────
// Helper: Seed Content File Types (System-wide)
// ──────────────────────────────────────────────────────────────
async function seedContentFileTypes(
  types: {
    slug: string;
    name: string;
    description?: string;
    icon?: string;
    sortOrder: number;
  }[],
) {
  for (const item of types) {
    await prisma.contentFileType.upsert({
      where: { slug: item.slug },
      update: {
        name: item.name,
        description: item.description,
        icon: item.icon,
        sortOrder: item.sortOrder,
        isActive: true,
      },
      create: {
        slug: item.slug,
        name: item.name,
        description: item.description,
        icon: item.icon,
        sortOrder: item.sortOrder,
        isActive: true,
      },
    });
  }
  console.log(`${types.length} Content File Types seeded`);
}

async function seedSystemLookupTables() {
  console.log("Seeding system-level lookup tables...");

  // ─── Difficulty Levels (system-wide) ──────────────────────────────
  await seedDifficultyLevels(
    null,
    [
      { name: "Beginner", code: "BEGINNER", displayOrder: 1 },
      { name: "Intermediate", code: "INTERMEDIATE", displayOrder: 2 },
      { name: "Advanced", code: "ADVANCED", displayOrder: 3 },
      { name: "Expert", code: "EXPERT", displayOrder: 4 },
    ],
    true,
  );

  // ─── Content Types (system-wide) ──────────────────────────────────
  // ─── Content Types (system-wide) ──────────────────────────────────────
  await seedContentTypes([
    // ─── RESOURCE (passive/static) ──────────────────────────────────────
    {
      slug: "video",
      name: "Video",
      category: ContentCategory.RESOURCE,
      description: "Video content",
      icon: "video",
      sortOrder: 1,
    },
    {
      slug: "audio",
      name: "Audio",
      category: ContentCategory.RESOURCE,
      description: "Audio content",
      icon: "audio",
      sortOrder: 2,
    },
    {
      slug: "document",
      name: "Document",
      category: ContentCategory.RESOURCE,
      description: "Document content",
      icon: "document",
      sortOrder: 3,
    },
    {
      slug: "link",
      name: "Link",
      category: ContentCategory.RESOURCE,
      description: "External link",
      icon: "link",
      sortOrder: 4,
    },
    {
      slug: "pdf",
      name: "PDF",
      category: ContentCategory.RESOURCE,
      description: "PDF document",
      icon: "pdf",
      sortOrder: 5,
    },
    {
      slug: "image",
      name: "Image",
      category: ContentCategory.RESOURCE,
      description: "Image content",
      icon: "image",
      sortOrder: 6,
    },
    {
      slug: "presentation",
      name: "Presentation",
      category: ContentCategory.RESOURCE,
      description: "Slide presentation",
      icon: "presentation",
      sortOrder: 7,
    },

    // ─── INTERACTIVE (requires user engagement) ──────────────────────────
    {
      slug: "assignment",
      name: "Assignment",
      category: ContentCategory.INTERACTIVE,
      description: "Assignment content",
      icon: "assignment",
      sortOrder: 10,
    },
    {
      slug: "quiz",
      name: "Quiz",
      category: ContentCategory.INTERACTIVE,
      description: "Quiz content",
      icon: "quiz",
      sortOrder: 11,
    },
    {
      slug: "survey",
      name: "Survey",
      category: ContentCategory.INTERACTIVE,
      description: "Survey content",
      icon: "survey",
      sortOrder: 12,
    },
    {
      slug: "scorm",
      name: "SCORM",
      category: ContentCategory.INTERACTIVE,
      description: "SCORM package",
      icon: "scorm",
      sortOrder: 13,
    },
    {
      slug: "interactive_video",
      name: "Interactive Video",
      category: ContentCategory.INTERACTIVE,
      description: "Video with interactive elements",
      icon: "interactive",
      sortOrder: 14,
    },
  ]);

  // ─── Content File Types (system-wide) ──────────────────────────────
  await seedContentFileTypes([
    {
      slug: "pdf",
      name: "PDF",
      description: "Portable Document Format",
      icon: "pdf",
      sortOrder: 1,
    },
    {
      slug: "mp4",
      name: "MP4 Video",
      description: "MP4 video file",
      icon: "video",
      sortOrder: 2,
    },
    {
      slug: "mp3",
      name: "MP3 Audio",
      description: "MP3 audio file",
      icon: "audio",
      sortOrder: 3,
    },
    {
      slug: "docx",
      name: "Word Document",
      description: "Microsoft Word document",
      icon: "document",
      sortOrder: 4,
    },
    {
      slug: "pptx",
      name: "PowerPoint",
      description: "PowerPoint presentation",
      icon: "ppt",
      sortOrder: 5,
    },
    {
      slug: "xlsx",
      name: "Excel Spreadsheet",
      description: "Excel spreadsheet",
      icon: "excel",
      sortOrder: 6,
    },
    {
      slug: "jpg",
      name: "JPEG Image",
      description: "JPEG image file",
      icon: "image",
      sortOrder: 7,
    },
    {
      slug: "png",
      name: "PNG Image",
      description: "PNG image file",
      icon: "image",
      sortOrder: 8,
    },
    {
      slug: "zip",
      name: "ZIP Archive",
      description: "ZIP compressed archive",
      icon: "zip",
      sortOrder: 9,
    },
  ]);

  console.log("  System Lookup Tables completed");
}

// ============================================================================
// SECTION 2: EMS TABLES
// ============================================================================
// HR/EMS data projected into LMS

async function seedEmsTables() {
  console.log("\n  [2/3] Seeding EMS Tables...");

  // 2.1 Company
  const company = await prisma.company.upsert({
    where: { companyCode: "ACME" },
    update: {},
    create: {
      id: 1,
      companyCode: "ACME",
      name: "Acme Corporation",
      logoUrl: "https://example.com/logo.png",
      isActive: true,
      lastSyncedAt: new Date(),
    },
  });
  console.log(`  Company: ${company.name} (ID: ${company.id})`);

  // 2.2 Departments
  const departments = [
    { id: 10, name: "Engineering" },
    { id: 11, name: "Sales" },
    { id: 12, name: "Marketing" },
    { id: 13, name: "Finance" },
    { id: 14, name: "Human Resources" },
  ];

  const departmentMap = new Map();
  for (const dept of departments) {
    const created = await prisma.department.upsert({
      where: { id: dept.id },
      update: {},
      create: {
        id: dept.id,
        name: dept.name,
        companyId: company.id,
        isActive: true,
        lastSyncedAt: new Date(),
      },
    });
    departmentMap.set(dept.name, created);
  }
  console.log(`  ${departments.length} Departments created`);

  // 2.3 Job Titles
  const jobTitles = [
    { id: 100, name: "Software Engineer" },
    { id: 101, name: "Senior Software Engineer" },
    { id: 102, name: "Tech Lead" },
    { id: 103, name: "Engineering Manager" },
    { id: 104, name: "Sales Representative" },
    { id: 105, name: "Sales Manager" },
    { id: 106, name: "Marketing Specialist" },
    { id: 107, name: "Marketing Manager" },
    { id: 108, name: "Accountant" },
    { id: 109, name: "HR Business Partner" },
  ];

  const jobTitleMap = new Map();
  for (const job of jobTitles) {
    const created = await prisma.jobTitle.upsert({
      where: { id: job.id },
      update: {},
      create: {
        id: job.id,
        name: job.name,
        companyId: company.id,
        isActive: true,
        lastSyncedAt: new Date(),
      },
    });
    jobTitleMap.set(job.name, created);
  }
  console.log(`  ${jobTitles.length} Job Titles created`);

  // 2.4 Job Levels
  const jobLevels = [
    { id: 200, name: "Entry", level: 1 },
    { id: 201, name: "Junior", level: 2 },
    { id: 202, name: "Senior", level: 3 },
    { id: 203, name: "Lead", level: 4 },
    { id: 204, name: "Manager", level: 5 },
    { id: 205, name: "Director", level: 6 },
    { id: 206, name: "VP", level: 7 },
    { id: 207, name: "C-Level", level: 8 },
  ];

  const jobLevelMap = new Map();
  for (const level of jobLevels) {
    const created = await prisma.jobLevel.upsert({
      where: { id: level.id },
      update: {},
      create: {
        id: level.id,
        name: level.name,
        companyId: company.id,
        isActive: true,
        lastSyncedAt: new Date(),
      },
    });
    jobLevelMap.set(level.name, created);
  }
  console.log(`  ${jobLevels.length} Job Levels created`);

  // ─── 2.5 App Roles ─────────────────────────────────────────────────────
  const roles = [
    // EMS roles (must have same IDs as EMS company 1)
    { id: 1, name: "EMPLOYEE", description: "Default Employee role" },
    { id: 6, name: "SUPER_ADMIN", description: "Full system access" },
    { id: 7, name: "ADMIN", description: "Company administrator" },
    { id: 8, name: "HR", description: "HR role" },

    // LMS-specific roles (new IDs not used by EMS)
    { id: 9, name: "INSTRUCTOR", description: "Can create and manage courses" },
    {
      id: 10,
      name: "MANAGER",
      description: "Can approve TNA and view reports",
    },
    { id: 11, name: "LEARNER", description: "Can take courses" },
  ];

  const roleMap = new Map();
  for (const role of roles) {
    const created = await prisma.appRole.upsert({
      where: { id: role.id },
      update: {},
      create: {
        id: role.id,
        companyId: company.id,
        name: role.name,
        description: role.description,
        isActive: true,
        lastSyncedAt: new Date(),
      },
    });
    roleMap.set(role.name, created);
  }
  console.log(`  ${roles.length} App Roles created`);

  // 2.6 Employees
  const employees = [
    // ─── Existing employees (keep these) ──────────────────────────────
    {
      id: "EMP001",
      fullName: "John Doe",
      department: "Engineering",
      jobTitle: "Tech Lead",
      jobLevel: "Lead",
      startDate: "2023-01-15",
    },
    {
      id: "EMP002",
      fullName: "Jane Smith",
      department: "Engineering",
      jobTitle: "Senior Software Engineer",
      jobLevel: "Senior",
      startDate: "2023-03-10",
    },
    {
      id: "EMP007",
      fullName: "Eve Adams",
      department: "Engineering",
      jobTitle: "Software Engineer",
      jobLevel: "Junior",
      startDate: "2024-06-15",
    },
    {
      id: "EMP009",
      fullName: "Grace Hopper",
      department: "Engineering",
      jobTitle: "Software Engineer",
      jobLevel: "Senior",
      startDate: "2022-05-10",
    },
    {
      id: "EMP003",
      fullName: "Bob Johnson",
      department: "Sales",
      jobTitle: "Sales Manager",
      jobLevel: "Manager",
      startDate: "2022-06-01",
    },
    {
      id: "EMP008",
      fullName: "Frank Castle",
      department: "Sales",
      jobTitle: "Sales Representative",
      jobLevel: "Senior",
      startDate: "2023-09-01",
    },
    {
      id: "EMP004",
      fullName: "Alice Williams",
      department: "Marketing",
      jobTitle: "Marketing Manager",
      jobLevel: "Manager",
      startDate: "2022-08-15",
    },
    {
      id: "EMP005",
      fullName: "Charlie Brown",
      department: "Finance",
      jobTitle: "Accountant",
      jobLevel: "Senior",
      startDate: "2021-11-01",
    },
    {
      id: "EMP010",
      fullName: "Henry Ford",
      department: "Finance",
      jobTitle: "Accountant",
      jobLevel: "Junior",
      startDate: "2024-01-01",
    },
    {
      id: "EMP006",
      fullName: "Diana Prince",
      department: "Human Resources",
      jobTitle: "HR Business Partner",
      jobLevel: "Manager",
      startDate: "2022-01-20",
    },

    // ─── NEW: EMS Employee IDs ────────────────────────────
    {
      id: "EMP-ADMIN",
      fullName: "Kacha Admin",
      department: "Human Resource",
      jobTitle: "Admin",
      jobLevel: "Manager",
      startDate: "2020-01-01",
    },
    {
      id: "EMP-MGR-001",
      fullName: "Manager User",
      department: "Technology",
      jobTitle: "Software Engineer",
      jobLevel: "Manager",
      startDate: "2020-01-01",
    },
    {
      id: "EMP-DEV-001",
      fullName: "Developer User",
      department: "Technology",
      jobTitle: "Software Engineer",
      jobLevel: "Senior",
      startDate: "2020-01-01",
    },
    // ─── @adiu.com test users ─────────────────────────────────
    {
      id: "EMP-LEARNER-ADIU",
      fullName: "Learner Adiu",
      department: "Technology",
      jobTitle: "Software Engineer",
      jobLevel: "Junior",
      startDate: "2024-01-01",
    },
    {
      id: "EMP-INSTRUCTOR-ADIU",
      fullName: "Instructor Adiu",
      department: "Technology",
      jobTitle: "Senior Software Engineer",
      jobLevel: "Senior",
      startDate: "2024-01-01",
    },
    {
      id: "EMP-CREATOR-ADIU",
      fullName: "Creator Adiu",
      department: "Technology",
      jobTitle: "Tech Lead",
      jobLevel: "Lead",
      startDate: "2024-01-01",
    },
    {
      id: "EMP-MANAGER-ADIU",
      fullName: "Manager Adiu",
      department: "Technology",
      jobTitle: "Engineering Manager",
      jobLevel: "Manager",
      startDate: "2024-01-01",
    },
    {
      id: "EMP-ADMIN-ADIU",
      fullName: "Admin Adiu",
      department: "Human Resource",
      jobTitle: "Admin",
      jobLevel: "Manager",
      startDate: "2024-01-01",
    },
    // Add any other employee IDs from your EMS that need LMS access
  ];

  const employeeMap = new Map();
  for (const emp of employees) {
    const dept = departmentMap.get(emp.department);
    const jobTitle = jobTitleMap.get(emp.jobTitle);
    const jobLevel = jobLevelMap.get(emp.jobLevel);

    const created = await prisma.employee.upsert({
      where: { id: emp.id },
      update: {},
      create: {
        id: emp.id,
        companyId: company.id,
        fullName: emp.fullName,
        departmentId: dept?.id || null,
        jobTitleId: jobTitle?.id || null,
        jobLevelId: jobLevel?.id || null,
        startDate: new Date(emp.startDate),
        isActive: true,
        lastSyncedAt: new Date(),
      },
    });
    employeeMap.set(emp.id, created);
  }
  console.log(`  ${employees.length} Employees created`);

  // ─── 2.7 App Users ─────────────────────────────────────────────────────
  const users = [
    {
      id: 1001,
      email: "superadmin@acme.com",
      employeeId: "EMP001",
      role: "SUPER_ADMIN",
    },
    { id: 1002, email: "admin@acme.com", employeeId: "EMP002", role: "ADMIN" },
    {
      id: 1003,
      email: "instructor@acme.com",
      employeeId: "EMP003",
      role: "INSTRUCTOR",
    },
    {
      id: 1004,
      email: "manager@acme.com",
      employeeId: "EMP004",
      role: "MANAGER",
    },
    {
      id: 1005,
      email: "learner@acme.com",
      employeeId: "EMP005",
      role: "LEARNER",
    },
    {
      id: 1006,
      email: "tsegasolomon635@gmail.com",
      employeeId: "EMP-ADMIN",
      role: "ADMIN",
    },
    // ─── @adiu.com test users ──────────────────────────────────
    {
      id: 1007,
      email: "learner@adiu.com",
      employeeId: "EMP-LEARNER-ADIU",
      role: "LEARNER",
    },
    {
      id: 1008,
      email: "instructor@adiu.com",
      employeeId: "EMP-INSTRUCTOR-ADIU",
      role: "INSTRUCTOR",
    },
    {
      id: 1009,
      email: "creator@adiu.com",
      employeeId: "EMP-CREATOR-ADIU",
      role: "INSTRUCTOR",
    },
    {
      id: 1010,
      email: "manager@adiu.com",
      employeeId: "EMP-MANAGER-ADIU",
      role: "MANAGER",
    },
    {
      id: 1011,
      email: "admin@adiu.com",
      employeeId: "EMP-ADMIN-ADIU",
      role: "ADMIN",
    },
  ];

  for (const user of users) {
    const employee = employeeMap.get(user.employeeId);
    const role = roleMap.get(user.role);

    await prisma.appUser.upsert({
      where: { id: user.id },
      update: {
        email: user.email,
        employeeId: employee?.id || null,
        roleId: role?.id || null,
        isActive: true,
        lastSyncedAt: new Date(),
      },
      create: {
        id: user.id,
        companyId: company.id,
        email: user.email,
        employeeId: employee?.id || null,
        roleId: role?.id || null,
        isActive: true,
        lastSyncedAt: new Date(),
      },
    });
  }
  console.log(`  ${users.length} App Users created`);

  // 2.8 Company-Specific Lookup Tables
  console.log("  Seeding company-specific lookup tables...");
  await seedCompanyLookupTables(company.id);

  console.log("  EMS Tables completed");
  return { company, roleMap };
}

async function seedCompanyLookupTables(companyId: number) {
  console.log(`Seeding lookup tables for companyId: ${companyId}`);

  // --------------------------------------------------
  // TaskType
  // --------------------------------------------------
  const taskTypes = [
    {
      name: "Course Content",
      slug: "course_content",
      expectedSubmissionType: "NONE",
      linkedEntity: "COURSE_CONTENT",
    },
    {
      name: "Assessment",
      slug: "assessment",
      expectedSubmissionType: "NONE",
      linkedEntity: "ASSESSMENT",
    },
    {
      name: "Live Session",
      slug: "live_session",
      expectedSubmissionType: "NONE",
      linkedEntity: "LIVE_SESSION",
    },
    {
      name: "Assignment",
      slug: "assignment",
      expectedSubmissionType: "FILE_UPLOAD",
      linkedEntity: "NONE",
    },
    {
      name: "Survey",
      slug: "survey",
      expectedSubmissionType: "NONE",
      linkedEntity: "SURVEY",
    },
    {
      name: "Manager Check-in",
      slug: "manager_checkin",
      expectedSubmissionType: "TEXT_INPUT",
      linkedEntity: "NONE",
    },
    {
      name: "Peer Review",
      slug: "peer_review",
      expectedSubmissionType: "TEXT_INPUT",
      linkedEntity: "NONE",
    },
    {
      name: "External Activity",
      slug: "external_activity",
      expectedSubmissionType: "LINK",
      linkedEntity: "NONE",
    },
    {
      name: "Reading",
      slug: "reading",
      expectedSubmissionType: "NONE",
      linkedEntity: "COURSE_CONTENT",
    },
    {
      name: "Other",
      slug: "other",
      expectedSubmissionType: "NONE",
      linkedEntity: "NONE",
    },
  ];

  await Promise.all(
    taskTypes.map(async (item) => {
      const existing = await prisma.taskType.findFirst({
        where: { companyId, slug: item.slug },
      });

      if (!existing) {
        await prisma.taskType.create({
          data: {
            companyId,
            name: item.name,
            slug: item.slug,
            expectedSubmissionType: item.expectedSubmissionType as any,
            linkedEntity: item.linkedEntity as any,
            isSystem: true,
            isActive: true,
          },
        });
      }
    }),
  );

  console.log(`  ${taskTypes.length} Task Types created`);

  // AttendanceMethods
  const attendanceMethods = [
    { name: "QR Code", slug: "qr_code" },
    { name: "Manual", slug: "manual" },
    { name: "System Auto", slug: "system_auto" },
    { name: "Biometric", slug: "biometric" },
  ];

  await Promise.all(
    attendanceMethods.map((item) =>
      prisma.attendanceMethod.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: {
          companyId,
          name: item.name,
          slug: item.slug,
          isSystem: true,
          isActive: true,
        },
      }),
    ),
  );

  // AssessmentTypes
  const assessmentTypes = [
    { name: "Pre Assessment", slug: "pre_assessment", code: "PRE_ASSESSMENT" },
    {
      name: "Post Assessment",
      slug: "post_assessment",
      code: "POST_ASSESSMENT",
    },
    { name: "Chapter Quiz", slug: "chapter_quiz", code: "CHAPTER_QUIZ" },
    { name: "Course Final", slug: "course_final", code: "COURSE_FINAL" },
    { name: "Practice", slug: "practice", code: "PRACTICE" },
  ];

  await Promise.all(
    assessmentTypes.map((item) =>
      prisma.assessmentType.upsert({
        where: { companyId_code: { companyId, code: item.code } },
        update: {},
        create: {
          companyId,
          name: item.name,
          code: item.code,
          isSystem: true,
          isActive: true,
          isScored: true,
          isGraded: true,
        },
      }),
    ),
  );

  // --------------------------------------------------
  // QuestionType
  const questionTypes = [
    {
      name: "Multiple Choice",
      slug: "multiple_choice",
      answerStructure: "OPTION_BASED",
    },
    { name: "True/False", slug: "true_false", answerStructure: "OPTION_BASED" },
    {
      name: "Short Answer",
      slug: "short_answer",
      answerStructure: "FREE_TEXT",
    },
    { name: "Essay", slug: "essay", answerStructure: "FREE_TEXT" },
    {
      name: "Matching",
      slug: "matching",
      answerStructure: "MATCHING_PAIR_BASED",
    },
    { name: "Ordering", slug: "ordering", answerStructure: "OPTION_BASED" },
    {
      name: "Fill in the Blank",
      slug: "fill_blank",
      answerStructure: "OPTION_BASED",
    },
    {
      name: "Multi Select",
      slug: "multi_select",
      answerStructure: "OPTION_BASED",
    },
    {
      name: "Drag and Drop",
      slug: "drag_drop",
      answerStructure: "MATCHING_PAIR_BASED",
    },
  ];

  await Promise.all(
    questionTypes.map((item) =>
      prisma.questionType.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: {
          companyId,
          name: item.name,
          slug: item.slug,
          answerStructure: item.answerStructure as any,
          isSystem: true,
          isActive: true,
        },
      }),
    ),
  );

  // --------------------------------------------------
  // GradingMethod
  const gradingMethods = [
    { name: "Highest Score", slug: "highest_score" },
    { name: "Latest Attempt", slug: "latest_attempt" },
    { name: "Average Score", slug: "average_score" },
    { name: "First Attempt", slug: "first_attempt" },
  ];

  await Promise.all(
    gradingMethods.map((item) =>
      prisma.gradingMethod.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: {
          companyId,
          name: item.name,
          slug: item.slug,
          isSystem: true,
          isActive: true,
        },
      }),
    ),
  );

  // CertificateTypes
  const certificateTypes = [
    { name: "Course Completion", slug: "course_completion" },
    { name: "Program Completion", slug: "program_completion" },
    { name: "Certification", slug: "certification" },
    { name: "Badge", slug: "badge" },
    { name: "Attendance", slug: "attendance" },
    { name: "External", slug: "external" },
  ];

  await Promise.all(
    certificateTypes.map((item) =>
      prisma.certificateType.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: {
          companyId,
          name: item.name,
          slug: item.slug,
          isSystem: true,
          isActive: true,
        },
      }),
    ),
  );

  // CredentialSources
  const credentialSources = [
    { name: "Manual Upload", slug: "manual_upload" },
    { name: "API Integration", slug: "api_integration" },
    { name: "Email Submission", slug: "email_submission" },
    { name: "LinkedIn", slug: "linkedin" },
    { name: "Other", slug: "other" },
  ];

  await Promise.all(
    credentialSources.map((item) =>
      prisma.credentialSource.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: {
          companyId,
          name: item.name,
          slug: item.slug,
          isSystem: true,
          isActive: true,
        },
      }),
    ),
  );

  // ProviderTypes
  const providerTypes = [
    { name: "Certification Body", slug: "certification_body" },
    { name: "University", slug: "university" },
    { name: "Online Platform", slug: "online_platform" },
    { name: "Government", slug: "government" },
    { name: "Internal", slug: "internal" },
    { name: "Other", slug: "other" },
  ];

  await Promise.all(
    providerTypes.map((item) =>
      prisma.providerType.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: {
          companyId,
          name: item.name,
          slug: item.slug,
          isSystem: true,
          isActive: true,
        },
      }),
    ),
  );

  // SurveyQuestionTypes
  const surveyQuestionTypes = [
    { name: "Rating", slug: "rating" },
    { name: "Multiple Choice", slug: "multiple_choice" },
    { name: "Multi Select", slug: "multi_select" },
    { name: "Text", slug: "text" },
    { name: "Yes/No", slug: "yes_no" },
    { name: "Scale", slug: "scale" },
  ];

  await Promise.all(
    surveyQuestionTypes.map((item) =>
      prisma.surveyQuestionType.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: {
          companyId,
          name: item.name,
          slug: item.slug,
          isSystem: true,
          isActive: true,
        },
      }),
    ),
  );

  // MeetingProviders
  const meetingProviders = [
    { name: "Zoom", slug: "zoom" },
    { name: "Microsoft Teams", slug: "microsoft_teams" },
    { name: "Google Meet", slug: "google_meet" },
    { name: "Webex", slug: "webex" },
    { name: "In Person", slug: "inperson" },
    { name: "Other", slug: "other" },
  ];

  await Promise.all(
    meetingProviders.map((item) =>
      prisma.meetingProvider.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: {
          companyId,
          name: item.name,
          slug: item.slug,
          isSystem: true,
          isActive: true,
        },
      }),
    ),
  );

  // FundingTypes
  const fundingTypes = [
    { name: "Company Funded", slug: "company_funded" },
    { name: "Self Funded", slug: "self_funded" },
    { name: "Shared", slug: "shared" },
  ];

  await Promise.all(
    fundingTypes.map((item) =>
      prisma.fundingType.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: {
          companyId,
          name: item.name,
          slug: item.slug,
          isSystem: true,
          isActive: true,
        },
      }),
    ),
  );

  // XpRuleCategories
  const xpRuleCategories = [
    { name: "Enrollment", slug: "enrollment" },
    { name: "Completion", slug: "completion" },
    { name: "Assessment", slug: "assessment" },
    { name: "Engagement", slug: "engagement" },
    { name: "Manual", slug: "manual" },
  ];

  await Promise.all(
    xpRuleCategories.map((item) =>
      prisma.xpRuleCategory.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: {
          companyId,
          name: item.name,
          slug: item.slug,
          isSystem: true,
          isActive: true,
        },
      }),
    ),
  );

  // XpTriggerEvents
  const xpTriggerEvents = [
    { name: "Course Completed", slug: "course_completed" },
    { name: "Assessment Passed", slug: "assessment_passed" },
    { name: "Perfect Score", slug: "perfect_score" },
    { name: "Program Completed", slug: "program_completed" },
    { name: "Certificate Earned", slug: "certificate_earned" },
    { name: "Badge Awarded", slug: "badge_awarded" },
    { name: "Manual Adjustment", slug: "manual_adjustment" },
  ];

  await Promise.all(
    xpTriggerEvents.map((item) =>
      prisma.xpTriggerEvent.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: {
          companyId,
          name: item.name,
          slug: item.slug,
          isSystem: true,
          isActive: true,
        },
      }),
    ),
  );

  // BadgeCategories
  const badgeCategories = [
    { name: "Achievement", slug: "achievement" },
    { name: "Milestone", slug: "milestone" },
    { name: "Streak", slug: "streak" },
    { name: "Skill", slug: "skill" },
    { name: "Participation", slug: "participation" },
  ];

  await Promise.all(
    badgeCategories.map((item) =>
      prisma.badgeCategory.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: {
          companyId,
          name: item.name,
          slug: item.slug,
          isSystem: true,
          isActive: true,
        },
      }),
    ),
  );

  // TrainingFormats
  const trainingFormats = [
    { name: "Online", slug: "online" },
    { name: "Instructor Led", slug: "instructor_led" },
    { name: "Blended", slug: "blended" },
    { name: "External", slug: "external" },
    { name: "Conference", slug: "conference" },
    { name: "On the Job", slug: "on_the_job" },
  ];

  await Promise.all(
    trainingFormats.map((item) =>
      prisma.trainingFormat.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: {
          companyId,
          name: item.name,
          slug: item.slug,
          isSystem: true,
          isActive: true,
        },
      }),
    ),
  );

  // NotificationModules
  const notificationModules = [
    { name: "Course", slug: "course" },
    { name: "Program", slug: "program" },
    { name: "Enrollment", slug: "enrollment" },
    { name: "Assessment", slug: "assessment" },
    { name: "Certification", slug: "certification" },
    { name: "Live Session", slug: "live_session" },
    { name: "Survey", slug: "survey" },
    { name: "TNA", slug: "tna" },
    { name: "Gamification", slug: "gamification" },
    { name: "System", slug: "system" },
  ];

  await Promise.all(
    notificationModules.map((item) =>
      prisma.notificationModule.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: {
          companyId,
          name: item.name,
          slug: item.slug,
          isSystem: true,
          isActive: true,
        },
      }),
    ),
  );

  // EnrollmentRuleTypes
  const enrollmentRuleTypes = [
    { name: "Auto Enroll", slug: "auto_enroll" },
    { name: "Restrict Access", slug: "restrict_access" },
    { name: "Require Approval", slug: "require_approval" },
    { name: "Waitlist Priority", slug: "waitlist_priority" },
    { name: "Custom", slug: "custom" },
  ];

  for (const item of enrollmentRuleTypes) {
    await prisma.enrollmentRuleType.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: {
        companyId,
        name: item.name,
        slug: item.slug,
        isSystem: true,
        isActive: true,
      },
    });
  }

  console.log(`  ${enrollmentRuleTypes.length} Enrollment Rule Types created`);
}
// ============================================================================
// SECTION 3: LMS PERMISSIONS
// ============================================================================

async function seedLmsPermissions(
  companyId: number,
  roleMap: Map<string, any>,
) {
  console.log("\n  [3/3] Seeding LMS Permissions...");

  const permissionDefinitions = [
    // ==========================================================
    // COURSE DOMAIN
    // ==========================================================

    {
      code: "course.create",
      description: "Create courses",
      module: "course",
    },
    {
      code: "course.view",
      description: "View courses",
      module: "course",
    },
    {
      code: "course.update",
      description: "Update courses",
      module: "course",
    },
    {
      code: "course.delete",
      description: "Delete courses",
      module: "course",
    },
    {
      code: "course.publish",
      description: "Publish courses",
      module: "course",
    },
    {
      code: "course.enroll",
      description: "Enroll learners in courses",
      module: "course",
    },

    // ==========================================================
    // AUDIENCE CONFIGURATION
    // ==========================================================

    {
      code: "audience.create",
      description: "Create audience groups",
      module: "audience_config",
    },
    {
      code: "audience.view",
      description: "View audience groups",
      module: "audience_config",
    },
    {
      code: "audience.update",
      description: "Update audience groups",
      module: "audience_config",
    },
    {
      code: "audience.delete",
      description: "Delete audience groups",
      module: "audience_config",
    },

    // ==========================================================
    // COURSE CONFIGURATION
    // ==========================================================

    {
      code: "course_category.create",
      description: "Create course categories",
      module: "course_config",
    },
    {
      code: "course_category.view",
      description: "View course categories",
      module: "course_config",
    },
    {
      code: "course_category.update",
      description: "Update course categories",
      module: "course_config",
    },
    {
      code: "course_category.delete",
      description: "Delete course categories",
      module: "course_config",
    },

    {
      code: "difficulty_level.create",
      description: "Create difficulty levels",
      module: "course_config",
    },
    {
      code: "difficulty_level.view",
      description: "View difficulty levels",
      module: "course_config",
    },
    {
      code: "difficulty_level.update",
      description: "Update difficulty levels",
      module: "course_config",
    },
    {
      code: "difficulty_level.delete",
      description: "Delete difficulty levels",
      module: "course_config",
    },

    {
      code: "content_type.create",
      description: "Create content types",
      module: "course_config",
    },
    {
      code: "content_type.view",
      description: "View content types",
      module: "course_config",
    },
    {
      code: "content_type.update",
      description: "Update content types",
      module: "course_config",
    },
    {
      code: "content_type.delete",
      description: "Delete content types",
      module: "course_config",
    },

    {
      code: "content_file_type.create",
      description: "Create content file types",
      module: "course_config",
    },
    {
      code: "content_file_type.view",
      description: "View content file types",
      module: "course_config",
    },
    {
      code: "content_file_type.update",
      description: "Update content file types",
      module: "course_config",
    },
    {
      code: "content_file_type.delete",
      description: "Delete content file types",
      module: "course_config",
    },

    {
      code: "course_template.create",
      description: "Create course templates",
      module: "course_config",
    },
    {
      code: "course_template.view",
      description: "View course templates",
      module: "course_config",
    },
    {
      code: "course_template.update",
      description: "Update course templates",
      module: "course_config",
    },
    {
      code: "course_template.delete",
      description: "Delete course templates",
      module: "course_config",
    },

    {
      code: "system_config.manage",
      description: "Manage protected system configuration",
      module: "system",
    },

    // ==========================================================
    // ASSESSMENT DOMAIN
    // ==========================================================

    {
      code: "assessment.create",
      description: "Create assessments",
      module: "assessment",
    },
    {
      code: "assessment.view",
      description: "View assessments",
      module: "assessment",
    },
    {
      code: "assessment.update",
      description: "Update assessments",
      module: "assessment",
    },
    {
      code: "assessment.delete",
      description: "Delete assessments",
      module: "assessment",
    },
    {
      code: "assessment.grade",
      description: "Grade assessments",
      module: "assessment",
    },

    // ==========================================================
    // ASSESSMENT CONFIGURATION
    // ==========================================================

    {
      code: "assessment_type.create",
      description: "Create assessment types",
      module: "assessment_config",
    },
    {
      code: "assessment_type.view",
      description: "View assessment types",
      module: "assessment_config",
    },
    {
      code: "assessment_type.update",
      description: "Update assessment types",
      module: "assessment_config",
    },
    {
      code: "assessment_type.delete",
      description: "Delete assessment types",
      module: "assessment_config",
    },

    {
      code: "question_type.create",
      description: "Create question types",
      module: "assessment_config",
    },
    {
      code: "question_type.view",
      description: "View question types",
      module: "assessment_config",
    },
    {
      code: "question_type.update",
      description: "Update question types",
      module: "assessment_config",
    },
    {
      code: "question_type.delete",
      description: "Delete question types",
      module: "assessment_config",
    },

    {
      code: "grading_method.create",
      description: "Create grading methods",
      module: "assessment_config",
    },
    {
      code: "grading_method.view",
      description: "View grading methods",
      module: "assessment_config",
    },
    {
      code: "grading_method.update",
      description: "Update grading methods",
      module: "assessment_config",
    },
    {
      code: "grading_method.delete",
      description: "Delete grading methods",
      module: "assessment_config",
    },

    {
      code: "assessment_template.create",
      description: "Create assessment templates",
      module: "assessment_config",
    },
    {
      code: "assessment_template.view",
      description: "View assessment templates",
      module: "assessment_config",
    },
    {
      code: "assessment_template.update",
      description: "Update assessment templates",
      module: "assessment_config",
    },
    {
      code: "assessment_template.delete",
      description: "Delete assessment templates",
      module: "assessment_config",
    },

    // ==========================================================
    // PROGRAM CONFIGURATION
    // ==========================================================

    {
      code: "program_type.create",
      description: "Create program types",
      module: "program_config",
    },
    {
      code: "program_type.view",
      description: "View program types",
      module: "program_config",
    },
    {
      code: "program_type.update",
      description: "Update program types",
      module: "program_config",
    },
    {
      code: "program_type.delete",
      description: "Delete program types",
      module: "program_config",
    },

    {
      code: "program_category.create",
      description: "Create program categories",
      module: "program_config",
    },
    {
      code: "program_category.view",
      description: "View program categories",
      module: "program_config",
    },
    {
      code: "program_category.update",
      description: "Update program categories",
      module: "program_config",
    },
    {
      code: "program_category.delete",
      description: "Delete program categories",
      module: "program_config",
    },

    {
      code: "task_type.create",
      description: "Create task types",
      module: "program_config",
    },
    {
      code: "task_type.view",
      description: "View task types",
      module: "program_config",
    },
    {
      code: "task_type.update",
      description: "Update task types",
      module: "program_config",
    },
    {
      code: "task_type.delete",
      description: "Delete task types",
      module: "program_config",
    },

    {
      code: "program_template.create",
      description: "Create program templates",
      module: "program_config",
    },
    {
      code: "program_template.view",
      description: "View program templates",
      module: "program_config",
    },
    {
      code: "program_template.update",
      description: "Update program templates",
      module: "program_config",
    },
    {
      code: "program_template.delete",
      description: "Delete program templates",
      module: "program_config",
    },

    // ==========================================================
    // CERTIFICATE CONFIGURATION
    // ==========================================================

    {
      code: "certificate_type.create",
      description: "Create certificate types",
      module: "certificate_config",
    },
    {
      code: "certificate_type.view",
      description: "View certificate types",
      module: "certificate_config",
    },
    {
      code: "certificate_type.update",
      description: "Update certificate types",
      module: "certificate_config",
    },
    {
      code: "certificate_type.delete",
      description: "Delete certificate types",
      module: "certificate_config",
    },

    {
      code: "credential_source.create",
      description: "Create credential sources",
      module: "certificate_config",
    },
    {
      code: "credential_source.view",
      description: "View credential sources",
      module: "certificate_config",
    },
    {
      code: "credential_source.update",
      description: "Update credential sources",
      module: "certificate_config",
    },
    {
      code: "credential_source.delete",
      description: "Delete credential sources",
      module: "certificate_config",
    },

    {
      code: "provider_type.create",
      description: "Create provider types",
      module: "certificate_config",
    },
    {
      code: "provider_type.view",
      description: "View provider types",
      module: "certificate_config",
    },
    {
      code: "provider_type.update",
      description: "Update provider types",
      module: "certificate_config",
    },
    {
      code: "provider_type.delete",
      description: "Delete provider types",
      module: "certificate_config",
    },

    {
      code: "certificate_template.create",
      description: "Create certificate templates",
      module: "certificate_config",
    },
    {
      code: "certificate_template.view",
      description: "View certificate templates",
      module: "certificate_config",
    },
    {
      code: "certificate_template.update",
      description: "Update certificate templates",
      module: "certificate_config",
    },
    {
      code: "certificate_template.delete",
      description: "Delete certificate templates",
      module: "certificate_config",
    },

    {
      code: "certificate_template_signer.create",
      description: "Add certificate template signers",
      module: "certificate_config",
    },
    {
      code: "certificate_template_signer.view",
      description: "View certificate template signers",
      module: "certificate_config",
    },
    {
      code: "certificate_template_signer.update",
      description: "Update certificate template signers",
      module: "certificate_config",
    },
    {
      code: "certificate_template_signer.delete",
      description: "Delete certificate template signers",
      module: "certificate_config",
    },

    // ==========================================================
    // ENROLLMENT CONFIGURATION
    // ==========================================================

    {
      code: "enrollment_rule_type.create",
      description: "Create enrollment rule types",
      module: "enrollment_config",
    },
    {
      code: "enrollment_rule_type.view",
      description: "View enrollment rule types",
      module: "enrollment_config",
    },
    {
      code: "enrollment_rule_type.update",
      description: "Update enrollment rule types",
      module: "enrollment_config",
    },
    {
      code: "enrollment_rule_type.delete",
      description: "Delete enrollment rule types",
      module: "enrollment_config",
    },

    {
      code: "enrollment_rule.create",
      description: "Create enrollment rules",
      module: "enrollment_config",
    },
    {
      code: "enrollment_rule.view",
      description: "View enrollment rules",
      module: "enrollment_config",
    },
    {
      code: "enrollment_rule.update",
      description: "Update enrollment rules",
      module: "enrollment_config",
    },
    {
      code: "enrollment_rule.delete",
      description: "Delete enrollment rules",
      module: "enrollment_config",
    },

    // ==========================================================
    // APPROVAL WORKFLOW CONFIGURATION
    // ==========================================================

    {
      code: "approval_workflow.create",
      description: "Create approval workflows",
      module: "approval_workflow",
    },
    {
      code: "approval_workflow.view",
      description: "View approval workflows",
      module: "approval_workflow",
    },
    {
      code: "approval_workflow.update",
      description: "Update approval workflows",
      module: "approval_workflow",
    },
    {
      code: "approval_workflow.delete",
      description: "Delete approval workflows",
      module: "approval_workflow",
    },

    {
      code: "approval_workflow_step.create",
      description: "Create approval workflow steps",
      module: "approval_workflow",
    },
    {
      code: "approval_workflow_step.view",
      description: "View approval workflow steps",
      module: "approval_workflow",
    },
    {
      code: "approval_workflow_step.update",
      description: "Update approval workflow steps",
      module: "approval_workflow",
    },
    {
      code: "approval_workflow_step.delete",
      description: "Delete approval workflow steps",
      module: "approval_workflow",
    },

    // ==========================================================
    // NOTIFICATION CONFIGURATION
    // ==========================================================

    {
      code: "notification_module.create",
      description: "Create notification modules",
      module: "notification_config",
    },
    {
      code: "notification_module.view",
      description: "View notification modules",
      module: "notification_config",
    },
    {
      code: "notification_module.update",
      description: "Update notification modules",
      module: "notification_config",
    },
    {
      code: "notification_module.delete",
      description: "Delete notification modules",
      module: "notification_config",
    },

    {
      code: "notification_event.create",
      description: "Create notification events",
      module: "notification_config",
    },
    {
      code: "notification_event.view",
      description: "View notification events",
      module: "notification_config",
    },
    {
      code: "notification_event.update",
      description: "Update notification events",
      module: "notification_config",
    },
    {
      code: "notification_event.delete",
      description: "Delete notification events",
      module: "notification_config",
    },

    {
      code: "notification_template.create",
      description: "Create notification templates",
      module: "notification_config",
    },
    {
      code: "notification_template.view",
      description: "View notification templates",
      module: "notification_config",
    },
    {
      code: "notification_template.update",
      description: "Update notification templates",
      module: "notification_config",
    },
    {
      code: "notification_template.delete",
      description: "Delete notification templates",
      module: "notification_config",
    },

    // ==========================================================
    // TNA CONFIGURATION
    // ==========================================================

    {
      code: "tna_request_type.create",
      description: "Create TNA request types",
      module: "tna_config",
    },
    {
      code: "tna_request_type.view",
      description: "View TNA request types",
      module: "tna_config",
    },
    {
      code: "tna_request_type.update",
      description: "Update TNA request types",
      module: "tna_config",
    },
    {
      code: "tna_request_type.delete",
      description: "Delete TNA request types",
      module: "tna_config",
    },

    {
      code: "funding_type.create",
      description: "Create funding types",
      module: "tna_config",
    },
    {
      code: "funding_type.view",
      description: "View funding types",
      module: "tna_config",
    },
    {
      code: "funding_type.update",
      description: "Update funding types",
      module: "tna_config",
    },
    {
      code: "funding_type.delete",
      description: "Delete funding types",
      module: "tna_config",
    },

    {
      code: "training_format.create",
      description: "Create training formats",
      module: "tna_config",
    },
    {
      code: "training_format.view",
      description: "View training formats",
      module: "tna_config",
    },
    {
      code: "training_format.update",
      description: "Update training formats",
      module: "tna_config",
    },
    {
      code: "training_format.delete",
      description: "Delete training formats",
      module: "tna_config",
    },

    // ==========================================================
    // TRAINING EFFECTIVENESS CONFIGURATION
    // ==========================================================

    {
      code: "effectiveness_weight.create",
      description: "Create effectiveness weight configurations",
      module: "training_effectiveness",
    },
    {
      code: "effectiveness_weight.view",
      description: "View effectiveness weight configurations",
      module: "training_effectiveness",
    },
    {
      code: "effectiveness_weight.update",
      description: "Update effectiveness weight configurations",
      module: "training_effectiveness",
    },
    {
      code: "effectiveness_weight.delete",
      description: "Delete effectiveness weight configurations",
      module: "training_effectiveness",
    },

    // ==========================================================
    // SURVEY CONFIGURATION
    // ==========================================================

    {
      code: "survey_question_type.create",
      description: "Create survey question types",
      module: "survey_config",
    },
    {
      code: "survey_question_type.view",
      description: "View survey question types",
      module: "survey_config",
    },
    {
      code: "survey_question_type.update",
      description: "Update survey question types",
      module: "survey_config",
    },
    {
      code: "survey_question_type.delete",
      description: "Delete survey question types",
      module: "survey_config",
    },

    {
      code: "survey_template.create",
      description: "Create survey templates",
      module: "survey_config",
    },
    {
      code: "survey_template.view",
      description: "View survey templates",
      module: "survey_config",
    },
    {
      code: "survey_template.update",
      description: "Update survey templates",
      module: "survey_config",
    },
    {
      code: "survey_template.delete",
      description: "Delete survey templates",
      module: "survey_config",
    },

    // ==========================================================
    // SYSTEM SETTINGS
    // ==========================================================

    {
      code: "system_setting.create",
      description: "Create system settings",
      module: "system",
    },
    {
      code: "system_setting.view",
      description: "View system settings",
      module: "system",
    },
    {
      code: "system_setting.update",
      description: "Update system settings",
      module: "system",
    },
    {
      code: "system_setting.delete",
      description: "Delete system settings",
      module: "system",
    },

    // ==========================================================
    // CERTIFICATE DOMAIN
    // ==========================================================

    {
      code: "certificate.view",
      description: "View certificates",
      module: "certificate",
    },
    {
      code: "certificate.create",
      description: "Create certificates",
      module: "certificate",
    },
    {
      code: "certificate.issue",
      description: "Issue certificates",
      module: "certificate",
    },
    {
      code: "certificate.revoke",
      description: "Revoke certificates",
      module: "certificate",
    },

    // ==========================================================
    // TNA DOMAIN
    // ==========================================================

    {
      code: "tna.view",
      description: "View TNA requests",
      module: "tna",
    },
    {
      code: "tna.create",
      description: "Create TNA requests",
      module: "tna",
    },
    {
      code: "tna.approve",
      description: "Approve TNA requests",
      module: "tna",
    },
    {
      code: "tna.reject",
      description: "Reject TNA requests",
      module: "tna",
    },

    // ==========================================================
    // USER / SYSTEM / REPORTS
    // ==========================================================

    {
      code: "user.view",
      description: "View users",
      module: "user",
    },
    {
      code: "user.create",
      description: "Create users",
      module: "user",
    },
    {
      code: "user.edit",
      description: "Edit users",
      module: "user",
    },
    {
      code: "user.delete",
      description: "Delete users",
      module: "user",
    },
    {
      code: "user.manage_roles",
      description: "Manage user roles",
      module: "user",
    },

    {
      code: "reports.view",
      description: "View reports",
      module: "reports",
    },
    {
      code: "reports.export",
      description: "Export reports",
      module: "reports",
    },

    // ==========================================================
    // ANALYTICS DOMAIN
    // ==========================================================

    {
      code: "analytics.view",
      description: "View LMS analytics and reports within the user's data scope.",
      module: "analytics",
    },

    // ==========================================================
    // GAMIFICATION — XP RULES
    // ==========================================================

    { code: "xp_rule.view",   description: "View XP rules.",   module: "gamification" },
    { code: "xp_rule.create", description: "Create XP rules.", module: "gamification" },
    { code: "xp_rule.update", description: "Update XP rules.", module: "gamification" },
    { code: "xp_rule.delete", description: "Delete XP rules.", module: "gamification" },

    // ==========================================================
    // GAMIFICATION — LEARNING LEVELS
    // ==========================================================

    { code: "learning_level.view",   description: "View learning levels.",   module: "gamification" },
    { code: "learning_level.create", description: "Create learning levels.", module: "gamification" },
    { code: "learning_level.update", description: "Update learning levels.", module: "gamification" },
    { code: "learning_level.delete", description: "Delete learning levels.", module: "gamification" },

    // ==========================================================
    // GAMIFICATION — BADGES
    // ==========================================================

    { code: "badge.view",   description: "View badges.",   module: "gamification" },
    { code: "badge.create", description: "Create badges.", module: "gamification" },
    { code: "badge.update", description: "Update badges.", module: "gamification" },
    { code: "badge.delete", description: "Delete badges.", module: "gamification" },

    { code: "badge_rule.view",   description: "View badge rules.",   module: "gamification" },
    { code: "badge_rule.create", description: "Create badge rules.", module: "gamification" },
    { code: "badge_rule.update", description: "Update badge rules.", module: "gamification" },
    { code: "badge_rule.delete", description: "Delete badge rules.", module: "gamification" },

    // ==========================================================
    // CUSTOM FIELDS
    // ==========================================================

    { code: "custom_field.view",   description: "View custom field definitions.",   module: "custom_fields" },
    { code: "custom_field.create", description: "Create custom field definitions.", module: "custom_fields" },
    { code: "custom_field.update", description: "Update custom field definitions.", module: "custom_fields" },
    { code: "custom_field.delete", description: "Delete custom field definitions.", module: "custom_fields" },

    // ==========================================================
    // GAMIFICATION — RUNTIME (gamification_config.manage guards page entry)
    // ==========================================================

    { code: "gamification_config.manage", description: "Manage gamification configuration.", module: "gamification" },
  ];

  const permissionMap = new Map<string, any>();

  for (const permission of permissionDefinitions) {
    const created = await prisma.lmsPermission.upsert({
      where: {
        companyId_code: {
          companyId,
          code: permission.code,
        },
      },
      update: {
        description: permission.description,
        module: permission.module,
      },
      create: {
        companyId,
        code: permission.code,
        description: permission.description,
        module: permission.module,
      },
    });

    permissionMap.set(permission.code, created);
  }

  console.log(
    `  ${permissionDefinitions.length} LMS Permissions created/updated`,
  );

  // ==========================================================
  // ROLE -> PERMISSION MAPPING
  // ==========================================================

  const rolePermissionMapping: Record<string, string[]> = {
    // ----------------------------------------------------------
    // SUPER ADMIN
    // ----------------------------------------------------------
    SUPER_ADMIN: Array.from(permissionMap.keys()),

    // ----------------------------------------------------------
    // ADMIN
    // ----------------------------------------------------------
    ADMIN: Array.from(permissionMap.keys()),

    // ----------------------------------------------------------
    // HR
    // Configuration management + relevant business operations
    // ----------------------------------------------------------
    HR: [
      // Course
      "course.create",
      "course.view",
      "course.update",
      "course.delete",
      "course.publish",

      // Audience
      "audience.create",
      "audience.view",
      "audience.update",
      "audience.delete",

      // Course Configuration
      "course_category.create",
      "course_category.view",
      "course_category.update",
      "course_category.delete",

      "difficulty_level.create",
      "difficulty_level.view",
      "difficulty_level.update",
      "difficulty_level.delete",

      "content_type.create",
      "content_type.view",
      "content_type.update",
      "content_type.delete",

      "content_file_type.create",
      "content_file_type.view",
      "content_file_type.update",
      "content_file_type.delete",

      "course_template.create",
      "course_template.view",
      "course_template.update",
      "course_template.delete",

      // Assessment Configuration
      "assessment_type.create",
      "assessment_type.view",
      "assessment_type.update",
      "assessment_type.delete",

      "question_type.create",
      "question_type.view",
      "question_type.update",
      "question_type.delete",

      "grading_method.create",
      "grading_method.view",
      "grading_method.update",
      "grading_method.delete",

      "assessment_template.create",
      "assessment_template.view",
      "assessment_template.update",
      "assessment_template.delete",

      // Program Configuration
      "program_type.create",
      "program_type.view",
      "program_type.update",
      "program_type.delete",

      "program_category.create",
      "program_category.view",
      "program_category.update",
      "program_category.delete",

      "task_type.create",
      "task_type.view",
      "task_type.update",
      "task_type.delete",

      "program_template.create",
      "program_template.view",
      "program_template.update",
      "program_template.delete",

      // Certificate Configuration
      "certificate_type.create",
      "certificate_type.view",
      "certificate_type.update",
      "certificate_type.delete",

      "credential_source.create",
      "credential_source.view",
      "credential_source.update",
      "credential_source.delete",

      "provider_type.create",
      "provider_type.view",
      "provider_type.update",
      "provider_type.delete",

      "certificate_template.create",
      "certificate_template.view",
      "certificate_template.update",
      "certificate_template.delete",

      "certificate_template_signer.create",
      "certificate_template_signer.view",
      "certificate_template_signer.update",
      "certificate_template_signer.delete",

      // Enrollment Configuration
      "enrollment_rule_type.create",
      "enrollment_rule_type.view",
      "enrollment_rule_type.update",
      "enrollment_rule_type.delete",

      "enrollment_rule.create",
      "enrollment_rule.view",
      "enrollment_rule.update",
      "enrollment_rule.delete",

      // Approval Workflow Configuration
      "approval_workflow.create",
      "approval_workflow.view",
      "approval_workflow.update",
      "approval_workflow.delete",

      "approval_workflow_step.create",
      "approval_workflow_step.view",
      "approval_workflow_step.update",
      "approval_workflow_step.delete",

      // Notification Configuration
      "notification_module.create",
      "notification_module.view",
      "notification_module.update",
      "notification_module.delete",

      "notification_event.create",
      "notification_event.view",
      "notification_event.update",
      "notification_event.delete",

      "notification_template.create",
      "notification_template.view",
      "notification_template.update",
      "notification_template.delete",

      // TNA Configuration
      "tna_request_type.create",
      "tna_request_type.view",
      "tna_request_type.update",
      "tna_request_type.delete",

      "funding_type.create",
      "funding_type.view",
      "funding_type.update",
      "funding_type.delete",

      "training_format.create",
      "training_format.view",
      "training_format.update",
      "training_format.delete",

      // Training Effectiveness
      "effectiveness_weight.create",
      "effectiveness_weight.view",
      "effectiveness_weight.update",
      "effectiveness_weight.delete",

      // Survey Configuration
      "survey_question_type.create",
      "survey_question_type.view",
      "survey_question_type.update",
      "survey_question_type.delete",

      "survey_template.create",
      "survey_template.view",
      "survey_template.update",
      "survey_template.delete",

      // System settings
      "system_setting.view",
      "system_setting.update",

      // Runtime
      "assessment.create",
      "assessment.view",
      "assessment.grade",

      "certificate.view",
      "certificate.create",
      "certificate.issue",
      "certificate.revoke",

      "tna.view",
      "tna.create",
      "tna.approve",
      "tna.reject",

      "reports.view",
      "reports.export",

      // Gamification Configuration
      "xp_rule.view",
      "xp_rule.create",
      "xp_rule.update",
      "xp_rule.delete",

      "learning_level.view",
      "learning_level.create",
      "learning_level.update",
      "learning_level.delete",

      "badge.view",
      "badge.create",
      "badge.update",
      "badge.delete",

      "badge_rule.view",
      "badge_rule.create",
      "badge_rule.update",
      "badge_rule.delete",

      "gamification_config.manage",

      // Custom Fields
      "custom_field.view",
      "custom_field.create",
      "custom_field.update",
      "custom_field.delete",
    ],

    // ----------------------------------------------------------
    // INSTRUCTOR
    // ----------------------------------------------------------
    INSTRUCTOR: [
      "course.create",
      "course.view",
      "course.update",

      "course_category.view",
      "difficulty_level.view",
      "content_type.view",
      "content_file_type.view",
      "course_template.view",

      "audience.view",

      "assessment.create",
      "assessment.view",
      "assessment.grade",

      "assessment_type.view",
      "question_type.view",
      "grading_method.view",
      "assessment_template.view",

      "program_type.view",
      "program_category.view",
      "task_type.view",
      "program_template.view",

      // Survey (view only)
      "survey_question_type.view",
      "survey_template.view",

      "reports.view",

      // Gamification (view only for instructors)
      "xp_rule.view",
      "learning_level.view",
      "badge.view",
      "badge_rule.view",
    ],

    // ----------------------------------------------------------
    // MANAGER
    // ----------------------------------------------------------
    MANAGER: [
      "course.view",
      "audience.view",

      "assessment.view",

      "assessment_type.view",
      "question_type.view",
      "grading_method.view",
      "assessment_template.view",

      "program_type.view",
      "program_category.view",
      "task_type.view",
      "program_template.view",

      "tna.view",
      "tna.create",
      "tna.approve",

      "reports.view",
      "reports.export",
      "analytics.view",

      // Gamification (view only for managers)
      "learning_level.view",
      "badge.view",
    ],

    // ----------------------------------------------------------
    // EMPLOYEE
    // ----------------------------------------------------------
    EMPLOYEE: [
      "course.view",
      "assessment.view",
      "certificate.view",
    ],

    // ----------------------------------------------------------
    // LEARNER
    // ----------------------------------------------------------
    LEARNER: [
      "course.view",
      "assessment.view",
    ],
  };

  // ==========================================================
  // SEED ROLE PERMISSIONS
  // ==========================================================

  for (const [roleName, permissionCodes] of Object.entries(
    rolePermissionMapping,
  )) {
    const role = roleMap.get(roleName);

    if (!role) {
      console.warn(
        `  Role "${roleName}" not found, skipping permissions`,
      );
      continue;
    }

    for (const code of permissionCodes) {
      const permission = permissionMap.get(code);

      if (!permission) {
        console.warn(
          `  Permission "${code}" not found for role "${roleName}"`,
        );
        continue;
      }

      await prisma.lmsRolePermission.upsert({
        where: {
          appRoleId_permissionId: {
            appRoleId: role.id,
            permissionId: permission.id,
          },
        },
        update: {},
        create: {
          companyId,
          appRoleId: role.id,
          permissionId: permission.id,
        },
      });
    }
  }

  console.log(
    `LMS permissions for companyId: ${companyId} seeded successfully.`,
  );
}

async function seedSystemSettings(companyId: number, actorId: number) {
  console.log(`  Seeding system settings for companyId: ${companyId}`);

  const existing = await prisma.systemSetting.findMany({
    where: { companyId },
    select: { settingKey: true },
  });
  const existingKeys = new Set(existing.map((r) => r.settingKey));

  let created = 0;
  for (const def of KNOWN_SETTINGS) {
    if (existingKeys.has(def.key)) continue;

    await prisma.systemSetting.create({
      data: {
        companyId,
        category: def.category,
        settingKey: def.key,
        settingValue:
          isSecretSettingKey(def.key) && def.defaultValue != null
            ? encryptSettingValue(String(def.defaultValue))
            : ((def.defaultValue ?? null) as object),
        valueType: def.valueType,
        description: def.description,
        isActive: true,
        createdBy: actorId,
        updatedBy: actorId,
      },
    });
    created += 1;
  }

  console.log(`  ${created} system settings seeded`);
}

async function main() {
  await seedSystemLookupTables();

  const { company, roleMap } = await seedEmsTables();
  await seedLmsPermissions(company.id, roleMap);
  await seedSystemSettings(company.id, 1001); // superadmin@acme.com
}

main().catch((e) => {
  console.error("Seeding error encountered:", e);
  process.exit(1);
});
