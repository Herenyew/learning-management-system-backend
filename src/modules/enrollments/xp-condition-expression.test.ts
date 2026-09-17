import { describe, expect, it } from "vitest";
import {
  evaluateXpConditionExpression,
  XP_CONDITION_LIMITS,
  type XpConditionContext,
} from "./xp-condition-expression.js";

const context: XpConditionContext = {
  companyId: 7,
  employee: {
    id: "EMP-1",
    departmentId: 4,
    jobTitleId: null,
    jobLevelId: 3,
    employmentTypeId: 2,
  },
  triggerSlug: "course_completed",
  sourceType: "COURSE_COMPLETION",
  sourceId: 61,
  courseVersionId: 11,
  programId: null,
};

describe("evaluateXpConditionExpression", () => {
  it("evaluates nested logical and typed predicate expressions", () => {
    const result = evaluateXpConditionExpression(
      {
        all: [
          { field: "triggerSlug", op: "eq", value: "course_completed" },
          { field: "employee.departmentId", op: "in", value: [4, 8] },
          { field: "employee.jobLevelId", op: "gte", value: 3 },
          {
            any: [
              { field: "programId", op: "eq", value: null },
              { field: "courseVersionId", op: "eq", value: 99 },
            ],
          },
          { not: { field: "employee.employmentTypeId", op: "eq", value: 9 } },
        ],
      },
      context,
    );

    expect(result).toEqual({ matches: true });
  });

  it("returns a valid non-match without an error", () => {
    expect(
      evaluateXpConditionExpression(
        { field: "employee.departmentId", op: "eq", value: 99 },
        context,
      ),
    ).toEqual({ matches: false });
  });

  it.each([
    ["unknown field", { field: "employee.constructor", op: "eq", value: "x" }],
    ["unknown operator", { field: "companyId", op: "regex", value: 7 }],
    ["extra object key", { field: "companyId", op: "eq", value: 7, execute: "code" }],
    ["wrong value type", { field: "companyId", op: "eq", value: "7" }],
    ["empty logical list", { all: [] }],
    ["mixed node forms", { all: [{ field: "companyId", op: "eq", value: 7 }], not: {} }],
    ["non-object node", true],
  ])("fails closed for %s", (_name, expression) => {
    const result = evaluateXpConditionExpression(expression, context);

    expect(result.matches).toBe(false);
    expect(result.error).toEqual(expect.any(String));
  });

  it("fails closed when a collection limit is exceeded", () => {
    const expression = {
      any: Array.from({ length: XP_CONDITION_LIMITS.maxLogicalOperands + 1 }, () => ({
        field: "companyId",
        op: "eq",
        value: 7,
      })),
    };

    expect(evaluateXpConditionExpression(expression, context)).toMatchObject({
      matches: false,
      error: expect.stringContaining("requires"),
    });
  });

  it("fails closed when the depth limit is exceeded", () => {
    let expression: unknown = { field: "companyId", op: "eq", value: 7 };
    for (let index = 0; index < XP_CONDITION_LIMITS.maxDepth; index += 1) {
      expression = { not: expression };
    }

    expect(evaluateXpConditionExpression(expression, context)).toMatchObject({
      matches: false,
      error: expect.stringContaining("depth"),
    });
  });
});
