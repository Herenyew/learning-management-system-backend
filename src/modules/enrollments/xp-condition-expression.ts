export const XP_CONDITION_LIMITS = {
  maxDepth: 8,
  maxNodes: 64,
  maxLogicalOperands: 16,
  maxSetValues: 32,
  maxStringLength: 256,
} as const;

/**
 * Bounded JSON grammar for XP rule conditions.
 *
 * Expressions are exactly one of:
 *   { "all": [expression, ...] }
 *   { "any": [expression, ...] }
 *   { "not": expression }
 *   { "field": field, "op": operator, "value": scalar | scalar[] }
 *
 * `all` and `any` require 1..16 operands. The complete expression is limited
 * to 8 levels and 64 nodes. Predicates may use only the fields listed in
 * `XP_CONDITION_FIELDS`. `eq`/`ne` accept one correctly typed scalar;
 * `in`/`notIn` accept 1..32 correctly typed scalars; and
 * `gt`/`gte`/`lt`/`lte` are available only for numeric fields and values.
 * Strings are limited to 256 characters. Objects with extra keys, unknown
 * fields/operators, type mismatches, and exceeded limits are invalid.
 *
 * The interpreter never executes code or resolves arbitrary object paths.
 * Invalid expressions return `matches: false` with an error (fail closed).
 */
export const XP_CONDITION_FIELDS = [
  "companyId",
  "employee.id",
  "employee.departmentId",
  "employee.jobTitleId",
  "employee.jobLevelId",
  "employee.employmentTypeId",
  "triggerSlug",
  "sourceType",
  "sourceId",
  "courseVersionId",
  "programId",
] as const;

type XpConditionField = (typeof XP_CONDITION_FIELDS)[number];
type XpConditionScalar = string | number | null;
type XpConditionOperator = "eq" | "ne" | "in" | "notIn" | "gt" | "gte" | "lt" | "lte";

export interface XpConditionContext {
  companyId: number;
  employee: {
    id: string;
    departmentId: number | null;
    jobTitleId: number | null;
    jobLevelId: number | null;
    employmentTypeId: number | null;
  };
  triggerSlug: string;
  sourceType: "COURSE_COMPLETION" | "PROGRAM_COMPLETION";
  sourceId: number;
  courseVersionId: number | null;
  programId: number | null;
}

export type XpConditionEvaluation =
  | { matches: boolean; error?: never }
  | { matches: false; error: string };

type EvaluationState = { nodes: number };
type FieldType = "string" | "number" | "nullableNumber";

const fieldTypes: Record<XpConditionField, FieldType> = {
  companyId: "number",
  "employee.id": "string",
  "employee.departmentId": "nullableNumber",
  "employee.jobTitleId": "nullableNumber",
  "employee.jobLevelId": "nullableNumber",
  "employee.employmentTypeId": "nullableNumber",
  triggerSlug: "string",
  sourceType: "string",
  sourceId: "number",
  courseVersionId: "nullableNumber",
  programId: "nullableNumber",
};

const operators = new Set<XpConditionOperator>([
  "eq",
  "ne",
  "in",
  "notIn",
  "gt",
  "gte",
  "lt",
  "lte",
]);
const orderedOperators = new Set<XpConditionOperator>(["gt", "gte", "lt", "lte"]);

class InvalidXpCondition extends Error {}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (value: Record<string, unknown>, expected: readonly string[]) => {
  const keys = Object.keys(value);
  return keys.length === expected.length && expected.every((key) => keys.includes(key));
};

function invalid(message: string): never {
  throw new InvalidXpCondition(message);
}

function assertScalar(
  value: unknown,
  fieldType: FieldType,
  location: string,
): asserts value is XpConditionScalar {
  if (typeof value === "string") {
    if (fieldType !== "string") invalid(`${location} must match the field type.`);
    if (value.length > XP_CONDITION_LIMITS.maxStringLength) {
      invalid(`${location} exceeds ${XP_CONDITION_LIMITS.maxStringLength} characters.`);
    }
    return;
  }
  if (typeof value === "number") {
    if (fieldType === "string" || !Number.isFinite(value)) {
      invalid(`${location} must match the field type.`);
    }
    return;
  }
  if (value === null && fieldType === "nullableNumber") return;
  invalid(`${location} must be a string, finite number, or allowed null.`);
}

