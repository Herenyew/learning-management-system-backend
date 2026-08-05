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
  console.log(`  ${users.length} App Users sync'd`);

  // 2.8 Company-Specific Lookup Tables
  console.log("  Seeding company-specific lookup tables...");

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

    if (!existing) {
      await prisma.taskType.create({
        data: {
          companyId: company.id,
          name: item.name,
          slug: item.slug,
          expectedSubmissionType: item.expectedSubmissionType as any,
          linkedEntity: item.linkedEntity as any,
          isSystem: true,
          isActive: true,
        },
      });
    }
  }

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

  await Promise.all(
    enrollmentRuleTypes.map((item) =>
      prisma.enrollmentRuleType.upsert({
        where: { companyId_slug: { companyId, slug: item.slug } },
        update: {},
        create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
      })
    )
  );

  console.log(`Lookup tables for companyId: ${companyId} seeded successfully.`);
}

async function main() {
  await seedSystemLookupTables();

  const companies = await prisma.company.findMany({ select: { id: true } });

  if (companies.length === 0) {
    console.log('No companies found. Please populate Company entity before running seed.');
    return;
  }

  for (const company of companies) {
    await seedCompanyLookupTables(company.id);
  }
}

main()
  .catch((e) => {
    console.error('Seeding error encountered:', e);
    process.exit(1);
  });
