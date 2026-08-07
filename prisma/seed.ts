import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedSystemLookupTables() {
  console.log('Seeding system-level lookup tables...');

  // --------------------------------------------------
  // DifficultyLevel (System-wide default: companyId = null)
  // --------------------------------------------------
  const difficultyLevels = [
    { name: 'Beginner', code: 'BEGINNER', displayOrder: 1 },
    { name: 'Intermediate', code: 'INTERMEDIATE', displayOrder: 2 },
    { name: 'Advanced', code: 'ADVANCED', displayOrder: 3 },
    { name: 'Expert', code: 'EXPERT', displayOrder: 4 },
  ];

  for (const item of difficultyLevels) {
    const existing = await prisma.difficultyLevel.findFirst({
      where: {
        code: item.code,
        companyId: null,
      },
    });


  }
  console.log(`  ${difficultyLevels.length} Difficulty Levels seeded`);

  console.log('  System Lookup Tables completed');
}

// ============================================================================
// SECTION 2: EMS TABLES
// ============================================================================
// HR/EMS data projected into LMS

async function seedEmsTables() {
  console.log('\n  [2/3] Seeding EMS Tables...');

  // 2.1 Company
  const company = await prisma.company.upsert({
    where: { companyCode: 'ACME' },
    update: {},
    create: {
      id: 1,
      companyCode: 'ACME',
      name: 'Acme Corporation',
      logoUrl: 'https://example.com/logo.png',
      isActive: true,
      lastSyncedAt: new Date(),
    },
  });
  console.log(`  Company: ${company.name} (ID: ${company.id})`);

  // 2.2 Departments
  const departments = [
    { id: 10, name: 'Engineering' },
    { id: 11, name: 'Sales' },
    { id: 12, name: 'Marketing' },
    { id: 13, name: 'Finance' },
    { id: 14, name: 'Human Resources' },
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
    { id: 100, name: 'Software Engineer' },
    { id: 101, name: 'Senior Software Engineer' },
    { id: 102, name: 'Tech Lead' },
    { id: 103, name: 'Engineering Manager' },
    { id: 104, name: 'Sales Representative' },
    { id: 105, name: 'Sales Manager' },
    { id: 106, name: 'Marketing Specialist' },
    { id: 107, name: 'Marketing Manager' },
    { id: 108, name: 'Accountant' },
    { id: 109, name: 'HR Business Partner' },
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
    { id: 200, name: 'Entry', level: 1 },
    { id: 201, name: 'Junior', level: 2 },
    { id: 202, name: 'Senior', level: 3 },
    { id: 203, name: 'Lead', level: 4 },
    { id: 204, name: 'Manager', level: 5 },
    { id: 205, name: 'Director', level: 6 },
    { id: 206, name: 'VP', level: 7 },
    { id: 207, name: 'C-Level', level: 8 },
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
  { id: 1, name: 'EMPLOYEE', description: 'Default Employee role' },
  { id: 6, name: 'SUPER_ADMIN', description: 'Full system access' },
  { id: 7, name: 'ADMIN', description: 'Company administrator' },
  { id: 8, name: 'HR', description: 'HR role' },

  // LMS-specific roles (new IDs not used by EMS)
  { id: 9, name: 'INSTRUCTOR', description: 'Can create and manage courses' },
  { id: 10, name: 'MANAGER', description: 'Can approve TNA and view reports' },
  { id: 11, name: 'LEARNER', description: 'Can take courses' },
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
  { id: 'EMP001', fullName: 'John Doe', department: 'Engineering', jobTitle: 'Tech Lead', jobLevel: 'Lead', startDate: '2023-01-15' },
  { id: 'EMP002', fullName: 'Jane Smith', department: 'Engineering', jobTitle: 'Senior Software Engineer', jobLevel: 'Senior', startDate: '2023-03-10' },
  { id: 'EMP007', fullName: 'Eve Adams', department: 'Engineering', jobTitle: 'Software Engineer', jobLevel: 'Junior', startDate: '2024-06-15' },
  { id: 'EMP009', fullName: 'Grace Hopper', department: 'Engineering', jobTitle: 'Software Engineer', jobLevel: 'Senior', startDate: '2022-05-10' },
  { id: 'EMP003', fullName: 'Bob Johnson', department: 'Sales', jobTitle: 'Sales Manager', jobLevel: 'Manager', startDate: '2022-06-01' },
  { id: 'EMP008', fullName: 'Frank Castle', department: 'Sales', jobTitle: 'Sales Representative', jobLevel: 'Senior', startDate: '2023-09-01' },
  { id: 'EMP004', fullName: 'Alice Williams', department: 'Marketing', jobTitle: 'Marketing Manager', jobLevel: 'Manager', startDate: '2022-08-15' },
  { id: 'EMP005', fullName: 'Charlie Brown', department: 'Finance', jobTitle: 'Accountant', jobLevel: 'Senior', startDate: '2021-11-01' },
  { id: 'EMP010', fullName: 'Henry Ford', department: 'Finance', jobTitle: 'Accountant', jobLevel: 'Junior', startDate: '2024-01-01' },
  { id: 'EMP006', fullName: 'Diana Prince', department: 'Human Resources', jobTitle: 'HR Business Partner', jobLevel: 'Manager', startDate: '2022-01-20' },

  // ─── NEW: EMS Employee IDs ────────────────────────────
  { id: 'EMP-ADMIN', fullName: 'Kacha Admin', department: 'Human Resource', jobTitle: 'Admin', jobLevel: 'Manager', startDate: '2020-01-01' },
  { id: 'EMP-MGR-001', fullName: 'Manager User', department: 'Technology', jobTitle: 'Software Engineer', jobLevel: 'Manager', startDate: '2020-01-01' },
  { id: 'EMP-DEV-001', fullName: 'Developer User', department: 'Technology', jobTitle: 'Software Engineer', jobLevel: 'Senior', startDate: '2020-01-01' },
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
  { id: 1001, email: 'superadmin@acme.com', employeeId: 'EMP001', role: 'SUPER_ADMIN' },
  { id: 1002, email: 'admin@acme.com', employeeId: 'EMP002', role: 'ADMIN' },
  { id: 1003, email: 'instructor@acme.com', employeeId: 'EMP003', role: 'INSTRUCTOR' },
  { id: 1004, email: 'manager@acme.com', employeeId: 'EMP004', role: 'MANAGER' },
  { id: 1005, email: 'learner@acme.com', employeeId: 'EMP005', role: 'LEARNER' },
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
  console.log('  Seeding company-specific lookup tables...');
  await seedCompanyLookupTables(company.id);

  console.log('  EMS Tables completed');
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
    })
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
        create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
      })
    )
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
      })
    )
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
      })
    )
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
        create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
      })
    )
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
        create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
      })
    )
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
        create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
      })
    )
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
        create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
      })
    )
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
        create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
      })
    )
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
        create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
      })
    )
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
        create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
      })
    )
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
        create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
      })
    )
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
        create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
      })
    )
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
        create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
      })
    )
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
        create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
      })
    )
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
        create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
      })
    )
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
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  console.log(`  ${enrollmentRuleTypes.length} Enrollment Rule Types created`);
}