const readField = (context: XpConditionContext, field: XpConditionField): XpConditionScalar => {
  switch (field) {
    case "companyId": return context.companyId;
    case "employee.id": return context.employee.id;
    case "employee.departmentId": return context.employee.departmentId;
    case "employee.jobTitleId": return context.employee.jobTitleId;
    case "employee.jobLevelId": return context.employee.jobLevelId;
    case "employee.employmentTypeId": return context.employee.employmentTypeId;
    case "triggerSlug": return context.triggerSlug;
    case "sourceType": return context.sourceType;
    case "sourceId": return context.sourceId;
    case "courseVersionId": return context.courseVersionId;
    case "programId": return context.programId;
  }
};

const equals = (left: XpConditionScalar, right: XpConditionScalar) => left === right;

const evaluatePredicate = (
  expression: Record<string, unknown>,
  context: XpConditionContext,
): boolean => {
  if (!hasExactKeys(expression, ["field", "op", "value"])) {
    invalid("Predicate must contain exactly field, op, and value.");
  }
  if (
    typeof expression.field !== "string" ||
    !XP_CONDITION_FIELDS.includes(expression.field as XpConditionField)
  ) {
    invalid("Predicate field is unsupported.");
  }
  if (typeof expression.op !== "string" || !operators.has(expression.op as XpConditionOperator)) {
    invalid("Predicate operator is unsupported.");
  }

  const field = expression.field as XpConditionField;
  const operator = expression.op as XpConditionOperator;
  const fieldType = fieldTypes[field];
  const actual = readField(context, field);

  if (operator === "in" || operator === "notIn") {
    const values = expression.value;
    if (
      !Array.isArray(values) ||
      values.length === 0 ||
      values.length > XP_CONDITION_LIMITS.maxSetValues
    ) {
      invalid(`Operator ${operator} requires 1..${XP_CONDITION_LIMITS.maxSetValues} values.`);
    }
    values.forEach((value, index) => assertScalar(value, fieldType, `value[${index}]`));
    const contained = values.some((value) => equals(actual, value));
    return operator === "in" ? contained : !contained;
  }

  assertScalar(expression.value, fieldType, "value");
  const expected = expression.value;
  if (operator === "eq") return equals(actual, expected);
  if (operator === "ne") return !equals(actual, expected);

  if (orderedOperators.has(operator)) {
    if (fieldType === "string" || typeof expected !== "number") {
      invalid(`Operator ${operator} requires a numeric field and value.`);
    }
    if (typeof actual !== "number") return false;
    if (operator === "gt") return actual > expected;
    if (operator === "gte") return actual >= expected;
    if (operator === "lt") return actual < expected;
    return actual <= expected;
  }

  return invalid("Predicate operator is unsupported.");
};

const evaluateNode = (
  expression: unknown,
  context: XpConditionContext,
  state: EvaluationState,
  depth: number,
): boolean => {
  if (depth > XP_CONDITION_LIMITS.maxDepth) {
    invalid(`Expression exceeds maximum depth ${XP_CONDITION_LIMITS.maxDepth}.`);
  }
  state.nodes += 1;
  if (state.nodes > XP_CONDITION_LIMITS.maxNodes) {
    invalid(`Expression exceeds maximum size ${XP_CONDITION_LIMITS.maxNodes}.`);
  }
  if (!isRecord(expression)) invalid("Each expression node must be an object.");

  if (hasExactKeys(expression, ["all"]) || hasExactKeys(expression, ["any"])) {
    const key = Object.hasOwn(expression, "all") ? "all" : "any";
    const operands = expression[key];
    if (
      !Array.isArray(operands) ||
      operands.length === 0 ||
      operands.length > XP_CONDITION_LIMITS.maxLogicalOperands
    ) {
      invalid(`${key} requires 1..${XP_CONDITION_LIMITS.maxLogicalOperands} operands.`);
    }
    if (key === "all") {
      let matches = true;
      for (const operand of operands) {
        const operandMatches = evaluateNode(operand, context, state, depth + 1);
        matches = matches && operandMatches;
      }
      return matches;
    }
    let matches = false;
    for (const operand of operands) {
      const operandMatches = evaluateNode(operand, context, state, depth + 1);
      matches = matches || operandMatches;
    }
    return matches;
  }

  if (hasExactKeys(expression, ["not"])) {
    return !evaluateNode(expression.not, context, state, depth + 1);
  }

  return evaluatePredicate(expression, context);
};

export const evaluateXpConditionExpression = (
  expression: unknown,
  context: XpConditionContext,
): XpConditionEvaluation => {
  try {
    return { matches: evaluateNode(expression, context, { nodes: 0 }, 1) };
  } catch (error) {
    if (error instanceof InvalidXpCondition) {
      return { matches: false, error: error.message };
    }
    return { matches: false, error: "Condition could not be evaluated safely." };
  }
};
