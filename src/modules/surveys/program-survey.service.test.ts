import type { PrismaClient } from "@prisma/client";
import { describe, expect, it, vi } from "vitest";
import { ProgramSurveyService } from "./program-survey.service.js";

const context = { companyId: 7, userId: 9 };
const now = new Date("2027-09-10T12:00:00.000Z");

const transaction = () => ({
  programEnrollment: {
    findFirst: vi.fn(async () => ({
      id: 21,
      programId: 31,
      employeeId: "EMP-1",
      enrollmentStatus: "ACTIVE",
    })),
  },
  programTask: {
    findFirst: vi.fn(async () => ({ id: 41, phaseNumber: 1 })),
    findMany: vi.fn(async () => []),
  },
  survey: {
    findFirst: vi.fn(async () => ({
      id: 51,
      status: "ACTIVE",
      isAnonymous: false,
      availableFrom: null,
      availableUntil: null,
      questions: [
        { id: 61, isRequired: true },
        { id: 62, isRequired: false },
      ],
    })),
  },
  surveyResponse: {
    findUnique: vi.fn(async () => null),
    create: vi.fn(async ({ data }: any) => ({ id: 71, ...data, answers: [] })),
  },
  auditLog: { create: vi.fn(async () => ({})) },
});

const serviceWith = (tx: ReturnType<typeof transaction>) => {
  const prisma = {
    $transaction: vi.fn(async (work: (client: any) => Promise<unknown>) => work(tx)),
  } as unknown as PrismaClient;
  const evaluator = { reevaluateProgram: vi.fn(async () => ({ progressPercentage: 100 })) };
  return { service: new ProgramSurveyService(prisma, evaluator), evaluator };
};

describe("ProgramSurveyService", () => {
  it("stores a response against the exact program attempt and reevaluates completion", async () => {
    const tx = transaction();
    const { service, evaluator } = serviceWith(tx);

    const result = await service.submit(
      context,
      21,
      51,
      { answers: [{ questionId: 61, ratingValue: 8 }] },
      now,
    );

    expect(tx.surveyResponse.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        companyId: 7,
        surveyId: 51,
        programEnrollmentId: 21,
        completionId: null,
        employeeId: "EMP-1",
      }),
      select: expect.any(Object),
    });
    expect(evaluator.reevaluateProgram).toHaveBeenCalledWith(context, 21, now);
    expect(result.response).toMatchObject({ id: 71, programEnrollmentId: 21 });
  });

  it("rejects a response missing a required question", async () => {
    const tx = transaction();
    const { service, evaluator } = serviceWith(tx);

    await expect(
      service.submit(context, 21, 51, { answers: [{ questionId: 62, textAnswer: "Optional" }] }, now),
    ).rejects.toMatchObject({ statusCode: 422, message: expect.stringContaining("required") });
    expect(tx.surveyResponse.create).not.toHaveBeenCalled();
    expect(evaluator.reevaluateProgram).not.toHaveBeenCalled();
  });
});
