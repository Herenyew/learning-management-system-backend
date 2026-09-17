INSERT INTO "completion_outbox" (
  "companyId", "eventKey", "eventType", "courseCompletionId", "status", "availableAt", "createdAt", "updatedAt"
)
SELECT
  "companyId", 'course-completion:' || "id", 'COURSE_COMPLETED', "id", 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "course_completions"
ON CONFLICT ("eventKey") DO NOTHING;

INSERT INTO "completion_outbox" (
  "companyId", "eventKey", "eventType", "programCompletionId", "status", "availableAt", "createdAt", "updatedAt"
)
SELECT
  "companyId", 'program-completion:' || "id", 'PROGRAM_COMPLETED', "id", 'PENDING', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "program_completions"
ON CONFLICT ("eventKey") DO NOTHING;
