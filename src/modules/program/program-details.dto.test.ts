import { describe, expect, it } from "vitest";
import {
  calculateDurationDays,
  createProgramSchema,
  duplicateProgramSchema,
  updateProgramSchema,
} from "./program-details.dto.js";

const dateOnly = (daysFromToday: number): string => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + daysFromToday);
  return date.toISOString().slice(0, 10);
};

const validInput = () => ({
  name: "Leadership Program",
  programTypeId: 1,
  ownerEmployeeId: "EMP-1",
  visibility: "COMPANY" as const,
});

describe("updateProgramSchema", () => {
  it("accepts a focused metadata patch", () => {
    expect(updateProgramSchema.parse({ description: null, maxEnrollments: 25 }))
      .toEqual({ description: null, maxEnrollments: 25 });
  });

  it("rejects empty patches and lifecycle fields", () => {
    expect(updateProgramSchema.safeParse({}).success).toBe(false);
    expect(updateProgramSchema.safeParse({ status: "ACTIVE" }).success).toBe(false);
  });
});

describe("duplicateProgramSchema", () => {
  it("allows an omitted/empty body or a trimmed supplied name", () => {
    expect(duplicateProgramSchema.parse(undefined)).toEqual({});
    expect(duplicateProgramSchema.parse({})).toEqual({});
    expect(duplicateProgramSchema.parse({ name: "  Program Copy  " }))
      .toEqual({ name: "Program Copy" });
  });
});

describe("createProgramSchema", () => {
  it("defaults rolling enrollment and accepts future ordered dates", () => {
    const result = createProgramSchema.parse({
      ...validInput(),
      startDate: dateOnly(1),
      endDate: dateOnly(6),
    });

    expect(result.rollingEnrollment).toBe(false);
    expect(calculateDurationDays(result.startDate!, result.endDate!)).toBe(5);
  });

  it("rejects a start date before today", () => {
    const result = createProgramSchema.safeParse({
      ...validInput(),
      startDate: dateOnly(-1),
    });

    expect(result.success).toBe(false);
  });

  it("rejects an end date that is not after the start date", () => {
    const startDate = dateOnly(2);
    const result = createProgramSchema.safeParse({
      ...validInput(),
      startDate,
      endDate: startDate,
    });

    expect(result.success).toBe(false);
  });

  it("rejects client-controlled fields", () => {
    const result = createProgramSchema.safeParse({
      ...validInput(),
      companyId: 999,
      status: "ACTIVE",
    });

    expect(result.success).toBe(false);
  });
});
