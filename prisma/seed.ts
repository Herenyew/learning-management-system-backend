// prisma/seed.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedLookupTables(companyId: number) {
  console.log(`Seeding lookup tables for companyId: ${companyId}`);

  // --------------------------------------------------
  // DifficultyLevel
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
      companyId: null, // system-level row
    },
  });

  if (!existing) {
    await prisma.difficultyLevel.create({
      data: {
        companyId: null, // system-wide default
        code: item.code,
        name: item.name,
        displayOrder: item.displayOrder,
        isSystem: true,
        isActive: true,
      },
    });
  }
}

  // --------------------------------------------------
  // TaskType
  // --------------------------------------------------
const taskTypes = [
  {
    name: 'Course Content',
    slug: 'course_content',
    expectedSubmissionType: 'NONE',
    linkedEntity: 'COURSE_CONTENT',
  },
  {
    name: 'Assessment',
    slug: 'assessment',
    expectedSubmissionType: 'NONE',
    linkedEntity: 'ASSESSMENT',
  },
  {
    name: 'Live Session',
    slug: 'live_session',
    expectedSubmissionType: 'NONE',
    linkedEntity: 'LIVE_SESSION',
  },
  {
    name: 'Assignment',
    slug: 'assignment',
    expectedSubmissionType: 'FILE_UPLOAD',
    linkedEntity: 'NONE',
  },
  {
    name: 'Survey',
    slug: 'survey',
    expectedSubmissionType: 'NONE',
    linkedEntity: 'SURVEY',
  },
  {
    name: 'Manager Check-in',
    slug: 'manager_checkin',
    expectedSubmissionType: 'TEXT_INPUT',
    linkedEntity: 'NONE',
  },
  {
    name: 'Peer Review',
    slug: 'peer_review',
    expectedSubmissionType: 'TEXT_INPUT',
    linkedEntity: 'NONE',
  },
  {
    name: 'External Activity',
    slug: 'external_activity',
    expectedSubmissionType: 'LINK',
    linkedEntity: 'NONE',
  },
  {
    name: 'Reading',
    slug: 'reading',
    expectedSubmissionType: 'NONE',
    linkedEntity: 'COURSE_CONTENT',
  },
  {
    name: 'Other',
    slug: 'other',
    expectedSubmissionType: 'NONE',
    linkedEntity: 'NONE',
  },
];