// ============================================================================
// SECTION 3: LMS PERMISSIONS
// ============================================================================

async function seedLmsPermissions(companyId: number, roleMap: Map<string, any>) {
  console.log('\n  [3/3] Seeding LMS Permissions...');

  const permissionDefinitions = [
    { code: 'course.view', description: 'View courses', module: 'course' },
    { code: 'course.create', description: 'Create courses', module: 'course' },
    { code: 'course.edit', description: 'Edit courses', module: 'course' },
    { code: 'course.delete', description: 'Delete courses', module: 'course' },
    { code: 'course.publish', description: 'Publish courses', module: 'course' },
    { code: 'course.enroll', description: 'Enroll students', module: 'course' },
    { code: 'audience.view', description: 'View audience groups', module: 'audience' },
    { code: 'audience.create', description: 'Create audience groups', module: 'audience' },
    { code: 'audience.edit', description: 'Edit audience groups', module: 'audience' },
    { code: 'audience.delete', description: 'Delete audience groups', module: 'audience' },
    { code: 'audience.assign', description: 'Assign audience groups', module: 'audience' },
    { code: 'assessment.view', description: 'View assessments', module: 'assessment' },
    { code: 'assessment.create', description: 'Create assessments', module: 'assessment' },
    { code: 'assessment.edit', description: 'Edit assessments', module: 'assessment' },
    { code: 'assessment.delete', description: 'Delete assessments', module: 'assessment' },
    { code: 'assessment.grade', description: 'Grade assessments', module: 'assessment' },
    { code: 'tna.view', description: 'View TNA requests', module: 'tna' },
    { code: 'tna.create', description: 'Create TNA requests', module: 'tna' },
    { code: 'tna.approve', description: 'Approve TNA requests', module: 'tna' },
    { code: 'tna.reject', description: 'Reject TNA requests', module: 'tna' },
    { code: 'certificate.view', description: 'View certificates', module: 'certificate' },
    { code: 'certificate.create', description: 'Create certificates', module: 'certificate' },
    { code: 'certificate.issue', description: 'Issue certificates', module: 'certificate' },
    { code: 'certificate.revoke', description: 'Revoke certificates', module: 'certificate' },
    { code: 'user.view', description: 'View users', module: 'user' },
    { code: 'user.create', description: 'Create users', module: 'user' },
    { code: 'user.edit', description: 'Edit users', module: 'user' },
    { code: 'user.delete', description: 'Delete users', module: 'user' },
    { code: 'user.manage_roles', description: 'Manage user roles', module: 'user' },
    { code: 'system.settings', description: 'View system settings', module: 'system' },
    { code: 'system.configure', description: 'Configure system', module: 'system' },
    { code: 'reports.view', description: 'View reports', module: 'reports' },
    { code: 'reports.export', description: 'Export reports', module: 'reports' },
  ];

  const permissionMap = new Map();
  for (const perm of permissionDefinitions) {
    const created = await prisma.lmsPermission.upsert({
      where: { companyId_code: { companyId, code: perm.code } },
      update: {},
      create: {
        companyId,
        code: perm.code,
        description: perm.description,
        module: perm.module,
      },
    });
    permissionMap.set(perm.code, created);
  }
  console.log(`  ${permissionDefinitions.length} LMS Permissions created`);

  const rolePermissionMapping = {
    SUPER_ADMIN: Array.from(permissionMap.keys()),
    ADMIN: Array.from(permissionMap.keys()),
    HR: ['course.view', 'audience.view', 'user.view', 'reports.view', 'certificate.view'],
    EMPLOYEE: ['course.view', 'assessment.view', 'certificate.view'],
    INSTRUCTOR: [
      'course.view', 'course.create', 'course.edit', 'course.enroll',
      'audience.view',
      'assessment.view', 'assessment.create', 'assessment.edit', 'assessment.grade',
      'tna.view',
      'reports.view',
    ],
    MANAGER: [
      'course.view',
      'audience.view',
      'assessment.view',
      'tna.view', 'tna.create', 'tna.approve',
      'reports.view', 'reports.export',
    ],
    LEARNER: ['course.view', 'assessment.view'],
  };

  for (const [roleName, permissionCodes] of Object.entries(rolePermissionMapping)) {
    const role = roleMap.get(roleName);
    if (!role) {
      console.warn(`  Role "${roleName}" not found, skipping permissions`);
      continue;
    }

    for (const code of permissionCodes) {
      const permission = permissionMap.get(code);
      if (!permission) {
        console.warn(`  Permission "${code}" not found for role "${roleName}"`);
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

  console.log(`LMS permissions for companyId: ${companyId} seeded successfully.`);
}

async function main() {
  await seedSystemLookupTables();

  const { company, roleMap } = await seedEmsTables();
  await seedLmsPermissions(company.id, roleMap);
}

main()
  .catch((e) => {
    console.error('Seeding error encountered:', e);
    process.exit(1);
  });