for (const item of taskTypes) {
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
}

  // --------------------------------------------------
  // AttendanceMethod
  // --------------------------------------------------
  const attendanceMethods = [
    { name: 'QR Code', slug: 'qr_code' },
    { name: 'Manual', slug: 'manual' },
    { name: 'System Auto', slug: 'system_auto' },
    { name: 'Biometric', slug: 'biometric' },
  ];

  for (const item of attendanceMethods) {
    await prisma.attendanceMethod.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  // --------------------------------------------------
  // AssessmentType
  // --------------------------------------------------
  const assessmentTypes = [
    { name: 'Pre Assessment', slug: 'pre_assessment', code: 'PRE_ASSESSMENT' },
    { name: 'Post Assessment', slug: 'post_assessment', code: 'POST_ASSESSMENT' },
    { name: 'Chapter Quiz', slug: 'chapter_quiz', code: 'CHAPTER_QUIZ' },
    { name: 'Course Final', slug: 'course_final', code: 'COURSE_FINAL' },
    { name: 'Practice', slug: 'practice', code: 'PRACTICE' },
  ];

  for (const item of assessmentTypes) {
    await prisma.assessmentType.upsert({
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
    });
  }

  // --------------------------------------------------
  // QuestionType
  // --------------------------------------------------
  const questionTypes = [
    { name: 'Multiple Choice', slug: 'multiple_choice', answerStructure: 'OPTION_BASED' },
    { name: 'True/False', slug: 'true_false', answerStructure: 'OPTION_BASED' },
    { name: 'Short Answer', slug: 'short_answer', answerStructure: 'FREE_TEXT' },
    { name: 'Essay', slug: 'essay', answerStructure: 'FREE_TEXT' },
    { name: 'Matching', slug: 'matching', answerStructure: 'MATCHING_PAIR_BASED' },
    { name: 'Ordering', slug: 'ordering', answerStructure: 'OPTION_BASED' },
    { name: 'Fill in the Blank', slug: 'fill_blank', answerStructure: 'OPTION_BASED' },
    { name: 'Multi Select', slug: 'multi_select', answerStructure: 'OPTION_BASED' },
    { name: 'Drag and Drop', slug: 'drag_drop', answerStructure: 'MATCHING_PAIR_BASED' },
  ];

  for (const item of questionTypes) {
    await prisma.questionType.upsert({
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
    });
  }

  // --------------------------------------------------
  // GradingMethod
  // --------------------------------------------------
  const gradingMethods = [
    { name: 'Highest Score', slug: 'highest_score' },
    { name: 'Latest Attempt', slug: 'latest_attempt' },
    { name: 'Average Score', slug: 'average_score' },
    { name: 'First Attempt', slug: 'first_attempt' },
  ];

  for (const item of gradingMethods) {
    await prisma.gradingMethod.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  // --------------------------------------------------
  // CertificateType
  // --------------------------------------------------
  const certificateTypes = [
    { name: 'Course Completion', slug: 'course_completion' },
    { name: 'Program Completion', slug: 'program_completion' },
    { name: 'Certification', slug: 'certification' },
    { name: 'Badge', slug: 'badge' },
    { name: 'Attendance', slug: 'attendance' },
    { name: 'External', slug: 'external' },
  ];

  for (const item of certificateTypes) {
    await prisma.certificateType.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  // --------------------------------------------------
  // CredentialSource
  // --------------------------------------------------
  const credentialSources = [
    { name: 'Manual Upload', slug: 'manual_upload' },
    { name: 'API Integration', slug: 'api_integration' },
    { name: 'Email Submission', slug: 'email_submission' },
    { name: 'LinkedIn', slug: 'linkedin' },
    { name: 'Other', slug: 'other' },
  ];

  for (const item of credentialSources) {
    await prisma.credentialSource.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  // --------------------------------------------------
  // ProviderType
  // --------------------------------------------------
  const providerTypes = [
    { name: 'Certification Body', slug: 'certification_body' },
    { name: 'University', slug: 'university' },
    { name: 'Online Platform', slug: 'online_platform' },
    { name: 'Government', slug: 'government' },
    { name: 'Internal', slug: 'internal' },
    { name: 'Other', slug: 'other' },
  ];

  for (const item of providerTypes) {
    await prisma.providerType.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  // --------------------------------------------------
  // SurveyQuestionType
  // --------------------------------------------------
  const surveyQuestionTypes = [
    { name: 'Rating', slug: 'rating' },
    { name: 'Multiple Choice', slug: 'multiple_choice' },
    { name: 'Multi Select', slug: 'multi_select' },
    { name: 'Text', slug: 'text' },
    { name: 'Yes/No', slug: 'yes_no' },
    { name: 'Scale', slug: 'scale' },
  ];

  for (const item of surveyQuestionTypes) {
    await prisma.surveyQuestionType.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  // --------------------------------------------------
  // MeetingProvider
  // --------------------------------------------------
  const meetingProviders = [
    { name: 'Zoom', slug: 'zoom' },
    { name: 'Microsoft Teams', slug: 'microsoft_teams' },
    { name: 'Google Meet', slug: 'google_meet' },
    { name: 'Webex', slug: 'webex' },
    { name: 'In Person', slug: 'inperson' },
    { name: 'Other', slug: 'other' },
  ];

  for (const item of meetingProviders) {
    await prisma.meetingProvider.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  // --------------------------------------------------
  // FundingType
  // --------------------------------------------------
  const fundingTypes = [
    { name: 'Company Funded', slug: 'company_funded' },
    { name: 'Self Funded', slug: 'self_funded' },
    { name: 'Shared', slug: 'shared' },
  ];

  for (const item of fundingTypes) {
    await prisma.fundingType.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  // --------------------------------------------------
  // XpRuleCategory
  // --------------------------------------------------
  const xpRuleCategories = [
    { name: 'Enrollment', slug: 'enrollment' },
    { name: 'Completion', slug: 'completion' },
    { name: 'Assessment', slug: 'assessment' },
    { name: 'Engagement', slug: 'engagement' },
    { name: 'Manual', slug: 'manual' },
  ];

  for (const item of xpRuleCategories) {
    await prisma.xpRuleCategory.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  // --------------------------------------------------
  // XpTriggerEvent
  // --------------------------------------------------
  const xpTriggerEvents = [
    { name: 'Course Completed', slug: 'course_completed' },
    { name: 'Assessment Passed', slug: 'assessment_passed' },
    { name: 'Perfect Score', slug: 'perfect_score' },
    { name: 'Program Completed', slug: 'program_completed' },
    { name: 'Certificate Earned', slug: 'certificate_earned' },
    { name: 'Badge Awarded', slug: 'badge_awarded' },
    { name: 'Manual Adjustment', slug: 'manual_adjustment' },
  ];

  for (const item of xpTriggerEvents) {
    await prisma.xpTriggerEvent.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  // --------------------------------------------------
  // BadgeCategory
  // --------------------------------------------------
  const badgeCategories = [
    { name: 'Achievement', slug: 'achievement' },
    { name: 'Milestone', slug: 'milestone' },
    { name: 'Streak', slug: 'streak' },
    { name: 'Skill', slug: 'skill' },
    { name: 'Participation', slug: 'participation' },
  ];

  for (const item of badgeCategories) {
    await prisma.badgeCategory.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  // --------------------------------------------------
  // TrainingFormat
  // --------------------------------------------------
  const trainingFormats = [
    { name: 'Online', slug: 'online' },
    { name: 'Instructor Led', slug: 'instructor_led' },
    { name: 'Blended', slug: 'blended' },
    { name: 'External', slug: 'external' },
    { name: 'Conference', slug: 'conference' },
    { name: 'On the Job', slug: 'on_the_job' },
  ];

  for (const item of trainingFormats) {
    await prisma.trainingFormat.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  // --------------------------------------------------
  // NotificationModule
  // --------------------------------------------------
  const notificationModules = [
    { name: 'Course', slug: 'course' },
    { name: 'Program', slug: 'program' },
    { name: 'Enrollment', slug: 'enrollment' },
    { name: 'Assessment', slug: 'assessment' },
    { name: 'Certification', slug: 'certification' },
    { name: 'Live Session', slug: 'live_session' },
    { name: 'Survey', slug: 'survey' },
    { name: 'TNA', slug: 'tna' },
    { name: 'Gamification', slug: 'gamification' },
    { name: 'System', slug: 'system' },
  ];

  for (const item of notificationModules) {
    await prisma.notificationModule.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  // --------------------------------------------------
  // EnrollmentRuleType
  // --------------------------------------------------
  const enrollmentRuleTypes = [
    { name: 'Auto Enroll', slug: 'auto_enroll' },
    { name: 'Restrict Access', slug: 'restrict_access' },
    { name: 'Require Approval', slug: 'require_approval' },
    { name: 'Waitlist Priority', slug: 'waitlist_priority' },
    { name: 'Custom', slug: 'custom' },
  ];

  for (const item of enrollmentRuleTypes) {
    await prisma.enrollmentRuleType.upsert({
      where: { companyId_slug: { companyId, slug: item.slug } },
      update: {},
      create: { companyId, name: item.name, slug: item.slug, isSystem: true, isActive: true },
    });
  }

  console.log('Lookup tables seeded successfully');
}

async function main() {
  // Seed for each company (example: companyId = 1)
  // In real usage, loop through all companies
  const companies = await prisma.company.findMany({ select: { id: true } });

  if (companies.length === 0) {
    console.log('No companies found. Please create a company first.');
    return;
  }

  for (const company of companies) {
    await seedLookupTables(company.id);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });